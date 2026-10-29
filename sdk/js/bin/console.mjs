#!/usr/bin/env node
// Interactive SDK console. Passwords/keys are not echoed or written to history.
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { readFileSync } from 'node:fs';
import { GarrisonClient } from '../dist/esm/index.js';

const client = new GarrisonClient(process.argv[2]);
let muted = false;
let active = null;
const output = new Writable({ write(chunk, _encoding, done) { if (!muted) process.stdout.write(chunk); done(); } });
const rl = createInterface({ input: process.stdin, output, terminal: !!process.stdin.isTTY });
const input = rl[Symbol.asyncIterator]();
const cancel = () => { if (active) active.abort(); else rl.close(); };
rl.on('SIGINT', cancel);
process.on('SIGINT', cancel);
async function read(prompt, secret = false) {
  if (process.stdin.isTTY) process.stdout.write(prompt);
  muted = secret && !!process.stdin.isTTY;
  try { const value = await input.next(); if (value.done) throw new Error('Input ended.'); return value.value; }
  finally { if (muted) process.stdout.write('\n'); muted = false; }
}
const show = (value) => console.log(JSON.stringify(value));
const ARCHITECT_DEPLOYMENT = 'agent-architect-sdk';
const FAKE_HARNESS_PROFILE = 'hrn_builtin_fake';
// Select an architect prompt (identifier or name; default the first listed, the built-in) for an agent architect,
// creating an architect on the fake harness when none exists.
async function selectArchitectPrompt(prompt) {
  const prompts = (await client.studioDrafts.listArchitectPrompts()).objects;
  if (!prompts.length) throw new Error('The server lists no architect prompts.');
  let architect = (await client.studioDrafts.listArchitects({ maxResults: 1 })).objects[0];
  if (!architect) architect = await client.studioDrafts.createArchitect({ name: ARCHITECT_DEPLOYMENT, harnessProfileId: FAKE_HARNESS_PROFILE });
  return client.studioDrafts.setArchitectPrompt(architect.id, prompt || prompts[0].id);
}
// Start an anonymous app session, send one message, wait for the turn, and end the session.
async function chat(slug, message, signal) {
  const gateway = client.appGateway(slug);
  gateway.abortSignal = signal;
  await gateway.startSession();
  const started = await gateway.startConversation(message);
  await gateway.streamTurn(started.conversationId, started.turn.runId, () => {});
  const turn = await gateway.waitForTurn(started.conversationId, started.turn.runId);
  await gateway.endSession();
  return turn;
}
console.log('Garrison SDK console. Type help; Ctrl+C cancels the active request or stream.');
try {
  while (true) {
    let line;
    try { line = await read('garrison> '); } catch { break; }
    const match = line.trim().match(/^(\S+)(?:\s+(\S+))?(?:\s+([\s\S]+))?$/);
    if (!match) continue;
    const [, command, argument, rest] = match;
    if (['quit', 'exit'].includes(command.toLowerCase())) break;
    active = new AbortController();
    client.transport.abortSignal = active.signal;
    try {
      const requireArgument = () => { if (!argument) throw new Error('Missing arguments. Type help.'); };
      switch (command.toLowerCase()) {
        case 'help': console.log('health | login <tenant> <email> | keys | tenant <id> | agents | runs | invoke <agent> <input> | run <id> | events <id> | operations <id> | watch <id> | pipelines | pipeline-runs | pipeline-reviews | start-pipeline <pipeline> <input> | triggers | fire-trigger <trigger> | notification-endpoints | apply <file> | apps | studio-draft <app> | architect-prompts | architects | architect [prompt] | chat <slug> <message> | quit'); break;
        case 'health': show(await client.health()); break;
        case 'login':
          requireArgument(); if (!rest) throw new Error('Missing email. Type help.');
          await client.login(rest, await read('Password: ', true), argument);
          console.log(`Signed in. Tenant: ${client.tenantId}`); break;
        case 'keys': await client.loginWithKeys(await read('Access key: ', true), await read('Secret key: ', true)); console.log(`Signed in. Tenant: ${client.tenantId}`); break;
        case 'tenant': requireArgument(); client.tenantId = argument; break;
        case 'agents': show(await client.agents.list()); break;
        case 'runs': show(await client.runs.list()); break;
        case 'invoke': requireArgument(); if (!rest) throw new Error('Missing input. Type help.'); show(await client.agents.invoke(argument, rest, { wait: false })); break;
        case 'run': requireArgument(); show(await client.runs.get(argument)); break;
        case 'operations': requireArgument(); show(await client.runs.operations(argument)); break;
        case 'events': requireArgument(); show(await client.runs.events(argument)); break;
        case 'watch': requireArgument(); for await (const frame of client.runs.stream(argument)) show(frame); break;
        case 'triggers': show(await client.triggers.list()); break;
        case 'fire-trigger': requireArgument(); show(await client.triggers.fire(argument)); break;
        case 'notification-endpoints': show(await client.notificationEndpoints.list()); break;
        case 'pipelines': show(await client.pipelines.list()); break;
        case 'pipeline-runs': show(await client.pipelineRuns.list()); break;
        case 'pipeline-reviews': show(await client.pipelineReviews.list()); break;
        case 'start-pipeline': requireArgument(); if (!rest) throw new Error('Missing input. Type help.'); show(await client.pipelines.start(argument, { input: rest })); break;
        case 'apply': {
          requireArgument();
          const applied = await client.manifests.apply(readFileSync(argument, 'utf8'));
          show({ id: applied.id, documentCount: applied.documentCount, createdCount: applied.createdCount, updatedCount: applied.updatedCount, unchangedCount: applied.unchangedCount, failedCount: applied.failedCount });
          break;
        }
        case 'apps': show(await client.apps.list()); break;
        case 'studio-draft': requireArgument(); show(await client.studioDrafts.create({ title: `Console draft of ${argument}`, fromApp: argument })); break;
        case 'architect-prompts': for (const entry of (await client.studioDrafts.listArchitectPrompts()).objects) show(entry); break;
        case 'architects': for (const entry of (await client.studioDrafts.listArchitects()).objects) show(entry); break;
        case 'architect': show(await selectArchitectPrompt(argument)); break;
        case 'chat': requireArgument(); if (!rest) throw new Error('Missing message. Type help.'); show(await chat(argument, rest, active.signal)); break;
        default: console.log('Unknown command. Type help.'); break;
      }
    } catch (error) { console.log(active.signal.aborted ? 'Cancelled.' : `Error: ${error.message}`); }
    finally { active = null; client.transport.abortSignal = undefined; }
  }
} finally { rl.close(); process.off('SIGINT', cancel); }
