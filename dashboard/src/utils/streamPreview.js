// Folds a run's event stream into what the Invoke Preview tab shows (P5.52).
//
// AssistantText events are either deltas (Claude Code with partial messages, Mux) or whole messages (Codex, Claude
// Code without partial messages, Gemini). Parsers attach the raw harness line only to whole messages, so a text
// event with rawEventJson starts a new paragraph and one without it continues the current text. Tool calls split
// the text into segments so each call shows as a chip where it happened. ToolResult events settle the chip of the
// call with the same toolCallId (or the latest open call with the same tool name).

/** True for the event types that count as model output for time to first token. */
export function isModelOutput(e) {
  return !!e && (e.eventType === 'AssistantText' || e.eventType === 'Thinking') && !!e.text;
}

/**
 * Build the preview model from events sorted by sequence.
 * Returns { segments: [{ kind: 'text', text } | { kind: 'tool', key, name, status: 'running'|'ok'|'failed' }],
 * thinking, outputTokens, hasText }.
 */
export function buildPreview(events) {
  const segments = [];
  const thinking = [];
  let outputTokens = 0;
  let sawUsage = false;
  let lastText = null;
  for (const e of events || []) {
    if (!e || typeof e !== 'object') continue;
    if (e.eventType === 'AssistantText' && e.text) {
      const whole = !!e.rawEventJson;
      if (lastText && whole && lastText.text) lastText.text += '\n\n';
      if (!lastText) {
        lastText = { kind: 'text', text: '' };
        segments.push(lastText);
      }
      lastText.text += e.text;
    } else if (e.eventType === 'Thinking' && e.text) {
      if (thinking.length && e.rawEventJson) thinking.push('\n\n');
      thinking.push(e.text);
    } else if (e.eventType === 'ToolCall') {
      segments.push({ kind: 'tool', key: e.toolCallId || `seq-${e.sequence}`, callId: e.toolCallId || null, name: e.toolName || '?', status: 'running' });
      lastText = null;
    } else if (e.eventType === 'ToolResult') {
      const open = segments.filter((s) => s.kind === 'tool' && s.status === 'running');
      const match = (e.toolCallId && open.find((s) => s.callId === e.toolCallId)) || [...open].reverse().find((s) => s.name === e.toolName) || null;
      const status = e.success === false ? 'failed' : 'ok';
      if (match) match.status = status;
      else {
        segments.push({ kind: 'tool', key: e.toolCallId || `seq-${e.sequence}`, callId: e.toolCallId || null, name: e.toolName || '?', status });
        lastText = null;
      }
    } else if (e.eventType === 'Usage' && (e.outputTokens || e.outputTokens === 0)) {
      outputTokens += Number(e.outputTokens) || 0;
      sawUsage = true;
    }
  }
  return {
    segments,
    thinking: thinking.join(''),
    outputTokens: sawUsage ? outputTokens : null,
    hasText: segments.some((s) => s.kind === 'text' && s.text)
  };
}
