#!/usr/bin/env node
// Mock fidelity contract test (P5.51).
//
// The mocked Playwright suite is only as good as tests/e2e/mocks.js. This script starts a real Garrison server and
// worker (Sqlite, fake harness, free ports on 127.0.0.1), seeds data through the REST API, then calls every GET route
// the dashboard uses (src/utils/api.js) and compares the shape of the real response with what mocks.js returns for the
// same request. Shapes are compared recursively by key and value type:
//
//   - null and missing are interchangeable (the server omits nulls), so a value is only compared when both sides have it;
//   - arrays are compared through a merged exemplar of their elements (the first element, filled in by later ones);
//   - a key only the mock has is accepted when the route's OpenAPI response schema declares it (a nullable property the
//     server omitted), and is a mismatch otherwise;
//   - objects the schema describes without properties (dictionaries) are compared by value type only;
//   - a mock string outside the enum the schema declares is a mismatch.
//
// Fields that a parallel backend change has not landed yet are listed in PENDING; they are reported as pending until
// the server's OpenAPI schema declares them, and checked like everything else from then on.
//
// Usage: npm run test:contract
// Environment:
//   GARRISON_CONTRACT_URL         use an already running server and worker instead of building and starting them
//   GARRISON_CONTRACT_ARTIFACTS   dotnet artifacts directory (default: a temp directory)
//   GARRISON_CONTRACT_SKIP_BUILD  1 to reuse GARRISON_CONTRACT_ARTIFACTS without building
//   GARRISON_CONTRACT_DUMP        directory to write each real and mock response to, for debugging
//   GARRISON_CONTRACT_VERBOSE     1 to print pending and tolerated differences too

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { respond } from '../e2e/mocks.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const TENANT = 'default';
const ADMIN_KEY = 'garrisonadmin';
const VERBOSE = process.env.GARRISON_CONTRACT_VERBOSE === '1';
const DUMP = process.env.GARRISON_CONTRACT_DUMP || '';

/** Fields and enum values from backend work in flight. key: field name or `enum:<value>`; value: plan reference. */
const PENDING = {
  blockedReason: 'G-15',
  blockedRuns: 'G-15',
  'enum:NoCapableWorker': 'G-15',
  delegationWaitMs: 'P9.17 M1-08',
  timeToFirstTokenExcludingDelegationMs: 'P9.17 M1-08',
  delegationWaitMsAvg: 'P9.17 M1-08',
  timeToFirstTokenExcludingDelegationMsAvg: 'P9.17 M1-08',
  timeToFirstTokenExcludingDelegationMsP50: 'P9.17 M1-08',
  timeToFirstTokenExcludingDelegationMsP95: 'P9.17 M1-08',
  changes: 'P9.17 M1-14',
  plannedResult: 'P9.17 M1-14',
  code: 'P9.17 M1-24',
  traceId: 'P13.16',
  observability: 'P13.13'
};

const children = [];
let work = '';

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on('error', reject);
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function cleanup() {
  for (const c of children) {
    try {
      c.kill('SIGTERM');
    } catch {
      /* already gone */
    }
  }
}
process.on('exit', cleanup);
process.on('SIGINT', () => process.exit(130));
process.on('SIGTERM', () => process.exit(143));

function start(name, cmd, args, opts) {
  const out = fs.openSync(path.join(work, `${name}.log`), 'w');
  const child = spawn(cmd, args, { ...opts, stdio: ['ignore', out, out] });
  children.push(child);
  child.on('exit', (code) => {
    if (code !== null && code !== 0 && code !== 143) log(`!! ${name} exited with ${code} (log: ${path.join(work, `${name}.log`)})`);
  });
  return child;
}

async function waitFor(what, fn, seconds = 90) {
  for (let i = 0; i < seconds; i++) {
    try {
      if (await fn()) return;
    } catch {
      /* not yet */
    }
    await sleep(1000);
  }
  throw new Error(`${what} did not become ready within ${seconds}s (logs: ${work})`);
}

/** Build, then start a server and a worker on free ports. Returns the base URL. */
async function bootstrap() {
  work = fs.mkdtempSync(path.join(os.tmpdir(), 'garrison-contract-'));
  const art = process.env.GARRISON_CONTRACT_ARTIFACTS || path.join(work, 'artifacts');
  if (process.env.GARRISON_CONTRACT_SKIP_BUILD !== '1') {
    log(`== building ${path.join(ROOT, 'src/Garrison.sln')} into ${art}`);
    const build = spawnSync('dotnet', ['build', path.join(ROOT, 'src/Garrison.sln'), '-f', 'net10.0', '--artifacts-path', art, '-v', 'quiet', '-nologo'], { encoding: 'utf8' });
    if (build.status !== 0) {
      log(`${build.stdout}\n${build.stderr}`.split('\n').slice(-30).join('\n'));
      throw new Error('dotnet build failed');
    }
  }
  const bin = (project, dll) => path.join(art, 'bin', project, 'debug_net10.0', dll);
  for (const f of [bin('Garrison.Server', 'Garrison.Server.dll'), bin('Garrison.Worker', 'Garrison.Worker.dll'), bin('Garrison.FakeHarness', 'garrison-fake-harness.dll')]) {
    if (!fs.existsSync(f)) throw new Error(`missing build output ${f}`);
  }

  const [restPort, mcpPort, healthPort] = [await freePort(), await freePort(), await freePort()];
  const base = `http://127.0.0.1:${restPort}`;
  for (const d of ['bin', 'server', 'worker']) fs.mkdirSync(path.join(work, d), { recursive: true });
  const wrapper = path.join(work, 'bin', 'garrison-fake-harness');
  fs.writeFileSync(wrapper, `#!/usr/bin/env bash\nexec dotnet "${bin('Garrison.FakeHarness', 'garrison-fake-harness.dll')}" "$@"\n`, { mode: 0o755 });
  const settings = path.join(work, 'server', 'garrison.json');
  fs.writeFileSync(
    settings,
    JSON.stringify(
      {
        Rest: { Hostname: '127.0.0.1', Port: restPort },
        Mcp: { Hostname: '127.0.0.1', Port: mcpPort },
        Database: { Type: 'Sqlite', Filename: path.join(work, 'server', 'garrison.db') },
        Logging: { ConsoleLogging: true, MinimumSeverity: 2 },
        Telemetry: { Enabled: false }
      },
      null,
      2
    )
  );

  log(`== starting server on ${base}`);
  start('server', 'dotnet', [bin('Garrison.Server', 'Garrison.Server.dll')], {
    cwd: path.join(work, 'server'),
    env: { ...process.env, GARRISON_SETTINGS_FILE: settings, GARRISON_TELEMETRY_ENABLE: 'false' }
  });
  await waitFor('server', async () => (await fetch(`${base}/v1.0/api/health`)).ok);

  log('== starting worker');
  start('worker', 'dotnet', [bin('Garrison.Worker', 'Garrison.Worker.dll')], {
    cwd: path.join(work, 'worker'),
    env: {
      ...process.env,
      PATH: `${path.join(work, 'bin')}${path.delimiter}${process.env.PATH}`,
      GARRISON_WORKER_SERVER_URL: base,
      GARRISON_WORKER_NODE_NAME: 'contract-worker',
      GARRISON_WORKER_HEALTH_PORT: String(healthPort),
      GARRISON_WORKER_WORK_ROOT: path.join(work, 'worker', 'workspaces'),
      GARRISON_WORKER_MAX_CONCURRENT_RUNS: '4',
      GARRISON_WORKER_TELEMETRY_ENABLE: 'false'
    }
  });
  await waitFor('worker', async () => {
    const r = await fetch(`${base}/v1.0/api/nodes`, { headers: { 'x-api-key': ADMIN_KEY } });
    return r.ok && (await r.text()).includes('"status":"Ready"');
  });
  return base;
}

// ---------------------------------------------------------------- HTTP

function client(base) {
  let token = null;
  async function call(method, p, body, extraHeaders = {}) {
    const headers = { ...extraHeaders };
    if (token) headers.Authorization = `Bearer ${token}`;
    let payload;
    if (body !== undefined) {
      if (typeof body === 'string') payload = body;
      else {
        payload = JSON.stringify(body);
        headers['Content-Type'] = 'application/json';
      }
    }
    if (VERBOSE) log(`   ${method} ${p}`);
    const res = await fetch(base + p, { method, headers, body: payload, signal: AbortSignal.timeout(150000) });
    const text = await res.text();
    let parsed = null;
    try {
      parsed = text ? JSON.parse(text) : null;
    } catch {
      parsed = text;
    }
    if (!res.ok) throw new Error(`${method} ${p} -> ${res.status}: ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`);
    return parsed;
  }
  return {
    get: (p) => call('GET', p),
    post: (p, b, h) => call('POST', p, b, h),
    put: (p, b) => call('PUT', p, b),
    login: async () => {
      const r = await call('POST', '/v1.0/token', { tenantId: TENANT, email: 'admin@garrison', password: 'password' });
      token = r.token;
    }
  };
}

const tp = (sub) => `/v1.0/api/tenants/${TENANT}/${sub}`;

/** Seed one of everything the dashboard lists. Returns the IDs the GET routes need. */
async function seed(api) {
  const ids = {};
  const fake = (await api.get('/v1.0/api/harness-profiles/builtin')).find((p) => p.name === 'builtin/fake');
  if (!fake) throw new Error('builtin/fake harness profile not found');
  ids.profile = fake.id;

  ids.secret = (await api.post(tp('secrets'), { name: 'contract-secret', description: 'Contract test secret', kind: 'GenericEnv', value: 'contract-value-1234' })).id;
  ids.mcp = (
    await api.post(tp('mcp-servers'), {
      name: 'contract-mcp',
      description: 'Contract test MCP server',
      transport: 'Http',
      url: 'http://127.0.0.1:9',
      path: '/mcp',
      headers: [{ name: 'X-Contract', valueTemplate: '1' }],
      requiredTools: ['echo'],
      required: false
    })
  ).id;
  ids.workspace = (await api.post(tp('workspace-templates'), { name: 'contract-workspace', description: 'Seeded workspace', kind: 'Seeded', files: [{ path: 'README.md', content: 'hello' }], retention: 'Delete' })).id;
  ids.store = (await api.post(tp('artifact-stores'), { name: 'contract-store', description: 'Contract store', kind: 'Database' })).id;
  ids.pool = (await api.post('/v1.0/api/node-pools', { name: 'contract-empty-pool', description: 'A pool with no nodes', tenants: [TENANT] })).id;

  ids.user = (await api.post(tp('users'), { email: 'contract@garrison.local', password: 'Contract-Passw0rd', firstName: 'Contract', lastName: 'User' })).id;
  const credential = await api.post(tp('credentials'), { name: 'contract-credential', userId: ids.user });
  ids.credential = credential.credential?.id || credential.id;
  ids.role = (await api.post(tp('roles'), { name: 'contract-role', description: 'Contract role' })).id;
  ids.permission = (await api.post(tp('permissions'), { name: 'contract-permission', permissionType: 'Permit', resourceTypes: ['Agent'], operationTypes: ['Read'] })).id;
  await api.post(tp('role-permissions'), { roleId: ids.role, permissionId: ids.permission });
  ids.userAssignment = (await api.post(tp('user-role-assignments'), { userId: ids.user, roleId: ids.role, resourceScope: 'Tenant' })).id;

  const template = await api.post(tp('prompt-templates'), { name: 'contract-template', kind: 'Task', description: 'Contract template', content: 'Task: {{input.message}}' });
  ids.template = template.id;
  await api.put(tp(`prompt-templates/${ids.template}`), { name: 'contract-template', kind: 'Task', description: 'Contract template', content: 'Task v2: {{input.message}}', changeNote: 'second version' });

  ids.agent = (
    await api.post(tp('agents'), {
      name: 'contract-echo',
      displayName: 'Contract Echo',
      description: 'Echo agent on the fake harness',
      tags: ['contract'],
      skills: [{ skillId: 'echo', name: 'Echo', description: 'Echoes input' }],
      exposeA2A: true,
      exposeMcpTool: true,
      mcpToolName: 'contract_echo'
    })
  ).id;
  ids.agent2 = (
    await api.post(tp('agents'), {
      name: 'contract-planner',
      displayName: 'Contract Planner',
      description: 'Delegating agent that never runs',
      delegationMode: 'AllowList',
      delegationAllowList: ['contract-echo'],
      delegationMaxDepth: 1
    })
  ).id;
  ids.agent3 = (await api.post(tp('agents'), { name: 'contract-blocked', description: 'Pinned to a node pool with no nodes' })).id;
  ids.credentialAssignment = (await api.post(tp('credential-scope-assignments'), { credentialId: ids.credential, roleId: ids.role, resourceScope: 'Resource', resourceId: ids.agent })).id;

  ids.deployment = (
    await api.post(tp('deployments'), {
      name: 'contract-echo-fake',
      description: 'Fake harness deployment',
      agentId: ids.agent,
      harnessProfileId: fake.id,
      model: 'sonnet',
      parameters: [{ name: 'format', value: 'claude' }],
      resourceBindings: [{ kind: 'Secret', alias: 'token', resourceId: ids.secret }],
      environmentOverrides: [{ name: 'CONTRACT', valueTemplate: '1', isSecret: false }],
      allowedRunOverrides: [{ name: 'fail', validation: 'Any' }],
      workspaceTemplateId: ids.workspace,
      artifactStoreId: ids.store,
      timeoutSeconds: 60
    })
  ).id;
  ids.deployment2 = (
    await api.post(tp('deployments'), {
      name: 'contract-planner-fake',
      agentId: ids.agent2,
      harnessProfileId: fake.id,
      resourceBindings: [
        { kind: 'McpServer', alias: 'tools', resourceId: ids.mcp },
        { kind: 'Secret', alias: 'token', resourceId: ids.secret }
      ],
      argumentOverrides: [{ operation: 'Append', template: '--tool-calls' }],
      fileOverrides: [{ baseDirectory: 'Config', pathTemplate: 'extra.txt', contentTemplate: 'x' }],
      nodeSelector: [{ key: 'zone', value: 'a' }],
      active: true
    })
  ).id;
  ids.deployment3 = (await api.post(tp('deployments'), { name: 'contract-blocked-fake', agentId: ids.agent3, harnessProfileId: fake.id, nodePoolId: ids.pool })).id;

  const yaml = 'apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: contract-manifest-agent\nspec:\n  description: Applied by the contract test.\n';
  await api.post(tp('manifests/apply'), yaml, { 'Content-Type': 'application/yaml' });

  log('== running agents');
  const ok = await api.post(tp(`agents/${ids.agent}/invoke?wait=true&waitSeconds=90`), { input: 'Hello from the contract test' });
  if (ok.status !== 'Succeeded') throw new Error(`seed run ended ${ok.status}: ${ok.errorMessage || ''}`);
  ids.run = ok.id;
  const failed = await api.post(tp('runs'), { agentId: ids.agent, input: 'Fail please', parameters: { fail: 'true' }, wait: true, waitSeconds: 90 });
  ids.failedRun = failed.id;
  ids.queuedRun = (await api.post(tp('runs'), { agentId: ids.agent3, input: 'Nobody can take this' })).id;
  // P12.1: a two-turn conversation, so the conversation routes and the run conversation fields have data.
  const first = await api.post(tp(`agents/${ids.agent}/invoke?wait=true&waitSeconds=90`), { input: 'Start a conversation', startConversation: true });
  if (!first.conversationId) throw new Error('startConversation did not name a conversation');
  ids.conversation = first.conversationId;
  const second = await api.post(tp(`agents/${ids.agent}/invoke?wait=true&waitSeconds=90`), { input: 'Continue the conversation', conversationId: ids.conversation });
  ids.conversationRun = second.id;
  await sleep(1500);
  return ids;
}

// ---------------------------------------------------------------- shape comparison

const kind = (v) => (v === null || v === undefined ? 'null' : Array.isArray(v) ? 'array' : typeof v);

/** Merge array elements into one exemplar so a field omitted on one element is still seen. */
function exemplar(list) {
  let out;
  for (const item of list) {
    if (out === undefined || out === null) {
      out = item;
      continue;
    }
    if (kind(out) === 'object' && kind(item) === 'object') {
      const merged = { ...out };
      for (const [k, v] of Object.entries(item)) {
        if (merged[k] === undefined || merged[k] === null) merged[k] = v;
        else if (kind(merged[k]) === 'object' && kind(v) === 'object') merged[k] = exemplar([merged[k], v]);
        else if (kind(merged[k]) === 'array' && kind(v) === 'array') merged[k] = [exemplar([...merged[k], ...v])].filter((x) => x !== undefined);
      }
      out = merged;
    }
  }
  return out;
}

const isMapSchema = (s) => s && s.type === 'object' && (!s.properties || Object.keys(s.properties).length === 0);

function compare(real, mock, schema, at, report) {
  const rk = kind(real);
  const mk = kind(mock);
  if (mk === 'string' && schema?.enum && !schema.enum.includes(mock)) {
    const pending = PENDING[`enum:${mock}`];
    if (pending) report.pending.push(`${at}: enum value ${mock} (${pending})`);
    else report.errors.push(`${at}: mock value "${mock}" is not one of ${schema.enum.join(', ')}`);
  }
  if (rk === 'null' || mk === 'null') return;
  if (rk !== mk) {
    report.errors.push(`${at}: type differs (server ${rk}, mock ${mk})`);
    return;
  }
  if (rk === 'array') {
    const r = exemplar(real);
    const m = exemplar(mock);
    if (r !== undefined && m !== undefined) compare(r, m, schema?.items, `${at}[]`, report);
    else if (r !== undefined && m === undefined) report.notes.push(`${at}: mock array is empty, element shape not checked`);
    return;
  }
  if (rk !== 'object') return;
  if (isMapSchema(schema)) {
    const r = exemplar(Object.values(real));
    const m = exemplar(Object.values(mock));
    if (r !== undefined && m !== undefined && kind(r) !== kind(m)) report.errors.push(`${at}{}: dictionary value type differs (server ${kind(r)}, mock ${kind(m)})`);
    return;
  }
  const props = schema?.properties || null;
  for (const key of Object.keys(real)) {
    if (real[key] === null || real[key] === undefined) continue;
    if (!(key in mock)) report.errors.push(`${at}.${key}: missing from mock (server sends ${kind(real[key])})`);
    else compare(real[key], mock[key], props?.[key], `${at}.${key}`, report);
  }
  for (const key of Object.keys(mock)) {
    if (key in real || mock[key] === null || mock[key] === undefined) continue;
    if (PENDING[key] && !(props && key in props)) report.pending.push(`${at}.${key}: ${PENDING[key]} field not in the server schema yet`);
    else if (props && key in props) {
      report.notes.push(`${at}.${key}: only in mock; the schema declares it (omitted null on the server)`);
      compare(undefined, mock[key], props[key], `${at}.${key}`, report);
    } else if (!props && schema) report.notes.push(`${at}.${key}: only in mock; schema depth limit, not checked`);
    else report.errors.push(`${at}.${key}: only in mock (the server never sends it)`);
  }
}

// ---------------------------------------------------------------- routes

function schemaFor(openapi, realPath) {
  for (const [template, ops] of Object.entries(openapi.paths || {})) {
    if (!ops.get) continue;
    const re = new RegExp(`^${template.replace(/[.]/g, '\\.').replace(/\{[^}]+\}/g, '[^/]+')}$`);
    if (re.test(realPath)) return ops.get.responses?.['200']?.content?.['application/json']?.schema || null;
  }
  return null;
}

/** Every GET the dashboard issues (src/utils/api.js), with the query parameters it sends. */
function routes(ids) {
  const now = Date.now();
  const range = `from=${encodeURIComponent(new Date(now - 3600000).toISOString())}&to=${encodeURIComponent(new Date(now + 60000).toISOString())}`;
  const list = 'maxResults=25&skip=0';
  return [
    ['healthCheck', '/v1.0/api/health'],
    ['validateToken', '/v1.0/token'],
    ['getTokenDetails', '/v1.0/token/details'],
    ['getServerInfo', '/v1.0/api/server-info'],
    ['getSettings', '/v1.0/api/settings'],
    ['getObservabilityStatus', '/v1.0/api/observability/status'],
    ['getOverview', tp('overview')],
    ['getQueueSummary', tp('queue/summary')],
    ['getRunAnalytics', tp(`analytics/runs?${range}&interval=minute`)],
    ['getRunAnalytics (groupBy=agent)', tp(`analytics/runs?${range}&groupBy=agent`)],
    ['getRunAnalytics (groupBy=harnessModel)', tp(`analytics/runs?${range}&groupBy=harnessModel`)],
    ['getRunAnalyticsDimensions', tp(`analytics/runs/dimensions?${range}`)],
    ['listTenants', `/v1.0/api/tenants?${list}`],
    ['getTenant', `/v1.0/api/tenants/${TENANT}`],
    ['listUsers', tp(`users?${list}`)],
    ['getUser', tp(`users/${ids.user}`)],
    ['getUserPermissions', tp(`users/${ids.user}/permissions`)],
    ['listCredentials', tp(`credentials?${list}`)],
    ['getCredential', tp(`credentials/${ids.credential}`)],
    ['getCredentialPermissions', tp(`credentials/${ids.credential}/permissions`)],
    ['listRoles', tp(`roles?${list}`)],
    ['getRole', tp(`roles/${ids.role}`)],
    ['listPermissions', tp(`permissions?${list}`)],
    ['listRolePermissions', tp(`role-permissions?${list}`)],
    ['listUserRoleAssignments', tp(`user-role-assignments?${list}`)],
    ['listCredentialScopeAssignments', tp(`credential-scope-assignments?${list}`)],
    ['listAudit', tp(`audit?${list}`)],
    ['getAuditRecord', tp(`audit/${ids.audit}`)],
    ['getRequestHistory', `/v1.0/api/request-history?${list}`],
    ['getRequestHistorySummary', `/v1.0/api/request-history/summary?${range.replace('from=', 'fromUtc=').replace('to=', 'toUtc=')}&bucketMinutes=1`],
    ['getRequestHistoryEntry', `/v1.0/api/request-history/${ids.requestHistory}`],
    ['listHarnessProfiles', tp(`harness-profiles?${list}&includeBuiltIn=true`)],
    ['listBuiltInHarnessProfiles', '/v1.0/api/harness-profiles/builtin'],
    ['getHarnessProfile', tp(`harness-profiles/${ids.profile}`)],
    ['listPromptTemplates', tp(`prompt-templates?${list}&includeBuiltIn=true`)],
    ['getPromptTemplate', tp(`prompt-templates/${ids.template}`)],
    ['listPromptTemplateVersions', tp(`prompt-templates/${ids.template}/versions`)],
    ['getPromptTemplateVersion', tp(`prompt-templates/${ids.template}/versions/1`)],
    ['listMcpServers', tp(`mcp-servers?${list}`)],
    ['listSecrets', tp(`secrets?${list}`)],
    ['listWorkspaceTemplates', tp(`workspace-templates?${list}`)],
    ['listArtifactStores', tp(`artifact-stores?${list}`)],
    ['listAgents', tp(`agents?${list}`)],
    ['getAgent', tp(`agents/${ids.agent2}`)],
    ['getAgentCard', tp(`agents/${ids.agent}/card`)],
    ['listDeployments', tp(`deployments?${list}`)],
    ['getDeployment', tp(`deployments/${ids.deployment2}`)],
    ['listManifestApplies', tp(`manifests/applies?${list}`)],
    ['getManifestApply', tp(`manifests/applies/${ids.manifestApply}`)],
    ['listRuns', tp(`runs?${list}`)],
    ['getRun', tp(`runs/${ids.run}`)],
    ['getRun (failed)', tp(`runs/${ids.failedRun}`)],
    ['getRun (queued)', tp(`runs/${ids.queuedRun}`)],
    ['listRunEvents', tp(`runs/${ids.run}/events?afterSequence=0&limit=500`)],
    ['listRunChildren', tp(`runs/${ids.run}/children`)],
    ['listConversations', tp(`conversations?${list}`)],
    ['listConversations (agentId)', tp(`conversations?${list}&agentId=${ids.agent}`)],
    ['getConversation', tp(`conversations/${ids.conversation}`)],
    ['listConversationRuns', tp(`conversations/${ids.conversation}/runs?maxResults=1000&skip=0`)],
    ['listRuns (conversationId)', tp(`runs?${list}&conversationId=${ids.conversation}`)],
    ['getRun (conversation turn)', tp(`runs/${ids.conversationRun}`)],
    ['listNodes', `/v1.0/api/nodes?${list}`],
    ['getNode', `/v1.0/api/nodes/${ids.node}`],
    ['listNodePools', `/v1.0/api/node-pools?${list}`],
    ['listControlNodes', `/v1.0/api/control-nodes?${list}`],
    ['getControlNode', `/v1.0/api/control-nodes/${ids.controlNode}`],
    ['getOpenApiSpec', '/openapi.json']
  ];
}

// ---------------------------------------------------------------- main

async function main() {
  const base = process.env.GARRISON_CONTRACT_URL ? process.env.GARRISON_CONTRACT_URL.replace(/\/$/, '') : await bootstrap();
  const api = client(base);
  await api.login();
  log('== seeding');
  const ids = await seed(api);
  ids.audit = (await api.get(tp('audit?maxResults=1&skip=0'))).objects?.[0]?.id;
  ids.requestHistory = (await api.get('/v1.0/api/request-history?maxResults=1&skip=0')).objects?.[0]?.id;
  ids.manifestApply = (await api.get(tp('manifests/applies?maxResults=1&skip=0'))).objects?.[0]?.id;
  ids.node = (await api.get('/v1.0/api/nodes?maxResults=1&skip=0')).objects?.[0]?.id;
  ids.controlNode = (await api.get('/v1.0/api/control-nodes?maxResults=1&skip=0')).objects?.[0]?.id;
  const openapi = await api.get('/openapi.json');

  if (DUMP) fs.mkdirSync(DUMP, { recursive: true });
  const failures = [];
  let checked = 0;
  let pendingCount = 0;
  for (const [name, p] of routes(ids)) {
    const report = { errors: [], pending: [], notes: [] };
    let real;
    try {
      real = await api.get(p);
    } catch (e) {
      failures.push(`${name}: server request failed: ${e.message}`);
      continue;
    }
    const url = new URL(base + p);
    const mock = respond('GET', url);
    if (DUMP) fs.writeFileSync(path.join(DUMP, `${name.replace(/[^A-Za-z0-9]+/g, '_')}.json`), JSON.stringify({ path: p, real, mock }, null, 2));
    if (mock === undefined) report.errors.push('mocks.js has no handler for this route');
    else if ((mock === null || (kind(mock) === 'object' && Object.keys(mock).length === 0)) && kind(real) === 'object' && Object.keys(real).length) report.errors.push('mocks.js answers an empty body for this route');
    else if (name === 'getOpenApiSpec') {
      // The mock spec is a deliberately tiny subset; only the envelope and per-operation fields are checked.
      compare({ openapi: real.openapi, info: real.info }, { openapi: mock.openapi, info: mock.info }, null, '$', report);
    } else compare(real, mock, schemaFor(openapi, url.pathname), '$', report);
    checked += 1;
    pendingCount += report.pending.length;
    const status = report.errors.length ? 'FAIL' : 'PASS';
    log(`${status}  ${name}  GET ${url.pathname}`);
    for (const e of report.errors) log(`        ${e}`);
    if (VERBOSE) {
      for (const e of report.pending) log(`        pending: ${e}`);
      for (const e of report.notes) log(`        note: ${e}`);
    }
    for (const e of report.errors) failures.push(`${name}: ${e}`);
  }

  log('');
  log(`== ${checked} routes checked, ${failures.length} mismatches, ${pendingCount} pending (${Object.values(PENDING).filter((v, i, a) => a.indexOf(v) === i).join(', ')})`);
  if (failures.length) {
    log('== mismatches');
    for (const f of failures) log(`  ${f}`);
    if (work) log(`logs: ${work}`);
    process.exitCode = 1;
  } else if (work) {
    fs.rmSync(work, { recursive: true, force: true });
  }
}

main()
  .catch((e) => {
    log(`contract test error: ${e.stack || e.message}`);
    if (work) log(`logs: ${work}`);
    process.exitCode = 1;
  })
  .finally(() => {
    cleanup();
    process.exit();
  });
