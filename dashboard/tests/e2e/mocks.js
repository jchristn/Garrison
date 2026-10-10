// Deterministic API mocks so the e2e suite runs without a Garrison server.

const NOW = Date.parse('2026-10-09T12:00:00Z');
const iso = (offsetMinutes) => new Date(NOW - offsetMinutes * 60000).toISOString();
const TENANT = 'default';

export const PRINCIPAL = {
  principalType: 'User',
  principalId: 'usr_admin',
  principalName: 'admin@garrison',
  tenantId: TENANT,
  isAdmin: true,
  isTenantAdmin: true,
  expiresUtc: iso(-60)
};

const RUN_STATUSES = ['Succeeded', 'Failed', 'Running', 'Queued', 'Succeeded', 'Cancelled'];

function base(prefix, i, extra = {}) {
  return { id: `${prefix}_${String(i).padStart(4, '0')}`, tenantId: TENANT, name: `${prefix}-${i}`, active: true, createdUtc: iso(i * 7), lastUpdateUtc: iso(i * 3), ...extra };
}

const FACTORIES = {
  tenants: (i) => base('ten', i, { name: i === 1 ? 'default' : `tenant-${i}`, id: i === 1 ? TENANT : `ten_${i}`, description: 'Sample tenant' }),
  users: (i) => base('usr', i, { email: `user${i}@garrison.local`, firstName: 'User', lastName: String(i), isAdmin: i === 1, isTenantAdmin: i < 3 }),
  credentials: (i) => base('cred', i, { accessKey: `AK${i}XYZ`, secretKeyLast4: 'ab12', userId: 'usr_0001', lastUsedUtc: iso(i) }),
  roles: (i) => base('role', i, { description: 'Role description', isBuiltIn: i < 3 }),
  permissions: (i) => base('perm', i, { permissionType: i % 4 === 0 ? 'Deny' : 'Permit', resourceTypes: ['Agent', 'Run'], operationTypes: ['Read', 'Invoke'], isBuiltIn: i < 3 }),
  'user-role-assignments': (i) => base('ura', i, { userId: 'usr_0001', roleId: 'role_0001', roleName: 'TenantAdmin', resourceScope: 'Tenant' }),
  'credential-scope-assignments': (i) => base('csa', i, { credentialId: 'cred_0001', roleId: 'role_0002', roleName: 'Invoker', resourceScope: 'Resource', resourceId: 'agt_0001' }),
  'harness-profiles': (i) => base('hp', i, { name: i === 1 ? 'builtin/claude-code' : `profile-${i}`, harnessType: ['ClaudeCode', 'Codex', 'GeminiCli', 'Generic'][i % 4], executable: 'claude', outputParser: 'ClaudeStreamJson', isBuiltIn: i === 1, arguments: [{ template: '-p' }] }),
  'prompt-templates': (i) => base('pt', i, { name: `template-${i}`, kind: ['System', 'Task', 'Fragment'][i % 3], currentVersion: i, description: 'Prompt template', isBuiltIn: i < 3, content: 'You are {{agent.name}}. Task: {{input}}' }),
  'mcp-servers': (i) => base('mcp', i, { transport: i % 2 ? 'Http' : 'Stdio', url: 'http://127.0.0.1:9000', path: '/mcp', required: i === 1 }),
  secrets: (i) => base('sec', i, { kind: 'AnthropicApiKey', valueLast4: 'wxyz', isSet: true, rotatedUtc: iso(i * 60) }),
  'workspace-templates': (i) => base('wst', i, { kind: 'GitRepository', gitUrl: 'https://github.com/jchristn/Garrison.git', retention: 'Delete' }),
  'artifact-stores': (i) => base('as', i, { kind: 'Local', description: 'Local disk' }),
  agents: (i) => base('agt', i, { name: i === 1 ? 'echo-agent' : `agent-${i}`, displayName: `Agent ${i}`, kind: 'Hosted', exposeA2A: true, exposeMcpTool: i % 2 === 0, delegationMode: 'None', tags: ['sample'] }),
  deployments: (i) => base('dep', i, { name: `deployment-${i}`, agentId: 'agt_0001', harnessProfileId: 'hp_0001', model: 'sonnet', weight: 100, configVersion: 3 }),
  'node-pools': (i) => base('np', i, { description: 'Pool', tenants: [] }),
  runs: (i) => base('run', i, {
    agentId: 'agt_0001',
    agentName: 'echo-agent',
    deploymentId: 'dep_0001',
    status: RUN_STATUSES[i % RUN_STATUSES.length],
    outcome: RUN_STATUSES[i % RUN_STATUSES.length] === 'Failed' ? 'HarnessFailed' : 'Succeeded',
    harnessType: 'ClaudeCode',
    leaseNodeName: 'garrison-worker-0',
    startedUtc: iso(i * 7),
    completedUtc: iso(i * 7 - 1),
    inputTokens: 1200 + i,
    outputTokens: 340 + i,
    costUsd: 0.0123 * i,
    depth: 0,
    input: 'Say hello',
    resultText: 'Hello from the fake harness.'
  }),
  nodes: (i) => base('node', i, {
    name: `garrison-worker-${i - 1}`,
    status: i === 3 ? 'Cordoned' : 'Ready',
    maxConcurrentRuns: 4,
    activeRuns: i % 3,
    labels: { zone: 'a' },
    nodeVersion: '0.1.0-alpha',
    lastHeartbeatUtc: iso(0),
    capabilities: [{ harnessType: 'ClaudeCode', available: true, detectedVersion: '2.1.0' }]
  }),
  audit: (i) => base('aud', i, { eventType: i % 5 === 0 ? 'AuthorizationDenied' : 'AuthSuccess', principalName: 'admin@garrison', principalId: 'usr_0001', resourceType: 'Agent', operation: 'Read', reason: 'ok', sourceIp: '127.0.0.1' }),
  'manifest-applies': (i) => base('ma', i, { principalName: 'admin@garrison', dryRun: i % 2 === 0, createdCount: 2, updatedCount: 1, unchangedCount: 0, failedCount: 0 }),
  'request-history': (i) => ({
    id: `req_${String(i).padStart(4, '0')}`,
    method: ['GET', 'POST', 'PUT', 'DELETE'][i % 4],
    path: `/v1.0/api/tenants/${TENANT}/agents`,
    url: `/v1.0/api/tenants/${TENANT}/agents`,
    statusCode: i % 7 === 0 ? 500 : i % 5 === 0 ? 404 : 200,
    durationMs: 3 + i,
    createdUtc: iso(i * 2),
    principalName: 'admin@garrison',
    sourceIp: '127.0.0.1',
    tenantId: TENANT
  })
};

const TOTALS = { runs: 137, 'request-history': 64, audit: 42 };

function enumerate(collection, url) {
  const factory = FACTORIES[collection];
  if (!factory) return null;
  const total = TOTALS[collection] ?? 6;
  const pageSize = Number(url.searchParams.get('maxResults') || url.searchParams.get('pageSize') || 25);
  const skip = Number(url.searchParams.get('skip') || 0) || (Number(url.searchParams.get('pageNumber') || 1) - 1) * pageSize;
  const objects = [];
  for (let i = skip + 1; i <= Math.min(total, skip + pageSize); i++) objects.push(factory(i));
  return { success: true, maxResults: pageSize, skip, totalRecords: total, recordsRemaining: Math.max(0, total - skip - objects.length), endOfResults: skip + objects.length >= total, objects };
}

const SETTINGS = {
  fields: [
    { path: 'Server.Port', group: 'Server', value: 8700, type: 'Number', min: 1, max: 65535, source: 'File', applyMode: 'RestartRequired' },
    { path: 'Server.Hostname', group: 'Server', value: '127.0.0.1', type: 'String', source: 'Environment', applyMode: 'RestartRequired' },
    { path: 'Logging.MinimumSeverity', group: 'Logging', value: 'Info', type: 'String', options: ['Debug', 'Info', 'Warn', 'Error'], source: 'File', applyMode: 'Live' },
    { path: 'Database.Type', group: 'Database', value: 'Sqlite', type: 'String', options: ['Sqlite', 'Postgresql'], source: 'File', applyMode: 'RestartRequired' },
    { path: 'Database.Password', group: 'Database', isSecret: true, isSet: true, type: 'String', source: 'File', applyMode: 'RestartRequired' },
    { path: 'Scheduler.LeaseSeconds', group: 'Scheduler', value: 60, type: 'Number', min: 10, max: 3600, source: 'Database', applyMode: 'Live' }
  ],
  restartPending: false
};

const OPENAPI = {
  openapi: '3.0.1',
  info: { title: 'Garrison', version: '0.1.0-alpha' },
  paths: {
    '/v1.0/api/health': { get: { tags: ['Health'], summary: 'Health check', operationId: 'health' } },
    '/v1.0/api/tenants/{tenantId}/agents': {
      get: { tags: ['Agents'], summary: 'List agents', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }, { name: 'maxResults', in: 'query', schema: { type: 'integer' } }] },
      post: { tags: ['Agents'], summary: 'Create agent', parameters: [{ name: 'tenantId', in: 'path', required: true, schema: { type: 'string' } }], requestBody: { content: { 'application/json': { schema: { type: 'object', properties: { name: { type: 'string' } } } } } } }
    },
    '/v1.0/api/tenants/{tenantId}/agents/{agentId}': {
      delete: { tags: ['Agents'], summary: 'Delete agent', parameters: [{ name: 'tenantId', in: 'path', required: true }, { name: 'agentId', in: 'path', required: true }] }
    }
  }
};

function summary() {
  const buckets = [];
  for (let i = 0; i < 24; i++) buckets.push({ bucketStartUtc: iso(i * 60), successCount: 10 + (i % 5), failureCount: i % 3, averageDurationMs: 20 + i });
  return { totalCount: 400, totalSuccess: 360, totalFailure: 40, averageDurationMs: 24, buckets };
}

const EVENTS = [
  { sequence: 1, eventType: 'Lifecycle', text: 'Run leased by garrison-worker-0', timestampUtc: iso(5) },
  { sequence: 2, eventType: 'AssistantText', text: 'Hello from the fake harness.', timestampUtc: iso(4) },
  { sequence: 3, eventType: 'ToolCall', toolName: 'read_file', text: '{"path":"README.md"}', timestampUtc: iso(4) },
  { sequence: 4, eventType: 'Result', text: 'Done.', timestampUtc: iso(3) }
];

/** JSON body for a request, or undefined when unhandled. */
function respond(method, url) {
  const p = url.pathname;
  if (p === '/openapi.json') return OPENAPI;
  if (p === '/v1.0/token' && method === 'POST') return { token: 'tok_e2e', expiresUtc: iso(-60) };
  if (p === '/v1.0/token/details') return PRINCIPAL;
  if (p.startsWith('/v1.0/token')) return {};
  if (p === '/v1.0/api/health') return { status: 'Healthy', version: '0.1.0-alpha' };
  if (p === '/v1.0/api/server-info') return { version: '0.1.0-alpha', nodeName: 'garrison-command-0', database: 'Sqlite', replicas: 1, routeCount: 214, serverTimeUtc: iso(0), endpoints: { rest: 'http://127.0.0.1:8700', mcp: 'http://127.0.0.1:8701', a2a: 'http://127.0.0.1:8700/a2a' }, features: { a2a: true } };
  if (p === '/v1.0/api/settings') return method === 'GET' ? SETTINGS : { restartPending: true };
  if (p.startsWith('/v1.0/api/settings')) return { success: true, message: 'ok' };
  if (p === '/v1.0/api/request-history/summary') return summary();
  if (p === '/v1.0/api/harness-profiles/builtin') return enumerate('harness-profiles', url).objects;

  let m = p.match(/^\/v1\.0\/api\/(request-history|nodes|tenants)(?:\/([^/]+))?(?:\/(cordon|uncordon|drain))?$/);
  if (m) {
    if (!m[2]) return method === 'GET' ? enumerate(m[1], url) : FACTORIES[m[1]](99);
    return FACTORIES[m[1]](1);
  }

  m = p.match(/^\/v1\.0\/api\/tenants\/[^/]+\/(.+)$/);
  if (m) {
    const parts = m[1].split('/');
    const collection = parts[0];
    if (collection === 'overview') return { agents: 6, deployments: 6, runsLast24Hours: 137, runsByStatus: [{ status: 'Running', count: 2 }, { status: 'Queued', count: 3 }, { status: 'Succeeded', count: 120 }, { status: 'Failed', count: 12 }], nodesByStatus: [{ status: 'Ready', count: 2 }, { status: 'Cordoned', count: 1 }], queued: 3, active: 2, generatedUtc: new Date().toISOString(), nodes: [1, 2, 3].map(FACTORIES.nodes), recentFailures: [2, 8].map((i) => ({ ...FACTORIES.runs(i), status: 'Failed', outcome: 'HarnessFailed' })) };
    if (collection === 'queue') return [{ agentName: 'echo-agent', harnessType: 'ClaudeCode', queued: 3, leased: 1, running: 2 }];
    if (collection === 'manifests' && parts[1] === 'applies') return parts.length === 2 ? enumerate('manifest-applies', url) : FACTORIES['manifest-applies'](1);
    if (collection === 'manifests' && parts[1] === 'export') return 'apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: echo-agent\n';
    if (collection === 'manifests') return { items: [{ kind: 'Agent', name: 'echo-agent', result: 'Created' }, { kind: 'Deployment', name: 'echo-agent-default', result: 'Created' }] };
    if (collection === 'runs' && parts[2] === 'events') return { objects: EVENTS, totalRecords: EVENTS.length, skip: 0, maxResults: 100, endOfResults: true };
    if (collection === 'runs' && parts[2] === 'children') return { objects: [], totalRecords: 0, skip: 0, maxResults: 100, endOfResults: true };
    if (collection === 'agents' && parts[2] === 'invoke') return { ...FACTORIES.runs(1), id: 'run_0001', status: 'Running' };
    if (collection === 'prompt-templates' && parts[1] === 'render') return { rendered: 'You are echo-agent. Task: hello', missingVariables: [] };
    if (collection === 'prompt-templates' && parts[2] === 'versions') return { objects: [1, 2].map((v) => ({ version: v, content: `Version ${v} {{input}}`, changeNote: `v${v}`, author: 'admin', createdUtc: iso(v * 60) })), totalRecords: 2, skip: 0, maxResults: 100 };
    if (parts.length === 1) return method === 'GET' ? enumerate(collection, url) : FACTORIES[collection]?.(99) || {};
    if (parts.length === 2 && FACTORIES[collection]) return FACTORIES[collection](1);
    return {};
  }
  return undefined;
}

/** Install mocks on a Playwright page. */
export async function installMocks(page) {
  await page.routeWebSocket(/\/v1\.0\/ws/, (ws) => ws.close());
  await page.route(/\/(v1\.0|openapi\.json)/, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.pathname.endsWith('/events/stream')) {
      const body = EVENTS.map((e) => `event: run.event\ndata: ${JSON.stringify(e)}\n\n`).join('') + `event: run.status\ndata: ${JSON.stringify({ status: 'Succeeded' })}\n\n`;
      return route.fulfill({ status: 200, headers: { 'content-type': 'text/event-stream' }, body });
    }
    const method = req.method();
    if (method === 'DELETE') return route.fulfill({ status: 204, body: '' });
    const body = respond(method, url);
    if (body === undefined) return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'RouteNotFound', code: 'RouteNotFound', message: 'Not found' }) });
    if (typeof body === 'string') return route.fulfill({ status: 200, contentType: 'application/yaml', body });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}
