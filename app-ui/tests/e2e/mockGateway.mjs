// A scripted stand-in for the Garrison app gateway (/v1.0/apps/{slug}/...), used by the browser tests.
//
// It speaks the same JSON shapes as the server (camelCase, enums as strings, null fields left out) and streams real
// server-sent events with timing, so the tests see text arrive piece by piece, a connection that drops mid-turn, and
// a file that appears while the agent runs. vite preview proxies /v1.0 here (GARRISON_API_URL), the way nginx
// proxies it in the dashboard image.
//
// Test control (not part of the gateway):
//   POST /__mock/reset   { app?, scenario? }  forget sessions and conversations; set branding and the turn script
//   POST /__mock/app     { ...AppInfo fields } change branding without restarting
//   POST /__mock/scenario { ...fields }      change the turn script (for example rejectNext) without a reset
//   POST /__mock/revoke                       end every session (the next call gets 401)
//   GET  /__mock/log                          stream connections seen: [{ runId, afterSequence, lastEventId }]
//
// Run: node tests/e2e/mockGateway.mjs [port]   (default 4791)

import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.argv[2] || process.env.MOCK_GATEWAY_PORT || 4791);
const ORIGIN = `http://127.0.0.1:${PORT}`;

const DEFAULT_APP = {
  slug: 'demo',
  displayName: 'Research Desk',
  description: 'Ask the research team anything.',
  welcomeText: 'Welcome to **Research Desk**. Ask a question to get started.',
  primaryColor: '#1e3a8a',
  accentColor: '#f59e0b',
  logoUrl: '/v1.0/apps/demo/logo',
  authMode: 'Anonymous',
  anonymousAllowed: true,
  showOperatorDetail: false
};

/**
 * The turn script. chunks: AssistantText pieces sent every chunkMs. dropAfter: on the first connection to a turn,
 * cut the stream right after this sequence, before turn.completed (the browser sees the connection drop; the
 * response is ended rather than the socket reset because vite's proxy would hold a reset connection open). replayOverlap: on reconnect, resend this many events the client
 * already has (the client must drop them). writeFile: { path, content, atChunk } writes a file while the turn runs.
 * approvalMs: the turn waits this long with awaitingApproval before it starts. holdMs: pause after the last chunk
 * before the turn completes. rejectNext: { status, code } refuses the next message.
 */
const DEFAULT_SCENARIO = {
  chunks: ['Here is ', 'the answer ', 'to your ', 'question.'],
  chunkMs: 250,
  dropAfter: 0,
  replayOverlap: 0,
  writeFile: null,
  approvalMs: 0,
  holdMs: 300,
  rejectNext: null
};

const LOGO = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" rx="12" fill="#1e3a8a"/><path d="M18 44V20h14a8 8 0 0 1 0 16H24" stroke="#fff" stroke-width="6" fill="none"/></svg>';

let app;
let scenario;
let sessions;
let conversations;
let runs;
let downloads;
let log;
let counter;

function reset(body = {}) {
  app = { ...DEFAULT_APP, ...(body.app || {}) };
  scenario = { ...DEFAULT_SCENARIO, ...(body.scenario || {}) };
  sessions = new Map();
  conversations = new Map();
  runs = new Map();
  downloads = new Map();
  log = [];
  counter = 0;
}
reset();

const nextId = (prefix) => `${prefix}_${String(++counter).padStart(6, '0')}`;
const now = () => new Date().toISOString();
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function send(res, status, body, headers = {}) {
  const text = body === undefined ? '' : JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(text);
}

function fail(res, status, code, message) {
  send(res, status, { error: code, code, message });
}

async function readBody(req) {
  const parts = [];
  for await (const chunk of req) parts.push(chunk);
  const text = Buffer.concat(parts).toString('utf8');
  return text ? JSON.parse(text) : null;
}

function tokenOf(req, url) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return url.searchParams.get('session');
}

function sessionOf(req, url) {
  const session = sessions.get(tokenOf(req, url));
  return session && !session.revoked ? session : null;
}

function turnView(run) {
  const view = { runId: run.id, turn: run.turn, message: run.message, status: run.status, awaitingApproval: run.awaitingApproval, createdUtc: run.createdUtc };
  if (run.status === 'Succeeded') view.answer = run.answer;
  if (run.status === 'Failed') view.error = 'The agent could not finish this turn (Failed).';
  if (run.completedUtc) view.completedUtc = run.completedUtc;
  return view;
}

function conversationView(conv, withTurns) {
  const last = conv.turns[conv.turns.length - 1];
  const view = {
    id: conv.id,
    title: conv.title,
    turnCount: conv.turns.length,
    busy: !!last && !['Succeeded', 'Failed'].includes(last.status),
    lastRunId: last ? last.id : undefined,
    createdUtc: conv.createdUtc,
    lastActivityUtc: conv.lastActivityUtc
  };
  if (withTurns) view.turns = conv.turns.map(turnView);
  return view;
}

function writeFile(conv, path, content) {
  const bytes = Buffer.from(content, 'utf8');
  const versions = conv.files.get(path) || [];
  versions.push({ number: versions.length + 1, sizeBytes: bytes.length, sha256: sha256(bytes), mediaType: 'text/markdown', createdUtc: now(), bytes });
  conv.files.set(path, versions);
}

function fileRecord(conv, path) {
  const versions = conv.files.get(path);
  const current = versions[versions.length - 1];
  return { path, currentVersion: current.number, sizeBytes: current.sizeBytes, sha256: current.sha256, mediaType: current.mediaType, deleted: false, createdUtc: versions[0].createdUtc, lastUpdateUtc: current.createdUtc };
}

function emit(run, evt) {
  run.events.push({ id: `evt_${run.id}_${run.events.length + 1}`, runId: run.id, sequence: run.events.length + 1, timestampUtc: now(), ...evt });
  for (const fn of run.listeners) fn();
}

function setStatus(run, status, awaitingApproval = false) {
  run.status = status;
  run.awaitingApproval = awaitingApproval;
  if (status === 'Succeeded' || status === 'Failed') run.completedUtc = now();
  for (const fn of run.listeners) fn();
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function play(conv, run, script) {
  await wait(100);
  emit(run, { eventType: 'Lifecycle', code: 'RunStarted', text: 'Run started' });
  if (script.approvalMs) {
    setStatus(run, 'Running', true);
    await wait(script.approvalMs);
  }
  setStatus(run, 'Running', false);
  for (let i = 0; i < script.chunks.length; i++) {
    await wait(script.chunkMs);
    if (script.writeFile && script.writeFile.atChunk === i) writeFile(conv, script.writeFile.path, script.writeFile.content);
    emit(run, { eventType: 'AssistantText', text: script.chunks[i] });
  }
  if (script.writeFile && script.writeFile.secondVersion) {
    await wait(script.chunkMs);
    writeFile(conv, script.writeFile.path, script.writeFile.secondVersion);
  }
  await wait(script.holdMs);
  run.answer = script.chunks.join('');
  emit(run, { eventType: 'Result', text: run.answer });
  conv.lastActivityUtc = now();
  setStatus(run, 'Succeeded');
}

function startTurn(conv, message) {
  const run = { id: nextId('run'), turn: conv.turns.length + 1, message, status: 'Queued', awaitingApproval: false, createdUtc: now(), events: [], listeners: new Set(), connections: 0, answer: null };
  conv.turns.push(run);
  conv.lastActivityUtc = run.createdUtc;
  runs.set(run.id, run);
  play(conv, run, { ...scenario });
  return run;
}

function sse(res) {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no', Connection: 'keep-alive' });
  res.flushHeaders();
}

function sseEvent(res, name, data, id) {
  res.write(`${id === undefined ? '' : `id: ${id}\n`}event: ${name}\ndata: ${JSON.stringify(data)}\n\n`);
}

function streamTurn(req, res, url, run) {
  const afterParam = Number(url.searchParams.get('afterSequence') || 0);
  const lastEventId = Number(req.headers['last-event-id'] || 0);
  let after = Math.max(afterParam, lastEventId);
  run.connections += 1;
  const first = run.connections === 1;
  log.push({ runId: run.id, afterSequence: afterParam, lastEventId, connection: run.connections });
  if (!first && scenario.replayOverlap) after = Math.max(0, after - scenario.replayOverlap);
  sse(res);
  let lastStatus = '';
  let done = false;
  const pump = () => {
    if (done) return;
    for (const evt of run.events.filter((e) => e.sequence > after)) {
      after = evt.sequence;
      if (['AssistantText', 'Result', 'Error', 'Lifecycle'].includes(evt.eventType) || app.showOperatorDetail) sseEvent(res, 'turn.event', evt, evt.sequence);
      if (first && scenario.dropAfter && evt.sequence === scenario.dropAfter) {
        done = true;
        run.listeners.delete(pump);
        res.end();
        return;
      }
    }
    const status = `${run.status}:${run.awaitingApproval}`;
    if (status !== lastStatus) {
      lastStatus = status;
      sseEvent(res, 'turn.status', turnView(run));
    }
    if (run.status === 'Succeeded' || run.status === 'Failed') {
      done = true;
      run.listeners.delete(pump);
      sseEvent(res, 'turn.completed', turnView(run));
      res.end();
    }
  };
  run.listeners.add(pump);
  req.on('close', () => {
    done = true;
    run.listeners.delete(pump);
  });
  pump();
}

function streamFiles(req, res, conv) {
  sse(res);
  const seen = new Map();
  let first = true;
  const tick = () => {
    const changed = [];
    for (const path of conv.files.keys()) {
      const f = fileRecord(conv, path);
      if (!first && seen.get(path) === f.currentVersion) continue;
      seen.set(path, f.currentVersion);
      changed.push({ path, version: f.currentVersion, deleted: false, sha256: f.sha256, sizeBytes: f.sizeBytes });
    }
    if (first || changed.length) sseEvent(res, 'files.changed', { conversationId: conv.id, changed });
    first = false;
  };
  tick();
  const timer = setInterval(tick, 200);
  req.on('close', () => clearInterval(timer));
}

async function handle(req, res) {
  const url = new URL(req.url, ORIGIN);
  const path = url.pathname;
  const method = req.method;

  if (path === '/__mock/reset' && method === 'POST') {
    reset((await readBody(req)) || {});
    return send(res, 200, { ok: true });
  }
  if (path === '/__mock/app' && method === 'POST') {
    app = { ...app, ...((await readBody(req)) || {}) };
    return send(res, 200, app);
  }
  if (path === '/__mock/scenario' && method === 'POST') {
    scenario = { ...scenario, ...((await readBody(req)) || {}) };
    return send(res, 200, scenario);
  }
  if (path === '/__mock/revoke' && method === 'POST') {
    for (const s of sessions.values()) s.revoked = true;
    return send(res, 200, { ok: true });
  }
  if (path === '/__mock/log' && method === 'GET') return send(res, 200, log);

  const download = path.match(/^\/v1\.0\/files\/download\/([a-f0-9]+)$/);
  if (download && method === 'GET') {
    const item = downloads.get(download[1]);
    if (!item) return fail(res, 404, 'NotFound', 'Download link not found.');
    res.writeHead(200, { 'Content-Type': item.mediaType, 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(item.name)}` });
    return res.end(item.bytes);
  }

  const m = path.match(/^\/v1\.0\/apps\/([a-z0-9-]+)(\/.*)?$/);
  if (!m) return fail(res, 404, 'NotFound', 'Not found.');
  if (m[1] !== app.slug) return fail(res, 404, 'NotFound', 'App not found.');
  const rest = m[2] || '';

  if (rest === '' && method === 'GET') {
    const info = { ...app };
    for (const k of Object.keys(info)) if (info[k] === null) delete info[k];
    return send(res, 200, info);
  }
  if (rest === '/logo' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'image/svg+xml' });
    return res.end(LOGO);
  }
  if (rest === '/session' && method === 'POST') {
    const body = (await readBody(req)) || {};
    let principal = null;
    if (body.email) {
      if (body.email !== 'ana@example.com' || body.password !== 'correct horse') return fail(res, 401, 'InvalidCredentials', 'The email or password is not correct.');
      principal = body.email;
    } else if (app.anonymousAllowed) {
      principal = 'anonymous';
    } else {
      return fail(res, 401, app.authMode === 'Anonymous' ? 'AnonymousDisabled' : 'AppSignInRequired', 'Sign in to use this app.');
    }
    const token = `gas_${crypto.randomBytes(16).toString('hex')}`;
    const session = { token, principalName: principal, anonymous: principal === 'anonymous', expiresUtc: new Date(Date.now() + 3600000).toISOString() };
    sessions.set(token, session);
    return send(res, 201, { token, expiresUtc: session.expiresUtc, principalName: principal, anonymous: session.anonymous });
  }

  const session = sessionOf(req, url);
  if (!session) return fail(res, 401, 'AppSessionRequired', 'The app session ended. Start a new one.');
  if (rest === '/session' && method === 'DELETE') {
    session.revoked = true;
    res.writeHead(204);
    return res.end();
  }
  const owned = (id) => {
    const conv = conversations.get(id);
    return conv && conv.owner === session.token ? conv : null;
  };
  if (rest === '/conversations' && method === 'GET') {
    return send(res, 200, [...conversations.values()].filter((c) => c.owner === session.token).map((c) => conversationView(c, false)));
  }
  if (rest === '/conversations' && method === 'POST') {
    const body = (await readBody(req)) || {};
    const conv = { id: nextId('cnv'), owner: session.token, title: String(body.message || '').slice(0, 60), createdUtc: now(), lastActivityUtc: now(), turns: [], files: new Map() };
    conversations.set(conv.id, conv);
    const run = startTurn(conv, body.message);
    return send(res, 201, { conversationId: conv.id, turn: turnView(run) });
  }
  const c = rest.match(/^\/conversations\/([A-Za-z0-9_]+)(\/.*)?$/);
  if (!c) return fail(res, 404, 'NotFound', 'Not found.');
  const conv = owned(c[1]);
  if (!conv) return fail(res, 404, 'NotFound', 'Conversation not found.');
  const sub = c[2] || '';
  if (sub === '' && method === 'GET') return send(res, 200, conversationView(conv, true));
  if (sub === '/messages' && method === 'POST') {
    const body = (await readBody(req)) || {};
    if (scenario.rejectNext) {
      const r = scenario.rejectNext;
      scenario.rejectNext = null;
      return fail(res, r.status, r.code, r.code);
    }
    const last = conv.turns[conv.turns.length - 1];
    if (last && !['Succeeded', 'Failed'].includes(last.status)) return fail(res, 409, 'ConversationBusy', 'The previous turn is still running.');
    return send(res, 201, turnView(startTurn(conv, body.message)));
  }
  const turn = sub.match(/^\/turns\/([A-Za-z0-9_]+)\/stream$/);
  if (turn && method === 'GET') {
    const run = runs.get(turn[1]);
    if (!run || !conv.turns.includes(run)) return fail(res, 404, 'NotFound', 'Turn not found.');
    return streamTurn(req, res, url, run);
  }
  if (sub === '/files' && method === 'GET') {
    const files = [...conv.files.keys()].map((p) => fileRecord(conv, p));
    return send(res, 200, { fileSpaceId: `cfs_${conv.id}`, fileCount: files.length, totalBytes: files.reduce((n, f) => n + f.sizeBytes, 0), files });
  }
  if (sub === '/files/stream' && method === 'GET') return streamFiles(req, res, conv);
  const filePath = url.searchParams.get('path');
  const versions = filePath ? conv.files.get(filePath) : null;
  if (sub.startsWith('/files/') && !versions) return fail(res, 404, 'NotFound', `File ${filePath} not found.`);
  const pick = () => {
    const n = Number(url.searchParams.get('version') || 0);
    return n ? versions.find((v) => v.number === n) : versions[versions.length - 1];
  };
  if (sub === '/files/versions' && method === 'GET') {
    return send(res, 200, [...versions].reverse().map(({ bytes: _bytes, ...v }) => ({ ...v, id: `cfv_${v.number}`, fileId: 'cfl_1', tenantId: 'default', storageKey: 'k' })));
  }
  if (sub === '/files/content' && method === 'GET') {
    const v = pick();
    res.writeHead(200, { 'Content-Type': v.mediaType, 'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(filePath.split('/').pop())}` });
    return res.end(v.bytes);
  }
  if (sub === '/files/download-url' && method === 'POST') {
    const v = pick();
    const token = crypto.randomBytes(12).toString('hex');
    downloads.set(token, { bytes: v.bytes, mediaType: v.mediaType, name: filePath.split('/').pop() });
    return send(res, 200, { url: `${ORIGIN}/v1.0/files/download/${token}`, expiresUtc: new Date(Date.now() + 300000).toISOString() });
  }
  return fail(res, 404, 'NotFound', 'Not found.');
}

http
  .createServer((req, res) => {
    handle(req, res).catch((err) => {
      if (!res.headersSent) fail(res, 500, 'InternalError', String(err && err.message));
    });
  })
  .listen(PORT, '127.0.0.1', () => {
    process.stdout.write(`mock gateway on ${ORIGIN}\n`);
  });
