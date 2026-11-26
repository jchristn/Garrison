// Evaluations, shadow trials, and canary releases (AA9.9, AA9.15): helpers shared by the Evaluations pages under
// Autonomy, the eval set and case forms, the run form, the eval run page with its live channel, and the studio
// playground's "Save as eval case". Case inputs, expected text, outputs, judge notes, and reasons are data people and
// agents wrote; nothing here turns them into markup.

import { EVAL_LIMITS, ENUMS } from './constants';
import { formatPercent } from '../i18n/formatters';

/** The WebSocket channel of one eval run (AA9.13). */
export function evalRunChannel(evalRunId) {
  return `eval-run:${evalRunId}`;
}

/** True for an eval run status that will not change again. */
export function isEvalRunFinished(status) {
  return status === 'Completed' || status === 'Failed' || status === 'Cancelled';
}

/** Semantic tone for an eval set state pill. */
export function evalSetStateTone(state) {
  return state === 'Approved' ? 'success' : 'neutral';
}

/** Semantic tone for an eval run status pill. */
export function evalRunStatusTone(status) {
  if (status === 'Completed') return 'success';
  if (status === 'Failed') return 'danger';
  if (status === 'Running' || status === 'Pending') return 'info';
  return 'neutral';
}

/** Semantic tone for a shadow trial status pill. */
export function shadowTrialStatusTone(status) {
  if (status === 'Running') return 'info';
  if (status === 'Completed') return 'success';
  if (status === 'Failed') return 'danger';
  return 'neutral';
}

/** Semantic tone for a canary release status pill. */
export function canaryStatusTone(status) {
  if (status === 'Running') return 'info';
  if (status === 'Promoted') return 'success';
  if (status === 'RolledBack') return 'danger';
  return 'warning';
}

/** A 0 to 1 score as a percent, or '-' when there is none. */
export function scoreText(score, lng) {
  return score === null || score === undefined ? '-' : formatPercent(score, lng, { digits: 1 });
}

/** Whether an eval run passed: 'passed', 'failed', or 'none' (running, or no threshold). */
export function verdictOf(run) {
  if (run?.passed === true) return 'passed';
  if (run?.passed === false) return 'failed';
  return 'none';
}

/** A case result's outcome: 'errored' when the case run failed, otherwise 'passed' or 'failed'. */
export function resultOutcome(result) {
  if (result?.errorMessage) return 'errored';
  return result?.passed ? 'passed' : 'failed';
}

// ---------------------------------------------------------------- eval sets

/** An empty eval set form: origin Human, no judge, no tags. */
export function blankEvalSet() {
  return { name: '', description: '', origin: 'Human', judgeAgent: '', tags: [] };
}

/** The form for a stored eval set version. */
export function evalSetToForm(set) {
  if (!set) return blankEvalSet();
  return {
    id: set.id,
    name: set.name || '',
    description: set.description || '',
    origin: set.origin || 'Human',
    judgeAgent: set.judgeAgent || '',
    tags: [...(set.tags || [])],
    state: set.state,
    version: set.version
  };
}

/** The create or update body of an eval set form. Updates leave the name and origin alone. */
export function evalSetFormToBody(form, mode = 'create') {
  const tags = [...new Set((form?.tags || []).map((x) => String(x).trim()).filter(Boolean))];
  const body = { description: (form?.description || '').trim() || null, judgeAgent: (form?.judgeAgent || '').trim(), tags };
  if (mode === 'create') {
    body.name = (form?.name || '').trim();
    body.origin = form?.origin === 'Playground' ? 'Playground' : 'Human';
  }
  return body;
}

/** Client checks of an eval set form that mirror the server (EvalSetService). Keys are field names. */
export function evalSetFormErrors(form, t, mode = 'create') {
  const e = {};
  const L = EVAL_LIMITS;
  const name = (form?.name || '').trim();
  if (mode === 'create' && (name.length < 1 || name.length > L.nameMax)) e.name = t('evals.form.errors.name', { max: L.nameMax });
  if ((form?.description || '').length > L.descriptionMax) e.description = t('evals.form.errors.description', { max: L.descriptionMax });
  if ((form?.judgeAgent || '').trim().length > L.judgeAgentMax) e.judgeAgent = t('evals.form.errors.judgeAgent', { max: L.judgeAgentMax });
  if ((form?.tags || []).some((x) => String(x).trim().length > L.tagMax)) e.tags = t('evals.form.errors.tags', { max: L.tagMax });
  return e;
}

// ---------------------------------------------------------------- cases and checks

/** A blank check for a scorer, weight 1. */
export function blankCheck(scorer = 'ExactMatch') {
  return { scorer, argument: '', weight: 1 };
}

/** An empty case form. */
export function blankCase() {
  return { name: '', inputText: '', expectedText: '', hidden: false, checks: [], files: [], sourceRunId: null };
}

/** The form for a stored case; the files ride along unchanged. */
export function caseToForm(item) {
  if (!item) return blankCase();
  return {
    id: item.id,
    name: item.name || '',
    inputText: item.inputText || '',
    expectedText: item.expectedText ?? '',
    hidden: !!item.hidden,
    checks: (item.checks || []).map((c) => ({ scorer: c.scorer || 'ExactMatch', argument: c.argument ?? '', weight: c.weight ?? 1 })),
    files: (item.files || []).map((f) => ({ ...f })),
    sourceRunId: item.sourceRunId || null
  };
}

/** The create or replace body of a case form. Empty expected text and arguments are sent as null. */
export function caseFormToBody(form) {
  const text = (v) => (v === null || v === undefined || v === '' ? null : String(v));
  return {
    name: (form?.name || '').trim() || null,
    inputText: form?.inputText || '',
    hidden: !!form?.hidden,
    expectedText: text(form?.expectedText),
    checks: (form?.checks || []).map((c) => ({ scorer: c.scorer, argument: text(c.argument), weight: c.weight === null || c.weight === undefined || c.weight === '' ? 1 : Number(c.weight) })),
    files: (form?.files || []).map((f) => ({ path: f.path, mediaType: f.mediaType ?? null, contentText: f.contentText ?? null, assetId: f.assetId ?? null, assetPath: f.assetPath ?? null })),
    sourceRunId: form?.sourceRunId || null
  };
}

/** Whether a JSON Schema argument parses as a JSON object. The server checks the schema itself. */
function isJsonObject(text) {
  try {
    const value = JSON.parse(text);
    return !!value && typeof value === 'object' && !Array.isArray(value);
  } catch {
    return false;
  }
}

/**
 * Client checks of a case form that mirror the server: input text is required, a name holds at most 256 characters,
 * weights are 0 to 100, a JSON Schema check needs a schema object, and Contains and Exact match checks need an argument
 * or the case's expected text. Keys are inputText, name, and checks[i].argument or checks[i].weight.
 */
export function caseFormErrors(form, t) {
  const e = {};
  const L = EVAL_LIMITS;
  if (!(form?.inputText || '').trim()) e.inputText = t('evals.case.errors.input');
  if ((form?.name || '').length > L.caseNameMax) e.name = t('evals.case.errors.name', { max: L.caseNameMax });
  const expected = form?.expectedText;
  (form?.checks || []).forEach((c, i) => {
    const w = c.weight === '' || c.weight === null || c.weight === undefined ? 1 : Number(c.weight);
    if (!Number.isFinite(w) || w < 0 || w > L.weightMax) e[`checks[${i}].weight`] = t('evals.case.errors.weight', { max: L.weightMax });
    const arg = c.argument ?? '';
    if (c.scorer === 'JsonSchemaValid' && (!arg.trim() || !isJsonObject(arg))) e[`checks[${i}].argument`] = t('evals.case.errors.schema');
    if ((c.scorer === 'Contains' || c.scorer === 'ExactMatch') && arg === '' && !expected) e[`checks[${i}].argument`] = t('evals.case.errors.argument');
  });
  return e;
}

/**
 * The checks a case is scored by when it lists none, as the server does (EvalCaseScoring.EffectiveChecks): exact match
 * against the expected text when there is one, otherwise the judge.
 */
export function effectiveScorers(item) {
  if ((item?.checks || []).length) return item.checks.map((c) => c.scorer);
  return [item?.expectedText ? 'ExactMatch' : 'Judge'];
}

/** True when a set's cases need a judge agent: a Judge check, or a case without checks and expected text. */
export function needsJudge(cases) {
  return (cases || []).some((c) => effectiveScorers(c).includes('Judge'));
}

// ---------------------------------------------------------------- eval runs

/** An empty run form for a set: a deployment target, the cases, no threshold or budget. */
export function blankEvalRun(set, extra = {}) {
  return {
    setId: set?.id || '',
    targetType: 'Deployment',
    deploymentId: '',
    agentId: '',
    agentRevisionId: '',
    inputMode: 'Cases',
    recentInputCount: EVAL_LIMITS.recentInputsDefault,
    thresholdPercent: null,
    budgetUsd: null,
    ...extra
  };
}

/** The body of a run form. The threshold is entered as a percent and sent as 0 to 1. */
export function evalRunFormToBody(form) {
  const body = { setId: form.setId, targetType: form.targetType, inputMode: form.targetType === 'Deployment' ? form.inputMode || 'Cases' : 'Cases' };
  if (form.targetType === 'Deployment') body.deploymentId = form.deploymentId;
  else {
    body.agentId = form.agentId;
    if (form.agentRevisionId) body.agentRevisionId = form.agentRevisionId;
  }
  if (body.inputMode === 'RecentInputs') body.recentInputCount = Number(form.recentInputCount) || EVAL_LIMITS.recentInputsDefault;
  body.threshold = form.thresholdPercent === null || form.thresholdPercent === undefined || form.thresholdPercent === '' ? null : Number(form.thresholdPercent) / 100;
  body.budgetUsd = form.budgetUsd === null || form.budgetUsd === undefined || form.budgetUsd === '' ? null : Number(form.budgetUsd);
  return body;
}

/** Client checks of a run form: a target, a 0 to 100 threshold, a 0 to 100000 budget, and 1 to 1000 recent inputs. */
export function evalRunFormErrors(form, t) {
  const e = {};
  const L = EVAL_LIMITS;
  if (!form.setId) e.setId = t('evals.run.errors.set');
  if (form.targetType === 'Deployment' && !form.deploymentId) e.deploymentId = t('evals.run.errors.deployment');
  if (form.targetType === 'AgentRevision' && !form.agentId) e.agentId = t('evals.run.errors.agent');
  const p = form.thresholdPercent;
  if (p !== null && p !== undefined && p !== '' && !(Number(p) >= 0 && Number(p) <= 100)) e.thresholdPercent = t('evals.run.errors.threshold');
  const b = form.budgetUsd;
  if (b !== null && b !== undefined && b !== '' && !(Number(b) >= 0 && Number(b) <= L.budgetMax)) e.budgetUsd = t('evals.run.errors.budget', { max: L.budgetMax });
  if (form.targetType === 'Deployment' && form.inputMode === 'RecentInputs') {
    const n = Number(form.recentInputCount);
    if (!Number.isInteger(n) || n < 1 || n > L.recentInputsMax) e.recentInputCount = t('evals.run.errors.recentInputs', { max: L.recentInputsMax });
  }
  return e;
}

/** Merge one result into a list kept in case order, replacing the result of the same order. */
export function upsertResult(results, result) {
  if (!result) return results || [];
  const rest = (results || []).filter((r) => r.order !== result.order && (!result.id || r.id !== result.id));
  return [...rest, result].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}

/**
 * Apply one eval-run channel message to the page state { run, results }: eval.case.completed adds the result and
 * moves the counts, eval.completed records the outcome. Messages for another eval run leave the state alone.
 */
export function applyEvalEvent(state, message) {
  if (!message || !state?.run || message.evalRunId !== state.run.id) return state;
  if (message.type === 'eval.case.completed') {
    const results = upsertResult(state.results, message.result);
    const status = state.run.status === 'Pending' ? 'Running' : state.run.status;
    return { run: { ...state.run, status, completedCases: message.completedCases ?? state.run.completedCases, totalCases: message.totalCases ?? state.run.totalCases }, results };
  }
  if (message.type === 'eval.completed') {
    const fields = ['status', 'score', 'threshold', 'passed', 'completedCases', 'passedCases', 'erroredCases', 'totalCases', 'costUsd', 'failureReason'];
    const run = { ...state.run };
    for (const f of fields) if (message[f] !== undefined) run[f] = message[f];
    return { ...state, run };
  }
  return state;
}

/** Progress of an eval run, 0 to 100. */
export function progressPercent(run) {
  const total = run?.totalCases || 0;
  if (!total) return 0;
  return Math.min(100, Math.round(((run.completedCases || 0) / total) * 100));
}

// ---------------------------------------------------------------- shadow trials

/** An empty shadow trial form: 10 percent sampled, no end, no comparison set. */
export function blankShadowTrial() {
  return { name: '', sourceDeploymentId: '', candidateDeploymentId: '', samplePercent: EVAL_LIMITS.samplePercentDefault, endsUtc: null, comparisonEvalSetId: '', useJudge: false };
}

/** The create body of a shadow trial form. */
export function shadowTrialFormToBody(form) {
  return {
    name: (form.name || '').trim() || null,
    sourceDeploymentId: form.sourceDeploymentId,
    candidateDeploymentId: form.candidateDeploymentId,
    samplePercent: Number(form.samplePercent) || EVAL_LIMITS.samplePercentDefault,
    endsUtc: form.endsUtc || null,
    comparisonEvalSetId: form.comparisonEvalSetId || null,
    useJudge: !!form.useJudge
  };
}

/** Client checks of a shadow trial form that mirror the server (ShadowTrialService). */
export function shadowTrialFormErrors(form, t) {
  const e = {};
  if ((form.name || '').trim().length > EVAL_LIMITS.nameMax) e.name = t('evals.shadow.errors.name', { max: EVAL_LIMITS.nameMax });
  if (!form.sourceDeploymentId) e.sourceDeploymentId = t('evals.shadow.errors.source');
  if (!form.candidateDeploymentId) e.candidateDeploymentId = t('evals.shadow.errors.candidate');
  else if (form.candidateDeploymentId === form.sourceDeploymentId) e.candidateDeploymentId = t('evals.shadow.errors.same');
  const p = Number(form.samplePercent);
  if (!Number.isInteger(p) || p < 1 || p > 100) e.samplePercent = t('evals.shadow.errors.sample');
  if (form.endsUtc && Date.parse(form.endsUtc) <= Date.now()) e.endsUtc = t('evals.shadow.errors.ends');
  return e;
}

/** The share of compared outputs that agreed, 0 to 1, or null before anything was compared. */
export function agreementRate(trial) {
  const n = Number(trial?.comparedCount || 0);
  return n > 0 ? Number(trial.agreedCount || 0) / n : null;
}

// ---------------------------------------------------------------- canary releases

/** A canary step with the server defaults. */
export function blankStep(weightPercent = 10) {
  return { weightPercent, minimumRuns: EVAL_LIMITS.minimumRunsDefault, minimumMinutes: EVAL_LIMITS.minimumMinutesDefault };
}

/** An empty canary form: steps of 10, 50, and 100 percent, a 5 percent error ceiling, no eval gate. */
export function blankCanary() {
  return { agentId: '', candidateDeploymentId: '', baselineDeploymentId: '', steps: [blankStep(10), blankStep(50), blankStep(100)], maxErrorRatePercent: EVAL_LIMITS.maxErrorRateDefault, evalSetId: '', minEvalScorePercent: null };
}

/** The create body of a canary form. The minimum eval score is entered as a percent and sent as 0 to 1. */
export function canaryFormToBody(form) {
  const gated = !!form.evalSetId;
  return {
    agentId: form.agentId,
    candidateDeploymentId: form.candidateDeploymentId,
    baselineDeploymentId: form.baselineDeploymentId,
    steps: (form.steps || []).map((s) => ({ weightPercent: Number(s.weightPercent), minimumRuns: Number(s.minimumRuns ?? EVAL_LIMITS.minimumRunsDefault), minimumMinutes: Number(s.minimumMinutes ?? EVAL_LIMITS.minimumMinutesDefault) })),
    maxErrorRatePercent: form.maxErrorRatePercent === null || form.maxErrorRatePercent === '' ? EVAL_LIMITS.maxErrorRateDefault : Number(form.maxErrorRatePercent),
    evalSetId: gated ? form.evalSetId : null,
    minEvalScore: gated && form.minEvalScorePercent !== null && form.minEvalScorePercent !== '' ? Number(form.minEvalScorePercent) / 100 : null
  };
}

/**
 * Client checks of a canary form that mirror the server (CanaryService): an agent, two different deployments, 1 to 20
 * steps whose weights rise strictly and end at 100, and an eval gate that names both the set and the score, or neither.
 */
export function canaryFormErrors(form, t) {
  const e = {};
  const L = EVAL_LIMITS;
  if (!form.agentId) e.agentId = t('evals.canary.errors.agent');
  if (!form.candidateDeploymentId) e.candidateDeploymentId = t('evals.canary.errors.candidate');
  if (!form.baselineDeploymentId) e.baselineDeploymentId = t('evals.canary.errors.baseline');
  if (form.candidateDeploymentId && form.candidateDeploymentId === form.baselineDeploymentId) e.candidateDeploymentId = t('evals.canary.errors.same');
  const steps = form.steps || [];
  if (!steps.length) e.steps = t('evals.canary.errors.steps');
  else if (steps.length > L.stepsMax) e.steps = t('evals.canary.errors.tooMany', { max: L.stepsMax });
  else {
    let previous = 0;
    for (const s of steps) {
      const w = Number(s.weightPercent);
      if (!Number.isInteger(w) || w < 1 || w > 100 || w <= previous) {
        e.steps = t('evals.canary.errors.increasing');
        break;
      }
      previous = w;
    }
    if (!e.steps && previous !== 100) e.steps = t('evals.canary.errors.lastStep');
  }
  const rate = form.maxErrorRatePercent;
  if (rate !== null && rate !== '' && !(Number(rate) >= 0 && Number(rate) <= 100)) e.maxErrorRatePercent = t('evals.canary.errors.errorRate');
  const score = form.minEvalScorePercent;
  const hasScore = score !== null && score !== undefined && score !== '';
  if (form.evalSetId && !hasScore) e.minEvalScorePercent = t('evals.canary.errors.gate');
  if (!form.evalSetId && hasScore) e.evalSetId = t('evals.canary.errors.gate');
  if (hasScore && !(Number(score) >= 0 && Number(score) <= 100)) e.minEvalScorePercent = t('evals.canary.errors.score');
  return e;
}

/** The step a canary release is on, 1-based, with its weight, or null when it has no steps. */
export function currentStep(release) {
  const steps = release?.steps || [];
  if (!steps.length) return null;
  const index = Math.min(Math.max(release.currentStepIndex || 0, 0), steps.length - 1);
  return { number: index + 1, total: steps.length, weightPercent: steps[index].weightPercent };
}

/** A step's place: 'done' before the current one (or every step once promoted), 'current', or 'pending'. */
export function stepState(release, index) {
  if (release?.status === 'Promoted') return 'done';
  const current = release?.currentStepIndex || 0;
  if (index < current) return 'done';
  if (index === current) return release?.status === 'Running' ? 'current' : 'stopped';
  return 'pending';
}

/** Every enum the evaluation pages show, for tests. */
export const EVAL_ENUM_GROUPS = ['evalSetState', 'evalSetOrigin', 'evalScorer', 'evalRunStatus', 'evalRunTarget', 'evalRunInputMode', 'shadowTrialStatus', 'canaryStatus'].filter((g) => ENUMS[g]);
