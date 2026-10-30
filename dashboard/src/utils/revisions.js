// Agent revisions, environments, and promotions (AD1): helpers shared by the agent detail page, the deployments page,
// the promotion dialogs, and their tests.

/** Environment a deployment runs in when the server sends none. */
export const DEFAULT_ENVIRONMENT = 'dev';

/** The shipped environment order, used when the tenant's list cannot be read. */
export const DEFAULT_ENVIRONMENTS = [
  { name: 'dev', position: 0 },
  { name: 'staging', position: 1 },
  { name: 'prod', position: 2 }
];

/** Environments in promotion order (by position, then name). Falls back to the shipped list when empty. */
export function orderedEnvironments(list) {
  const items = (Array.isArray(list) ? list : list?.environments || []).filter((e) => e && e.name);
  const source = items.length ? items : DEFAULT_ENVIRONMENTS;
  return [...source].sort((a, b) => (a.position ?? 0) - (b.position ?? 0) || String(a.name).localeCompare(String(b.name)));
}

/** Environment names in promotion order, plus any extra names (for example a deployment's current one) not listed. */
export function environmentNames(list, extra = []) {
  const names = orderedEnvironments(list).map((e) => e.name);
  for (const name of extra) if (name && !names.includes(name)) names.push(name);
  return names;
}

/** The environment after `source` in promotion order, or '' when `source` is the last one or unknown. */
export function nextEnvironment(list, source) {
  const names = environmentNames(list);
  const i = names.indexOf(source);
  return i >= 0 && i + 1 < names.length ? names[i + 1] : '';
}

/** True when promoting from `source` to `target` skips at least one environment, or goes backwards. */
export function skipsEnvironments(list, source, target) {
  if (!source || !target) return false;
  return nextEnvironment(list, source) !== target;
}

/** A deployment's environment, defaulting to dev. */
export function environmentOf(deployment) {
  return deployment?.environment || DEFAULT_ENVIRONMENT;
}

/** Revisions sorted newest first (highest number first). */
export function sortRevisions(revisions) {
  return [...(revisions || [])].sort((a, b) => (b.number ?? 0) - (a.number ?? 0));
}

/** Published revisions, newest first. */
export function publishedRevisions(revisions) {
  return sortRevisions(revisions).filter((r) => r.state === 'Published');
}

/** The open draft, or null. Prefers the agent's draftRevisionId when given. */
export function draftRevision(revisions, agent) {
  const list = revisions || [];
  if (agent?.draftRevisionId) {
    const named = list.find((r) => r.id === agent.draftRevisionId);
    if (named) return named;
  }
  return sortRevisions(list).find((r) => r.state === 'Draft') || null;
}

/** The latest published revision, or null. Prefers the agent's latestPublishedRevisionId when given. */
export function latestPublished(revisions, agent) {
  const list = revisions || [];
  if (agent?.latestPublishedRevisionId) {
    const named = list.find((r) => r.id === agent.latestPublishedRevisionId);
    if (named) return named;
  }
  return publishedRevisions(list)[0] || null;
}

/**
 * The pair a diff opens with: the latest published revision against the draft; without a draft, the previous
 * published revision against the latest one. Returns { from, to } as revision IDs ('' when there is nothing to compare).
 */
export function defaultDiffPair(revisions, agent) {
  const draft = draftRevision(revisions, agent);
  const latest = latestPublished(revisions, agent);
  if (draft && latest) return { from: latest.id, to: draft.id };
  const published = publishedRevisions(revisions);
  if (published.length >= 2) return { from: published[1].id, to: published[0].id };
  const all = sortRevisions(revisions);
  if (all.length >= 2) return { from: all[1].id, to: all[0].id };
  return { from: '', to: '' };
}

/** Revision number by ID, from a list of revisions. */
export function revisionNumbers(revisions) {
  return Object.fromEntries((revisions || []).map((r) => [r.id, r.number]));
}

/**
 * What a deployment's revision pin shows: { pinned: false } when it follows the latest published revision, else
 * { pinned: true, number } (number null when the revision is not known to the caller).
 */
export function revisionPin(deployment, numbers = {}) {
  const id = deployment?.agentRevisionId;
  if (!id) return { pinned: false, number: null };
  return { pinned: true, number: numbers[id] ?? null, id };
}

/** True for a promotion record that can still be rolled back: a promotion that applied and was not rolled back. */
export function canRollback(record) {
  return !!record && record.kind === 'Promote' && record.outcome !== 'RolledBack' && !record.rolledBackById;
}

/**
 * Body for POST /promotions from the dialog state. The target is sent only when chosen; allowSkip only when the
 * target skips an environment; empty strings become absent fields.
 */
export function promotionBody(form, environments) {
  const body = { agentId: form.agentId, sourceEnvironment: form.sourceEnvironment };
  const target = form.targetEnvironment || nextEnvironment(environments, form.sourceEnvironment);
  if (target) body.targetEnvironment = target;
  if (form.agentRevisionId) body.agentRevisionId = form.agentRevisionId;
  if (target && skipsEnvironments(environments, form.sourceEnvironment, target) && form.allowSkip) body.allowSkip = true;
  const note = (form.note || '').trim();
  if (note) body.note = note;
  return body;
}

/** Client-side checks for the promote dialog. Returns { field: message } (empty when valid). */
export function promotionErrors(form, environments, t) {
  const e = {};
  if (!form.agentId) e.agentId = t('common.errors.required');
  if (!form.sourceEnvironment) e.sourceEnvironment = t('common.errors.required');
  const target = form.targetEnvironment || nextEnvironment(environments, form.sourceEnvironment);
  if (form.sourceEnvironment && !target) e.targetEnvironment = t('components.promote.errors.noNext');
  else if (target && target === form.sourceEnvironment) e.targetEnvironment = t('components.promote.errors.sameEnvironment');
  else if (target && skipsEnvironments(environments, form.sourceEnvironment, target) && !form.allowSkip) e.allowSkip = t('components.promote.errors.needsSkip');
  return e;
}

/** Text for a diff value: '' for null, as is otherwise. */
export function diffValue(value) {
  if (value === null || value === undefined) return '';
  return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
}

/** True when a diff value is long or spans lines, so it reads better as a line diff than inline. */
export function isBlockValue(value) {
  const text = diffValue(value);
  return text.includes('\n') || text.length > 80;
}
