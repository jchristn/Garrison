// What the agent is doing during a turn, for apps that show operator detail: its thinking, the tools it used (with
// what it sent and what came back), and the other agents it asked. Built from the turn's detail events.

/** Tools on the Garrison MCP server that hand work to other agents, with what they mean to a person. */
const DELEGATION_TOOLS = {
  garrison_invoke_agent: 'ask',
  garrison_fan_out: 'askMany',
  garrison_gather: 'gather',
  garrison_wait_run: 'gather',
  garrison_get_run: 'check'
};

/**
 * A tool's name without the prefix the harness adds: `mcp__garrison__garrison_invoke_agent` (Claude Code) and
 * `garrison.garrison_invoke_agent` (Codex) both give `garrison_invoke_agent`.
 */
export function toolName(name) {
  const raw = String(name || '');
  const mcp = raw.match(/^mcp__[^_]+(?:_[^_]+)*?__(.+)$/);
  if (mcp) return mcp[1];
  const dotted = raw.match(/^[A-Za-z0-9_-]+\.(.+)$/);
  if (dotted) return dotted[1];
  return raw;
}

function parse(text) {
  const s = String(text || '').trim();
  if (!s || (s[0] !== '{' && s[0] !== '[')) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

/** The MCP server name of a harness tool name (`mcp__garrison__x` or `garrison.x` gives `garrison`), or null. */
function serverOf(name) {
  const raw = String(name || '');
  const mcp = raw.match(/^mcp__([^_]+(?:_[^_]+)*?)__/);
  if (mcp) return mcp[1];
  const dotted = raw.match(/^([A-Za-z0-9_-]+)\./);
  return dotted ? dotted[1] : null;
}

/**
 * What a tool call does, for its label: { kind: 'ask', agent } when it asks another agent (garrison_invoke_agent, or
 * an agent's own tool on the Garrison MCP server, which is named after the agent), { kind: 'askMany', agents } for a
 * fan-out, { kind: 'gather' } and { kind: 'check' } for collecting answers, else { kind: 'tool', tool }.
 */
export function describeTool(name, input) {
  const tool = toolName(name);
  const kind = DELEGATION_TOOLS[tool];
  const args = parse(input) || {};
  if (kind === 'ask') return { kind, agent: args.agent || '?' };
  if (kind === 'askMany') return { kind, agents: (Array.isArray(args.members) ? args.members : []).map((m) => (m && (m.label || m.agent)) || '?') };
  if (kind) return { kind };
  if (serverOf(name) === 'garrison' && !tool.startsWith('garrison_')) return { kind: 'ask', agent: tool };
  return { kind: 'tool', tool };
}

/** JSON indented for reading; other text as it is. */
export function readable(text) {
  const value = parse(text);
  return value === null ? String(text || '') : JSON.stringify(value, null, 2);
}

/**
 * The turn's activity as steps, in order: { kind: 'thinking', key, text } (consecutive thinking merged),
 * { kind: 'tool', key, name, action, input, output, status: 'running' | 'ok' | 'failed' } (a call and its result
 * paired by call ID, or by name), and { kind: 'note', key, eventType, text } for progress and warnings.
 */
export function activitySteps(details) {
  const steps = [];
  for (const d of details || []) {
    const last = steps[steps.length - 1];
    if (d.eventType === 'Thinking') {
      if (!d.text) continue;
      if (last && last.kind === 'thinking') last.text += `\n\n${d.text}`;
      else steps.push({ kind: 'thinking', key: `t-${d.sequence}`, text: d.text });
    } else if (d.eventType === 'ToolCall') {
      steps.push({ kind: 'tool', key: d.toolCallId || `c-${d.sequence}`, callId: d.toolCallId || null, name: d.toolName || '?', action: describeTool(d.toolName, d.text), input: d.text || '', output: '', status: 'running' });
    } else if (d.eventType === 'ToolResult') {
      const open = steps.filter((s) => s.kind === 'tool' && s.status === 'running');
      const match = (d.toolCallId && open.find((s) => s.callId === d.toolCallId)) || [...open].reverse().find((s) => s.name === d.toolName) || null;
      const status = d.success === false ? 'failed' : 'ok';
      if (match) {
        match.output = d.text || '';
        match.status = status;
      } else {
        steps.push({ kind: 'tool', key: d.toolCallId || `r-${d.sequence}`, callId: d.toolCallId || null, name: d.toolName || '?', action: describeTool(d.toolName, ''), input: '', output: d.text || '', status });
      }
    } else if (d.text) {
      steps.push({ kind: 'note', key: `n-${d.sequence}`, eventType: d.eventType, text: d.text });
    }
  }
  return steps;
}

/** What the agent is doing right now: the running tool step, else 'thinking' when it last thought, else null. */
export function currentActivity(steps) {
  const running = [...(steps || [])].reverse().find((s) => s.kind === 'tool' && s.status === 'running');
  if (running) return running;
  const last = (steps || [])[steps.length - 1];
  return last && last.kind === 'thinking' ? last : null;
}
