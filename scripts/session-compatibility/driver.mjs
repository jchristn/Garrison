import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';

const options = Object.fromEntries(process.argv.slice(2).map(arg => arg.replace(/^--/, '').split('=')));
const harness = options.harness || 'claude';
const contracts = {
  claude: ['claude-code', 'claude-project-jsonl-v1'],
  codex: ['codex', 'codex-rollout-jsonl-v1'],
  'codex-app-server': ['codex-app-server', 'codex-rollout-jsonl-v1'],
  mux: ['mux', 'mux-session-json-v1'],
  gemini: ['gemini-cli', 'gemini-chat-jsonl-v1'],
  'provider-api': ['provider-api', 'garrison-provider-history-json-v1']
};
if (!contracts[harness]) throw new Error('Unknown session contract: ' + harness);
const [profileName, expectedFormat] = contracts[harness];
const profile = JSON.parse(await fs.readFile(`/profiles/${profileName}.json`, 'utf8'));
if (profile.supportsResume !== true || profile.isolateHome !== true || profile.sessionFormat !== expectedFormat) throw new Error('Seed profile session contract disagrees with compatibility gate: ' + harness);
const root = '/tmp/garrison-session-compat';
const home = path.join(root, 'home');
const work = path.join(root, 'work');
const fixture = options.fixture || `/fixtures/${harness === 'codex-app-server' ? 'codex' : harness}`;
const first = 'GARRISON_RECORDED_SESSION_FIRST_8da3';
const next = 'GARRISON_RECORDED_SESSION_NEXT_31b9';
const answer = 'GARRISON_SESSION_RESUME_OK';
const fixedId = 'b37a8c6d-ec31-4b1e-8e06-625885a829b1';
let resumedRequests = 0;
let apiRequests = 0;

await fs.rm(root, { recursive: true, force: true });
await fs.mkdir(work, { recursive: true });
await fs.mkdir(home, { recursive: true });
await fs.mkdir(path.join(home, ".codex"), { recursive: true });
const server = http.createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const text = Buffer.concat(chunks).toString('utf8');
    const body = text ? JSON.parse(text) : {};
    apiRequests++;
    const isResume = text.includes(next);
    if (isResume && !text.includes(first)) {
      res.writeHead(409, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ error: { message: 'Recorded session history was not restored', type: 'invalid_request_error' } }));
      return;
    }
    if (isResume) resumedRequests++;
    const output = isResume ? answer : first;
    const emit = (type, data) => res.write(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
    if (req.url.includes(':countTokens')) { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify({ totalTokens: 12 })); return; }
    if (req.url.includes(':streamGenerateContent') || req.url.includes(':generateContent')) {
      const response = { candidates: [{ content: { role: 'model', parts: [{ text: output }] }, finishReason: 'STOP', index: 0 }], usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 8, totalTokenCount: 20 }, modelVersion: 'gemini-2.5-flash', responseId: 'fixture' };
      if (req.url.includes(':streamGenerateContent')) { res.writeHead(200, { 'content-type': 'text/event-stream' }); res.end('data: ' + JSON.stringify(response) + '\n\n'); }
      else { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(response)); }
      return;
    }
    if (req.url.startsWith('/v1/messages')) {
      const message = { id: 'msg_fixture', type: 'message', role: 'assistant', model: body.model, content: [{ type: 'text', text: output }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 12, output_tokens: 8 } };
      if (!body.stream) { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(message)); return; }
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      emit('message_start', { type: 'message_start', message: { ...message, content: [], stop_reason: null, usage: { input_tokens: 12, output_tokens: 0 } } });
      emit('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } });
      emit('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: output } });
      emit('content_block_stop', { type: 'content_block_stop', index: 0 });
      emit('message_delta', { type: 'message_delta', delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 8 } });
      emit('message_stop', { type: 'message_stop' });
      res.end(); return;
    }
    if (req.url.startsWith('/v1/responses')) {
      const item = { id: 'msg_fixture', type: 'message', role: 'assistant', status: 'completed', content: [{ type: 'output_text', text: output, annotations: [] }] };
      const response = { id: 'resp_fixture', object: 'response', created_at: 1, model: body.model, status: 'completed', output: [item], usage: { input_tokens: 12, output_tokens: 8, total_tokens: 20, input_tokens_details: { cached_tokens: 0 }, output_tokens_details: { reasoning_tokens: 0 } } };
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      emit('response.created', { type: 'response.created', response: { ...response, status: 'in_progress', output: [] } });
      emit('response.output_item.added', { type: 'response.output_item.added', output_index: 0, item: { ...item, status: 'in_progress', content: [] } });
      emit('response.content_part.added', { type: 'response.content_part.added', item_id: item.id, output_index: 0, content_index: 0, part: { type: 'output_text', text: '', annotations: [] } });
      emit('response.output_text.delta', { type: 'response.output_text.delta', item_id: item.id, output_index: 0, content_index: 0, delta: output });
      emit('response.output_text.done', { type: 'response.output_text.done', item_id: item.id, output_index: 0, content_index: 0, text: output });
      emit('response.output_item.done', { type: 'response.output_item.done', output_index: 0, item });
      emit('response.completed', { type: 'response.completed', response });
      res.end(); return;
    }
    if (req.url.startsWith('/v1/chat/completions')) {
      const response = { id: 'chat_fixture', object: 'chat.completion', created: 1, model: body.model, choices: [{ index: 0, message: { role: 'assistant', content: output }, finish_reason: 'stop' }], usage: { prompt_tokens: 12, completion_tokens: 8, total_tokens: 20 } };
      if (!body.stream) { res.writeHead(200, { 'content-type': 'application/json' }); res.end(JSON.stringify(response)); return; }
      res.writeHead(200, { 'content-type': 'text/event-stream' });
      res.write(`data: ${JSON.stringify({ ...response, object: 'chat.completion.chunk', choices: [{ index: 0, delta: { role: 'assistant', content: output }, finish_reason: null }] })}\n\n`);
      res.write(`data: ${JSON.stringify({ ...response, object: 'chat.completion.chunk', choices: [{ index: 0, delta: {}, finish_reason: 'stop' }] })}\n\ndata: [DONE]\n\n`);
      res.end(); return;
    }
    res.writeHead(404); res.end();
  } catch { res.writeHead(500); res.end('Fixture protocol error'); }
});
await new Promise(resolve => server.listen(41237, '127.0.0.1', resolve));
const base = `http://127.0.0.1:${server.address().port}`;
const env = { PATH: process.env.PATH, HOME: home, USERPROFILE: home, CODEX_HOME: path.join(home, '.codex'), ANTHROPIC_BASE_URL: base, ANTHROPIC_API_KEY: 'fixture-not-a-real-key', DISABLE_AUTOUPDATER: '1', CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1', GARRISON_FIXTURE_API_KEY: 'fixture-not-a-real-key', GEMINI_API_KEY: 'fixture-not-a-real-key', GOOGLE_GEMINI_BASE_URL: base, GEMINI_CLI_NO_RELAUNCH: 'true' };

async function run(command, args, input) {
  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: work, env, stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = ''; let stderr = '';
    child.stdout.on('data', data => { stdout += data; });
    child.stderr.on('data', data => { stderr += data; });
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error(`${harness} timed out`)); }, 45000);
    child.on('error', error => { clearTimeout(timer); reject(error); });
    child.on('close', code => { clearTimeout(timer); if (code === 0) resolve(stdout); else reject(new Error(`${harness} exited ${code}: ${stderr.slice(-1500)} ${stdout.slice(-1500)}`)); });
    child.stdin.end(input || '');
  });
}
const codexConfig = ['-c', 'model_provider="fixture"', '-c', 'model="fixture-model"', '-c', 'model_providers.fixture.name="Fixture"', '-c', `model_providers.fixture.base_url="${base}/v1"`, '-c', 'model_providers.fixture.wire_api="responses"', '-c', 'model_providers.fixture.requires_openai_auth=false', '-c', 'model_providers.fixture.env_key="GARRISON_FIXTURE_API_KEY"'];
async function appServerTurn(prompt, id) {
  const child = spawn('codex', ['app-server', ...codexConfig], { cwd: work, env, stdio: ['pipe', 'pipe', 'pipe'] });
  let sequence = 0; let buffer = ''; let output = ''; const pending = new Map();
  let finish; let fail;
  const completed = new Promise((resolve, reject) => { finish = resolve; fail = reject; });
  const timer = setTimeout(() => fail(new Error('Codex app-server resume timed out')), 45000);
  const send = (method, params) => new Promise((resolve, reject) => {
    const requestId = ++sequence; pending.set(requestId, { resolve, reject });
    child.stdin.write(JSON.stringify({ id: requestId, method, params }) + '\n');
  });
  child.stdout.on('data', data => {
    buffer += data;
    while (buffer.includes('\n')) {
      const end = buffer.indexOf('\n'); const line = buffer.slice(0, end); buffer = buffer.slice(end + 1);
      let message; try { message = JSON.parse(line); } catch { continue; }
      if (pending.has(message.id)) {
        const request = pending.get(message.id); pending.delete(message.id);
        if (message.error) request.reject(new Error(JSON.stringify(message.error))); else request.resolve(message.result);
      }
      if (message.method === 'item/agentMessage/delta') output += message.params.delta;
      if (message.method === 'turn/completed') {
        if (message.params.turn.status !== 'completed') fail(new Error('App-server turn failed: ' + JSON.stringify(message.params.turn)));
        else finish(output);
      }
    }
  });
  child.stderr.resume();
  child.on('error', fail);
  child.on('exit', code => { if (code && code !== 0) fail(new Error('App-server exited ' + code)); });
  try {
    await send('initialize', { clientInfo: { name: 'garrison-session-compatibility', version: '1.0' }, capabilities: {} });
    child.stdin.write(JSON.stringify({ method: 'initialized', params: {} }) + '\n');
    await send('thread/resume', { threadId: id, cwd: work, approvalPolicy: 'never' });
    await send('turn/start', { threadId: id, input: [{ type: 'text', text: prompt }] });
    return await completed;
  } finally { clearTimeout(timer); child.kill('SIGTERM'); }
}
async function turn(prompt, resume, id) {
  if (harness === 'gemini') {
    await fs.mkdir(path.join(home, '.gemini'), { recursive: true });
    await fs.writeFile(path.join(home, '.gemini', 'settings.json'), JSON.stringify({ security: { auth: { selectedType: 'gemini-api-key' } }, general: { enableAutoUpdate: false } }));
    return await run('gemini', ['--prompt', prompt, '--output-format', 'stream-json', '--model', 'gemini-2.5-flash', '--skip-trust', ...(resume ? ['--resume', id] : ['--session-id', fixedId])]);
  }
  if (harness === 'provider-api') {
    const config = path.join(root, 'provider.json');
    await fs.writeFile(config, JSON.stringify({ Endpoint: base + '/v1', Model: 'fixture-model', ApiKeyVariable: 'GARRISON_FIXTURE_API_KEY', SessionId: fixedId, Resume: resume }));
    return await run('garrison-provider-api', ['--config', config], prompt);
  }
  if (harness === 'codex-app-server') return await appServerTurn(prompt, id);
  if (harness === 'claude') return await run('claude', ['-p', '--output-format', 'stream-json', '--verbose', '--model', 'claude-sonnet-4-5', ...(resume ? ['--resume', id] : ['--session-id', fixedId]), prompt]);
  if (harness === 'codex') return await run('codex', ['exec', ...(resume ? ['resume'] : []), '--json', '--skip-git-repo-check', ...codexConfig, ...(resume ? [id] : ['--sandbox', 'read-only']), prompt]);
  if (harness === 'mux') return await run('mux', ['--print', '--output-format', 'jsonl', '--config-dir', path.join(home, '.mux'), '--adapter-type', 'openai', '--base-url', `${base}/v1`, '--model', 'fixture-model', '--no-project-instructions', ...(resume ? ['--resume', id] : ['--session-id', fixedId]), prompt]);
  throw new Error(`Unsupported fixture harness: ${harness}`);
}
async function files(directory) {
  const result = [];
  for (const item of await fs.readdir(directory, { withFileTypes: true })) {
    const full = path.join(directory, item.name);
    if (item.isDirectory()) result.push(...await files(full)); else if (item.isFile()) result.push(full);
  }
  return result;
}
try {
  let metadata;
  if (options.capture === 'true') {
    const output = await turn(`Remember ${first}. Reply with that marker only.`, false, fixedId);
    if (!output.includes(first)) throw new Error('First turn did not produce the fixture marker');
    const version = (await run(harness === 'provider-api' ? 'garrison-provider-api' : harness, ['--version'])).trim();
    let id = fixedId;
    if (harness === 'codex') {
      const started = output.split('\n').filter(Boolean).map(line => { try { return JSON.parse(line); } catch { return {}; } }).find(item => item.type === 'thread.started');
      if (!started?.thread_id) throw new Error('Codex did not emit its recorded thread ID');
      id = started.thread_id;
    }
    metadata = { harness, version, sessionFormat: expectedFormat, sessionId: id, originalWorkspace: work, provider: 'offline protocol fixture; no real credentials', recordedBy: 'installed CLI session writer', sanitization: 'Generated system prompts and environment attachments removed; session envelopes and fixture user/assistant history retained; sanitized recordings validated by installed CLI resume' };
    await fs.rm(fixture, { recursive: true, force: true });
    await fs.mkdir(fixture, { recursive: true });
    const allow = harness === 'claude' ? path.join(home, '.claude', 'projects') : harness === 'codex' ? path.join(home, '.codex', 'sessions') : harness === 'gemini' ? path.join(home, '.gemini', 'tmp') : harness === 'provider-api' ? path.join(home, '.garrison-provider-api', 'sessions') : path.join(home, '.mux', 'sessions');
    const sessionFiles = await files(allow);
    for (const source of sessionFiles) {
      const relative = path.relative(home, source);
      const destination = path.join(fixture, 'home', relative);
      await fs.mkdir(path.dirname(destination), { recursive: true });
      let recorded = await fs.readFile(source, 'utf8');
      if (harness === 'claude') {
        const rows = recorded.trim().split('\n').map(JSON.parse).filter(row => ['user', 'assistant'].includes(row.type));
        for (let index = 0; index < rows.length; index++) rows[index].parentUuid = index ? rows[index - 1].uuid : null;
        recorded = rows.map(row => JSON.stringify(row)).join('\n') + '\n';
      } else if (harness === 'codex') {
        const rows = recorded.trim().split('\n').map(JSON.parse).filter(row => row.type !== 'world_state' && !(row.type === 'response_item' && row.payload?.role === 'developer'));
        for (const row of rows) if (row.type === 'session_meta' && row.payload.base_instructions) row.payload.base_instructions.text = 'Offline recorded session compatibility fixture.';
        recorded = rows.map(row => JSON.stringify(row)).join('\n') + '\n';
      }
      await fs.writeFile(destination, recorded);
    }
    await fs.writeFile(path.join(fixture, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
  } else metadata = JSON.parse(await fs.readFile(path.join(fixture, 'metadata.json'), 'utf8'));
  if (metadata.sessionFormat !== expectedFormat) throw new Error('Recorded session format disagrees with seed profile: ' + harness);
  // Resume solely from the committed first-turn session, with no original process or original HOME.
  await fs.rm(home, { recursive: true, force: true });
  await fs.cp(path.join(fixture, 'home'), home, { recursive: true });
  const output = await turn(`${next}. Continue the saved session and answer briefly.`, true, metadata.sessionId);
  if (!output.includes(answer) || resumedRequests < 1) throw new Error('Installed CLI did not restore prior history from the recorded session');
  const installedVersion = (await run(harness === 'codex-app-server' ? 'codex' : harness === 'provider-api' ? 'garrison-provider-api' : harness, ['--version'])).trim();
  console.log(JSON.stringify({ harness, recordedVersion: metadata.version, sessionFormat: expectedFormat, installedVersion, result: 'PASS', restoredHistoryRequests: resumedRequests, apiRequests }));
} finally { await new Promise(resolve => server.close(resolve)); }
