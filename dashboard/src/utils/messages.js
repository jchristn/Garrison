// Messages between agents (AA6.12): helpers shared by the Messages page, the thread page, the agent inbox tab, the Home
// card, and the Send message dialog. Message subjects and bodies are data an agent or a person wrote; these helpers
// never turn them into markup.

import { pathFor } from '../config/navConfig';
import { ENUMS, MESSAGE_LIMITS } from './constants';
import { enumLabel } from './enums';
import { holds } from './apps';

/** Window event sent after a person sends a message from the dashboard, so message lists reload. */
export const MESSAGES_CHANGED_EVENT = 'garrison:messages-changed';

/** Tell message lists that a message was sent (or refused and stored). */
export function notifyMessagesChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(MESSAGES_CHANGED_EVENT));
}

/** Who sent the message: the sender agent's name, else its ID, else the name of the person or credential. */
export function senderText(message, agents = {}) {
  if (!message) return '';
  return message.senderAgentName || (message.senderAgentId && agents[message.senderAgentId]) || message.senderAgentId || message.senderName || message.senderPrincipalId || '';
}

/** Who sent the message with the kind of principal when no agent sent it: "admin@garrison (User)". */
export function senderDetail(t, message, agents = {}) {
  const who = senderText(message, agents);
  if (!who) return '';
  if (message.senderAgentId || !message.senderPrincipalType) return who;
  return `${who} (${enumLabel(t, 'principalType', message.senderPrincipalType)})`;
}

/** Who the message is for: the recipient agent's name, else its ID. */
export function recipientText(message, agents = {}) {
  if (!message) return '';
  return message.recipientAgentName || (message.recipientAgentId && agents[message.recipientAgentId]) || message.recipientAgentId || '';
}

/** The thread page of a message, with the message picked out. */
export function threadPath(message) {
  if (!message) return null;
  const thread = message.threadId || message.id;
  return pathFor('messageThreads', thread, message.id && message.id !== thread ? { message: message.id } : undefined);
}

/** The Messages page showing only rejected messages. */
export function rejectedPath() {
  return pathFor('messages', null, { status: 'Rejected' });
}

/** ISO time `hours` before now (default 24), for "in the last day" counts. */
export function hoursAgo(hours = 24, now = Date.now()) {
  return new Date(now - hours * 3600000).toISOString();
}

/** UTF-8 byte length of a string. */
export function utf8Bytes(text) {
  return new TextEncoder().encode(text || '').length;
}

/** A blank Send message form, optionally addressed to an agent: Normal urgency, the server's default time to live. */
export function blankMessage(recipient = '') {
  return { recipient: recipient || '', subject: '', body: '', urgency: 'Normal', ttlSeconds: '' };
}

/**
 * Field errors for a Send message form, matching the server: a recipient, a subject of 1 to 256 characters, a body
 * within the byte limit, and a whole-number time to live of 1 to 31536000 seconds when one is given.
 */
export function messageErrors(form, t) {
  const errors = {};
  if (!(form?.recipient || '').trim()) errors.recipient = t('messages.send.errors.recipient');
  const subject = (form?.subject || '').trim();
  if (subject.length < 1 || subject.length > MESSAGE_LIMITS.subjectMax) errors.subject = t('messages.send.errors.subject', { max: MESSAGE_LIMITS.subjectMax });
  if (utf8Bytes(form?.body) > MESSAGE_LIMITS.bodyMaxBytes) errors.body = t('messages.send.errors.body', { max: MESSAGE_LIMITS.bodyMaxBytes });
  const ttl = String(form?.ttlSeconds ?? '').trim();
  if (ttl) {
    const n = Number(ttl);
    if (!Number.isInteger(n) || n < MESSAGE_LIMITS.ttlMin || n > MESSAGE_LIMITS.ttlMax) errors.ttlSeconds = t('messages.send.errors.ttlSeconds', { min: MESSAGE_LIMITS.ttlMin, max: MESSAGE_LIMITS.ttlMax });
  }
  return errors;
}

/** The request body for POST /messages: the recipient, trimmed subject, urgency, and the body and TTL when set. */
export function messageToBody(form) {
  const body = { recipient: (form?.recipient || '').trim(), subject: (form?.subject || '').trim(), urgency: form?.urgency || 'Normal' };
  if ((form?.body || '').trim()) body.body = form.body;
  const ttl = String(form?.ttlSeconds ?? '').trim();
  if (ttl) body.ttlSeconds = Number(ttl);
  if (form?.parentMessageId) body.parentMessageId = form.parentMessageId;
  return body;
}

/** The rejection reason of a refused send (409 with the reason as the error code), or null for any other error. */
export function rejectionOf(error) {
  if (!error || error.status !== 409) return null;
  return ENUMS.messageRejection.includes(error.code) ? error.code : null;
}

/**
 * The tooltip explaining a missing AgentMessage permission, or '' when the caller holds it (or it cannot be known: the
 * server then decides). Reading needs Read; sending needs Create.
 */
export function messageDenied(t, permissions, operation) {
  if (holds(permissions, 'AgentMessage', operation)) return '';
  return t('tips.messages.denied', { operation: enumLabel(t, 'operationType', operation) });
}
