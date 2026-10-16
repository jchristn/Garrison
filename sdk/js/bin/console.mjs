#!/usr/bin/env node
// Interactive SDK console. Passwords/keys are not echoed or written to history.
import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
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
        case 'help': console.log('health | login <tenant> <email> | keys | tenant <id> | agents | runs | invoke <agent> <input> | run <id> | events <id> | operations <id> | watch <id> | pipelines | pipeline-runs | pipeline-reviews | start-pipeline <pipeline> <input> | triggers | fire-trigger <trigger> | notification-endpoints | quit'); break;
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
        default: console.log('Unknown command. Type help.'); break;
      }
    } catch (error) { console.log(active.signal.aborted ? 'Cancelled.' : `Error: ${error.message}`); }
    finally { active = null; client.transport.abortSignal = undefined; }
  }
} finally { rl.close(); process.off('SIGINT', cancel); }
