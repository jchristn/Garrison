// ResourceView configurations for evaluation (AA9.15, Autonomy > Eval sets, Eval runs, Shadow trials, and Canary
// releases). Re-exported by resourceConfigs.jsx so the configuration-wide tests (tooltips, i18n keys, enum labels)
// cover them. Names, descriptions, reasons, and tags are data and render as text.

import CopyableId from '../components/CopyableId';
import EvalRunModal from '../components/EvalRunModal';
import EvalReasonModal from '../components/EvalReasonModal';
import { CanaryStatusBadge, EvalRunStatusBadge, EvalSetStateBadge, EvalVerdictBadge, ShadowTrialStatusBadge } from '../components/EvalBadges';
import { tip } from '../components/Tooltip';
import { EVAL_LIMITS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatCurrency, formatDateTime, formatNumber, formatRelativeTime, truncate } from '../i18n/formatters';
import { copyToClipboard } from '../utils/clipboard';
import { enumLabel, enumOptions } from '../utils/enums';
import { resourceTip, optionalText } from '../utils/tips';
import {
  agreementRate,
  blankCanary,
  blankEvalSet,
  blankShadowTrial,
  blankStep,
  canaryFormErrors,
  canaryFormToBody,
  currentStep,
  evalSetFormErrors,
  evalSetFormToBody,
  evalSetToForm,
  isEvalRunFinished,
  scoreText,
  shadowTrialFormErrors,
  shadowTrialFormToBody
} from '../utils/evaluations';
import { EVAL_FIELD_CODES } from '../utils/evalErrors';
import { loadCallerPermissions } from '../utils/apps';
import { deniedProps, deniedReasonFor, permissionDenied, permissionsLookup } from '../utils/permissions';

function col(t, id, key, render, extra = {}) {
  return { key, label: t(`resources.${id}.columns.${key}`), tip: resourceTip(t, id, key), render, ...extra };
}

function field(t, id, name, type, extra = {}) {
  const hint = optionalText(t, `resources.${id}.hints.${name}`, extra.hintValues);
  return { name, type, label: t(`resources.${id}.fields.${name}`), hint: hint || undefined, tip: resourceTip(t, id, name), ...extra };
}

function sub(t, id, name, type, extra = {}) {
  return { name, type, label: t(`resources.${id}.fields.${name}`), tip: t(`tips.resources.${id}.${name}`), ...extra };
}

const page = { pageNumber: 1, pageSize: 1000 };
const safeList = (promise) => promise.then((r) => r.items || []).catch(() => []);
const when = (value, lng) => (value ? <span {...tip(formatDateTime(value, lng))}>{formatRelativeTime(value, lng)}</span> : '-');
const nameOf = (lookups, kind, id) => (id ? lookups?.[kind]?.[id] || id : '-');
const fieldErrorSpecial = (t) => (_key, code) => (EVAL_FIELD_CODES.includes(code) ? t(`evals.fieldCodes.${code}`, { defaultValue: '' }) || null : null);

/** The tip, danger, and disabled state of a destructive row action that needs `operation` on the row (UT-03). */
function guarded(ctx, resourceType, r, usualTip, operation = 'Update') {
  const denied = permissionDenied(ctx.t, ctx.lookups?.permissions, resourceType, operation, { resourceId: r.id });
  return { tip: denied || usualTip, danger: !denied, disabled: !!denied };
}

/** Copy an ID and say whether the browser allowed it. */
async function copyId(ctx, id) {
  const ok = await copyToClipboard(id);
  ctx.addToast?.({ type: ok ? 'success' : 'error', message: ctx.t(ok ? 'evals.toasts.copied' : 'tips.copy.failed') });
}

/**
 * Names of deployments, agents, and the newest eval set versions, for list cells and filters, and the caller's
 * permissions (UT-03: actions the caller may not take stay disabled with the reason).
 */
async function loadNames({ apiClient, tenantId, principal }) {
  const [deployments, agents, sets, permissions] = await Promise.all([
    safeList(apiClient.listDeployments(tenantId, page)),
    safeList(apiClient.listAgents(tenantId, page)),
    safeList(apiClient.listEvalSets(tenantId, { ...page, latestOnly: true })),
    loadCallerPermissions(apiClient, tenantId, principal).catch(() => null)
  ]);
  return {
    deployments: Object.fromEntries(deployments.map((d) => [d.id, d.name])),
    agents: Object.fromEntries(agents.map((a) => [a.id, a.name])),
    sets: Object.fromEntries(sets.map((s) => [s.id, s.name])),
    permissions
  };
}

/** Deployments, agents, and the newest eval set versions, for form pick lists. */
async function loadPicks({ apiClient, tenantId }) {
  const [deployments, agents, sets] = await Promise.all([safeList(apiClient.listDeployments(tenantId, page)), safeList(apiClient.listAgents(tenantId, page)), safeList(apiClient.listEvalSets(tenantId, { ...page, latestOnly: true }))]);
  return { deployments, agents, sets };
}

const deploymentOptions = (options, agentId) => (options?.deployments || []).filter((d) => !agentId || d.agentId === agentId).map((d) => ({ value: d.id, label: d.environment ? `${d.name} (${d.environment})` : d.name }));
const setOptions = (t, options) => (options?.sets || []).map((s) => ({ value: s.id, label: t('evals.run.setOption', { name: s.name, version: s.version }) }));

// ---------------------------------------------------------------- eval sets

/**
 * Eval sets (AA9.15): versioned sets of cases that grade an agent. A person creates version 1 here and edits its cases
 * on the set's page; approving a draft freezes it so it can gate promotions and canaries, and editing an approved
 * version opens the next version as a draft. The list shows the newest version of each set unless asked for all.
 */
export const evalSetsConfig = {
  id: 'evalSets',
  explainer: 'evalSets',
  formSize: 'medium',
  autoRefresh: 30,
  search: true,
  defaultFilters: { latestOnly: 'true' },
  urlFilters: ['state', 'origin', 'latestOnly'],
  api: {
    list: (c, tenant, p) => c.listEvalSets(tenant, { ...p, latestOnly: p?.latestOnly === 'all' ? false : p?.latestOnly ?? true }),
    create: (c, tenant, b) => c.createEvalSet(tenant, b),
    update: (c, tenant, id, b) => c.updateEvalSet(tenant, id, b),
    remove: (c, tenant, id) => c.deleteEvalSet(tenant, id)
  },
  filters: [
    { name: 'state', label: (t) => t('resources.evalSets.columns.state'), tip: (t) => t('tips.evals.filters.state'), options: ['Draft', 'Approved'], optionLabel: (o, t) => enumLabel(t, 'evalSetState', o) },
    { name: 'origin', label: (t) => t('resources.evalSets.columns.origin'), tip: (t) => t('tips.evals.filters.origin'), options: ['Human', 'Evaluator', 'Playground'], optionLabel: (o, t) => enumLabel(t, 'evalSetOrigin', o) },
    { name: 'latestOnly', label: (t) => t('resources.evalSets.filters.latestOnly'), options: ['true', 'all'], optionLabel: (o, t) => t(`resources.evalSets.filters.${o === 'all' ? 'allVersions' : 'newestOnly'}`) }
  ],
  loadOptions: async ({ apiClient, tenantId }) => ({ agents: await safeList(apiClient.listAgents(tenantId, page)) }),
  loadLookups: permissionsLookup,
  deniedReason: deniedReasonFor('EvalSet'),
  canDuplicate: false,
  bulkDelete: false,
  canDelete: (r) => r?.state !== 'Approved',
  detailPath: (r) => pathFor('evaluations', r.id),
  blank: () => blankEvalSet(),
  toForm: (r) => evalSetToForm(r),
  toBody: (d, mode) => evalSetFormToBody(d, mode),
  validate: (d, t, ctx) => evalSetFormErrors(d, t, d?.id ? 'edit' : ctx?.mode || 'create'),
  fieldErrorSpecial,
  afterCreate: (created, ctx) => created?.id && ctx.navigate(pathFor('evaluations', created.id)),
  columns: ({ t, i18n }) => {
    const lng = i18n.language;
    return [
      col(t, 'evalSets', 'name', (r) => <strong>{r.name}</strong>, { sortable: true, pinned: true }),
      col(t, 'evalSets', 'version', (r) => t('evals.versionShort', { version: r.version }), { cellClass: 'nowrap', csv: (r) => String(r.version) }),
      col(t, 'evalSets', 'state', (r) => <EvalSetStateBadge state={r.state} t={t} />, { csv: (r) => r.state || '' }),
      col(t, 'evalSets', 'origin', (r) => enumLabel(t, 'evalSetOrigin', r.origin), { csv: (r) => r.origin || '' }),
      col(t, 'evalSets', 'caseCount', (r) => formatNumber(r.caseCount || 0, {}, lng), { cellClass: 'right', headerClass: 'right', csv: (r) => String(r.caseCount || 0) }),
      col(t, 'evalSets', 'judgeAgent', (r) => r.judgeAgent || <span className="text-muted">{t('evals.noJudge')}</span>, { csv: (r) => r.judgeAgent || '' }),
      col(t, 'evalSets', 'tags', (r) => ((r.tags || []).length ? <span className="eval-tags">{r.tags.join(', ')}</span> : '-'), { defaultHidden: true, csv: (r) => (r.tags || []).join(', ') }),
      col(t, 'evalSets', 'authoredByName', (r) => r.authoredByName || '-', { defaultHidden: true, csv: (r) => r.authoredByName || '' }),
      col(t, 'evalSets', 'approvedByName', (r) => (r.approvedByName ? <span {...tip(r.approvedUtc ? formatDateTime(r.approvedUtc, lng) : '')}>{r.approvedByName}</span> : '-'), { csv: (r) => r.approvedByName || '' }),
      col(t, 'evalSets', 'description', (r) => (r.description ? <span {...tip(r.description)}>{truncate(r.description, 80)}</span> : '-'), { defaultHidden: true, csv: (r) => r.description || '' }),
      col(t, 'evalSets', 'lastUpdateUtc', (r) => when(r.lastUpdateUtc, lng), { sortable: true, cellClass: 'nowrap', csv: (r) => r.lastUpdateUtc || '' }),
      col(t, 'evalSets', 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
    ];
  },
  fields: (d, ctx) => {
    const { t, options, mode } = ctx;
    const L = EVAL_LIMITS;
    const agents = (options?.agents || []).map((a) => ({ value: a.name, label: a.name }));
    if (d?.judgeAgent && !agents.some((a) => a.value === d.judgeAgent)) agents.push({ value: d.judgeAgent, label: d.judgeAgent });
    return [
      field(t, 'evalSets', 'name', 'text', { required: true, readOnly: mode !== 'create', placeholder: 'refund-answers', hintValues: { max: L.nameMax } }),
      field(t, 'evalSets', 'description', 'textarea', { rows: 2, hintValues: { max: L.descriptionMax } }),
      field(t, 'evalSets', 'origin', 'select', { required: true, readOnly: mode !== 'create', options: enumOptions(t, 'evalSetOrigin', ['Human', 'Playground']) }),
      field(t, 'evalSets', 'judgeAgent', 'select', { options: agents, noneLabel: t('evals.noJudge') }),
      field(t, 'evalSets', 'tags', 'stringList', { rows: 2, hintValues: { max: L.tagMax } })
    ];
  },
  formNotice: (d, { t }) =>
    d?.state === 'Approved' ? (
      <p className="info-banner" data-testid="eval-set-next-version">
        {t('evals.set.nextVersion', { version: (d.version || 0) + 1 })}
      </p>
    ) : null,
  rowActions: (r, ctx) => {
    const denied = permissionDenied(ctx.t, ctx.lookups?.permissions, 'EvalRun', 'Execute');
    return [
      { label: ctx.t('evals.actions.runSet'), tip: denied || ctx.t('tips.evals.actions.runSet'), disabled: !!denied, onClick: () => ctx.navigate(pathFor('evaluations', r.id, { run: '1' })) },
      { label: ctx.t('evals.actions.copyId'), tip: ctx.t('tips.evals.actions.copyId'), onClick: () => copyId(ctx, r.id) }
    ];
  }
};

// ---------------------------------------------------------------- eval runs

/** Open the run form from a list, then open the new run's page. */
function openRun(ctx) {
  const close = () => ctx.setExtraModal(null);
  ctx.setExtraModal(
    <EvalRunModal
      onClose={close}
      onStarted={(run) => {
        close();
        if (run?.id) ctx.navigate(pathFor('evalRuns', run.id));
      }}
    />
  );
}

/** Ask for a reason, then cancel an eval run from a list. */
function cancelRun(r, ctx) {
  const close = () => ctx.setExtraModal(null);
  ctx.setExtraModal(
    <EvalReasonModal
      title={ctx.t('evals.runDetail.cancelTitle')}
      message={ctx.t('evals.runDetail.cancelMessage', { name: r.setName || r.setId })}
      confirmLabel={ctx.t('evals.actions.cancelRun')}
      confirmTip={ctx.t('tips.evals.actions.cancelRun')}
      testId="eval-run-cancel"
      onClose={close}
      onConfirm={async (reason) => {
        await ctx.apiClient.cancelEvalRun(ctx.tenantId, r.id, { reason });
        ctx.addToast({ type: 'success', message: ctx.t('evals.toasts.runCancelled') });
        close();
        ctx.reload();
      }}
    />
  );
}

/** What an eval run grades: a deployment by name, or an agent and its revision. */
export function targetText(t, r, lookups) {
  if (r?.targetType === 'Deployment') return t('evals.target.deployment', { name: nameOf(lookups, 'deployments', r.deploymentId) });
  return t('evals.target.revision', { agent: nameOf(lookups, 'agents', r?.agentId), revision: r?.agentRevisionId || '-' });
}

/**
 * Eval runs (AA9.15): each run of a set version against a deployment or an agent revision, with its progress, score
 * against the threshold, and cost. A run opens on its own page, which follows it live.
 */
export const evalRunsConfig = {
  id: 'evalRuns',
  explainer: 'evalRuns',
  autoRefresh: 15,
  urlFilters: ['status', 'set'],
  api: {
    list: (c, tenant, p) => c.listEvalRuns(tenant, p)
  },
  filters: [{ name: 'status', label: (t) => t('resources.evalRuns.columns.status'), options: ['Pending', 'Running', 'Completed', 'Failed', 'Cancelled'], optionLabel: (o, t) => enumLabel(t, 'evalRunStatus', o) }],
  loadLookups: loadNames,
  detailPath: (r) => pathFor('evalRuns', r.id),
  columns: ({ t, i18n, lookups }) => {
    const lng = i18n.language;
    return [
      col(t, 'evalRuns', 'setName', (r) => <strong>{t('evals.setVersion', { name: r.setName || r.setId, version: r.setVersion })}</strong>, { pinned: true, csv: (r) => `${r.setName} v${r.setVersion}` }),
      col(t, 'evalRuns', 'status', (r) => <EvalRunStatusBadge status={r.status} t={t} />, { csv: (r) => r.status || '' }),
      col(t, 'evalRuns', 'verdict', (r) => <EvalVerdictBadge run={r} t={t} />, { csv: (r) => (r.passed === true ? 'passed' : r.passed === false ? 'failed' : '') }),
      col(t, 'evalRuns', 'score', (r) => scoreText(r.score, lng), { cellClass: 'right nowrap', headerClass: 'right', csv: (r) => (r.score ?? '') + '' }),
      col(t, 'evalRuns', 'threshold', (r) => scoreText(r.threshold, lng), { cellClass: 'right nowrap', headerClass: 'right', defaultHidden: true, csv: (r) => (r.threshold ?? '') + '' }),
      col(t, 'evalRuns', 'progress', (r) => t('evals.progress', { completed: r.completedCases || 0, total: r.totalCases || 0, passed: r.passedCases || 0 }), { cellClass: 'nowrap', csv: (r) => `${r.completedCases}/${r.totalCases}` }),
      col(t, 'evalRuns', 'target', (r) => targetText(t, r, lookups), { csv: (r) => targetText(t, r, lookups) }),
      col(t, 'evalRuns', 'inputMode', (r) => enumLabel(t, 'evalRunInputMode', r.inputMode), { defaultHidden: true, csv: (r) => r.inputMode || '' }),
      col(t, 'evalRuns', 'costUsd', (r) => formatCurrency(r.costUsd || 0, lng), { cellClass: 'right nowrap', headerClass: 'right', defaultHidden: true, csv: (r) => String(r.costUsd || 0) }),
      col(t, 'evalRuns', 'startedByName', (r) => r.startedByName || '-', { defaultHidden: true, csv: (r) => r.startedByName || '' }),
      col(t, 'evalRuns', 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' }),
      col(t, 'evalRuns', 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
    ];
  },
  fields: () => [],
  headerActions: (ctx) => {
    const denied = permissionDenied(ctx.t, ctx.lookups?.permissions, 'EvalRun', 'Execute');
    return (
      <button type="button" className="button-primary" onClick={() => !denied && openRun(ctx)} data-testid="eval-runs-start" {...deniedProps(denied)} {...tip(denied || ctx.t('tips.evals.actions.runSet'))}>
        {ctx.t('evals.actions.runSet')}
      </button>
    );
  },
  rowActions: (r, ctx) => [
    { label: ctx.t('evals.actions.openSet'), tip: ctx.t('tips.evals.actions.openSet'), hidden: !r.setId, onClick: () => ctx.navigate(pathFor('evaluations', r.setId)) },
    { ...guarded(ctx, 'EvalRun', r, ctx.t('tips.evals.actions.cancelRun'), 'Execute'), label: ctx.t('evals.actions.cancelRun'), hidden: isEvalRunFinished(r.status), onClick: () => cancelRun(r, ctx) },
    { label: ctx.t('evals.actions.copyId'), tip: ctx.t('tips.evals.actions.copyId'), onClick: () => copyId(ctx, r.id) }
  ]
};

// ---------------------------------------------------------------- shadow trials

/** Ask for a reason, then stop a shadow trial from a list. */
function stopTrial(r, ctx) {
  const close = () => ctx.setExtraModal(null);
  ctx.setExtraModal(
    <EvalReasonModal
      title={ctx.t('evals.shadowDetail.stopTitle')}
      message={ctx.t('evals.shadowDetail.stopMessage', { name: r.name || r.id })}
      confirmLabel={ctx.t('evals.actions.stopTrial')}
      confirmTip={ctx.t('tips.evals.actions.stopTrial')}
      testId="shadow-stop"
      onClose={close}
      onConfirm={async (reason) => {
        await ctx.apiClient.stopShadowTrial(ctx.tenantId, r.id, { reason });
        ctx.addToast({ type: 'success', message: ctx.t('evals.toasts.trialStopped') });
        close();
        ctx.reload();
      }}
    />
  );
}

/**
 * Shadow trials (AA9.15): a sampled share of a deployment's succeeded runs is replayed on a candidate deployment of the
 * same agent as Shadow runs that cannot act on anything, and the outputs are compared. The list shows how many were
 * compared, agreed, diverged, and failed on the candidate.
 */
export const shadowTrialsConfig = {
  id: 'shadowTrials',
  explainer: 'shadowTrials',
  formSize: 'medium',
  autoRefresh: 30,
  urlFilters: ['status'],
  api: {
    list: (c, tenant, p) => c.listShadowTrials(tenant, p),
    create: (c, tenant, b) => c.createShadowTrial(tenant, b)
  },
  filters: [{ name: 'status', label: (t) => t('resources.shadowTrials.columns.status'), options: ['Running', 'Completed', 'Stopped', 'Failed'], optionLabel: (o, t) => enumLabel(t, 'shadowTrialStatus', o) }],
  loadLookups: loadNames,
  deniedReason: deniedReasonFor('ShadowTrial'),
  loadOptions: loadPicks,
  canDuplicate: false,
  bulkDelete: false,
  isEditable: () => false,
  detailPath: (r) => pathFor('shadowTrials', r.id),
  blank: () => blankShadowTrial(),
  toBody: (d) => shadowTrialFormToBody(d),
  validate: (d, t) => shadowTrialFormErrors(d, t),
  fieldErrorSpecial,
  afterCreate: (created, ctx) => created?.id && ctx.navigate(pathFor('shadowTrials', created.id)),
  columns: ({ t, i18n, lookups }) => {
    const lng = i18n.language;
    return [
      col(t, 'shadowTrials', 'name', (r) => <strong>{r.name || r.id}</strong>, { pinned: true, csv: (r) => r.name || '' }),
      col(t, 'shadowTrials', 'status', (r) => <ShadowTrialStatusBadge status={r.status} t={t} />, { csv: (r) => r.status || '' }),
      col(t, 'shadowTrials', 'source', (r) => nameOf(lookups, 'deployments', r.sourceDeploymentId), { csv: (r) => r.sourceDeploymentId || '' }),
      col(t, 'shadowTrials', 'candidate', (r) => nameOf(lookups, 'deployments', r.candidateDeploymentId), { csv: (r) => r.candidateDeploymentId || '' }),
      col(t, 'shadowTrials', 'samplePercent', (r) => t('evals.percent', { value: r.samplePercent }), { cellClass: 'right', headerClass: 'right', csv: (r) => String(r.samplePercent) }),
      col(t, 'shadowTrials', 'comparedCount', (r) => formatNumber(r.comparedCount || 0, {}, lng), { cellClass: 'right', headerClass: 'right', csv: (r) => String(r.comparedCount || 0) }),
      col(t, 'shadowTrials', 'agreedCount', (r) => formatNumber(r.agreedCount || 0, {}, lng), { cellClass: 'right', headerClass: 'right', defaultHidden: true, csv: (r) => String(r.agreedCount || 0) }),
      col(t, 'shadowTrials', 'divergedCount', (r) => formatNumber(r.divergedCount || 0, {}, lng), { cellClass: 'right', headerClass: 'right', defaultHidden: true, csv: (r) => String(r.divergedCount || 0) }),
      col(t, 'shadowTrials', 'candidateFailureCount', (r) => formatNumber(r.candidateFailureCount || 0, {}, lng), { cellClass: 'right', headerClass: 'right', csv: (r) => String(r.candidateFailureCount || 0) }),
      col(t, 'shadowTrials', 'agreement', (r) => scoreText(agreementRate(r), lng), { cellClass: 'right nowrap', headerClass: 'right', csv: (r) => String(agreementRate(r) ?? '') }),
      col(t, 'shadowTrials', 'endsUtc', (r) => (r.endsUtc ? when(r.endsUtc, lng) : <span className="text-muted">{t('evals.untilStopped')}</span>), { defaultHidden: true, cellClass: 'nowrap', csv: (r) => r.endsUtc || '' }),
      col(t, 'shadowTrials', 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' }),
      col(t, 'shadowTrials', 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
    ];
  },
  fields: (d, ctx) => {
    const { t, options } = ctx;
    const source = (options?.deployments || []).find((x) => x.id === d?.sourceDeploymentId);
    return [
      field(t, 'shadowTrials', 'name', 'text', { placeholder: 'haiku-vs-sonnet', hintValues: { max: EVAL_LIMITS.nameMax } }),
      field(t, 'shadowTrials', 'sourceDeploymentId', 'select', { required: false, options: deploymentOptions(options), noneLabel: t('evals.run.chooseDeployment') }),
      field(t, 'shadowTrials', 'candidateDeploymentId', 'select', { options: deploymentOptions(options, source?.agentId).filter((o) => o.value !== d?.sourceDeploymentId), noneLabel: t('evals.run.chooseDeployment') }),
      field(t, 'shadowTrials', 'samplePercent', 'number', { min: 1, max: 100, step: 1 }),
      field(t, 'shadowTrials', 'endsUtc', 'datetime', { futureOnly: true }),
      field(t, 'shadowTrials', 'comparisonEvalSetId', 'select', { options: setOptions(t, options), noneLabel: t('evals.noSet') }),
      field(t, 'shadowTrials', 'useJudge', 'checkbox')
    ];
  },
  rowActions: (r, ctx) => [
    { ...guarded(ctx, 'ShadowTrial', r, ctx.t('tips.evals.actions.stopTrial')), label: ctx.t('evals.actions.stopTrial'), hidden: r.status !== 'Running', onClick: () => stopTrial(r, ctx) },
    { label: ctx.t('evals.actions.copyId'), tip: ctx.t('tips.evals.actions.copyId'), onClick: () => copyId(ctx, r.id) }
  ]
};

// ---------------------------------------------------------------- canary releases

/** Ask for a reason, then abort a canary release from a list. */
function abortCanary(r, ctx) {
  const close = () => ctx.setExtraModal(null);
  ctx.setExtraModal(
    <EvalReasonModal
      title={ctx.t('evals.canaryDetail.abortTitle')}
      message={ctx.t('evals.canaryDetail.abortMessage')}
      confirmLabel={ctx.t('evals.actions.abortCanary')}
      confirmTip={ctx.t('tips.evals.actions.abortCanary')}
      testId="canary-abort"
      onClose={close}
      onConfirm={async (reason) => {
        await ctx.apiClient.abortCanaryRelease(ctx.tenantId, r.id, { reason });
        ctx.addToast({ type: 'success', message: ctx.t('evals.toasts.canaryAborted') });
        close();
        ctx.reload();
      }}
    />
  );
}

/** "Step 2 of 3 at 50 percent", or '-'. */
export function stepText(t, r) {
  const s = currentStep(r);
  return s ? t('evals.canary.stepOf', { number: s.number, total: s.total, percent: s.weightPercent }) : '-';
}

/**
 * Canary releases (AA9.15): a candidate deployment takes a rising share of an agent's traffic in steps, each lasting a
 * minimum of runs and minutes; it advances while the candidate's error rate (and, when gated, the latest eval score)
 * stays within bounds, is promoted after the last step, and rolls back to the initial weights otherwise.
 */
export const canaryReleasesConfig = {
  id: 'canaryReleases',
  explainer: 'canaryReleases',
  formSize: 'large',
  autoRefresh: 30,
  urlFilters: ['status'],
  api: {
    list: (c, tenant, p) => c.listCanaryReleases(tenant, p),
    create: (c, tenant, b) => c.createCanaryRelease(tenant, b)
  },
  filters: [{ name: 'status', label: (t) => t('resources.canaryReleases.columns.status'), options: ['Running', 'Promoted', 'RolledBack', 'Aborted'], optionLabel: (o, t) => enumLabel(t, 'canaryStatus', o) }],
  loadLookups: loadNames,
  deniedReason: deniedReasonFor('CanaryRelease'),
  loadOptions: loadPicks,
  canDuplicate: false,
  bulkDelete: false,
  isEditable: () => false,
  detailPath: (r) => pathFor('canaryReleases', r.id),
  blank: () => blankCanary(),
  toBody: (d) => canaryFormToBody(d),
  validate: (d, t) => canaryFormErrors(d, t),
  fieldErrorSpecial,
  afterCreate: (created, ctx) => created?.id && ctx.navigate(pathFor('canaryReleases', created.id)),
  columns: ({ t, i18n, lookups }) => {
    const lng = i18n.language;
    return [
      col(t, 'canaryReleases', 'agent', (r) => <strong>{nameOf(lookups, 'agents', r.agentId)}</strong>, { pinned: true, csv: (r) => r.agentId || '' }),
      col(t, 'canaryReleases', 'status', (r) => <CanaryStatusBadge status={r.status} t={t} />, { csv: (r) => r.status || '' }),
      col(t, 'canaryReleases', 'candidate', (r) => nameOf(lookups, 'deployments', r.candidateDeploymentId), { csv: (r) => r.candidateDeploymentId || '' }),
      col(t, 'canaryReleases', 'baseline', (r) => nameOf(lookups, 'deployments', r.baselineDeploymentId), { csv: (r) => r.baselineDeploymentId || '' }),
      col(t, 'canaryReleases', 'step', (r) => stepText(t, r), { cellClass: 'nowrap', csv: (r) => stepText(t, r) }),
      col(t, 'canaryReleases', 'maxErrorRatePercent', (r) => t('evals.percent', { value: r.maxErrorRatePercent }), { cellClass: 'right', headerClass: 'right', csv: (r) => String(r.maxErrorRatePercent) }),
      col(t, 'canaryReleases', 'gate', (r) => (r.evalSetId ? t('evals.canary.gateText', { name: nameOf(lookups, 'sets', r.evalSetId), score: scoreText(r.minEvalScore, lng) }) : <span className="text-muted">{t('evals.canary.noGate')}</span>), { csv: (r) => r.evalSetId || '' }),
      col(t, 'canaryReleases', 'rollbackReason', (r) => (r.rollbackReason ? <span {...tip(r.rollbackReason)}>{truncate(r.rollbackReason, 60)}</span> : '-'), { defaultHidden: true, csv: (r) => r.rollbackReason || '' }),
      col(t, 'canaryReleases', 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' }),
      col(t, 'canaryReleases', 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
    ];
  },
  fields: (d, ctx) => {
    const { t, options } = ctx;
    const agents = (options?.agents || []).map((a) => ({ value: a.id, label: a.name }));
    return [
      field(t, 'canaryReleases', 'agentId', 'select', { options: agents, noneLabel: t('evals.run.chooseAgent') }),
      field(t, 'canaryReleases', 'baselineDeploymentId', 'select', { options: deploymentOptions(options, d?.agentId), noneLabel: t('evals.run.chooseDeployment') }),
      field(t, 'canaryReleases', 'candidateDeploymentId', 'select', { options: deploymentOptions(options, d?.agentId).filter((o) => o.value !== d?.baselineDeploymentId), noneLabel: t('evals.run.chooseDeployment') }),
      field(t, 'canaryReleases', 'steps', 'objectList', {
        ordered: true,
        hintValues: { max: EVAL_LIMITS.stepsMax },
        addLabel: t('resources.canaryReleases.addStep'),
        fields: [
          sub(t, 'canaryReleases', 'weightPercent', 'number', { min: 1, max: 100, step: 1, default: 100 }),
          sub(t, 'canaryReleases', 'minimumRuns', 'number', { min: 0, max: EVAL_LIMITS.minimumRunsMax, step: 1, default: blankStep().minimumRuns }),
          sub(t, 'canaryReleases', 'minimumMinutes', 'number', { min: 0, max: EVAL_LIMITS.minimumMinutesMax, step: 1, default: blankStep().minimumMinutes })
        ]
      }),
      field(t, 'canaryReleases', 'maxErrorRatePercent', 'number', { min: 0, max: 100, step: 'any' }),
      field(t, 'canaryReleases', 'evalSetId', 'select', { options: setOptions(t, options), noneLabel: t('evals.noSet') }),
      field(t, 'canaryReleases', 'minEvalScorePercent', 'number', { min: 0, max: 100, step: 'any', showIf: (x) => !!x.evalSetId })
    ];
  },
  rowActions: (r, ctx) => [
    { ...guarded(ctx, 'CanaryRelease', r, ctx.t('tips.evals.actions.abortCanary')), label: ctx.t('evals.actions.abortCanary'), hidden: r.status !== 'Running', onClick: () => abortCanary(r, ctx) },
    { label: ctx.t('evals.actions.copyId'), tip: ctx.t('tips.evals.actions.copyId'), onClick: () => copyId(ctx, r.id) }
  ]
};
