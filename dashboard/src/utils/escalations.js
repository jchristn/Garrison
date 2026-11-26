// Helpers for escalations (AA2): questions a run raises for a person, a role, or another agent. They decide what can
// be answered or cancelled, build and check the answer body like the server does, and order the Home attention list.

import { ESCALATION_LIMITS } from './constants';

const SEVERITY_RANK = { Urgent: 0, Warning: 1, Info: 2 };

const blankText = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());

/** True while an escalation waits for an answer here: Open and not passed up to another escalation (answer that one). */
export function isAnswerable(escalation) {
  return escalation?.status === 'Open' && !escalation?.escalatedToId;
}

/** True when the escalation offers options, so the answer is a choice among their keys. */
export function hasOptions(escalation) {
  return Array.isArray(escalation?.options) && escalation.options.length > 0;
}

/** A blank answer form, preselecting the default answer when it is one of the options. */
export function blankAnswer(escalation) {
  const keys = (escalation?.options || []).map((o) => o.key);
  const def = escalation?.defaultAnswer || '';
  return { choice: keys.includes(def) ? def : '', text: '' };
}

/** The request body for POST /escalations/{id}/answer: choice only when the escalation has options, trimmed text. */
export function answerToBody(form, escalation) {
  const body = {};
  if (hasOptions(escalation) && blankText(form?.choice)) body.choice = blankText(form.choice);
  if (blankText(form?.text)) body.text = blankText(form.text);
  return body;
}

/** Field errors for an answer, matching the server: a choice among the options, otherwise text, at most 8000 chars. */
export function answerErrors(form, escalation, t) {
  const errors = {};
  const text = form?.text || '';
  if (hasOptions(escalation)) {
    const keys = escalation.options.map((o) => o.key);
    if (!blankText(form?.choice)) errors.choice = t('components.escalations.errors.choice');
    else if (!keys.includes(form.choice.trim())) errors.choice = t('components.escalations.errors.unknownChoice');
  } else if (!blankText(text)) {
    errors.text = t('components.escalations.errors.text');
  }
  if (text.length > ESCALATION_LIMITS.answerMax) errors.text = t('components.escalations.errors.textMax', { max: ESCALATION_LIMITS.answerMax });
  return errors;
}

/** The label of an option key, or the key itself. */
export function optionLabel(escalation, key) {
  if (!key) return '';
  const option = (escalation?.options || []).find((o) => o.key === key);
  return option?.label || key;
}

/** Answerable escalations ordered for attention: Urgent first, then Warning, then Info, oldest first within each. */
export function attentionList(escalations) {
  return (escalations || [])
    .filter(isAnswerable)
    .sort((a, b) => (SEVERITY_RANK[a.severity] ?? 3) - (SEVERITY_RANK[b.severity] ?? 3) || String(a.createdUtc || '').localeCompare(String(b.createdUtc || '')));
}

/** Who an escalation is addressed to, for display: the target name or identifier, or null for a manager. */
export function targetText(escalation) {
  return escalation?.targetName || escalation?.targetId || null;
}
