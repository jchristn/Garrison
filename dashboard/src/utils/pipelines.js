// Helpers for pipelines (P12.9): the definition form (stages in order, with stage parameters), client-side checks
// that mirror the server's, the pipeline run timeline, and the review decision rules. Plain functions so Node-based
// tests can import them.

import { PIPELINE_LIMITS, TERMINAL_PIPELINE_RUN_STATUSES, RETRYABLE_PIPELINE_RUN_STATUSES } from './constants';

const NAME = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

/** A new stage with the server defaults. `index` is zero-based; the name defaults to "stage-N". */
export function blankStage(index = 0) {
  return {
    name: `stage-${index + 1}`,
    description: '',
    agentId: '',
    deploymentId: '',
    handoffTemplateId: '',
    handoffTemplateVersion: null,
    outputCharLimit: PIPELINE_LIMITS.outputCharLimit.default,
    maxAttempts: PIPELINE_LIMITS.maxAttempts.default,
    continueOnFailure: false,
    requiresReview: false,
    reviewTimeoutSeconds: PIPELINE_LIMITS.reviewTimeoutSeconds.default,
    reviewTimeoutAction: 'Reject',
    maxRevisions: PIPELINE_LIMITS.maxRevisions.default,
    parameters: []
  };
}

/** A new pipeline with one empty stage. */
export function blankPipeline() {
  return { name: '', description: '', maxDurationSeconds: PIPELINE_LIMITS.maxDurationSeconds.default, active: true, stages: [blankStage(0)] };
}

/** Form values for a pipeline record: stages sorted by position, optional text as '', parameters as { name, value }. */
export function pipelineToForm(record) {
  const r = record || {};
  const stages = [...(Array.isArray(r.stages) ? r.stages : [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  return {
    ...r,
    description: r.description || '',
    maxDurationSeconds: r.maxDurationSeconds ?? 0,
    active: r.active !== false,
    stages: stages.map((s, i) => ({
      ...blankStage(i),
      ...s,
      description: s.description || '',
      deploymentId: s.deploymentId || '',
      handoffTemplateId: s.handoffTemplateId || '',
      handoffTemplateVersion: s.handoffTemplateVersion ?? null,
      parameters: (s.parameters || []).map((p) => ({ name: p.name, value: p.value ?? '' }))
    }))
  };
}

/**
 * Form values for Duplicate: the pipeline's settings and stages without record IDs, named "<name>-copy". Stage
 * references (agent, deployment, handoff template) are kept, unlike the generic duplicate, which drops child IDs.
 */
export function pipelineDuplicate(record) {
  const form = pipelineToForm(record);
  const { id: _id, tenantId: _tenant, version: _version, createdUtc: _created, lastUpdateUtc: _updated, isProtected: _protected, ...rest } = form;
  return {
    ...rest,
    name: form.name ? `${form.name}-copy` : '',
    stages: form.stages.map(({ id: _sid, pipelineId: _pid, tenantId: _stenant, ...stage }) => ({ ...stage, parameters: stage.parameters.map((p) => ({ name: p.name, value: p.value })) }))
  };
}

const optional = (v) => {
  const text = typeof v === 'string' ? v.trim() : v;
  return text === '' || text === undefined ? null : text;
};
const int = (v, fallback) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? fallback : Math.trunc(Number(v)));

/**
 * API body for a pipeline: stages in list order with positions 1 to N, empty optional references as null, and stage
 * parameters without blank rows. Stage and parameter IDs are not sent; the server replaces the stage list.
 */
export function pipelineToBody(form) {
  const f = form || {};
  return {
    name: String(f.name || '').trim(),
    description: optional(f.description),
    maxDurationSeconds: int(f.maxDurationSeconds, 0),
    active: f.active !== false,
    stages: (f.stages || []).map((s, i) => ({
      position: i + 1,
      name: String(s.name || '').trim(),
      description: optional(s.description),
      agentId: s.agentId || '',
      deploymentId: optional(s.deploymentId),
      handoffTemplateId: optional(s.handoffTemplateId),
      handoffTemplateVersion: optional(s.handoffTemplateId) ? (s.handoffTemplateVersion === null || s.handoffTemplateVersion === '' || s.handoffTemplateVersion === undefined ? null : int(s.handoffTemplateVersion, null)) : null,
      outputCharLimit: int(s.outputCharLimit, PIPELINE_LIMITS.outputCharLimit.default),
      maxAttempts: int(s.maxAttempts, PIPELINE_LIMITS.maxAttempts.default),
      continueOnFailure: !!s.continueOnFailure,
      requiresReview: !!s.requiresReview,
      reviewTimeoutSeconds: s.requiresReview ? int(s.reviewTimeoutSeconds, 0) : 0,
      reviewTimeoutAction: s.reviewTimeoutAction === 'Approve' ? 'Approve' : 'Reject',
      maxRevisions: int(s.maxRevisions, PIPELINE_LIMITS.maxRevisions.default),
      parameters: (s.parameters || []).filter((p) => String(p?.name || '').trim()).map((p) => ({ name: String(p.name).trim(), value: p.value ?? '' }))
    }))
  };
}

/** Move one item of a list by `delta` places; out-of-range moves return the list unchanged. */
export function moveItem(list, index, delta) {
  const items = Array.isArray(list) ? [...list] : [];
  const target = index + delta;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  [items[index], items[target]] = [items[target], items[index]];
  return items;
}

function outside(value, range) {
  if (value === null || value === undefined || value === '') return false;
  const n = Number(value);
  return !Number.isInteger(n) || n < range.min || n > range.max;
}

/**
 * Client-side checks that mirror the server's (ConfigurationValidator.PipelineAsync). Returns { field: message }, with
 * stage fields keyed stages[i].field like the server's 400 response, plus a summary under `stages`. Empty when valid.
 * `maxStages` is the configured Runtime.PipelineMaxStages when known.
 */
export function pipelineErrors(form, t, maxStages = PIPELINE_LIMITS.maxStages) {
  const errors = {};
  const f = form || {};
  if (!NAME.test(String(f.name || '')) || String(f.name || '').length > 64) errors.name = t('resources.pipelines.errors.dnsName');
  if (outside(f.maxDurationSeconds, PIPELINE_LIMITS.maxDurationSeconds)) errors.maxDurationSeconds = t('resources.pipelines.errors.range', PIPELINE_LIMITS.maxDurationSeconds);
  const stages = Array.isArray(f.stages) ? f.stages : [];
  if (stages.length === 0) errors.stages = t('resources.pipelines.errors.noStages');
  else if (stages.length > maxStages) errors.stages = t('resources.pipelines.errors.tooManyStages', { max: maxStages });
  const names = new Set();
  const problems = [];
  stages.forEach((s, i) => {
    const key = (field) => `stages[${i}].${field}`;
    const name = String(s?.name || '').trim();
    if (!name) errors[key('name')] = t('common.errors.required');
    else if (name.length > 128) errors[key('name')] = t('resources.pipelines.errors.stageNameLong');
    else if (names.has(name.toLowerCase())) errors[key('name')] = t('resources.pipelines.errors.stageNameDuplicate', { name });
    names.add(name.toLowerCase());
    if (!s?.agentId) errors[key('agentId')] = t('common.errors.required');
    for (const field of ['outputCharLimit', 'maxAttempts', 'maxRevisions']) {
      if (outside(s?.[field], PIPELINE_LIMITS[field])) errors[key(field)] = t('resources.pipelines.errors.range', PIPELINE_LIMITS[field]);
    }
    if (s?.requiresReview && outside(s?.reviewTimeoutSeconds, PIPELINE_LIMITS.reviewTimeoutSeconds)) errors[key('reviewTimeoutSeconds')] = t('resources.pipelines.errors.range', PIPELINE_LIMITS.reviewTimeoutSeconds);
    if (s?.handoffTemplateVersion !== null && s?.handoffTemplateVersion !== undefined && s?.handoffTemplateVersion !== '' && (!Number.isInteger(Number(s.handoffTemplateVersion)) || Number(s.handoffTemplateVersion) < 1)) {
      errors[key('handoffTemplateVersion')] = t('resources.pipelines.errors.version');
    }
    const params = (s?.parameters || []).filter((p) => String(p?.name || '').trim());
    if (params.length && !s?.deploymentId) errors[key('parameters')] = t('resources.pipelines.errors.parametersNeedDeployment');
    else if (new Set(params.map((p) => String(p.name).trim())).size !== params.length) errors[key('parameters')] = t('resources.pipelines.errors.parametersUnique');
    const stageErrors = Object.keys(errors).filter((k) => k.startsWith(`stages[${i}].`));
    if (stageErrors.length) problems.push(t('common.errors.listItem', { index: i + 1, message: t('resources.pipelines.errors.stageInvalid') }));
  });
  if (problems.length && !errors.stages) errors.stages = problems.join(' ');
  return errors;
}

/** Errors of one stage from a form error map ({ field: message } without the stages[i]. prefix). */
export function stageErrors(errors, index) {
  const out = {};
  const prefix = `stages[${index}].`;
  for (const [key, message] of Object.entries(errors || {})) {
    if (key.startsWith(prefix)) out[key.slice(prefix.length).split('.')[0]] = message;
  }
  return out;
}

/** Deployments of one agent, for the stage deployment picker. */
export function deploymentsForAgent(deployments, agentId) {
  return (deployments || []).filter((d) => d && agentId && d.agentId === agentId);
}

/** Templates a stage handoff may use: Task templates (built-ins first), plus the current one if it differs. */
export function handoffTemplates(templates, currentId) {
  const list = templates || [];
  const fit = list.filter((x) => x.kind === 'Task');
  fit.sort((a, b) => Number(!!b.isBuiltIn) - Number(!!a.isBuiltIn) || String(a.name).localeCompare(String(b.name)));
  if (currentId && !fit.some((x) => x.id === currentId)) {
    const current = list.find((x) => x.id === currentId);
    fit.push(current || { id: currentId, name: currentId });
  }
  return fit;
}

/** True when a pipeline run has finished (Succeeded, Failed, Cancelled, TimedOut). */
export function isTerminalPipelineRun(run) {
  return TERMINAL_PIPELINE_RUN_STATUSES.includes(run?.status);
}

/** True when POST pipeline-runs/{id}/retry would accept the run. */
export function canRetryPipelineRun(run) {
  return RETRYABLE_PIPELINE_RUN_STATUSES.includes(run?.status);
}

/** True while a pipeline run may still be cancelled. */
export function canCancelPipelineRun(run) {
  return run?.status === 'Running' || run?.status === 'AwaitingReview';
}

/**
 * The timeline of a pipeline run: one entry per stage in position order, each with its stage run summaries (oldest
 * execution first) and its reviews (oldest first). Stage run summaries and reviews come from the run detail.
 */
export function pipelineTimeline(run) {
  const stages = [...(run?.stages || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  const runs = run?.runs || [];
  const reviews = run?.reviews || [];
  return stages.map((stage) => ({
    stage,
    runs: runs.filter((r) => r.position === stage.position).sort((a, b) => (a.execution ?? 0) - (b.execution ?? 0)),
    reviews: reviews.filter((r) => r.runStageId === stage.id || (!r.runStageId && r.position === stage.position)).sort((a, b) => (a.execution ?? 0) - (b.execution ?? 0)),
    current: stage.position === run?.currentPosition && !isTerminalPipelineRun(run)
  }));
}

/** The pending review of a pipeline run, or null. */
export function pendingReview(run) {
  return (run?.reviews || []).find((r) => r.status === 'Pending') || null;
}

/** Revisions left for a stage before RequestChanges answers 409 RevisionLimitReached. Never negative. */
export function revisionsLeft(stage) {
  if (!stage) return null;
  return Math.max(0, (stage.maxRevisions ?? 0) - (stage.revisions ?? 0));
}

/** Body for POST pipeline-reviews/{id}/decide; the comment is trimmed and left out when empty. */
export function reviewDecisionBody(decision, comment) {
  const body = { decision };
  const text = String(comment || '').trim();
  if (text) body.comment = text;
  return body;
}

/**
 * Client-side check for a review decision: RequestChanges needs a comment, and comments are at most 8,000
 * characters. Returns a translated message, or '' when valid.
 */
export function reviewDecisionError(decision, comment, t) {
  const text = String(comment || '').trim();
  if (decision === 'RequestChanges' && !text) return t('components.pipelineReviews.commentRequired');
  if (text.length > PIPELINE_LIMITS.commentMax) return t('components.pipelineReviews.commentTooLong', { max: PIPELINE_LIMITS.commentMax });
  return '';
}

/** Translation key for a 409 from the decide route, by error code, or null for other errors. */
export function reviewConflictKey(err) {
  if (err?.status !== 409) return null;
  if (err.code === 'RevisionLimitReached') return 'components.pipelineReviews.toasts.revisionLimit';
  return 'components.pipelineReviews.toasts.notPending';
}

/** A new random Idempotency-Key for one Start click, so a double submit starts one pipeline run. */
export function newIdempotencyKey() {
  try {
    if (globalThis.crypto?.randomUUID) return `dash-${globalThis.crypto.randomUUID()}`;
  } catch {
    /* fall through */
  }
  return `dash-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
