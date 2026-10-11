#!/usr/bin/env node
// Telemetry verification (P13.28). Generates traffic across every REST route, the MCP tools and sessions, the A2A
// methods, server-sent events, the live-update WebSocket, process and KubernetesJob runs on several harness types (all
// backed by the fake harness, so no credentials are needed), guard trips, cancellations, delegation, structured output
// repair, and blocked runs. Then it asserts through the Prometheus, Loki, and Tempo APIs that every entry of the
// coverage matrix in docs/TELEMETRY.md produced data, and opens every Grafana dashboard in a headless browser to check
// that no panel shows "No data" or an error.
//
// Run it through k8s/tests/telemetry-verify.sh (or .bat) against a cluster deployed with OBSERVABILITY=1. It reaches
// the cluster with kubectl port-forward on local ports that do not collide with the defaults of port-forward.sh.
//
// Environment:
//   KUBECONFIG_FILE, CONTEXT       kubectl config and context (default: kubectl's current ones)
//   NAMESPACE                      garrison
//   SERVER_PORT, MCP_PORT          18800, 18801 (local ports for the server's REST and MCP listeners)
//   GRAFANA_PORT, PROMETHEUS_PORT  13000, 19090
//   LOKI_PORT, TEMPO_PORT          13100, 13200
//   SETTLE_SECONDS                 75   wait after the traffic for scrapes, log shipping, and trace batching
//   BLOCKED_FAIL_SECONDS           30   Runtime.FailBlockedAfterSeconds used for the blocked-run scenario
//   KUBERNETES_EXECUTOR            auto (1 forces the KubernetesJob scenarios, 0 skips them)
//   POD_FAILURE_WAIT_SECONDS       120  how long to wait for the unschedulable run pod to fail (set the workers'
//                                       GARRISON_WORKER_RUN_PENDING_TIMEOUT_SECONDS below this to see PodFailed)
//   HEADLESS_CHECK                 1    0 skips the Grafana browser check
//   SCREENSHOT_DIR                      save a full-page screenshot of every dashboard here
//   ONLY_HEADLESS                  0    1 runs only the Grafana browser check (after an earlier full run)
//   RESULTS_DIR                    k8s/tests/results
// Exit code 0 when every check passed, 1 otherwise. A JSON report is written to RESULTS_DIR.

import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '..', '..', '..');
const env = process.env;
const NAMESPACE = env.NAMESPACE || 'garrison';
const PORTS = {
  server: Number(env.SERVER_PORT || 18800),
  mcp: Number(env.MCP_PORT || 18801),
  grafana: Number(env.GRAFANA_PORT || 13000),
  prometheus: Number(env.PROMETHEUS_PORT || 19090),
  loki: Number(env.LOKI_PORT || 13100),
  tempo: Number(env.TEMPO_PORT || 13200),
};
const SETTLE_SECONDS = Number(env.SETTLE_SECONDS || 75);
const BLOCKED_FAIL_SECONDS = Number(env.BLOCKED_FAIL_SECONDS || 30);
const RESULTS_DIR = env.RESULTS_DIR || path.join(REPO, 'k8s', 'tests', 'results');
const BASE = `http://127.0.0.1:${PORTS.server}`;
const MCP = `http://127.0.0.1:${PORTS.mcp}/mcp`;
const PROM = `http://127.0.0.1:${PORTS.prometheus}`;
const LOKI = `http://127.0.0.1:${PORTS.loki}`;
const TEMPO = `http://127.0.0.1:${PORTS.tempo}`;
const GRAFANA = `http://127.0.0.1:${PORTS.grafana}`;
const PREFIX = 'verify';

const checks = [];
const children = [];
const started = new Date();

function log(message) {
  process.stdout.write(`[telemetry-verify ${new Date().toISOString().substring(11, 19)}] ${message}\n`);
}

function check(area, name, ok, detail = '') {
  checks.push({ area, name, status: ok ? 'pass' : 'fail', detail });
  if (!ok) log(`FAIL ${area}: ${name}${detail ? ' (' + detail + ')' : ''}`);
}

function skip(area, name, detail) {
  checks.push({ area, name, status: 'skip', detail });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function kubectlArgs(args) {
  const base = [];
  if (env.KUBECONFIG_FILE) base.push('--kubeconfig', env.KUBECONFIG_FILE);
  if (env.CONTEXT) base.push('--context', env.CONTEXT);
  return [...base, '-n', NAMESPACE, ...args];
}

function kubectl(args) {
  return execFileSync('kubectl', kubectlArgs(args), { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function secret(name, key) {
  const value = kubectl(['get', 'secret', name, '-o', `jsonpath={.data.${key.replace(/\./g, '\\.')}}`]).trim();
  return Buffer.from(value, 'base64').toString('utf8');
}

async function waitForPort(port, seconds) {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    const ok = await new Promise((resolve) => {
      const socket = net.connect(port, '127.0.0.1');
      socket.once('connect', () => { socket.destroy(); resolve(true); });
      socket.once('error', () => resolve(false));
    });
    if (ok) return;
    await sleep(250);
  }
  throw new Error(`port ${port} did not open within ${seconds} s`);
}

async function portForward(target, local, remote) {
  const child = spawn('kubectl', kubectlArgs(['port-forward', '--address', '127.0.0.1', target, `${local}:${remote}`]), { stdio: 'ignore' });
  children.push(child);
  await waitForPort(local, 60);
}

// ---------------------------------------------------------------------------------------------------------------
// HTTP helpers

let adminKey = '';
let tenantId = '';

async function api(method, route, body, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!options.anonymous && !headers.Authorization && !headers['x-api-key']) headers['x-api-key'] = adminKey;
  let payload;
  if (body !== undefined && body !== null) {
    payload = typeof body === 'string' ? body : JSON.stringify(body);
    if (!headers['Content-Type']) headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(BASE + route, { method, headers, body: payload, signal: AbortSignal.timeout(options.timeoutMs || 120000) });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: response.status, json, text };
}

async function prom(query) {
  const response = await fetch(`${PROM}/api/v1/query?query=${encodeURIComponent(query)}`);
  const body = await response.json();
  if (body.status !== 'success') throw new Error(`Prometheus query failed: ${query}: ${JSON.stringify(body).substring(0, 300)}`);
  return body.data.result;
}

async function promCount(query) {
  const result = await prom(query);
  return result.length;
}

// ---------------------------------------------------------------------------------------------------------------
// The coverage matrix (docs/TELEMETRY.md)

function section(name) {
  const document = fs.readFileSync(path.join(REPO, 'docs', 'TELEMETRY.md'), 'utf8');
  const start = document.indexOf(`<!-- telemetry-coverage:${name} -->`);
  const end = document.indexOf(`<!-- /telemetry-coverage:${name} -->`);
  if (start < 0 || end < start) throw new Error(`docs/TELEMETRY.md has no ${name} section`);
  return document.substring(start, end).split('\n').filter((line) => line.startsWith('| ') && !line.startsWith('|---'));
}

function cells(line) {
  return line.split('|').slice(1, -1).map((cell) => cell.trim());
}

function catalog() {
  return section('metrics').slice(1).map((line) => {
    const [metric, type, labels, processName, dashboard] = cells(line);
    return { name: metric.replace(/`/g, ''), type, labels, process: processName, dashboard };
  });
}

function routes() {
  return section('routes').slice(1).map((line) => {
    const [method, route] = cells(line);
    return { method, path: route.replace(/`/g, '') };
  });
}

function bullet(name) {
  return section(name).slice(1).map((line) => cells(line)[0].replace(/`/g, '').split(' ')[0]);
}

// ---------------------------------------------------------------------------------------------------------------
// Setup: harness profiles, agents, deployments, a secret

const harnesses = [
  { suffix: 'claude', type: 'ClaudeCode', format: 'claude', parser: 'ClaudeStreamJson' },
  { suffix: 'codex', type: 'Codex', format: 'codex', parser: 'CodexJsonl' },
  { suffix: 'mux', type: 'Mux', format: 'mux', parser: 'MuxJsonl' },
  { suffix: 'gemini', type: 'GeminiCli', format: 'claude', parser: 'ClaudeStreamJson' },
  { suffix: 'fake', type: 'Generic', format: 'claude', parser: 'ClaudeStreamJson' },
];

function extraArguments() {
  const pair = (flag, parameter) => [
    { template: flag, condition: `{{deployment.parameters.${parameter}}}` },
    { template: `{{deployment.parameters.${parameter}}}`, condition: `{{deployment.parameters.${parameter}}}` },
  ];
  return [
    ...pair('--think-ms', 'thinkMs'),
    ...pair('--tool-calls', 'toolCalls'),
    ...pair('--loop-text', 'loopText'),
    { template: '--hang', condition: '{{deployment.parameters.hang}}' },
    // Delegation: call garrison_invoke_agent through the run's own Garrison MCP server with the run token.
    { template: '--mcp-call', condition: '{{deployment.parameters.delegateTo}}' },
    {
      template: '{{#each resources.mcpServers}}{{#if @first}}{{this.endpoint}},{{this.bearerToken}},garrison_invoke_agent,{"agent":"{{deployment.parameters.delegateTo}}","input":"delegated by the telemetry check","waitSeconds":60}{{/if}}{{/each}}',
      condition: '{{deployment.parameters.delegateTo}}',
    },
  ];
}

function profileDocuments(fake) {
  const keep = { ...fake };
  for (const key of ['id', 'tenantId', 'name', 'isBuiltIn', 'builtInKey', 'createdUtc', 'lastUpdateUtc', 'isProtected', 'version', 'configVersion']) delete keep[key];
  return harnesses.map((h) => ({
    apiVersion: 'garrison/v1',
    kind: 'HarnessProfile',
    metadata: { name: `${PREFIX}-${h.suffix}` },
    spec: {
      ...keep,
      description: `Fake harness reporting as ${h.type} for the telemetry check.`,
      harnessType: h.type,
      outputParser: h.parser,
      resultSource: 'ParserFinalEvent',
      successPolicy: 'FinalEvent',
      arguments: [
        { template: '--format' },
        { template: h.format },
        ...(keep.arguments || []).slice(2),
        ...extraArguments(),
      ],
    },
  }));
}

function agent(name, extra = {}) {
  return {
    apiVersion: 'garrison/v1',
    kind: 'Agent',
    metadata: { name },
    spec: { displayName: name, description: `Telemetry check agent ${name}.`, exposure: { a2a: true, mcpTool: true }, ...extra },
  };
}

function deployment(agentName, profile, extra = {}) {
  return {
    apiVersion: 'garrison/v1',
    kind: 'Deployment',
    metadata: { name: `${agentName}-default` },
    spec: { agent: agentName, harnessProfile: profile, model: 'fake-model', timeoutSeconds: 120, parameters: { thinkMs: '150', toolCalls: '2', delayMs: '15' }, ...extra },
  };
}

async function setup(kubernetesExecutor) {
  const tenants = await api('GET', '/v1.0/api/tenants');
  check('setup', 'list tenants', tenants.status === 200 && tenants.json?.objects?.length > 0, `HTTP ${tenants.status}`);
  tenantId = tenants.json.objects[0].id;
  log(`tenant ${tenantId}`);

  const settings = await api('PUT', '/v1.0/api/settings', { values: [{ path: 'Runtime.FailBlockedAfterSeconds', value: String(BLOCKED_FAIL_SECONDS) }] });
  check('setup', 'set Runtime.FailBlockedAfterSeconds', settings.status === 200, `HTTP ${settings.status} ${settings.text.substring(0, 200)}`);

  const builtin = await api('GET', '/v1.0/api/harness-profiles/builtin');
  const list = Array.isArray(builtin.json) ? builtin.json : builtin.json?.objects || [];
  const fake = list.find((p) => p.name === 'builtin/fake');
  check('setup', 'read builtin/fake', !!fake, `HTTP ${builtin.status}`);

  const documents = [
    { apiVersion: 'garrison/v1', kind: 'Secret', metadata: { name: `${PREFIX}-secret` }, spec: { kind: 'OpenAiApiKey', description: 'Dummy secret bound to verify-echo so compilation decrypts a secret.', value: 'sk-verify-not-a-real-key-000000' } },
    { apiVersion: 'garrison/v1', kind: 'McpServer', metadata: { name: `${PREFIX}-self` }, spec: { transport: 'Http', url: 'http://garrison-server:8701', path: '/mcp', description: 'The Garrison MCP endpoint itself, for the MCP server test call.' } },
    ...profileDocuments(fake),
    agent(`${PREFIX}-echo`),
    deployment(`${PREFIX}-echo`, `${PREFIX}-fake`, { resources: { secrets: [{ alias: 'openai', secret: `${PREFIX}-secret` }] } }),
    agent(`${PREFIX}-claude`),
    deployment(`${PREFIX}-claude`, `${PREFIX}-claude`),
    agent(`${PREFIX}-codex`),
    deployment(`${PREFIX}-codex`, `${PREFIX}-codex`),
    agent(`${PREFIX}-mux`),
    deployment(`${PREFIX}-mux`, `${PREFIX}-mux`),
    agent(`${PREFIX}-gemini`),
    deployment(`${PREFIX}-gemini`, `${PREFIX}-gemini`),
    agent(`${PREFIX}-loop`),
    deployment(`${PREFIX}-loop`, `${PREFIX}-fake`, { repetitionGuard: true, parameters: { thinkMs: '50', loopText: '* \\n' } }),
    agent(`${PREFIX}-fail`),
    deployment(`${PREFIX}-fail`, `${PREFIX}-fake`, { parameters: { thinkMs: '50', fail: 'true' } }),
    agent(`${PREFIX}-slow`),
    deployment(`${PREFIX}-slow`, `${PREFIX}-fake`, { timeoutSeconds: 20, parameters: { thinkMs: '50', hang: 'true' } }),
    agent(`${PREFIX}-structured`, { outputSchema: { type: 'object', required: ['answer'], properties: { answer: { type: 'string' } } } }),
    deployment(`${PREFIX}-structured`, `${PREFIX}-claude`, { parameters: { thinkMs: '50', answer: 'not json at all', resumeAnswer: '{"answer":"repaired"}', structuredOutput: 'true' } }),
    agent(`${PREFIX}-delegator`, { delegation: { maxDepth: 2, allow: [`${PREFIX}-echo`] } }),
    deployment(`${PREFIX}-delegator`, `${PREFIX}-fake`, { parameters: { thinkMs: '50', delegateTo: `${PREFIX}-echo` } }),
    agent(`${PREFIX}-denied`, { delegation: { maxDepth: 2, allow: [`${PREFIX}-claude`] } }),
    deployment(`${PREFIX}-denied`, `${PREFIX}-fake`, { parameters: { thinkMs: '50', delegateTo: `${PREFIX}-echo` } }),
  ];
  if (kubernetesExecutor) {
    documents.push(agent(`${PREFIX}-k8s`), deployment(`${PREFIX}-k8s`, `${PREFIX}-fake`, { executor: 'KubernetesJob' }));
    // A run pod no node can schedule fails with PodFailed once the worker's pending timeout passes
    // (GARRISON_WORKER_RUN_PENDING_TIMEOUT_SECONDS, default 300).
    documents.push(agent(`${PREFIX}-unschedulable`), deployment(`${PREFIX}-unschedulable`, `${PREFIX}-fake`, { executor: 'KubernetesJob', podResources: { cpuRequest: '64', cpuLimit: '64' } }));
  }
  const manifest = documents.map((d) => JSON.stringify(d)).join('\n---\n');
  const applied = await api('POST', `/v1.0/api/tenants/${tenantId}/manifests/apply?allowSecretValues=true`, manifest, { headers: { 'Content-Type': 'application/yaml' } });
  const failed = (applied.json?.documents || applied.json?.results || []).filter((d) => String(d.result || '').toLowerCase() === 'failed');
  check('setup', 'apply verification manifests', applied.status === 200 && failed.length === 0, `HTTP ${applied.status} ${applied.status !== 200 ? applied.text.substring(0, 400) : JSON.stringify(failed).substring(0, 400)}`);
}

async function agentByName(name) {
  const result = await api('GET', `/v1.0/api/tenants/${tenantId}/agents?search=${encodeURIComponent(name)}&maxResults=50`);
  return (result.json?.objects || []).find((a) => a.name === name);
}

async function invoke(name, wait = true, extra = {}) {
  const found = await agentByName(name);
  if (!found) throw new Error(`agent ${name} not found`);
  const response = await api('POST', `/v1.0/api/tenants/${tenantId}/agents/${found.id}/invoke`, { input: `Telemetry check for ${name}`, wait, waitSeconds: 90, ...extra }, { timeoutMs: 150000 });
  return response;
}

async function waitForRun(runId, seconds) {
  const deadline = Date.now() + seconds * 1000;
  while (Date.now() < deadline) {
    const run = await api('GET', `/v1.0/api/tenants/${tenantId}/runs/${runId}`);
    if (run.json && ['Succeeded', 'Failed', 'Cancelled', 'TimedOut', 'Rejected'].includes(run.json.status)) return run.json;
    await sleep(500);
  }
  return null;
}

// ---------------------------------------------------------------------------------------------------------------
// Traffic

async function routeSweep(allRoutes) {
  // Every route template gets a request. Mutating requests address a tenant and resources that do not exist, so they
  // match the route (and are counted under its template) without changing anything.
  let sent = 0;
  for (const route of allRoutes) {
    if (route.path === '/metrics') continue;
    const mutating = route.method !== 'GET';
    const target = route.path.replace(/\{([A-Za-z0-9_]+)\}/g, (match, name) => (name === 'tenantId' && !mutating ? tenantId : `${PREFIX}-missing`));
    const options = {};
    // Restarting the server is the one global mutation; ask without credentials that permit it.
    if (route.path === '/v1.0/api/settings/restart') options.headers = { Authorization: `Bearer ${await userToken()}` };
    try {
      await api(route.method, target, mutating ? {} : undefined, options);
      sent++;
    } catch (error) {
      log(`route ${route.method} ${route.path}: ${error.message}`);
    }
  }
  check('traffic', 'route sweep', sent >= allRoutes.length - 1, `${sent} of ${allRoutes.length}`);
}

let cachedUserToken = null;
async function userToken() {
  if (cachedUserToken) return cachedUserToken;
  const email = `${PREFIX}-user@example.com`;
  const password = 'Verify-password-123!';
  await api('POST', `/v1.0/api/tenants/${tenantId}/users`, { email, password, firstName: 'Telemetry', lastName: 'Check', isTenantAdmin: false, isAdmin: false });
  const token = await api('POST', '/v1.0/token', { tenantId, email, password }, { anonymous: true });
  cachedUserToken = token.json?.token || 'invalid';
  return cachedUserToken;
}

async function authTraffic() {
  await api('GET', `/v1.0/api/tenants/${tenantId}/agents`, undefined, { headers: { Authorization: 'Bearer not-a-token' } });
  await api('GET', `/v1.0/api/tenants/${tenantId}/agents`, undefined, { headers: { 'x-api-key': 'wrong-admin-key' } });
  await api('GET', `/v1.0/api/tenants/${tenantId}/agents`, undefined, { anonymous: true });
  await userToken();
  let limited = 0;
  for (let i = 0; i < 75; i++) {
    const response = await api('POST', '/v1.0/token', { tenantId, email: 'nobody@example.com', password: 'wrong' }, { anonymous: true });
    if (response.status === 429) limited++;
  }
  check('traffic', 'token rate limit trips', limited > 0, `${limited} requests limited`);
}

function parseSse(text) {
  return text.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.substring(5).trim());
}

async function mcpPost(sessionId, body, headers = {}) {
  const response = await fetch(MCP, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'x-api-key': adminKey, 'x-tenant-id': tenantId, ...(sessionId ? { 'MCP-Session-Id': sessionId, 'MCP-Protocol-Version': '2025-06-18' } : {}), ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(150000),
  });
  const text = await response.text();
  const session = response.headers.get('mcp-session-id');
  let json = null;
  const data = (response.headers.get('content-type') || '').includes('event-stream') ? parseSse(text).pop() : text;
  try {
    json = data ? JSON.parse(data) : null;
  } catch {
    json = null;
  }
  return { status: response.status, session, json };
}

async function mcpTraffic(runId) {
  const init = await mcpPost(null, { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'telemetry-verify', version: '1.0' } } });
  check('traffic', 'MCP initialize', init.status === 200 && !!init.session, `HTTP ${init.status}`);
  const session = init.session;
  await mcpPost(session, { jsonrpc: '2.0', method: 'notifications/initialized' });
  const tools = await mcpPost(session, { jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} });
  const names = (tools.json?.result?.tools || []).map((t) => t.name);
  check('traffic', 'MCP tools/list', names.includes('garrison_invoke_agent'), names.join(', '));
  const echo = await agentByName(`${PREFIX}-echo`);
  const calls = [
    ['garrison_list_agents', { tenantId }],
    ['garrison_get_agent', { tenantId, agent: `${PREFIX}-echo` }],
    ['garrison_invoke_agent', { tenantId, agent: `${PREFIX}-echo`, input: 'MCP invoke', waitSeconds: 60 }],
    ['garrison_start_run', { tenantId, agent: `${PREFIX}-echo`, input: 'MCP start' }],
    ['garrison_get_run', { tenantId, runId }],
    ['garrison_get_run_events', { tenantId, runId }],
    ['garrison_list_runs', { tenantId }],
    ['garrison_cancel_run', { tenantId, runId }],
    [`${PREFIX}-echo`, { input: 'MCP agent tool', waitSeconds: 60 }],
  ];
  let id = 10;
  for (const [name, args] of calls) {
    await mcpPost(session, { jsonrpc: '2.0', id: id++, method: 'tools/call', params: { name, arguments: args } });
  }
  // A tool call that is cancelled by the client closing the session: the slow agent's run is cancelled on disconnect.
  const slowCall = mcpPost(session, { jsonrpc: '2.0', id: id++, method: 'tools/call', params: { name: 'garrison_invoke_agent', arguments: { tenantId, agent: `${PREFIX}-slow`, input: 'MCP wait then disconnect', waitSeconds: 60 } } }).catch(() => null);
  await sleep(4000);
  await fetch(MCP, { method: 'DELETE', headers: { 'x-api-key': adminKey, 'x-tenant-id': tenantId, 'MCP-Session-Id': session, 'MCP-Protocol-Version': '2025-06-18' } });
  await slowCall;
  void echo;
}

async function a2aCall(agentName, method, params) {
  const response = await api('POST', `/v1.0/a2a/${tenantId}/${agentName}`, { jsonrpc: '2.0', id: 1, method, params }, { timeoutMs: 150000 });
  return response;
}

function a2aMessage(text) {
  return { message: { role: 'ROLE_USER', messageId: `${PREFIX}-${Date.now()}-${Math.random().toString(16).substring(2)}`, parts: [{ text }] } };
}

async function a2aTraffic() {
  await api('GET', `/v1.0/a2a/${tenantId}/${PREFIX}-echo/.well-known/agent-card.json`, undefined, { anonymous: true });
  await api('GET', `/v1.0/a2a/${tenantId}`);
  const sent = await a2aCall(`${PREFIX}-echo`, 'SendMessage', a2aMessage('A2A send'));
  const taskId = sent.json?.result?.task?.id;
  check('traffic', 'A2A SendMessage', !!taskId, sent.text.substring(0, 200));
  await a2aCall(`${PREFIX}-echo`, 'SendStreamingMessage', a2aMessage('A2A stream'));
  if (taskId) {
    await a2aCall(`${PREFIX}-echo`, 'GetTask', { id: taskId });
    await a2aCall(`${PREFIX}-echo`, 'SubscribeToTask', { id: taskId });
    await a2aCall(`${PREFIX}-echo`, 'CancelTask', { id: taskId });
  }
  await a2aCall(`${PREFIX}-echo`, 'ListTasks', {});
  const slow = await a2aCall(`${PREFIX}-slow`, 'SendMessage', { ...a2aMessage('A2A slow, cancel me'), configuration: { returnImmediately: true } });
  const slowId = slow.json?.result?.task?.id;
  if (slowId) await a2aCall(`${PREFIX}-slow`, 'CancelTask', { id: slowId });
  await a2aCall(`${PREFIX}-echo`, 'NoSuchMethod', {});
}

async function sseTraffic(runId) {
  const response = await fetch(`${BASE}/v1.0/api/tenants/${tenantId}/runs/${runId}/events/stream`, { headers: { 'x-api-key': adminKey }, signal: AbortSignal.timeout(60000) });
  const text = await response.text();
  check('traffic', 'run events SSE stream', text.includes('run.completed'), `${text.length} bytes`);
}

async function webSocketTraffic(runId) {
  const token = await api('POST', '/v1.0/token', { tenantId, email: `${PREFIX}-user@example.com`, password: 'Verify-password-123!' }, { anonymous: true });
  const ws = new WebSocket(`ws://127.0.0.1:${PORTS.server}/v1.0/ws?token=${encodeURIComponent(token.json?.token || '')}`);
  let messages = 0;
  await new Promise((resolve) => {
    const timer = setTimeout(resolve, 8000);
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'subscribe', channel: 'runs' }));
      ws.send(JSON.stringify({ type: 'subscribe', channel: `run:${runId}` }));
      ws.send(JSON.stringify({ type: 'ping' }));
    };
    ws.onmessage = () => { messages++; };
    ws.onerror = () => { clearTimeout(timer); resolve(); };
  });
  ws.close();
  check('traffic', 'live-update WebSocket', messages > 0, `${messages} messages`);
}

let unschedulable = null;

async function runTraffic(kubernetesExecutor) {
  const outcomes = {};
  const runIds = [];
  if (kubernetesExecutor) unschedulable = await invoke(`${PREFIX}-unschedulable`, false);
  for (const name of ['echo', 'claude', 'codex', 'mux', 'structured', 'delegator', 'loop', 'fail']) {
    for (let i = 0; i < (name === 'echo' ? 4 : 2); i++) {
      const response = await invoke(`${PREFIX}-${name}`);
      const run = response.json;
      if (run?.id) runIds.push(run.id);
      outcomes[name] = `${run?.status || response.status}/${run?.outcome || ''}`;
    }
  }
  log(`run outcomes: ${JSON.stringify(outcomes)}`);
  check('traffic', 'echo runs succeed', outcomes.echo?.startsWith('Succeeded'), outcomes.echo);
  check('traffic', 'harness-typed fake runs succeed', ['claude', 'codex', 'mux'].every((n) => outcomes[n]?.startsWith('Succeeded')), JSON.stringify(outcomes));
  check('traffic', 'repetition guard trips', (outcomes.loop || '').includes('RepetitionDetected'), outcomes.loop);
  check('traffic', 'delegation succeeds', outcomes.delegator?.startsWith('Succeeded'), outcomes.delegator);
  await invoke(`${PREFIX}-denied`);

  // Asynchronous runs: one streamed over SSE, one cancelled, one left to time out, a queue of slow runs.
  const streamed = await invoke(`${PREFIX}-echo`, false);
  if (streamed.json?.id) await sseTraffic(streamed.json.id);
  const cancelled = await invoke(`${PREFIX}-slow`, false);
  await sleep(3000);
  if (cancelled.json?.id) await api('POST', `/v1.0/api/tenants/${tenantId}/runs/${cancelled.json.id}/cancel`, {});
  const timedOut = await invoke(`${PREFIX}-slow`, false);
  for (let i = 0; i < 6; i++) await invoke(`${PREFIX}-slow`, false);

  // A synchronous REST wait abandoned by the client: the run is cancelled on disconnect.
  const slowAgent = await agentByName(`${PREFIX}-slow`);
  try {
    await fetch(`${BASE}/v1.0/api/tenants/${tenantId}/agents/${slowAgent.id}/invoke`, { method: 'POST', headers: { 'x-api-key': adminKey, 'Content-Type': 'application/json' }, body: JSON.stringify({ input: 'wait then disconnect', wait: true, waitSeconds: 60, cancelOnDisconnect: true }), signal: AbortSignal.timeout(3000) });
  } catch {
    // The client gave up on purpose.
  }

  // Blocked runs: no worker can run the GeminiCli-typed deployment, so they block and then fail.
  await invoke(`${PREFIX}-gemini`, false);
  await invoke(`${PREFIX}-gemini`, false);

  if (kubernetesExecutor) {
    const k8s = await invoke(`${PREFIX}-k8s`);
    check('traffic', 'KubernetesJob run succeeds', k8s.json?.status === 'Succeeded', `${k8s.json?.status}/${k8s.json?.outcome} ${k8s.json?.errorMessage || ''}`);
  }

  // Retry, children, and analytics routes with real identifiers.
  if (runIds.length > 0) {
    await api('POST', `/v1.0/api/tenants/${tenantId}/runs/${runIds[0]}/retry`, {});
    await api('GET', `/v1.0/api/tenants/${tenantId}/runs/${runIds[0]}/children`);
    await api('GET', `/v1.0/api/tenants/${tenantId}/runs/${runIds[0]}/events`);
  }
  await api('GET', `/v1.0/api/tenants/${tenantId}/analytics/runs`);
  if (timedOut.json?.id) await waitForRun(timedOut.json.id, 60);
  return runIds;
}

async function miscTraffic() {
  const status = await api('GET', '/v1.0/api/observability/status');
  check('traffic', 'observability status', status.status === 200, `HTTP ${status.status}`);
  const servers = await api('GET', `/v1.0/api/tenants/${tenantId}/mcp-servers`);
  const self = (servers.json?.objects || []).find((s) => s.name === `${PREFIX}-self`);
  if (self) await api('POST', `/v1.0/api/tenants/${tenantId}/mcp-servers/${self.id}/test`, {});
  check('traffic', 'MCP server test call', !!self, 'mcp server registered');
  await api('GET', '/v1.0/api/request-history?maxResults=5');
  await api('GET', `/v1.0/api/tenants/${tenantId}/audit?maxResults=5`);
}

// ---------------------------------------------------------------------------------------------------------------
// Assertions

const CONDITIONAL = {
  garrison_codex_token_refresh_total: 'only when a Codex auth.json login is bound and due for refresh (G-22)',
  garrison_archive_runs_total: 'only with Archive.Enabled and runs past retention',
  garrison_retention_deleted_total: 'only when retention finds rows past their retention period',
  garrison_db_errors_total: 'only when a statement fails',
  garrison_db_transaction_retries_total: 'only on transient conflicts',
  garrison_db_write_lock_wait_seconds: 'Sqlite only',
  garrison_telemetry_labels_folded_total: 'only when a label exceeds Telemetry.MaxLabelValues',
  garrison_telemetry_diagnostics_total: 'only when the telemetry pipeline reports a diagnostic',
  garrison_maintenance_pauses_total: 'only after a process pause',
  garrison_worker_pauses_total: 'only after a process pause',
  garrison_lease_expirations_total: 'only when a worker stops renewing a lease',
  garrison_worker_k8s_pod_failures_total: 'only when a run pod fails outside the harness',
  garrison_backplane_received_total: 'only with more than one control-plane replica',
  garrison_backplane_lag_seconds: 'only with more than one control-plane replica',
  garrison_invocation_disconnect_cancels_total: 'only when a waiting caller disconnects before the run ends',
  garrison_worker_jobs_reconciled_total: 'only when a worker finds run Jobs it does not hold (after a restart)',
};

async function assertMetrics(kubernetesExecutor, replicas) {
  const kubernetesOnly = ['garrison_worker_k8s_jobs_total', 'garrison_worker_k8s_pod_start_duration_seconds', 'garrison_worker_jobs_reconciled_total'];
  for (const metric of catalog()) {
    const series = metric.type.startsWith('histogram') ? `${metric.name}_count` : metric.name;
    // last_over_time also finds gauges that reported earlier in the run (a queue that has drained since).
    const count = await promCount(`count(last_over_time(${series}[30m]))`);
    if (count > 0) {
      check('metrics', metric.name, true);
    } else if (CONDITIONAL[metric.name] && !(metric.name.startsWith('garrison_backplane') && replicas > 1)) {
      skip('metrics', metric.name, CONDITIONAL[metric.name]);
    } else if (kubernetesOnly.includes(metric.name) && !kubernetesExecutor) {
      skip('metrics', metric.name, 'KubernetesJob executor not available');
    } else {
      check('metrics', metric.name, false, 'no series');
    }
  }

  const routeSeries = await prom('count by (route) (garrison_http_requests_total)');
  const seen = new Set(routeSeries.map((r) => r.metric.route));
  const missingRoutes = routes().filter((r) => r.path !== '/metrics' && !seen.has(r.path));
  check('routes', 'every REST route has request metrics', missingRoutes.length === 0, missingRoutes.slice(0, 15).map((r) => `${r.method} ${r.path}`).join(', '));
  check('routes', 'no route label holds a raw path', ![...seen].some((r) => r.includes(tenantId)), [...seen].filter((r) => r.includes(tenantId)).join(', '));

  const toolSeries = new Set((await prom('count by (tool) (garrison_mcp_tool_duration_seconds_count)')).map((r) => r.metric.tool));
  const missingTools = bullet('mcp-tools').map((t) => (t === '{mcpToolName}' ? 'agent' : t)).filter((t) => !toolSeries.has(t));
  check('protocols', 'every MCP tool has duration metrics', missingTools.length === 0, missingTools.join(', '));
  const methodSeries = new Set((await prom('count by (method) (garrison_a2a_request_duration_seconds_count)')).map((r) => r.metric.method));
  const missingMethods = bullet('a2a-methods').filter((m) => !methodSeries.has(m));
  check('protocols', 'every A2A method has duration metrics', missingMethods.length === 0, missingMethods.join(', '));

  for (const name of ['echo', 'claude', 'codex', 'mux']) {
    const agentName = `${PREFIX}-${name}`;
    for (const stage of ['queue', 'claim', 'compile', 'startup', 'first_token', 'streaming', 'execution', 'total']) {
      const n = await promCount(`garrison_run_stage_duration_seconds_count{agent="${agentName}", stage="${stage}"} > 0`);
      check('agents', `${agentName} stage ${stage}`, n > 0);
    }
    // The fake harness reports reasoning tokens in the Claude and Codex formats only, like the real CLIs.
    for (const direction of name === 'mux' ? ['input', 'output'] : ['input', 'output', 'reasoning']) {
      const n = await promCount(`garrison_run_tokens_total{agent="${agentName}", direction="${direction}"} > 0`);
      check('agents', `${agentName} ${direction} tokens`, n > 0);
    }
    check('agents', `${agentName} worker TTFT`, (await promCount(`garrison_worker_run_ttft_seconds_count{agent="${agentName}"} > 0`)) > 0);
  }
  check('agents', 'deployment label is the deployment name', (await promCount(`garrison_runs_created_total{deployment="${PREFIX}-echo-default"}`)) > 0);
  check('agents', 'guard trips by agent', (await promCount(`garrison_runs_guard_trips_total{agent="${PREFIX}-loop", guard="repetition"}`)) > 0);
  check('agents', 'blocked runs fail as NoCapableWorker', (await promCount(`garrison_runs_finished_total{agent="${PREFIX}-gemini", outcome="NoCapableWorker"}`)) > 0);
  check('protocols', 'delegation depth recorded', (await promCount('garrison_delegation_depth_count > 0')) > 0);
  check('protocols', 'delegation denial recorded', (await promCount('garrison_delegation_denials_total > 0')) > 0);
  check('harnesses', 'every harness label has runs', (await promCount('count by (harness) (garrison_runs_finished_total)')) >= 4);

  const exemplars = await fetch(`${PROM}/api/v1/query_exemplars?query=${encodeURIComponent('garrison_http_request_duration_seconds_bucket')}&start=${Math.floor(started.getTime() / 1000) - 60}&end=${Math.floor(Date.now() / 1000)}`).then((r) => r.json());
  const exemplarCount = (exemplars.data || []).reduce((total, series) => total + (series.exemplars || []).length, 0);
  check('traces', 'duration histograms carry exemplars', exemplarCount > 0, `${exemplarCount} exemplars`);
}

async function assertLogs(runId, traceId) {
  const labels = await fetch(`${LOKI}/loki/api/v1/labels`).then((r) => r.json());
  for (const label of ['app', 'component', 'node', 'level', 'tenant']) check('logs', `Loki label ${label}`, (labels.data || []).includes(label), (labels.data || []).join(', '));
  const now = Date.now() * 1e6;
  const from = (started.getTime() - 60000) * 1e6;
  const query = async (expr) => {
    const body = await fetch(`${LOKI}/loki/api/v1/query_range?query=${encodeURIComponent(expr)}&start=${from}&end=${now}&limit=200`).then((r) => r.json());
    return (body.data?.result || []).reduce((total, stream) => total + stream.values.length, 0);
  };
  check('logs', 'server lines for a run', (await query(`{app="garrison", component="server"} |= "run=${runId}"`)) > 0);
  check('logs', 'worker lines for a run', (await query(`{app="garrison", component="worker"} |= "run=${runId}"`)) > 0);
  check('logs', 'lines by trace', (await query(`{app="garrison"} |= "trace=${traceId}"`)) > 0);
  check('logs', 'tenant label filters lines', (await query(`{app="garrison", tenant="${tenantId}"}`)) > 0);
  check('logs', 'agent field on lines', (await query(`{app="garrison"} |= "agent=${PREFIX}-echo"`)) > 0);
  check('logs', 'warning lines have a level', (await query('{app="garrison", level="Warn"}')) > 0);
}

async function assertTraces(traceId) {
  let trace = null;
  for (let i = 0; i < 20 && !trace; i++) {
    const response = await fetch(`${TEMPO}/api/traces/${traceId}`);
    if (response.ok) trace = await response.json();
    else await sleep(3000);
  }
  check('traces', 'run trace in Tempo', !!trace, traceId);
  if (trace) {
    const spans = [];
    const services = new Set();
    for (const batch of trace.batches || trace.resourceSpans || []) {
      const service = (batch.resource?.attributes || []).find((a) => a.key === 'service.name')?.value?.stringValue;
      if (service) services.add(service);
      for (const scope of batch.scopeSpans || batch.instrumentationLibrarySpans || []) for (const span of scope.spans || []) spans.push(span.name);
    }
    check('traces', 'run trace spans server and worker', services.has('garrison-server') && services.has('garrison-worker'), [...services].join(', '));
    for (const name of ['run:create', 'run:claim', 'run:compile', 'run:report']) check('traces', `run trace has ${name}`, spans.includes(name), spans.join(', ').substring(0, 300));
    check('traces', 'run trace has the harness span', spans.some((s) => s.startsWith('harness ')), '');
    check('traces', 'run trace has database spans', spans.some((s) => s.startsWith('db ')), '');
  }
  const search = async (traceql) => {
    const start = Math.floor(started.getTime() / 1000) - 120;
    const body = await fetch(`${TEMPO}/api/search?q=${encodeURIComponent(traceql)}&start=${start}&end=${Math.floor(Date.now() / 1000)}&limit=20`).then((r) => r.json()).catch(() => ({}));
    return (body.traces || []).length;
  };
  for (const [name, traceql] of [
    ['MCP tool spans', '{name="mcp garrison_list_agents"}'],
    ['A2A method spans', '{name="a2a SendMessage"}'],
    ['REST route spans', '{span.http.route="/v1.0/api/tenants/{tenantId}/agents/{agentId}/invoke"}'],
    ['background iteration spans', '{span.garrison.service=~".+"}'],
    ['outbound control plane spans', '{name="control_plane complete"}'],
    ['outbound Kubernetes spans', '{span.peer.service="kubernetes"}'],
  ]) {
    const n = await search(traceql);
    if (name === 'outbound Kubernetes spans' && n === 0) skip('traces', name, 'no KubernetesJob runs');
    else check('traces', name, n > 0, traceql);
  }
}

async function headlessCheck(dashboards, grafanaPassword) {
  const require = createRequire(path.join(REPO, 'dashboard', 'package.json'));
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (error) {
    check('grafana', 'Playwright available (run npm install in dashboard/)', false, error.message);
    return;
  }
  const browser = await chromium.launch();
  // A tall viewport renders every panel at once (Grafana only loads panels that are on screen).
  const context = await browser.newContext({ viewport: { width: 1920, height: 9000 } });
  const page = await context.newPage();
  await page.goto(`${GRAFANA}/login`, { waitUntil: 'load', timeout: 60000 });
  await page.getByTestId('data-testid Username input field').fill('admin');
  await page.getByTestId('data-testid Password input field').fill(grafanaPassword);
  await page.getByTestId('data-testid Login button').click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 60000 });
  const report = [];
  for (const uid of dashboards) {
    await page.goto(`${GRAFANA}/d/${uid}?orgId=1&from=now-1h&to=now&kiosk`, { waitUntil: 'load', timeout: 90000 });
    // Wait until no panel is still loading, then a little longer for late renders.
    const deadline = Date.now() + 90000;
    while (Date.now() < deadline) {
      await page.waitForTimeout(2000);
      const loading = await page.evaluate(() => document.querySelectorAll('[data-testid="data-testid Panel status loading"], [aria-label="Panel loading bar"]').length);
      const panelCount = await page.evaluate(() => document.querySelectorAll('[data-viz-panel-key]').length);
      if (loading === 0 && panelCount > 0) break;
    }
    await page.waitForTimeout(3000);
    const panels = await page.evaluate(() => {
      const results = [];
      for (const panel of document.querySelectorAll('[data-viz-panel-key]')) {
        const header = panel.querySelector('[data-testid^="data-testid Panel header"]');
        const title = header ? header.getAttribute('data-testid').replace('data-testid Panel header ', '') : panel.getAttribute('data-viz-panel-key');
        const content = panel.querySelector('[data-testid="data-testid panel content"]') || panel;
        const text = content.innerText || '';
        const error = !!panel.querySelector('[data-testid="data-testid Panel status error"]');
        results.push({ title, noData: /(^|\n)\s*No data\s*($|\n)/.test(text), error });
      }
      return results;
    });
    const bad = panels.filter((p) => p.noData || p.error);
    report.push({ uid, panels: panels.length, bad });
    if (env.SCREENSHOT_DIR) await page.screenshot({ path: path.join(env.SCREENSHOT_DIR, `${uid}.png`), fullPage: false });
    check('grafana', `${uid}: ${panels.length} panels render data`, panels.length > 0 && bad.length === 0, bad.map((p) => `${p.title}${p.error ? ' (error)' : ' (No data)'}`).join('; '));
  }
  await browser.close();
  fs.writeFileSync(path.join(RESULTS_DIR, `${stamp()}-telemetry-grafana.json`), JSON.stringify(report, null, 2));
}

function stamp() {
  return started.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
}

// ---------------------------------------------------------------------------------------------------------------

async function main() {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  adminKey = secret('garrison-secrets', 'admin-api-key');
  const grafanaPassword = secret('garrison-grafana', 'admin-password');
  const replicas = Number(kubectl(['get', 'deployment', 'garrison-server', '-o', 'jsonpath={.status.readyReplicas}']).trim() || '1');
  log(`server replicas ${replicas}`);

  await portForward('svc/garrison-server', PORTS.server, 8700);
  await portForward('svc/garrison-server', PORTS.mcp, 8701);
  await portForward('svc/garrison-prometheus', PORTS.prometheus, 9090);
  await portForward('svc/garrison-loki', PORTS.loki, 3100);
  await portForward('svc/garrison-tempo', PORTS.tempo, 3200);
  await portForward('svc/garrison-grafana', PORTS.grafana, 3000);
  log('port-forwards ready');

  const nodes = await (async () => {
    adminKey = adminKey.trim();
    const response = await api('GET', '/v1.0/api/nodes');
    return response.json?.objects || response.json || [];
  })();
  const detected = Array.isArray(nodes) && nodes.some((n) => (n.executors || []).includes('KubernetesJob'));
  const kubernetesExecutor = env.KUBERNETES_EXECUTOR === '1' ? true : env.KUBERNETES_EXECUTOR === '0' ? false : detected;
  log(`KubernetesJob executor ${kubernetesExecutor ? 'available' : 'not available'}`);

  if (env.ONLY_HEADLESS === '1') {
    const info = await api('GET', '/v1.0/api/server-info');
    await headlessCheck(Object.values(info.json?.observability?.dashboards || {}).filter(Boolean), grafanaPassword);
    return;
  }

  await setup(kubernetesExecutor);
  await authTraffic();
  const runIds = await runTraffic(kubernetesExecutor);
  const sample = runIds[0];
  await mcpTraffic(sample);
  await a2aTraffic();
  await webSocketTraffic(sample);
  await miscTraffic();
  await routeSweep(routes());
  // A second request wave after the sweep keeps the rate panels populated over the dashboards' windows.
  for (let i = 0; i < 3; i++) await invoke(`${PREFIX}-echo`);

  log(`waiting ${SETTLE_SECONDS} s for scrapes, logs, and traces`);
  await sleep(SETTLE_SECONDS * 1000);

  if (unschedulable?.json?.id) {
    const ended = await waitForRun(unschedulable.json.id, Number(env.POD_FAILURE_WAIT_SECONDS || 120));
    log(`unschedulable run: ${ended?.status || 'still running'}/${ended?.outcome || ''} ${ended?.errorMessage || ''}`);
    if (ended) await sleep(30000);
  }
  const sampleRun = (await api('GET', `/v1.0/api/tenants/${tenantId}/runs/${sample}`)).json;
  await assertMetrics(kubernetesExecutor, replicas);
  await assertLogs(sample, sampleRun?.traceId);
  await assertTraces(sampleRun?.traceId);
  if (env.HEADLESS_CHECK !== '0') {
    const info = await api('GET', '/v1.0/api/server-info');
    const dashboards = Object.values(info.json?.observability?.dashboards || {}).filter(Boolean);
    check('grafana', 'server-info lists 14 dashboards', dashboards.length === 14, dashboards.join(', '));
    await headlessCheck(dashboards, grafanaPassword);
  }
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  check('run', 'verification ran to completion', false, error.stack || String(error));
} finally {
  for (const child of children) child.kill();
  const failed = checks.filter((c) => c.status === 'fail');
  const skipped = checks.filter((c) => c.status === 'skip');
  const report = { started: started.toISOString(), finished: new Date().toISOString(), passed: checks.filter((c) => c.status === 'pass').length, failed: failed.length, skipped: skipped.length, checks };
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
  const file = path.join(RESULTS_DIR, `${stamp()}-telemetry-verify.json`);
  fs.writeFileSync(file, JSON.stringify(report, null, 2));
  log(`passed ${report.passed}, failed ${report.failed}, skipped ${report.skipped}; report ${file}`);
  for (const s of skipped) log(`skipped ${s.area}: ${s.name} (${s.detail})`);
  exitCode = failed.length === 0 ? 0 : 1;
}
process.exit(exitCode);
