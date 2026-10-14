// ResourceView configurations for pipelines (P12.9): definitions (Agents > Pipelines), pipeline runs (Runs > Pipeline
// runs), and stage reviews (Approvals > Stage reviews). Re-exported by resourceConfigs.jsx and runConfigs.jsx so the
// configuration-wide tests (tooltips, i18n keys, enum labels) cover them.

import CopyableId from '../components/CopyableId';
import NamedId from '../components/NamedId';
import { ActiveBadge } from '../components/StatusBadge';
import { tip } from '../components/Tooltip';
import PipelineStagesEditor, { stageFields } from '../components/PipelineStagesEditor';
import PipelineStartModal from '../components/PipelineStartModal';
import PipelinePreviewModal from '../components/PipelinePreviewModal';
import PipelineReviewDecideModal from '../components/PipelineReviewDecideModal';
import { PipelineRunStatusBadge, PipelineRunOutcome, PipelineReviewStatusBadge, PipelineReviewDecisionBadge } from '../components/PipelineBadges';
import { ENUMS, PIPELINE_LIMITS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatDuration, formatNumber, formatRelativeTime, truncate } from '../i18n/formatters';
import { errorMessage } from '../utils/errors';
import { resourceTip, enumTip, optionalText } from '../utils/tips';
import { enumLabel } from '../utils/enums';
import { normalizeSettings } from '../utils/settings';
import { blankPipeline, blankStage, pipelineToForm, pipelineToBody, pipelineDuplicate, pipelineErrors, canCancelPipelineRun, canRetryPipelineRun, isTerminalPipelineRun } from '../utils/pipelines';

function col(id, t, key, render, extra = {}) {
  return { key, label: t(`resources.${id}.columns.${key}`), tip: resourceTip(t, id, key), render, ...extra };
}

function field(id, t, name, type, extra = {}) {
  const hint = optionalText(t, `resources.${id}.hints.${name}`, extra.hintValues);
  return { name, type, label: t(`resources.${id}.fields.${name}`), hint: hint || undefined, tip: resourceTip(t, id, name), ...extra };
}

const safeList = (promise) => promise.then((r) => r.items || []).catch(() => []);
const when = (value, lng) => (value ? <span {...tip(formatDateTime(value, lng))}>{formatRelativeTime(value, lng)}</span> : '-');

async function act(ctx, fn, successKey) {
  try {
    await fn();
    ctx.addToast({ type: 'success', message: ctx.t(successKey) });
    ctx.reload();
  } catch (e) {
    ctx.addToast({ type: 'error', message: errorMessage(ctx.t, e) });
  }
}

/** The configured Runtime.PipelineMaxStages, or the default when settings are not readable. */
async function loadMaxStages(apiClient) {
  try {
    const f = normalizeSettings(await apiClient.getSettings()).find((x) => x.path === 'Runtime.PipelineMaxStages');
    const n = Number(f?.value);
    return Number.isInteger(n) && n > 0 ? n : PIPELINE_LIMITS.maxStages;
  } catch {
    return PIPELINE_LIMITS.maxStages;
  }
}

/** A duration in seconds, or "No limit" for 0. */
function durationText(t, seconds, lng) {
  return seconds ? formatDuration(seconds * 1000, lng) : t('resources.pipelines.noLimit');
}

/** Open the start dialog for a pipeline (Start row action and the pipeline run page). */
export function openStart(ctx, pipeline) {
  ctx.setExtraModal(<PipelineStartModal pipeline={pipeline} onClose={() => ctx.setExtraModal(null)} onStarted={() => ctx.setExtraModal(null)} />);
}

/** Open the prompt preview for a saved pipeline. */
export function openPreview(ctx, pipeline) {
  ctx.setExtraModal(<PipelinePreviewModal pipeline={pipeline} onClose={() => ctx.setExtraModal(null)} />);
}

/**
 * Pipeline definitions (P12.9): ordered stages, each an agent (optionally a fixed deployment) with a handoff template,
 * limits, and an optional review gate. Row actions start a pipeline, preview its prompts, and list its runs.
 */
export const pipelinesConfig = {
  id: 'pipelines',
  explainer: 'pipelines',
  formSize: 'xlarge',
  api: {
    list: (c, tenant, p) => c.listPipelines(tenant, p),
    create: (c, tenant, b) => c.createPipeline(tenant, b),
    update: (c, tenant, id, b) => c.updatePipeline(tenant, id, b),
    remove: (c, tenant, id) => c.deletePipeline(tenant, id)
  },
  // Agent names for the stage chain column.
  loadLookups: async ({ apiClient, tenantId }) => {
    const agents = await safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 }));
    return { agents: Object.fromEntries(agents.map((a) => [a.id, a.displayName || a.name])) };
  },
  // Pick lists for the stage editor: agents, deployments (filtered per stage agent), Task templates, and the stage limit.
  loadOptions: async ({ apiClient, tenantId }) => {
    const [agents, deployments, templates, maxStages] = await Promise.all([
      safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listPromptTemplates(tenantId, { pageNumber: 1, pageSize: 1000, kind: 'Task' })),
      loadMaxStages(apiClient)
    ]);
    return { agents, deployments, templates, maxStages };
  },
  blank: () => blankPipeline(),
  toForm: (r) => pipelineToForm(r),
  toDuplicate: (r) => pipelineDuplicate(r),
  toBody: (d) => pipelineToBody(d),
  // The stage count is checked by the server against the configured Runtime.PipelineMaxStages.
  validate: (d, t) => pipelineErrors(d, t, Number.POSITIVE_INFINITY),
  columns: ({ t, i18n, lookups }) => {
    const lng = i18n.language;
    const agentName = (id) => lookups?.agents?.[id] || id;
    const stages = (r) => [...(r.stages || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    return [
      col('pipelines', t, 'name', (r) => <strong>{r.name}</strong>, { sortable: true, pinned: true }),
      col('pipelines', t, 'stages', (r) => {
        const list = stages(r);
        if (!list.length) return '-';
        return <span {...tip(list.map((s) => `${s.position}. ${s.name} (${agentName(s.agentId)})`).join('\n'))}>{t('resources.pipelines.stageSummary', { count: list.length, chain: list.map((s) => agentName(s.agentId)).join(' > ') })}</span>;
      }, { csv: (r) => stages(r).map((s) => s.name).join(' > ') }),
      col('pipelines', t, 'reviewGates', (r) => formatNumber(stages(r).filter((s) => s.requiresReview).length, {}, lng), { cellClass: 'right', csv: (r) => stages(r).filter((s) => s.requiresReview).length }),
      col('pipelines', t, 'maxDurationSeconds', (r) => durationText(t, r.maxDurationSeconds, lng), { cellClass: 'nowrap', csv: (r) => r.maxDurationSeconds ?? 0 }),
      col('pipelines', t, 'version', (r) => formatNumber(r.version ?? 1, {}, lng), { cellClass: 'right', csv: (r) => r.version ?? 1 }),
      col('pipelines', t, 'active', (r) => <ActiveBadge active={r.active} activeLabel={t('common.generic.active')} inactiveLabel={t('common.generic.inactive')} tip={t(r.active ? 'tips.badges.active' : 'tips.badges.inactive')} />),
      col('pipelines', t, 'description', (r) => (r.description ? <span {...tip(r.description)}>{truncate(r.description, 80)}</span> : '-'), { defaultHidden: true, csv: (r) => r.description || '' }),
      col('pipelines', t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true }),
      col('pipelines', t, 'lastUpdateUtc', (r) => when(r.lastUpdateUtc, lng), { defaultHidden: true, cellClass: 'nowrap', csv: (r) => r.lastUpdateUtc || '' }),
      col('pipelines', t, 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' })
    ];
  },
  fields: (_d, { t, options }) => {
    const id = 'pipelines';
    return [
      field(id, t, 'name', 'text', { required: true }),
      field(id, t, 'maxDurationSeconds', 'number', { min: PIPELINE_LIMITS.maxDurationSeconds.min, max: PIPELINE_LIMITS.maxDurationSeconds.max, hintValues: PIPELINE_LIMITS.maxDurationSeconds }),
      field(id, t, 'description', 'textarea', { rows: 2 }),
      field(id, t, 'active', 'checkbox'),
      {
        ...field(id, t, 'stages', 'custom'),
        // Sub-field descriptors for the tooltip and i18n coverage tests; the editor renders them per stage.
        fields: stageFields(t, { ...blankStage(0), requiresReview: true, handoffTemplateId: 'x', reviewTimeoutSeconds: 60 }, {}),
        render: (data, { disabled, onChange, errors }) => (
          <PipelineStagesEditor value={data?.stages} disabled={disabled} errors={errors} options={options || {}} maxStages={options?.maxStages || PIPELINE_LIMITS.maxStages} onChange={(stages) => onChange({ ...data, stages })} />
        )
      }
    ];
  },
  formNotice: (d, { t }) => (
    <div className="info-banner" role="status" data-testid="pipeline-version-notice">
      {t('resources.pipelines.versionNotice', { version: d?.version ?? 1 })}
    </div>
  ),
  rowActions: (r, ctx) => [
    { label: ctx.t('resources.pipelines.actions.start'), tip: ctx.t('tips.resources.pipelines.actions.start'), hidden: r.active === false, onClick: () => openStart(ctx, r) },
    { label: ctx.t('resources.pipelines.actions.preview'), tip: ctx.t('tips.resources.pipelines.actions.preview'), onClick: () => openPreview(ctx, r) },
    { label: ctx.t('resources.pipelines.actions.runs'), tip: ctx.t('tips.resources.pipelines.actions.runs'), onClick: () => ctx.navigate(pathFor('pipelineRuns', null, { pipelineId: r.id })) }
  ]
};

/** Pipeline names for list filters, keyed by pipeline ID. */
async function pipelineLookups({ apiClient, tenantId }) {
  const pipelines = await safeList(apiClient.listPipelines(tenantId, { pageNumber: 1, pageSize: 1000 }));
  return { pipelines: Object.fromEntries(pipelines.map((p) => [p.id, p.name])) };
}

const pipelineFilter = (id) => ({
  name: 'pipelineId',
  label: (t) => t(`resources.${id}.columns.pipelineName`),
  options: (lookups, filters) => [...new Set([...Object.keys(lookups?.pipelines || {}), ...(filters?.pipelineId ? [filters.pipelineId] : [])])],
  optionLabel: (o, _t, lookups) => lookups?.pipelines?.[o] || o
});

/**
 * Pipeline runs (P12.9): one execution of a pipeline. The list filters by status, pipeline, and time; a row opens the
 * run's stage timeline. Cancel and Retry act on the whole pipeline run; Delete removes finished ones (stage runs stay).
 */
export const pipelineRunsConfig = {
  id: 'pipelineRuns',
  explainer: 'pipelineRuns',
  autoRefresh: 5,
  search: false,
  urlFilters: ['status', 'pipelineId', 'callerId', 'fromUtc', 'toUtc'],
  api: {
    list: (c, tenant, p) => c.listPipelineRuns(tenant, p),
    create: null,
    update: null,
    remove: (c, tenant, id) => c.deletePipelineRun(tenant, id)
  },
  loadLookups: pipelineLookups,
  filters: [
    { name: 'status', label: (t) => t('resources.pipelineRuns.columns.status'), options: ENUMS.pipelineRunStatus, enumGroup: 'pipelineRunStatus' },
    pipelineFilter('pipelineRuns'),
    { name: 'fromUtc', type: 'datetime', label: (t) => t('components.filters.from') },
    { name: 'toUtc', type: 'datetime', label: (t) => t('components.filters.to') }
  ],
  canDuplicate: false,
  isEditable: () => false,
  canDelete: (r) => isTerminalPipelineRun(r),
  columns: ({ t, i18n }) => {
    const lng = i18n.language;
    return [
      col('pipelineRuns', t, 'id', (r) => <CopyableId value={r.id} />, { pinned: true, cellClass: 'cell-id' }),
      col('pipelineRuns', t, 'pipelineName', (r) => (
        <>
          <strong>{r.pipelineName}</strong> <span className="text-muted" {...tip(t('tips.resources.pipelineRuns.pipelineVersion'))}>{t('resources.pipelineRuns.versionShort', { version: r.pipelineVersion ?? 1 })}</span>
        </>
      ), { sortable: true, serverSort: false, csv: (r) => r.pipelineName || '' }),
      col('pipelineRuns', t, 'status', (r) => <PipelineRunStatusBadge status={r.status} t={t} />, { sortable: true, serverSort: false, csv: (r) => r.status || '' }),
      col('pipelineRuns', t, 'outcome', (r) => <PipelineRunOutcome outcome={r.outcome} t={t} />, { csv: (r) => r.outcome || '' }),
      col('pipelineRuns', t, 'progress', (r) => t('resources.pipelineRuns.progressValue', { position: formatNumber(Math.min(r.currentPosition ?? 1, r.stageCount ?? 0), {}, lng), count: r.stageCount ?? 0 }), { cellClass: 'nowrap', csv: (r) => `${r.currentPosition ?? 1}/${r.stageCount ?? 0}` }),
      col('pipelineRuns', t, 'callerName', (r) => r.callerName || r.callerId || '-'),
      col('pipelineRuns', t, 'errorMessage', (r) => (r.errorMessage ? <span {...tip(r.errorMessage)}>{truncate(r.errorMessage, 80)}</span> : '-'), { defaultHidden: true, csv: (r) => r.errorMessage || '' }),
      col('pipelineRuns', t, 'priority', (r) => formatNumber(r.priority ?? 0, {}, lng), { cellClass: 'right', defaultHidden: true, csv: (r) => r.priority ?? 0 }),
      col('pipelineRuns', t, 'deadlineUtc', (r) => when(r.deadlineUtc, lng), { defaultHidden: true, cellClass: 'nowrap', csv: (r) => r.deadlineUtc || '' }),
      col('pipelineRuns', t, 'completedUtc', (r) => when(r.completedUtc, lng), { defaultHidden: true, cellClass: 'nowrap', csv: (r) => r.completedUtc || '' }),
      col('pipelineRuns', t, 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' })
    ];
  },
  fields: () => [],
  detailPath: (r) => pathFor('pipelineRuns', r.id),
  rowActions: (r, ctx) => [
    { label: ctx.t('resources.pipelineRuns.actions.cancel'), tip: ctx.t('tips.resources.pipelineRuns.actions.cancel'), hidden: !canCancelPipelineRun(r), onClick: () => act(ctx, () => ctx.apiClient.cancelPipelineRun(ctx.tenantId, r.id), 'resources.pipelineRuns.toasts.cancelRequested') },
    { label: ctx.t('resources.pipelineRuns.actions.retry'), tip: ctx.t('tips.resources.pipelineRuns.actions.retry'), hidden: !canRetryPipelineRun(r), onClick: () => act(ctx, () => ctx.apiClient.retryPipelineRun(ctx.tenantId, r.id), 'resources.pipelineRuns.toasts.retried') },
    { label: ctx.t('resources.pipelineRuns.actions.stageRuns'), tip: ctx.t('tips.resources.pipelineRuns.actions.stageRuns'), onClick: () => ctx.navigate(pathFor('runs', null, { pipelineRunId: r.id })) },
    { label: ctx.t('resources.pipelineRuns.actions.finalRun'), tip: ctx.t('tips.resources.pipelineRuns.actions.finalRun'), hidden: !r.finalRunId, onClick: () => ctx.navigate(pathFor('runs', r.finalRunId)) }
  ]
};

/** Open the decide dialog for a stage review from a list; reloads the list once it is decided (or found decided). */
export function openReviewDecide(ctx, review, decision) {
  ctx.setExtraModal(
    <PipelineReviewDecideModal
      review={review}
      initialDecision={decision}
      onClose={() => ctx.setExtraModal(null)}
      onDecided={() => {
        ctx.setExtraModal(null);
        ctx.reload();
      }}
    />
  );
}

/**
 * Pipeline stage reviews (P12.9), the second tab of Approvals: a stage that requires a review waits here after it
 * finishes. Opens on the pending ones; row actions approve, request changes, or reject without leaving the inbox.
 */
export const pipelineReviewsConfig = {
  id: 'pipelineReviews',
  explainer: 'pipelineReviews',
  autoRefresh: 10,
  search: false,
  defaultFilters: { status: 'Pending' },
  urlFilters: ['status', 'pipelineRunId', 'pipelineId', 'runId', 'decisionSource'],
  api: {
    list: (c, tenant, p) => c.listPipelineReviews(tenant, p),
    create: null,
    update: null,
    remove: null
  },
  loadLookups: pipelineLookups,
  filters: [
    { name: 'status', label: (t) => t('resources.pipelineReviews.columns.status'), options: ENUMS.pipelineReviewStatus, enumGroup: 'pipelineReviewStatus' },
    pipelineFilter('pipelineReviews'),
    { name: 'decisionSource', label: (t) => t('resources.pipelineReviews.columns.decisionSource'), options: ENUMS.pipelineReviewSource, enumGroup: 'pipelineReviewSource', tip: (t) => t('tips.resources.pipelineReviews.filters.decisionSource') },
    { name: 'pipelineRunId', type: 'text', label: (t) => t('resources.pipelineReviews.filters.pipelineRunId'), placeholder: (t) => t('resources.pipelineReviews.filters.pipelineRunIdPlaceholder') }
  ],
  canDuplicate: false,
  isEditable: () => false,
  canDelete: () => false,
  columns: ({ t, i18n }) => {
    const lng = i18n.language;
    return [
      col('pipelineReviews', t, 'createdUtc', (r) => when(r.requestedUtc || r.createdUtc, lng), { sortable: true, pinned: true, cellClass: 'nowrap', csv: (r) => r.requestedUtc || r.createdUtc || '' }),
      col('pipelineReviews', t, 'pipelineName', (r) => (r.pipelineName ? <strong>{r.pipelineName}</strong> : <NamedId id={r.pipelineId} />), { sortable: true, serverSort: false, csv: (r) => r.pipelineName || r.pipelineId || '' }),
      col('pipelineReviews', t, 'stageName', (r) => (
        <>
          {r.stageName} <span className="text-muted" {...tip(t('tips.resources.pipelineReviews.positionExecution'))}>{t('components.pipelineReviews.positionExecution', { position: r.position, execution: r.execution })}</span>
        </>
      ), { csv: (r) => `${r.position}. ${r.stageName}` }),
      col('pipelineReviews', t, 'status', (r) => <PipelineReviewStatusBadge status={r.status} t={t} />, { sortable: true, serverSort: false, csv: (r) => r.status || '' }),
      col('pipelineReviews', t, 'decision', (r) => <PipelineReviewDecisionBadge decision={r.decision} t={t} />, { csv: (r) => r.decision || '' }),
      col('pipelineReviews', t, 'decisionSource', (r) => (r.decisionSource ? <span {...tip(enumTip(t, 'pipelineReviewSource', r.decisionSource))}>{enumLabel(t, 'pipelineReviewSource', r.decisionSource)}</span> : '-'), { csv: (r) => r.decisionSource || '' }),
      col('pipelineReviews', t, 'comment', (r) => (r.comment ? <span {...tip(r.comment)}>{truncate(r.comment, 80)}</span> : '-'), { csv: (r) => r.comment || '' }),
      col('pipelineReviews', t, 'decidedBy', (r) => r.decidedBy || '-'),
      col('pipelineReviews', t, 'expiresUtc', (r) =>
        r.status === 'Pending' ? (r.expiresUtc ? (
          <span className="inline-meta">
            {when(r.expiresUtc, lng)} <span className="text-muted">{t('components.pipelineReviews.timeoutThen', { decision: enumLabel(t, 'pipelineReviewDecision', r.timeoutAction || 'Reject') })}</span>
          </span>
        ) : <span className="text-muted">{t('resources.pipelineReviews.noTimeout')}</span>) : '-',
      { cellClass: 'nowrap', csv: (r) => r.expiresUtc || '' }),
      col('pipelineReviews', t, 'pipelineRunId', (r) => <CopyableId value={r.pipelineRunId} />, { cellClass: 'cell-id', defaultHidden: true }),
      col('pipelineReviews', t, 'runId', (r) => <CopyableId value={r.runId} />, { cellClass: 'cell-id', defaultHidden: true }),
      col('pipelineReviews', t, 'decidedUtc', (r) => when(r.decidedUtc, lng), { defaultHidden: true, cellClass: 'nowrap', csv: (r) => r.decidedUtc || '' }),
      col('pipelineReviews', t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
    ];
  },
  fields: () => [],
  detailPath: (r) => pathFor('pipelineRuns', r.pipelineRunId),
  rowActions: (r, ctx) => [
    { label: ctx.t('resources.pipelineReviews.actions.approve'), tip: ctx.t('tips.resources.pipelineReviews.actions.approve'), hidden: r.status !== 'Pending', onClick: () => openReviewDecide(ctx, r, 'Approve') },
    { label: ctx.t('resources.pipelineReviews.actions.requestChanges'), tip: ctx.t('tips.resources.pipelineReviews.actions.requestChanges'), hidden: r.status !== 'Pending', onClick: () => openReviewDecide(ctx, r, 'RequestChanges') },
    { label: ctx.t('resources.pipelineReviews.actions.reject'), tip: ctx.t('tips.resources.pipelineReviews.actions.reject'), hidden: r.status !== 'Pending', onClick: () => openReviewDecide(ctx, r, 'Reject') },
    { label: ctx.t('resources.pipelineReviews.actions.openStageRun'), tip: ctx.t('tips.resources.pipelineReviews.actions.openStageRun'), hidden: !r.runId, onClick: () => ctx.navigate(pathFor('runs', r.runId)) }
  ]
};
