#!/usr/bin/env node
// UX pass seed (LEARNABILITY_PLAN.md LP5.1): stand up a fresh Garrison server and worker from the current source and
// fill them, through the public REST API only, with enough data that every dashboard route has something to show.
//
// What it does, in order:
//   1. Builds Garrison.Server, Garrison.Worker, and Garrison.FakeHarness into <out>/artifacts (skip with --no-build).
//   2. Starts the server (Sqlite, data under <out>/server) and one worker on the fake harness, detached, so they keep
//      running after this script exits. Process IDs go to <out>/pids.json. Skip with --no-start to seed a running server.
//   3. Starts the dashboard dev server (npx vite) against that server, also detached (skip with --no-vite).
//   4. Seeds, one step at a time. Every step logs what it did and the IDs it made; a step that fails is logged and the
//      rest still run:
//        gerbil          examples/autonomous/gerbil, played through scripts/run-autonomy-example.sh (an escalation a
//                        person answers, memory between ticks)
//        sre             examples/autonomous/site-reliability-org: the org, its keepers' first round (peer message,
//                        reports, board brief, an open escalation), its eval set (approved) and change rules
//        invokes         an echo agent on the fake harness: several runs, one failed run, a two-turn conversation
//        chain           a support desk organization of four agents where each wakes the next with urgent mail, so one
//                        invoke has a trail of three message hops ending in a report
//        fanout          an orchestrator that fans out to three members, one of which always fails, then a retry of the
//                        failed member
//        escalation      makes sure at least one escalation was answered by a person
//        report          a report filed by a person in the echo agent's name
//        canary          a canary release between two deployments of one agent, with runs on it
//        eval            an approved eval set on the echo agent and an eval run of it, plus driver-upgrade-checks
//        shadow          a shadow trial copying every run of one deployment to another, with source runs
//        approvals       a deployment that asks before tool calls, and a run that recorded approvals
//        pipeline        a two-stage pipeline whose run waits on a review
//        studio          a studio draft with one agent document
//        secret          one secret, so the Secrets list has a row and a row menu
//        freeze          an active freeze on an agent and a lifted one (seeded last)
//   5. Writes <out>/seed.json with every ID a reviewer or capture.mjs needs, and prints the summary.
//
// Run it from dashboard/:
//
//   node tests/audit/seed.mjs --out /path/to/scratch/uxpass1
//
// Options (each has an environment variable; flags win):
//   --out DIR          where builds, data, logs, pids.json and seed.json go   UXSEED_OUT (required)
//   --rest-port N      server REST port                                       UXSEED_REST_PORT    18950
//   --mcp-port N       server MCP port                                        UXSEED_MCP_PORT     18951
//   --worker-port N    worker health port                                     UXSEED_WORKER_PORT  18960
//   --vite-port N      dashboard dev server port                              UXSEED_VITE_PORT    18955
//   --no-build         reuse <out>/artifacts
//   --no-start         seed an already running server on --rest-port (implies --no-build and --no-vite)
//   --no-vite          do not start the dashboard dev server
//   --steps a,b        only these seed steps (default all, in the order above)
//
// Requires dotnet 10, node 20+, bash, curl, and jq (the gerbil step shells out to scripts/run-autonomy-example.sh).
// Everything binds to 127.0.0.1. The server runs in development mode (GARRISON_ALLOW_INSECURE_DEFAULTS=true), so it uses
// the public default keys and the admin@garrison / password sign-in: never expose it.

import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DASHBOARD = path.resolve(HERE, '../..');
const ROOT = path.resolve(DASHBOARD, '..');
const TENANT = 'default';
const EMAIL = 'admin@garrison';
const PASSWORD = 'password';
const ADMIN_KEY = 'garrisonadmin';

function parseArgs(argv) {
  const opts = {
    out: process.env.UXSEED_OUT || '',
    restPort: Number(process.env.UXSEED_REST_PORT || 18950),
    mcpPort: Number(process.env.UXSEED_MCP_PORT || 18951),
    workerPort: Number(process.env.UXSEED_WORKER_PORT || 18960),
    vitePort: Number(process.env.UXSEED_VITE_PORT || 18955),
    build: true,
    start: true,
    vite: true,
    steps: []
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--out') opts.out = next();
    else if (a === '--rest-port') opts.restPort = Number(next());
    else if (a === '--mcp-port') opts.mcpPort = Number(next());
    else if (a === '--worker-port') opts.workerPort = Number(next());
    else if (a === '--vite-port') opts.vitePort = Number(next());
    else if (a === '--no-build') opts.build = false;
    else if (a === '--no-start') {
      opts.start = false;
      opts.build = false;
      opts.vite = false;
    } else if (a === '--no-vite') opts.vite = false;
    else if (a === '--steps') opts.steps = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '-h' || a === '--help') {
      process.stdout.write(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 45).map((l) => l.replace(/^\/\/ ?/, '')).join('\n') + '\n');
      process.exit(0);
    } else throw new Error(`unknown option ${a} (try --help)`);
  }
  if (!opts.out) throw new Error('--out DIR (or UXSEED_OUT) is required');
  opts.out = path.resolve(opts.out);
  return opts;
}

const OPTS = parseArgs(process.argv.slice(2));
const BASE = `http://127.0.0.1:${OPTS.restPort}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const STARTED = Date.now();

function log(msg) {
  const s = ((Date.now() - STARTED) / 1000).toFixed(1).padStart(6);
  process.stdout.write(`[${s}s] ${msg}\n`);
}

// ---------------------------------------------------------------- processes

function startDetached(name, cmd, args, opts) {
  const logFile = path.join(OPTS.out, 'logs', `${name}.log`);
  const fd = fs.openSync(logFile, 'a');
  const child = spawn(cmd, args, { ...opts, detached: true, stdio: ['ignore', fd, fd] });
  child.unref();
  log(`started ${name} (pid ${child.pid}), log ${logFile}`);
  return child.pid;
}

async function waitFor(what, fn, seconds = 120) {
  for (let i = 0; i < seconds; i += 1) {
    try {
      if (await fn()) return true;
    } catch {
      /* not yet */
    }
    await sleep(1000);
  }
  throw new Error(`${what} did not become ready within ${seconds} s (logs in ${path.join(OPTS.out, 'logs')})`);
}

function build(art) {
  for (const project of ['Garrison.Server', 'Garrison.Worker', 'Garrison.FakeHarness']) {
    log(`building ${project} into ${art}`);
    const r = spawnSync('dotnet', ['build', path.join(ROOT, 'src', project, `${project}.csproj`), '-f', 'net10.0', '--artifacts-path', art, '-v', 'quiet', '-nologo'], { encoding: 'utf8' });
    if (r.status !== 0) {
      process.stdout.write(`${r.stdout}\n${r.stderr}`.split('\n').slice(-40).join('\n') + '\n');
      throw new Error(`dotnet build of ${project} failed`);
    }
  }
}

async function startStack() {
  const art = path.join(OPTS.out, 'artifacts');
  if (OPTS.build) build(art);
  const bin = (project, dll) => path.join(art, 'bin', project, 'debug_net10.0', dll);
  const serverDll = bin('Garrison.Server', 'Garrison.Server.dll');
  const workerDll = bin('Garrison.Worker', 'Garrison.Worker.dll');
  const fakeDll = bin('Garrison.FakeHarness', 'garrison-fake-harness.dll');
  for (const f of [serverDll, workerDll, fakeDll]) if (!fs.existsSync(f)) throw new Error(`missing build output ${f}`);

  for (const d of ['bin', 'server', 'worker', 'logs']) fs.mkdirSync(path.join(OPTS.out, d), { recursive: true });
  const wrapper = path.join(OPTS.out, 'bin', 'garrison-fake-harness');
  fs.writeFileSync(wrapper, `#!/usr/bin/env bash\nexec dotnet "${fakeDll}" "$@"\n`, { mode: 0o755 });

  const serverDir = path.join(OPTS.out, 'server');
  const settings = path.join(serverDir, 'garrison.json');
  fs.writeFileSync(
    settings,
    JSON.stringify(
      {
        Rest: { Hostname: '127.0.0.1', Port: OPTS.restPort, LivenessPort: 0 },
        Mcp: { Hostname: '127.0.0.1', Port: OPTS.mcpPort, PublicUrl: `http://127.0.0.1:${OPTS.mcpPort}` },
        Database: { Type: 'Sqlite', Filename: path.join(serverDir, 'garrison.db') },
        Logging: { ConsoleLogging: true, MinimumSeverity: 2 },
        Telemetry: { Enabled: false },
        AgentMemory: { Enabled: true, RootDirectory: path.join(serverDir, 'agent-memory') }
      },
      null,
      2
    )
  );
  const pids = {};
  pids.server = startDetached('server', 'dotnet', [serverDll], {
    cwd: serverDir,
    env: {
      ...process.env,
      GARRISON_SETTINGS_FILE: settings,
      // Development mode: this throwaway server uses the public default keys and credentials (SR-08).
      GARRISON_ALLOW_INSECURE_DEFAULTS: 'true',
      GARRISON_TELEMETRY_ENABLE: 'false',
      GARRISON_LIVENESS_PORT: '0',
      GARRISON_AGENT_MEMORY_ENABLE: 'true',
      GARRISON_AGENT_MEMORY_ROOT: path.join(serverDir, 'agent-memory')
    }
  });
  await waitFor('server', async () => (await fetch(`${BASE}/v1.0/api/health`)).ok, 180);
  log(`server healthy on ${BASE}`);

  const workerDir = path.join(OPTS.out, 'worker');
  pids.worker = startDetached('worker', 'dotnet', [workerDll], {
    cwd: workerDir,
    env: {
      ...process.env,
      PATH: `${path.join(OPTS.out, 'bin')}${path.delimiter}${process.env.PATH}`,
      GARRISON_WORKER_SETTINGS_FILE: path.join(workerDir, 'garrison-worker.json'),
      GARRISON_WORKER_SERVER_URL: BASE,
      GARRISON_WORKER_NODE_NAME: 'uxpass-worker',
      GARRISON_WORKER_HEALTH_PORT: String(OPTS.workerPort),
      GARRISON_WORKER_WORK_ROOT: path.join(workerDir, 'workspaces'),
      GARRISON_WORKER_MAX_CONCURRENT_RUNS: '8',
      GARRISON_WORKER_TELEMETRY_ENABLE: 'false'
    }
  });
  await waitFor('worker', async () => {
    const r = await fetch(`${BASE}/v1.0/api/nodes`, { headers: { 'x-api-key': ADMIN_KEY } });
    return r.ok && (await r.text()).includes('"status":"Ready"');
  });
  log('worker Ready');

  if (OPTS.vite) {
    pids.vite = startDetached('vite', 'npx', ['vite', '--port', String(OPTS.vitePort), '--host', '127.0.0.1', '--strictPort'], {
      cwd: DASHBOARD,
      env: { ...process.env, GARRISON_API_URL: BASE }
    });
    await waitFor('vite', async () => (await fetch(`http://127.0.0.1:${OPTS.vitePort}/`)).ok, 60);
    log(`dashboard dev server on http://127.0.0.1:${OPTS.vitePort}`);
  }
  fs.writeFileSync(
    path.join(OPTS.out, 'pids.json'),
    JSON.stringify({ ...pids, ports: { rest: OPTS.restPort, mcp: OPTS.mcpPort, workerHealth: OPTS.workerPort, vite: OPTS.vite ? OPTS.vitePort : null } }, null, 2)
  );
  return pids;
}

// ---------------------------------------------------------------- HTTP

let TOKEN = '';

class ApiError extends Error {
  constructor(method, p, status, body) {
    super(`${method} ${p} -> ${status}: ${typeof body === 'string' ? body.slice(0, 400) : JSON.stringify(body).slice(0, 400)}`);
    this.status = status;
    this.body = body;
  }
}

async function call(method, p, body, headers = {}) {
  const h = { ...headers };
  if (TOKEN) h.Authorization = `Bearer ${TOKEN}`;
  let payload;
  if (body !== undefined) {
    if (typeof body === 'string') payload = body;
    else {
      payload = JSON.stringify(body);
      h['Content-Type'] = 'application/json';
    }
  }
  const res = await fetch(BASE + p, { method, headers: h, body: payload, signal: AbortSignal.timeout(180000) });
  const text = await res.text();
  let parsed = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  if (!res.ok) throw new ApiError(method, p, res.status, parsed);
  return parsed;
}

const tp = (sub) => `/v1.0/api/tenants/${TENANT}/${sub}`;
const get = (sub) => call('GET', tp(sub));
const post = (sub, body, headers) => call('POST', tp(sub), body, headers);
const list = async (sub) => {
  const r = await get(sub);
  return Array.isArray(r) ? r : r?.objects || [];
};
const apply = (yaml) => post('manifests/apply', yaml, { 'Content-Type': 'application/yaml' });

function appliedSummary(result) {
  const items = result?.items || [];
  const failed = items.filter((i) => i.result === 'Failed');
  if (failed.length) throw new Error(`apply failed: ${failed.map((i) => `${i.kind}/${i.name}: ${i.message}`).join('; ')}`);
  return `${items.length} documents (${items.map((i) => `${i.kind}/${i.name} ${i.result}`).join(', ')})`;
}

async function signIn() {
  const r = await call('POST', '/v1.0/token', { tenantId: TENANT, email: EMAIL, password: PASSWORD });
  TOKEN = r.token;
}

async function poll(what, fn, seconds = 120, everyMs = 2000) {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {
      /* keep trying */
    }
    await sleep(everyMs);
  }
  throw new Error(`${what}: not reached within ${seconds} s`);
}

const TERMINAL = new Set(['Succeeded', 'Failed', 'TimedOut', 'Cancelled', 'Rejected']);
const runDone = async (id) => {
  const r = await get(`runs/${id}`);
  return TERMINAL.has(r.status) ? r : null;
};

// ---------------------------------------------------------------- seed steps

const ids = {};
const results = [];

/** The scripted fake profile: the fake harness calling the Garrison MCP tools in deployment parameters step1 to step4. */
const SCRIPT_PROFILE = `apiVersion: garrison/v1
kind: HarnessProfile
metadata:
  name: scripted-fake
  description: The fake harness, calling the Garrison MCP tools named in deployment parameters step1 to step4 in order
spec:
  harnessType: Generic
  executable: garrison-fake-harness
  promptDelivery: Stdin
  mcpConfigFormat: ClaudeJson
  mcpConfigFileName: mcp.json
  outputParser: ClaudeStreamJson
  resultSource: ParserFinalEvent
  defaultTimeoutSeconds: 300
  files:
    - baseDirectory: Config
      pathTemplate: mcp.json
      contentTemplate: "{{> builtin/claude-code-mcp-config}}"
      isSecret: true
      condition: "{{resources.hasMcpServers}}"
      mode: "600"
  arguments:
    - template: --format
    - template: claude
    - template: --mcp-config
      condition: "{{resources.hasMcpServers}}"
    - template: $GARRISON_CONFIG_DIR/mcp.json
      condition: "{{resources.hasMcpServers}}"
${[1, 2, 3, 4]
  .map(
    (n) => `    - template: --mcp-invoke
      condition: "{{deployment.parameters.step${n}}}"
    - template: "{{deployment.parameters.step${n}}}"
      condition: "{{deployment.parameters.step${n}}}"`
  )
  .join('\n')}
`;

const doc = (kind, name, spec, description) =>
  `apiVersion: garrison/v1\nkind: ${kind}\nmetadata:\n  name: ${name}\n${description ? `  description: ${description}\n` : ''}spec:\n${spec}`;

async function stepGerbil() {
  const script = path.join(ROOT, 'scripts', 'run-autonomy-example.sh');
  const r = spawnSync('bash', [script, '--url', BASE, '--token', TOKEN, '--wait', '120'], { encoding: 'utf8', timeout: 900000 });
  const lines = `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n');
  for (const l of lines) log(`  gerbil | ${l}`);
  const mandate = await get('mandates/gerbil-keeper');
  ids.gerbilMandate = mandate.id;
  ids.gerbilAgent = mandate.agentId;
  const esc = await list(`escalations?mandateId=${mandate.id}&maxResults=20`);
  const answered = esc.find((e) => e.status === 'Answered');
  if (answered) ids.answeredEscalation = answered.id;
  if (r.status !== 0) throw new Error(`run-autonomy-example.sh exited ${r.status} (see the gerbil lines above)`);
  return `mandate ${mandate.id}; answered escalation ${ids.answeredEscalation || 'none'}`;
}

async function stepSre() {
  const dir = path.join(ROOT, 'examples', 'autonomous', 'site-reliability-org');
  const yaml = ['org.yaml', 'fake-harness.yaml'].map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n---\n');
  log(`  sre | apply: ${appliedSummary(await apply(yaml))}`);
  const set = await post('eval-sets', JSON.parse(fs.readFileSync(path.join(dir, 'eval-set.json'), 'utf8')));
  const approved = await post(`eval-sets/${set.id}/approve`, {});
  ids.sreEvalSet = approved.id;
  log(`  sre | eval set driver-upgrade-checks ${approved.id} approved`);
  ids.sreChangeRules = [];
  for (const rule of JSON.parse(fs.readFileSync(path.join(dir, 'change-rules.json'), 'utf8'))) {
    ids.sreChangeRules.push((await post('change-rules', rule)).id);
  }
  log(`  sre | change rules ${ids.sreChangeRules.join(', ')}`);
  const org = await get('organizations/site-reliability-org');
  ids.sreOrganization = org.id;
  // Every mandate is new, so the five keepers tick within seconds. Wait for the round: reports from the latency and
  // dependency keepers, the board brief, and the uptime keeper's escalation.
  await poll('site-reliability round', async () => {
    const reports = await list('reports?maxResults=50');
    const kinds = new Set(reports.map((x) => x.kind));
    const esc = await list('escalations?status=Open&maxResults=50');
    return kinds.has('Brief') && kinds.has('Incident') && esc.length > 0;
  }, 240, 3000).catch((e) => log(`  sre | ${e.message}; continuing with what arrived`));
  const reports = await list('reports?maxResults=50');
  ids.sreReports = reports.map((x) => x.id);
  const msgs = await list('messages?maxResults=50');
  const peer = msgs.find((m) => m.subject && m.subject.startsWith('Checkout p95'));
  if (peer) {
    ids.srePeerMessage = peer.id;
    ids.srePeerThread = peer.threadId || peer.id;
  }
  const open = await list('escalations?status=Open&maxResults=50');
  if (open.length) ids.openEscalation = open[0].id;
  const latencyMandate = await get('mandates/latency-watch');
  ids.sreLatencyMandate = latencyMandate.id;
  return `organization ${org.id}; ${reports.length} reports; peer message ${ids.srePeerMessage || 'none'}; open escalation ${ids.openEscalation || 'none'}`;
}

async function stepInvokes() {
  log(`  invokes | ${appliedSummary(
    await apply(
      doc('Agent', 'docs-helper', '  displayName: Docs Helper\n  tags: [uxpass]\n', 'Answers questions about the product docs') +
        '\n---\n' +
        doc(
          'Deployment',
          'docs-helper-fake',
          '  agent: docs-helper\n  harnessProfile: builtin/fake\n  timeoutSeconds: 60\n  allowedRunOverrides:\n    - name: fail\n      validation: Any\n'
        )
    )
  )}`);
  const agent = await get('agents/docs-helper');
  ids.echoAgent = agent.id;
  const deps = await list(`deployments?agentId=${agent.id}&maxResults=5`);
  ids.echoDeployment = (deps.find((d) => d.name === 'docs-helper-fake') || deps[0] || {}).id;
  const inputs = [
    'How do I rotate the signing key?',
    'Summarize the release notes for 0.3.0.',
    'What does a freeze do to a keeper?',
    'Where are run artifacts stored?',
    'Explain the difference between a message and a delegation.'
  ];
  ids.runs = [];
  for (const input of inputs) {
    const r = await post(`agents/${agent.id}/invoke?wait=true&waitSeconds=90`, { input });
    ids.runs.push(r.id);
  }
  const failed = await post('runs', { agentId: agent.id, input: 'This one is meant to fail.', parameters: { fail: 'true' }, wait: true, waitSeconds: 90 });
  ids.failedRun = failed.id;
  const first = await post(`agents/${agent.id}/invoke?wait=true&waitSeconds=90`, { input: 'Start a conversation about keepers.', startConversation: true });
  ids.conversation = first.conversationId;
  await post(`agents/${agent.id}/invoke?wait=true&waitSeconds=90`, { input: 'And how often do they wake?', conversationId: ids.conversation });
  return `agent ${agent.id}; runs ${ids.runs.join(', ')}; failed run ${failed.id} (${failed.status}); conversation ${ids.conversation}`;
}

async function stepChain() {
  const agents = [
    ['support-intake', 'Support Intake', 'Takes customer requests and routes them to triage'],
    ['support-triage', 'Support Triage', 'Sorts requests and hands hard ones to the investigator'],
    ['support-investigator', 'Support Investigator', 'Finds the cause of a problem and asks the scribe to write it up'],
    ['support-scribe', 'Support Scribe', 'Writes up what was found and reports it upward']
  ];
  const send = (to, subject, body) => `'garrison,garrison_send_message,${JSON.stringify({ recipient: to, subject, body, urgency: 'Urgent' })}'`;
  const steps = {
    'support-intake': [send('support-triage', 'Customer cannot export invoices', 'A customer reports that invoice export returns an empty file since this morning. Please triage.')],
    'support-triage': [send('support-investigator', 'Invoice export returns empty files', 'Triage: reproducible for every account in the eu region. Looks like a backend problem, please investigate.')],
    'support-investigator': [send('support-scribe', 'Root cause: export job timeout', 'The export job hits the 30 second limit after the index change. Please write it up for the lead.')],
    'support-scribe': [
      `'garrison,garrison_file_report,${JSON.stringify({ title: 'Invoice export outage', kind: 'Incident', health: 'Degraded', body: 'Invoice export returned empty files in the eu region because the export job hit its 30 second limit after an index change. Triage and investigation are done; a fix needs a person.', metrics: [{ name: 'affected_accounts', value: 212 }], issues: [{ severity: 'High', text: 'Export job timeout after the index change.' }] })}'`
    ]
  };
  const docs = [SCRIPT_PROFILE.trimEnd()];
  for (const [name, display, desc] of agents) {
    docs.push(doc('Agent', name, `  displayName: ${display}\n  tags: [uxpass, support]\n`, desc));
    docs.push(
      doc(
        'Deployment',
        `${name}-fake`,
        `  agent: ${name}\n  harnessProfile: scripted-fake\n  timeoutSeconds: 120\n  parameters:\n${steps[name].map((s, i) => `    step${i + 1}: ${s}`).join('\n')}\n`
      )
    );
  }
  docs.push(
    doc(
      'Organization',
      'support-desk-org',
      `  description: A support desk where each agent hands the case to the next (UX pass seed)
  mission: Answer every customer request within a day.
  units:
    - name: intake
      lead: support-intake
      leadTitle: Intake
      budgets:
        - { period: Day, amountUsd: 5 }
      units:
        - name: triage
          lead: support-triage
          leadTitle: Triage
          units:
            - name: investigation
              lead: support-investigator
              leadTitle: Investigator
              units:
                - name: writeups
                  lead: support-scribe
                  leadTitle: Scribe
`
    )
  );
  log(`  chain | ${appliedSummary(await apply(docs.join('\n---\n')))}`);
  const org = await get('organizations/support-desk-org');
  ids.chainOrganization = org.id;
  if (!org.publishedRevisionId && org.status !== 'Active') log(`  chain | organization status ${org.status}; messages need a live organization`);
  const intake = await get('agents/support-intake');
  const run = await post(`agents/${intake.id}/invoke?wait=true&waitSeconds=90`, { input: 'A customer says invoice export returns an empty file.' });
  ids.chainOriginRun = run.id;
  log(`  chain | origin run ${run.id} ${run.status}`);
  const trail = await poll('a trail of three message hops', async () => {
    const t = await get(`runs/${run.id}/trail`);
    const runs = (t.nodes || []).filter((n) => n.kind === 'Run');
    const settled = runs.every((n) => TERMINAL.has(n.state));
    return (t.hopCount || 0) >= 3 && settled && runs.length >= 4 ? t : null;
  }, 180, 3000);
  ids.chainTrailHops = trail.hopCount;
  ids.chainTrailNodes = (trail.nodes || []).length;
  const deepest = (trail.nodes || []).filter((n) => n.kind === 'Run' && n.agentName && /Scribe|scribe/.test(n.agentName));
  if (deepest.length) ids.chainLeafRun = deepest[0].id;
  const step = (trail.nodes || []).find((n) => n.kind === 'Message');
  if (step) ids.chainMessageStep = step.id;
  return `organization ${org.id}; origin run ${run.id}; trail hopCount ${trail.hopCount}, ${ids.chainTrailNodes} nodes`;
}

async function stepFanout() {
  const fan = JSON.stringify({
    members: [
      { agent: 'research-member', input: 'Summarize the incident timeline', label: 'timeline' },
      { agent: 'research-member', input: 'List the customers affected', label: 'customers' },
      { agent: 'research-flaky', input: 'Fetch the vendor status page', label: 'vendor' }
    ],
    joinPolicy: 'All',
    timeoutSeconds: 120
  });
  const docs = [
    SCRIPT_PROFILE.trimEnd(),
    doc('Agent', 'research-member', '  displayName: Research Member\n  tags: [uxpass]\n', 'Answers one part of a fanned-out research task'),
    doc('Deployment', 'research-member-fake', '  agent: research-member\n  harnessProfile: builtin/fake\n'),
    doc('Agent', 'research-flaky', '  displayName: Vendor Checker\n  tags: [uxpass]\n', 'Checks a vendor status page that is down today'),
    doc('Deployment', 'research-flaky-fake', "  agent: research-flaky\n  harnessProfile: builtin/fake\n  parameters:\n    fail: 'true'\n"),
    doc('Agent', 'research-lead', '  displayName: Research Lead\n  tags: [uxpass]\n  delegation:\n    allow: [research-member, research-flaky]\n    maxDepth: 1\n', 'Asks three researchers at once and gathers their answers'),
    doc(
      'Deployment',
      'research-lead-fake',
      `  agent: research-lead\n  harnessProfile: scripted-fake\n  timeoutSeconds: 180\n  parameters:\n    step1: 'garrison,garrison_fan_out,${fan}'\n    step2: 'garrison,garrison_gather,{"waitSeconds":110}'\n`
    )
  ];
  log(`  fanout | ${appliedSummary(await apply(docs.join('\n---\n')))}`);
  const lead = await get('agents/research-lead');
  const run = await post(`agents/${lead.id}/invoke?wait=true&waitSeconds=170`, { input: 'Research the invoice export outage.' });
  ids.fanoutParentRun = run.id;
  log(`  fanout | parent run ${run.id} ${run.status}`);
  const groups = await list(`runs/${run.id}/fan-out-groups`);
  if (groups.length) ids.fanoutGroup = groups[0].fanOutGroupId || groups[0].id;
  const children = await poll('fan-out children finished', async () => {
    const c = await list(`runs/${run.id}/children?maxResults=20`);
    return c.length >= 3 && c.every((x) => TERMINAL.has(x.status)) ? c : null;
  }, 120);
  const failed = children.find((c) => c.status !== 'Succeeded');
  if (!failed) return `group ${ids.fanoutGroup || 'none'}; no failed member to retry`;
  const retry = await post(`runs/${failed.id}/retry`, {});
  ids.fanoutFailedMember = failed.id;
  ids.fanoutRetry = retry.id;
  await poll('retry finished', () => runDone(retry.id), 90).catch(() => null);
  return `parent ${run.id}; group ${ids.fanoutGroup || 'none'}; failed member ${failed.id}; retry ${retry.id}`;
}

async function stepEscalation() {
  const answered = await list('escalations?status=Answered&maxResults=5');
  if (answered.length) {
    ids.answeredEscalation = ids.answeredEscalation || answered[0].id;
    return `already answered: ${answered[0].id}`;
  }
  const open = await list('escalations?status=Open&maxResults=5');
  if (!open.length) throw new Error('no open escalation to answer');
  const e = open[open.length - 1];
  const options = e.options || [];
  const body = options.length ? { choice: options[options.length - 1].key, text: 'Hold for now; the provider is investigating.' } : { text: 'Hold for now; the provider is investigating.' };
  const r = await post(`escalations/${e.id}/answer`, body);
  ids.answeredEscalation = r.id;
  return `answered ${r.id} (${r.status})`;
}

async function stepReport() {
  const r = await post('reports', {
    agent: 'docs-helper',
    kind: 'Status',
    health: 'Healthy',
    audience: 'Manager',
    title: 'Docs questions this week',
    body: 'Answered 48 questions about keepers, freezes, and key rotation. Two pages need clearer examples.',
    periodStartUtc: new Date(Date.now() - 7 * 86400000).toISOString(),
    periodEndUtc: new Date().toISOString(),
    metrics: [{ name: 'questions_answered', value: 48 }],
    issues: [{ severity: 'Low', text: 'The key rotation page has no example for Postgres.' }],
    decisions: [{ text: 'Ask the docs team for a rotation example.' }],
    idempotencyKey: 'uxpass-report-1'
  });
  ids.personReport = r.id;
  return `report ${r.id}`;
}

async function stepCanary() {
  const docs = [
    doc('Agent', 'invoice-extractor', '  displayName: Invoice Extractor\n  tags: [uxpass]\n', 'Reads invoices and returns their fields'),
    doc('Deployment', 'invoice-extractor-stable', '  agent: invoice-extractor\n  harnessProfile: builtin/fake\n  weight: 1000\n'),
    doc('Deployment', 'invoice-extractor-next', '  agent: invoice-extractor\n  harnessProfile: builtin/fake\n  weight: 0\n  model: next\n')
  ];
  log(`  canary | ${appliedSummary(await apply(docs.join('\n---\n')))}`);
  const rel = await post('canary-releases', {
    agentId: 'invoice-extractor',
    candidateDeploymentId: 'invoice-extractor-next',
    baselineDeploymentId: 'invoice-extractor-stable',
    steps: [
      { weightPercent: 10, minimumRuns: 20, minimumMinutes: 10 },
      { weightPercent: 50, minimumRuns: 20, minimumMinutes: 10 },
      { weightPercent: 100, minimumRuns: 20, minimumMinutes: 10 }
    ],
    maxErrorRatePercent: 5
  });
  ids.canaryRelease = rel.id;
  for (let i = 0; i < 6; i += 1) await post('agents/invoice-extractor/invoke?wait=true&waitSeconds=60', { input: `Extract the fields of invoice INV-${1040 + i}.` });
  return `release ${rel.id} (${rel.status}); 6 runs`;
}

async function stepEval() {
  const set = await post('eval-sets', {
    name: 'docs-helper-checks',
    description: 'Questions the docs helper must answer by quoting the question back',
    origin: 'Human',
    tags: ['uxpass'],
    cases: [
      { name: 'mentions freezes', inputText: 'What does a freeze do?', expectedText: 'freeze', checks: [{ scorer: 'Contains', argument: 'freeze', weight: 1 }] },
      { name: 'mentions keepers', inputText: 'How often do keepers wake?', checks: [{ scorer: 'Contains', argument: 'keepers', weight: 1 }] },
      { name: 'exact answer', inputText: 'Say exactly: ok', expectedText: 'ok', checks: [{ scorer: 'ExactMatch', weight: 1 }] }
    ]
  });
  ids.evalSet = (await post(`eval-sets/${set.id}/approve`, {})).id;
  const run = await post('eval-runs', { setId: ids.evalSet, deploymentId: 'docs-helper-fake', threshold: 0.6 });
  ids.evalRun = run.id;
  const out = [`set ${ids.evalSet}`, `eval run ${run.id}`];
  if (ids.sreEvalSet) {
    const sre = await post('eval-runs', { setId: ids.sreEvalSet, deploymentId: 'docs-helper-fake', threshold: 1 });
    ids.sreEvalRun = sre.id;
    out.push(`driver-upgrade-checks run ${sre.id}`);
  }
  const done = await poll('eval run finished', async () => {
    const r = await get(`eval-runs/${run.id}`);
    return ['Completed', 'Failed', 'Cancelled'].includes(r.status) ? r : null;
  }, 180, 3000).catch(() => null);
  out.push(done ? `${done.status}, score ${done.score}` : 'still running');
  return out.join('; ');
}

async function stepShadow() {
  const docs = [
    doc('Agent', 'ticket-summarizer', '  displayName: Ticket Summarizer\n  tags: [uxpass]\n', 'Summarizes support tickets for the morning standup'),
    doc('Deployment', 'ticket-summarizer-live', '  agent: ticket-summarizer\n  harnessProfile: builtin/fake\n  weight: 1000\n'),
    doc('Deployment', 'ticket-summarizer-candidate', '  agent: ticket-summarizer\n  harnessProfile: builtin/fake\n  weight: 0\n  model: candidate\n')
  ];
  log(`  shadow | ${appliedSummary(await apply(docs.join('\n---\n')))}`);
  const trial = await post('shadow-trials', {
    name: 'Candidate model on ticket summaries',
    sourceDeploymentId: 'ticket-summarizer-live',
    candidateDeploymentId: 'ticket-summarizer-candidate',
    samplePercent: 100,
    endsUtc: new Date(Date.now() + 3 * 86400000).toISOString()
  });
  ids.shadowTrial = trial.id;
  ids.shadowSourceRuns = [];
  for (let i = 0; i < 4; i += 1) {
    const r = await post('agents/ticket-summarizer/invoke?wait=true&waitSeconds=60', { input: `Summarize ticket T-${880 + i}.` });
    ids.shadowSourceRuns.push(r.id);
  }
  const t = await poll('shadow comparisons', async () => {
    const x = await get(`shadow-trials/${trial.id}`);
    return (x.comparedCount || 0) + (x.candidateFailureCount || 0) >= 1 ? x : null;
  }, 120, 3000).catch(() => null);
  const shadows = await list(`runs?shadowTrialId=${trial.id}&maxResults=5`).catch(() => []);
  if (shadows.length) ids.shadowRun = shadows[0].id;
  return `trial ${trial.id}; ${t ? `compared ${t.comparedCount}, agreed ${t.agreedCount}` : 'no comparison yet'}`;
}

async function stepApprovals() {
  const builtin = (await call('GET', '/v1.0/api/harness-profiles/builtin')).find((p) => p.name === 'builtin/claude-code');
  if (!builtin) throw new Error('builtin/claude-code harness profile not found');
  const clone = await post(`harness-profiles/${builtin.id}/clone`, { name: 'fake-claude-approvals' });
  const profile = await get(`harness-profiles/${clone.id}`);
  const keep = (profile.arguments || []).map((a) => ({ template: a.template, condition: a.condition ?? null }));
  const requests = [1, 2].flatMap((n) => {
    const condition = `{{deployment.parameters.permissionRequest${n}}}`;
    return [
      { template: '--permission-request', condition },
      { template: condition, condition }
    ];
  });
  await call('PUT', tp(`harness-profiles/${clone.id}`), {
    ...profile,
    executable: 'garrison-fake-harness',
    arguments: [{ template: '--format' }, { template: 'claude' }, ...keep, ...requests].map((a, position) => ({ ...a, position }))
  });
  const agent = await post('agents', { name: 'release-checker', displayName: 'Release Checker', description: 'Checks the repository before a release and asks before risky commands' });
  await post('deployments', {
    name: 'release-checker-fake',
    agentId: agent.id,
    harnessProfileId: clone.id,
    approvalsEnabled: true,
    approvalDefaultAction: 'Deny',
    approvalTimeoutSeconds: 60,
    approvalTimeoutDecision: 'Deny',
    approvalRules: [
      { action: 'Allow', pattern: 'Bash(git status:*)', description: 'Read-only status checks' },
      { action: 'Ask', pattern: 'Bash(git push:*)' }
    ],
    parameters: [
      { name: 'permissionRequest1', value: 'Bash={"command":"git status --short"}' },
      { name: 'permissionRequest2', value: 'WebFetch={"url":"https://example.com"}' }
    ],
    timeoutSeconds: 90
  });
  const run = await post(`agents/${agent.id}/invoke?wait=true&waitSeconds=90`, { input: 'Check the repository before the release.' });
  ids.approvalRun = run.id;
  const approvals = await list(`approvals?runId=${run.id}&maxResults=25`);
  if (approvals.length) ids.approval = approvals[0].id;
  return `run ${run.id} (${run.status}); ${approvals.length} approvals`;
}

async function stepPipeline() {
  const p = await post('pipelines', {
    name: 'release-notes',
    description: 'Drafts release notes, then waits for a person to review them',
    maxDurationSeconds: 3600,
    stages: [
      { position: 1, name: 'draft', agentId: ids.echoAgent || 'docs-helper', maxAttempts: 2 },
      { position: 2, name: 'review', agentId: ids.echoAgent || 'docs-helper', requiresReview: true, reviewTimeoutSeconds: 86400, reviewTimeoutAction: 'Approve', maxRevisions: 2 }
    ]
  });
  ids.pipeline = p.id;
  const started = await post(`pipelines/${p.id}/start?wait=true&waitSeconds=120`, { input: 'Draft the 0.3.0 release notes' });
  ids.pipelineRun = started.id;
  return `pipeline ${p.id}; run ${started.id} (${started.status})`;
}

async function stepStudio() {
  const d = await post('studio/drafts', { title: 'Add a refunds agent to support' });
  ids.studioDraft = d.id;
  const yaml = doc('Agent', 'support-refunds', '  displayName: Support Refunds\n  tags: [uxpass, support]\n', 'Handles refund requests the triage agent sends it');
  const item = await call('PUT', tp(`studio/drafts/${d.id}/items/Agent/support-refunds`), { version: d.version ?? 1, document: yaml });
  return `draft ${d.id} with ${item?.kind || 'an'} item`;
}

async function stepSecret() {
  const r = await post('secrets', { name: 'vendor-status-token', description: 'Read token for the vendor status page API', kind: 'GenericEnv', value: 'uxpass-not-a-real-token' });
  ids.secret = r.id;
  return `secret ${r.id}`;
}

async function stepFreeze() {
  await apply(doc('Agent', 'legacy-importer', '  displayName: Legacy Importer\n  tags: [uxpass]\n', 'Imports records from the old CRM; frozen while the CRM is retired'));
  const lifted = await post('freezes', { targetKind: 'Agent', targetId: 'research-flaky', reason: 'Vendor status page is down; stop retries for an hour.' });
  await post(`freezes/${lifted.id}/lift`, { reason: 'Vendor is back.' });
  ids.liftedFreeze = lifted.id;
  const f = await post('freezes', { targetKind: 'Agent', targetId: 'legacy-importer', reason: 'The old CRM is being retired; no imports until the migration is signed off.' });
  ids.freeze = f.id;
  ids.frozenAgent = f.targetId;
  return `active freeze ${f.id} on legacy-importer; lifted freeze ${lifted.id}`;
}

const STEPS = [
  ['gerbil', stepGerbil],
  ['sre', stepSre],
  ['invokes', stepInvokes],
  ['chain', stepChain],
  ['fanout', stepFanout],
  ['escalation', stepEscalation],
  ['report', stepReport],
  ['canary', stepCanary],
  ['eval', stepEval],
  ['shadow', stepShadow],
  ['approvals', stepApprovals],
  ['pipeline', stepPipeline],
  ['studio', stepStudio],
  ['secret', stepSecret],
  ['freeze', stepFreeze]
];

async function main() {
  fs.mkdirSync(path.join(OPTS.out, 'logs'), { recursive: true });
  let pids = {};
  if (OPTS.start) pids = await startStack();
  else log(`using the running server on ${BASE}`);
  await signIn();
  log('signed in as admin@garrison');
  const seedFile = path.join(OPTS.out, 'seed.json');
  let previousSteps = [];
  if (!OPTS.start && fs.existsSync(seedFile)) {
    const previous = JSON.parse(fs.readFileSync(seedFile, 'utf8'));
    Object.assign(ids, previous.ids || {});
    previousSteps = previous.steps || [];
  }

  for (const [name, fn] of STEPS) {
    if (OPTS.steps.length && !OPTS.steps.includes(name)) continue;
    const t0 = Date.now();
    log(`== ${name}`);
    try {
      const summary = await fn();
      results.push({ step: name, ok: true, seconds: (Date.now() - t0) / 1000, summary });
      log(`ok   ${name}: ${summary}`);
    } catch (err) {
      results.push({ step: name, ok: false, seconds: (Date.now() - t0) / 1000, error: err.message });
      log(`FAIL ${name}: ${err.message}`);
    }
  }

  const out = {
    createdUtc: new Date().toISOString(),
    base: BASE,
    dashboard: OPTS.vite || !OPTS.start ? `http://127.0.0.1:${OPTS.vitePort}` : null,
    tenant: TENANT,
    signIn: { email: EMAIL, password: PASSWORD },
    pids: OPTS.start ? pids : JSON.parse(fs.existsSync(path.join(OPTS.out, 'pids.json')) ? fs.readFileSync(path.join(OPTS.out, 'pids.json'), 'utf8') : '{}'),
    ids,
    steps: [...previousSteps.filter((p) => !results.some((r) => r.step === p.step)), ...results]
  };
  fs.writeFileSync(seedFile, JSON.stringify(out, null, 2));
  log(`wrote ${seedFile}`);
  process.stdout.write('\nIDs for reviewers\n');
  const show = [
    ['Origin run with a three-hop trail', ids.chainOriginRun && `${ids.chainOriginRun} (hops ${ids.chainTrailHops}, ${ids.chainTrailNodes} nodes)`],
    ['  its trail', ids.chainOriginRun && `/dashboard/runs/${ids.chainOriginRun}?tab=trail`],
    ['Support desk organization', ids.chainOrganization],
    ['Site reliability organization', ids.sreOrganization],
    ['Fan-out parent run', ids.fanoutParentRun],
    ['Fan-out retry run', ids.fanoutRetry],
    ['Answered escalation', ids.answeredEscalation],
    ['Open escalation', ids.openEscalation],
    ['Gerbil keeper', ids.gerbilMandate],
    ['Canary release', ids.canaryRelease],
    ['Eval run', ids.evalRun],
    ['Shadow trial', ids.shadowTrial],
    ['Active freeze', ids.freeze],
    ['Pipeline run', ids.pipelineRun],
    ['Studio draft', ids.studioDraft],
    ['Conversation', ids.conversation]
  ];
  for (const [label, value] of show) process.stdout.write(`  ${label.padEnd(36)} ${value || '(not seeded)'}\n`);
  const failed = results.filter((r) => !r.ok);
  process.stdout.write(`\n${results.length - failed.length} of ${results.length} seed steps ok${failed.length ? `; failed: ${failed.map((f) => f.step).join(', ')}` : ''}\n`);
  if (OPTS.start) process.stdout.write(`Processes keep running: ${JSON.stringify(pids)}. Stop them with kill.\n`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
