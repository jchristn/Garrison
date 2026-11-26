// Change rules and executive proposals (AA8.12): helpers shared by the Change rules page, its form, and the Proposals
// tab of the organization page. Rule names, descriptions, proposal titles, and reasons are data people and agents
// wrote; nothing here turns them into markup.

import { CHANGE_RULE_LIMITS, CHANGE_RULE_LIMIT_NAMES, ENUMS } from './constants';
import { enumLabel } from './enums';
import { formatNumber } from '../i18n/formatters';

/** Field codes the change rule routes answer with, each explained under changeRules.errors.<code>. */
export const CHANGE_RULE_ERROR_CODES = ['UnknownLimit', 'ClassNotInRule', 'UnitNotFound', 'Duplicate', 'BoundRequired', 'MinimumAboveMaximum', 'NegativeBound', 'ExpiryInPast', 'OrganizationNotFound', 'OrganizationNotSettable', 'TooMany'];

/** The limit names a change class accepts; count for an unknown class. */
export function limitNamesFor(changeClass) {
  return CHANGE_RULE_LIMIT_NAMES[changeClass] || ['count'];
}

/** A blank limit row for the form: the first class the rule lists, the count limit, no bounds. */
export function blankLimit(classes) {
  return { class: (classes || [])[0] || ENUMS.changeClass[0], name: 'count', minimum: null, maximum: null };
}

/** An empty rule form: active, no expiry, no classes, no limits. */
export function blankChangeRule() {
  return { organizationId: '', unitId: '', name: '', description: '', active: true, expiresUtc: null, classes: [], limits: [] };
}

/** The form for a stored rule: classes flattened to their names. */
export function changeRuleToForm(rule) {
  if (!rule) return blankChangeRule();
  return {
    id: rule.id,
    organizationId: rule.organizationId || '',
    organizationName: rule.organizationName || null,
    unitId: rule.unitId || '',
    name: rule.name || '',
    description: rule.description || '',
    active: rule.active !== false,
    expiresUtc: rule.expiresUtc || null,
    classes: (rule.classes || []).map((c) => c.class).filter(Boolean),
    limits: (rule.limits || []).map((l) => ({ class: l.class, name: l.name, minimum: l.minimum ?? null, maximum: l.maximum ?? null }))
  };
}

const bound = (v) => (v === '' || v === null || v === undefined || Number.isNaN(Number(v)) ? null : Number(v));

/** The request body for a rule form. Classes go as [{ class }], in the order of the enum. */
export function changeRuleFormToBody(form) {
  const classes = ENUMS.changeClass.filter((c) => (form?.classes || []).includes(c));
  return {
    organizationId: form?.organizationId || '',
    unitId: form?.unitId || '',
    name: String(form?.name || '').trim(),
    description: String(form?.description || '').trim() || null,
    active: form?.active !== false,
    expiresUtc: form?.expiresUtc || null,
    classes: classes.map((c) => ({ class: c })),
    limits: (form?.limits || []).map((l) => ({ class: l.class, name: l.name, minimum: bound(l.minimum), maximum: bound(l.maximum) }))
  };
}

/**
 * Client-side checks that mirror the server's, keyed by field (limit rows as limits[i]): a name, an organization and a
 * unit, at least one class, each limit for a listed class with a known name, at least one bound, bounds zero or more
 * with the minimum not above the maximum, no limit twice, and an expiry in the future.
 */
export function changeRuleFormErrors(form, t, now = Date.now()) {
  const e = {};
  const name = String(form?.name || '').trim();
  if (!name || name.length > CHANGE_RULE_LIMITS.nameMax) e.name = t('changeRules.form.errors.name', { max: CHANGE_RULE_LIMITS.nameMax });
  if (String(form?.description || '').length > CHANGE_RULE_LIMITS.descriptionMax) e.description = t('changeRules.form.errors.description', { max: CHANGE_RULE_LIMITS.descriptionMax });
  if (!form?.organizationId) e.organizationId = t('changeRules.form.errors.organization');
  if (!form?.unitId) e.unitId = t('changeRules.form.errors.unit');
  const classes = form?.classes || [];
  if (classes.length === 0) e.classes = t('changeRules.form.errors.classes');
  if (form?.expiresUtc && new Date(form.expiresUtc).getTime() <= now) e.expiresUtc = t('changeRules.errors.ExpiryInPast');
  const limits = form?.limits || [];
  const problems = [];
  if (limits.length > CHANGE_RULE_LIMITS.limitsMax) problems.push(t('changeRules.errors.TooMany', { max: CHANGE_RULE_LIMITS.limitsMax }));
  const seen = new Set();
  limits.forEach((l, i) => {
    const row = (message) => problems.push(t('common.errors.listItem', { index: i + 1, message }));
    const min = bound(l.minimum);
    const max = bound(l.maximum);
    if (!classes.includes(l.class)) row(t('changeRules.errors.ClassNotInRule'));
    else if (!limitNamesFor(l.class).includes(l.name)) row(t('changeRules.errors.UnknownLimit'));
    else if (seen.has(`${l.class}/${l.name}`)) row(t('changeRules.errors.Duplicate'));
    else if (min === null && max === null) row(t('changeRules.errors.BoundRequired'));
    else if ((min !== null && min < 0) || (max !== null && max < 0)) row(t('changeRules.errors.NegativeBound'));
    else if (min !== null && max !== null && min > max) row(t('changeRules.errors.MinimumAboveMaximum'));
    seen.add(`${l.class}/${l.name}`);
  });
  if (problems.length) e.limits = problems.join(' ');
  return e;
}

/** A readable message for a change rule field code, or null for codes this page does not explain. */
export function changeRuleFieldError(t, code) {
  if (!CHANGE_RULE_ERROR_CODES.includes(code)) return null;
  return t(`changeRules.errors.${code}`, { max: CHANGE_RULE_LIMITS.limitsMax });
}

/** Where a rule stands now: Active (in force), Inactive (switched off), or Expired (its expiry passed). */
export function ruleStatus(rule, now = Date.now()) {
  if (!rule || rule.active === false) return 'Inactive';
  if (rule.expiresUtc && new Date(rule.expiresUtc).getTime() <= now) return 'Expired';
  return 'Active';
}

/** Semantic tone for a rule status pill. */
export function ruleStatusTone(status) {
  if (status === 'Active') return 'success';
  if (status === 'Expired') return 'warning';
  return 'neutral';
}

/** A limit as words: "Wake tuning, minimum interval (seconds): 60 to 3,600". */
export function limitText(t, limit, lng) {
  const n = (v) => formatNumber(v, { maximumFractionDigits: 4 }, lng);
  const min = bound(limit?.minimum);
  const max = bound(limit?.maximum);
  const range = min !== null && max !== null ? t('changeRules.limit.between', { min: n(min), max: n(max) }) : max !== null ? t('changeRules.limit.atMost', { max: n(max) }) : min !== null ? t('changeRules.limit.atLeast', { min: n(min) }) : t('changeRules.limit.any');
  return t('changeRules.limit.text', { class: enumLabel(t, 'changeClass', limit?.class), name: limitLabel(t, limit?.name), range });
}

/** The label of a limit name (count, minIntervalSeconds, ...), or the name itself for one this page does not know. */
export function limitLabel(t, name) {
  return t(`changeRules.limitNames.${name}`, { defaultValue: name || '' });
}

/**
 * Where a proposal's decision stands, for its pill: rule (applied at once because rules covered every change),
 * approved (a person allowed it), needsApproval (waiting for a person), denied (a person sent it back), lapsed (the
 * approval expired or was cancelled), or drafting (the executive has not submitted it).
 */
export function proposalDecision(proposal) {
  if (!proposal) return 'drafting';
  if (proposal.status === 'Applied') return proposal.decisionSource === 'Rule' ? 'rule' : 'approved';
  if (proposal.status === 'PendingApproval') return 'needsApproval';
  if (proposal.approvalStatus === 'Denied') return 'denied';
  if (proposal.approvalStatus === 'Expired' || proposal.approvalStatus === 'Cancelled') return 'lapsed';
  return 'drafting';
}

/** Every proposal decision, in display order. */
export const PROPOSAL_DECISIONS = ['rule', 'approved', 'needsApproval', 'denied', 'lapsed', 'drafting'];

/** Semantic tone for a proposal decision pill. */
export function proposalDecisionTone(decision) {
  switch (decision) {
    case 'rule':
    case 'approved':
      return 'success';
    case 'needsApproval':
      return 'warning';
    case 'denied':
      return 'danger';
    default:
      return 'neutral';
  }
}

/** Insert or replace a proposal (from proposal.changed) in a list kept newest change first. */
export function upsertProposal(list, proposal) {
  if (!proposal?.draftId) return list;
  const rest = (list || []).filter((p) => p.draftId !== proposal.draftId);
  return [proposal, ...rest].sort((a, b) => String(b.lastUpdateUtc || '').localeCompare(String(a.lastUpdateUtc || '')));
}
