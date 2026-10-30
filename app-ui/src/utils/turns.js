// Turn state for the chat. A turn starts from the AppTurnView the server returns, then folds in streamed events:
// AssistantText appends to the visible answer as it arrives; Error records the failure text; Thinking, ToolCall,
// ToolResult, Progress, and Warning only reach the browser when the app shows operator detail, and are kept as a
// list. When the turn completes, the server's answer replaces the streamed text (it is the final, whole answer).

export const TERMINAL_STATUSES = ['Succeeded', 'Failed', 'Cancelled', 'TimedOut', 'Rejected'];
export const DETAIL_EVENT_TYPES = ['Thinking', 'ToolCall', 'ToolResult', 'Progress', 'Warning'];

/** True when the turn's run has finished (successfully or not). */
export function isTerminal(status) {
  return TERMINAL_STATUSES.includes(status);
}

/** A fresh turn record for the UI. */
export function newTurnState(view) {
  return { ...view, streamed: '', details: [], streamError: null, lastSequence: 0, reconnecting: false };
}

/** An event's text: its text, or a tool call's arguments or a tool result as JSON text when the server sent JSON. */
function eventText(evt) {
  const json = evt.toolInput ?? evt.toolOutput;
  if (json !== null && json !== undefined) return JSON.stringify(json);
  return evt.text || '';
}

/** Fold one RunEvent into a turn state; returns a new object (or the same one when nothing changed). */
export function applyEvent(state, evt) {
  if (!evt || typeof evt !== 'object') return state;
  const sequence = Number(evt.sequence) || 0;
  if (sequence && sequence <= state.lastSequence) return state;
  const next = { ...state, lastSequence: sequence || state.lastSequence };
  if (evt.eventType === 'AssistantText' && evt.text) {
    next.streamed = state.streamed + evt.text;
  } else if (evt.eventType === 'Error' && evt.text) {
    next.streamError = evt.text;
  } else if (DETAIL_EVENT_TYPES.includes(evt.eventType)) {
    next.details = [...state.details, { sequence, eventType: evt.eventType, text: eventText(evt), toolName: evt.toolName || null, toolCallId: evt.toolCallId || null, success: evt.success }];
  }
  return next;
}

/** Merge a newer AppTurnView (turn.status, turn.completed, or a refetch) into the turn state. */
export function applyView(state, view) {
  if (!view) return state;
  return { ...state, ...view };
}

/** The text to show for the agent's answer. */
export function visibleAnswer(state) {
  if (state.answer) return state.answer;
  return state.streamed || '';
}

/** One of: waiting, approval, streaming, done, failed. */
export function turnPhase(state) {
  if (isTerminal(state.status)) return state.status === 'Succeeded' ? 'done' : 'failed';
  if (state.awaitingApproval) return 'approval';
  if (state.streamed) return 'streaming';
  return 'waiting';
}
