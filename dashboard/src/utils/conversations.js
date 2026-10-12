// Conversation helpers (P12.1): how a turn got its harness session, previews, and the invoke body fields.

/** Invoke modes: a standalone run, the first turn of a new conversation, or the next turn of an existing one. */
export const CONVERSATION_MODES = ['none', 'start', 'continue'];

/** Error codes the server answers (409) when a conversation turn cannot start, each with a translated message. */
export const CONVERSATION_ERROR_CODES = ['ConversationBusy', 'ConversationAgentMismatch', 'ConversationDeploymentMismatch', 'ConversationDeploymentUnavailable'];

/**
 * How a conversation turn got its harness session:
 *   'none'     the run is not part of a conversation;
 *   'first'    turn 1, which starts the conversation's session;
 *   'resumed'  the turn resumed the session the previous turn left (resumeSessionId);
 *   'fallback' the turn started a fresh session seeded with the transcript (conversationFallbackReason says why);
 *   'pending'  a later turn that has not been placed on a node yet, so whether it resumes is not known.
 */
export function turnSessionMode(run) {
  if (!run || !run.conversationId) return 'none';
  if (run.conversationFallbackReason) return 'fallback';
  if (run.resumeSessionId) return 'resumed';
  if ((run.conversationTurn ?? 0) <= 1) return 'first';
  return 'pending';
}

/** Badge tone for a turn session mode. */
export function turnSessionTone(mode) {
  switch (mode) {
    case 'resumed':
      return 'success';
    case 'fallback':
      return 'warning';
    case 'first':
      return 'info';
    default:
      return 'neutral';
  }
}

/** One-line preview of a run's input or result: whitespace collapsed, cut at `max` characters with an ellipsis. */
export function textPreview(text, max = 120) {
  const flat = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  return `${flat.slice(0, Math.max(1, max - 3)).trimEnd()}...`;
}

/**
 * The conversation fields of an invoke body for a mode: { startConversation: true } to start one, { conversationId }
 * to continue one, nothing for a standalone run. Continuing without an ID falls back to a standalone run.
 */
export function conversationBody(mode, conversationId) {
  if (mode === 'start') return { startConversation: true };
  if (mode === 'continue' && conversationId) return { conversationId };
  return {};
}
