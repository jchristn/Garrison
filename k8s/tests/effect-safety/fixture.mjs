import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { setTimeout as sleep } from 'node:timers/promises';

const args = Object.fromEntries(process.argv.slice(2).reduce((items, value, index, all) => {
  if (value.startsWith('--')) items.push([value.slice(2), all[index + 1] ?? 'true']);
  return items;
}, []));
if (args.version) {
  console.log('garrison-effect-fixture 1.0.0');
  process.exit(0);
}

if (args.mode === 'sink') {
  const receipts = [];
  const ready = [];
  const allowed = new Set();
  const released = new Set();
  http.createServer(async (request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    response.setHeader('Content-Type', 'application/json');
    const operationId = request.headers['idempotency-key'] ?? url.searchParams.get('operation');
    if (request.method === 'POST' && (url.pathname === '/mutate' || url.pathname === '/ready')) {
      if (!operationId || !request.headers['x-garrison-attempt']) {
        response.writeHead(400).end(JSON.stringify({ error: 'Operation and attempt are required.' }));
        return;
      }
      const receipt = { operationId, attempt: Number(request.headers['x-garrison-attempt']), timestampUtc: new Date().toISOString() };
      if (url.pathname === '/mutate') receipts.push(receipt);
      else ready.push(receipt);
      response.end(JSON.stringify(receipt));
    } else if (request.method === 'POST' && url.pathname === '/allow') {
      allowed.add(operationId);
      response.end('{}');
    } else if (request.method === 'POST' && url.pathname === '/release') {
      released.add(operationId);
      response.end('{}');
    } else if (request.method === 'GET' && url.pathname === '/allowed') {
      response.end(JSON.stringify({ allowed: allowed.has(operationId) }));
    } else if (request.method === 'GET' && url.pathname === '/released') {
      response.end(JSON.stringify({ released: released.has(operationId) }));
    } else if (request.method === 'GET' && url.pathname === '/state') {
      response.end(JSON.stringify({ receipts, ready }));
    } else {
      response.writeHead(404).end('{}');
    }
  }).listen(Number(args.port ?? 8080), args.hostname ?? '0.0.0.0');
} else {
  let input = '';
  for await (const chunk of process.stdin) input += chunk.toString();
  if (args.mode === 'noop') {
    console.log('No-op fixture completed.');
    process.exit(0);
  }
  if (args.mode === 'gateway') {
    console.log(JSON.stringify(await gatewayBenchmark(args)));
    process.exit(0);
  }
  const headers = { 'Idempotency-Key': args.operation, 'X-Garrison-Attempt': args.attempt };
  const call = async (path, method = 'GET') => {
    const response = await fetch(args.sink + path, { method, headers });
    if (!response.ok) throw new Error(`Sink answered ${response.status} for ${path}.`);
    return response.json();
  };
  if (args.phase === 'before') {
    await call('/ready', 'POST');
    while (!(await call(`/allowed?operation=${encodeURIComponent(args.operation)}`)).allowed) await sleep(100);
  }
  await call('/mutate', 'POST');
  if (args.phase !== 'complete') {
    while (!(await call(`/released?operation=${encodeURIComponent(args.operation)}`)).released) await sleep(100);
  }
  console.log(`External effect committed for ${args.operation}, attempt ${args.attempt}.`);
}


async function gatewayBenchmark(options) {
  const configuration = JSON.parse(await readFile(options.config, 'utf8'));
  const endpoint = configuration.mcpServers.garrison;
  if (!endpoint?.url || !endpoint?.headers) throw new Error('Compiled Garrison MCP endpoint is missing.');
  let sequence = 0;
  const makeClient = (headers) => ({ headers, session: null });
  const fenced = makeClient(endpoint.headers);
  const control = makeClient({ 'x-api-key': options['control-key'] });
  const rpc = async (client, method, params, notification = false) => {
    const id = ++sequence;
    const headers = { ...client.headers, 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-03-26' };
    if (client.session) headers['Mcp-Session-Id'] = client.session;
    const response = await fetch(endpoint.url, { method: 'POST', headers,
      body: JSON.stringify({ jsonrpc: '2.0', ...(notification ? {} : { id }), method, params }) });
    if (!response.ok) throw new Error(`MCP ${method} answered ${response.status}.`);
    client.session = response.headers.get('mcp-session-id') ?? client.session;
    const text = await response.text();
    if (notification || !text.trim()) return null;
    let message;
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      const frames = text.split(/\r?\n\r?\n/).map(frame => frame.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => line.slice(5).trim()).join('\n')).filter(Boolean);
      message = frames.map(frame => JSON.parse(frame)).find(frame => frame.id === id);
    } else message = JSON.parse(text);
    if (!message || message.error || message.result?.isError) throw new Error('MCP call failed: ' + JSON.stringify(message?.error ?? message?.result));
    return message.result;
  };
  for (const client of [control, fenced]) {
    await rpc(client, 'initialize', { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'garrison-gateway-proof', version: '1.0.0' } });
    await rpc(client, 'notifications/initialized', {}, true);
  }
  const count = Number(options.count ?? 200);
  const warmup = Number(options.warmup ?? 10);
  const samples = [];
  const invoke = async (client, index) => {
    const start = performance.now();
    await rpc(client, 'tools/call', { name: 'garrison_start_run', arguments: { tenantId: options.tenant, agent: options.child, input: `Gateway overhead fixture ${index}.` } });
    return performance.now() - start;
  };
  for (let index = -warmup; index < count; index++) {
    let baselineMs;
    let gatewayMs;
    if (index % 2 === 0) {
      baselineMs = await invoke(control, index);
      gatewayMs = await invoke(fenced, index);
    } else {
      gatewayMs = await invoke(fenced, index);
      baselineMs = await invoke(control, index);
    }
    if (index >= 0) samples.push({ baselineMs, gatewayMs, differenceMs: gatewayMs - baselineMs });
  }
  const percentile = values => values.toSorted((a, b) => a - b)[Math.max(0, Math.ceil(values.length * 0.99) - 1)];
  return { samples, count, warmup, baselineP99Ms: percentile(samples.map(sample => sample.baselineMs)),
    gatewayP99Ms: percentile(samples.map(sample => sample.gatewayMs)),
    pairedDifferenceP99Ms: percentile(samples.map(sample => sample.differenceMs)),
    positiveDifferenceP99Ms: percentile(samples.map(sample => Math.max(0, sample.differenceMs))),
    description: 'Alternating paired MCP garrison_start_run calls: administrator control versus current-run fencing and durable intent journal. Includes transport, authorization differences and child admission; shared local cluster, not a production one-region guarantee.' };
}
