// ResourceView configurations for runs, nodes, and audit records.

import CopyableId from '../components/CopyableId';
import { Badge } from '../components/StatusBadge';
import { ENUMS, TERMINAL_RUN_STATUSES, runStatusTone, nodeStatusTone } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters';
import { errorMessage } from '../utils/errors';
import { resourceTip, enumTip } from '../utils/tips';
import { enumLabel } from '../utils/enums';
import { runTelemetry, formatMs, formatCount, formatRate, formatUsd } from '../utils/telemetry';
import { BlockedBadge } from '../components/BlockedRun';
import { tip } from '../components/Tooltip';

function col(id, t, key, render, extra = {}) {
  return { key, label: t(`resources.${id}.columns.${key}`), tip: resourceTip(t, id, key), render, ...extra };
}

/**
 * A run telemetry column (section 10.6). `field` is the run property, so page-only sorting works on the raw
 * value; `format` renders the normalized value with the "n/a" placeholder for nulls.
 */
function telemetryCol(t, i18n, field, format, extra = {}) {
  const na = t('common.generic.notAvailable');
  return col('runs', t, field, (r) => format(runTelemetry(r)[field], i18n.language, na), { cellClass: 'right nowrap', sortable: true, serverSort: false, ...extra });
}

async function act(ctx, fn, successKey) {
  try {
    await fn();
    ctx.addToast({ type: 'success', message: ctx.t(successKey) });
    ctx.reload();
  } catch (e) {
    ctx.addToast({ type: 'error', message: errorMessage(ctx.t, e) });
  }
}

/** Run status pill with a localized label. */
export function RunStatus({ status, t }) {
  return (
    <Badge tone={runStatusTone(status)} tip={enumTip(t, 'runStatus', status)}>
      {t(`enums.runStatus.${status}`, { defaultValue: status })}
    </Badge>
  );
}

export const runsConfig = {
  id: 'runs',
  explainer: 'runs',
  autoRefresh: 5,
  urlFilters: ['status', 'agentId', 'deploymentId', 'nodeId', 'harnessType', 'fromUtc', 'toUtc', 'parentRunId'],
  api: {
    list: (c, tenant, p) => c.listRuns(tenant, p),
    create: null,
    update: null,
    remove: (c, tenant, id) => c.deleteRun(tenant, id)
  },
  filters: [
    { name: 'status', label: (t) => t('resources.runs.columns.status'), options: ENUMS.runStatus, enumGroup: 'runStatus' },
    { name: 'harnessType', label: (t) => t('resources.runs.columns.harnessType'), options: ENUMS.harnessType, enumGroup: 'harnessType' },
    { name: 'fromUtc', type: 'datetime', label: (t) => t('components.filters.from') },
    { name: 'toUtc', type: 'datetime', label: (t) => t('components.filters.to') }
  ],
  canDelete: (r) => TERMINAL_RUN_STATUSES.includes(r.status),
  canDuplicate: false,
  columns: ({ t, i18n }) => [
    col('runs', t, 'id', (r) => <CopyableId value={r.id} />, { pinned: true, cellClass: 'cell-id' }),
    col('runs', t, 'agentName', (r) => <strong>{r.agentName}</strong>, { sortable: true, serverSort: false }),
    col('runs', t, 'status', (r) => (
      <>
        <RunStatus status={r.status} t={t} />
        <BlockedBadge run={r} t={t} />
      </>
    ), { sortable: true, serverSort: false, csv: (r) => (r.blockedReason && r.status === 'Queued' ? `${r.status} (${r.blockedReason})` : r.status) }),
    col('runs', t, 'outcome', (r) =>
      r.outcome && r.outcome !== 'None' ? <span {...tip(enumTip(t, 'runOutcome', r.outcome))}>{t(`enums.runOutcome.${r.outcome}`, { defaultValue: r.outcome })}</span> : '-'
    ),
    col('runs', t, 'harnessType', (r) => t(`enums.harnessType.${r.harnessType}`, { defaultValue: r.harnessType })),
    col('runs', t, 'leaseNodeName', (r) => r.leaseNodeName || '-'),
    telemetryCol(t, i18n, 'timeToFirstTokenMs', formatMs),
    telemetryCol(t, i18n, 'timeToFirstTokenExcludingDelegationMs', formatMs, { defaultHidden: true }),
    telemetryCol(t, i18n, 'delegationWaitMs', formatMs, { defaultHidden: true }),
    telemetryCol(t, i18n, 'streamingMs', formatMs, { defaultHidden: true }),
    telemetryCol(t, i18n, 'executionMs', formatMs),
    telemetryCol(t, i18n, 'queueMs', formatMs, { defaultHidden: true }),
    telemetryCol(t, i18n, 'totalMs', formatMs, { defaultHidden: true }),
    telemetryCol(t, i18n, 'inputTokens', formatCount),
    telemetryCol(t, i18n, 'outputTokens', formatCount),
    telemetryCol(t, i18n, 'cachedTokens', formatCount, { defaultHidden: true }),
    telemetryCol(t, i18n, 'reasoningTokens', formatCount, { defaultHidden: true }),
    telemetryCol(t, i18n, 'outputTokensPerSecond', (v, lng, na) => formatRate(v, lng, na, t('common.units.tokPerSec')), { defaultHidden: true }),
    telemetryCol(t, i18n, 'costUsd', formatUsd),
    telemetryCol(t, i18n, 'toolCallCount', formatCount, { defaultHidden: true }),
    col('runs', t, 'depth', (r) => r.depth ?? 0, { cellClass: 'right', defaultHidden: true }),
    col('runs', t, 'createdUtc', (r) => <span {...tip(formatDateTime(r.createdUtc, i18n.language))}>{formatRelativeTime(r.createdUtc, i18n.language)}</span>, { sortable: true })
  ],
  fields: () => [],
  detailPath: (r) => pathFor('runs', r.id),
  rowActions: (r, ctx) => [
    { label: ctx.t('resources.runs.actions.cancel'), tip: ctx.t('tips.resources.runs.actions.cancel'), hidden: TERMINAL_RUN_STATUSES.includes(r.status), onClick: () => act(ctx, () => ctx.apiClient.cancelRun(ctx.tenantId, r.id), 'resources.runs.toasts.cancelRequested') },
    { label: ctx.t('resources.runs.actions.retry'), tip: ctx.t('tips.resources.runs.actions.retry'), hidden: !TERMINAL_RUN_STATUSES.includes(r.status), onClick: () => act(ctx, () => ctx.apiClient.retryRun(ctx.tenantId, r.id), 'resources.runs.toasts.retried') }
  ]
};

export const nodesConfig = {
  id: 'nodes',
  explainer: 'nodes',
  autoRefresh: 15,
  api: {
    list: (c, _t, p) => c.listNodes(p),
    create: null,
    update: null,
    remove: (c, _t, id) => c.deleteNode(id)
  },
  filters: [{ name: 'status', label: (t) => t('resources.nodes.columns.status'), options: ENUMS.nodeStatus, enumGroup: 'nodeStatus' }],
  canDelete: (r) => r.status === 'Lost' || r.status === 'Offline',
  canDuplicate: false,
  isEditable: () => false,
  columns: ({ t, i18n }) => [
    col('nodes', t, 'name', (r) => <strong>{r.name}</strong>, { sortable: true, pinned: true }),
    col('nodes', t, 'status', (r) => (
      <Badge tone={nodeStatusTone(r.status)} tip={enumTip(t, 'nodeStatus', r.status)}>
        {t(`enums.nodeStatus.${r.status}`, { defaultValue: r.status })}
      </Badge>
    )),
    col('nodes', t, 'capacity', (r) => `${r.activeRuns ?? 0} / ${r.maxConcurrentRuns ?? 0}`, { cellClass: 'right', csv: (r) => `${r.activeRuns ?? 0}/${r.maxConcurrentRuns ?? 0}` }),
    col('nodes', t, 'harnesses', (r) =>
      (r.capabilities || [])
        .filter((c) => c.available)
        .map((c) => enumLabel(t, 'harnessType', c.harnessType))
        .join(', ') || '-',
      { csv: (r) => (r.capabilities || []).filter((c) => c.available).map((c) => c.harnessType).join(' ') }
    ),
    col('nodes', t, 'labels', (r) => (r.labels || []).map((l) => `${l.key}=${l.value}`).join(', ') || '-', { defaultHidden: true, csv: (r) => (Array.isArray(r.labels) ? r.labels.map((l) => `${l.key}=${l.value}`).join(' ') : '') }),
    col('nodes', t, 'nodeVersion', (r) => r.nodeVersion || '-', { defaultHidden: true }),
    col('nodes', t, 'lastHeartbeatUtc', (r) => (r.lastHeartbeatUtc ? formatRelativeTime(r.lastHeartbeatUtc, i18n.language) : '-')),
    col('nodes', t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
  ],
  fields: (_d, { t }) => nodeFields(t),
  rowActions: (r, ctx) => [
    { label: ctx.t('resources.nodes.actions.cordon'), tip: ctx.t('tips.resources.nodes.actions.cordon'), hidden: r.status !== 'Ready', onClick: () => act(ctx, () => ctx.apiClient.cordonNode(r.id), 'resources.nodes.toasts.cordoned') },
    { label: ctx.t('resources.nodes.actions.uncordon'), tip: ctx.t('tips.resources.nodes.actions.uncordon'), hidden: r.status !== 'Cordoned', onClick: () => act(ctx, () => ctx.apiClient.uncordonNode(r.id), 'resources.nodes.toasts.uncordoned') },
    { label: ctx.t('resources.nodes.actions.drain'), tip: ctx.t('tips.resources.nodes.actions.drain'), hidden: r.status === 'Draining' || r.status === 'Lost', onClick: () => act(ctx, () => ctx.apiClient.drainNode(r.id), 'resources.nodes.toasts.draining') },
    { label: ctx.t('resources.nodes.actions.runs'), tip: ctx.t('tips.resources.nodes.actions.runs'), onClick: () => ctx.navigate(pathFor('runs', null, { nodeId: r.id })) }
  ]
};

function nodeFields(t) {
  const withTips = (f) => ({ ...f, tip: resourceTip(t, 'nodes', f.name), fields: f.fields ? f.fields.map((x) => ({ ...x, tip: resourceTip(t, 'nodes', `${f.name}Items.${x.name}`) })) : undefined });
  return [
    { name: 'name', type: 'text', label: t('resources.nodes.columns.name') },
    { name: 'status', type: 'text', label: t('resources.nodes.columns.status') },
    { name: 'address', type: 'text', label: t('resources.nodes.fields.address') },
    { name: 'nodeVersion', type: 'text', label: t('resources.nodes.columns.nodeVersion') },
    { name: 'maxConcurrentRuns', type: 'number', label: t('resources.nodes.fields.maxConcurrentRuns') },
    { name: 'activeRuns', type: 'number', label: t('resources.nodes.fields.activeRuns') },
    {
      name: 'labels',
      type: 'objectList',
      label: t('resources.nodes.columns.labels'),
      fields: [
        { name: 'key', type: 'text', label: t('components.form.key') },
        { name: 'value', type: 'text', label: t('components.form.value') }
      ]
    },
    {
      name: 'capabilities',
      type: 'objectList',
      label: t('resources.nodes.fields.capabilities'),
      fields: [
        { name: 'harnessType', type: 'select', label: t('resources.runs.columns.harnessType'), options: ENUMS.harnessType.map((h) => ({ value: h, label: enumLabel(t, 'harnessType', h) })) },
        { name: 'detectedVersion', type: 'text', label: t('resources.nodes.fields.detectedVersion') },
        { name: 'available', type: 'checkbox', label: t('resources.nodes.fields.available') },
        { name: 'detail', type: 'text', label: t('resources.nodes.fields.detail') }
      ]
    }
  ].map(withTips);
}

export const auditConfig = {
  id: 'audit',
  explainer: 'audit',
  api: {
    list: (c, tenant, p) => c.listAudit(tenant, p),
    create: null,
    update: null,
    remove: (c, tenant, id) => c.deleteAuditRecord(tenant, id)
  },
  filters: [
    { name: 'eventType', label: (t) => t('resources.audit.columns.eventType'), options: ENUMS.auditEventType, enumGroup: 'auditEventType' },
    { name: 'fromUtc', type: 'datetime', label: (t) => t('components.filters.from') },
    { name: 'toUtc', type: 'datetime', label: (t) => t('components.filters.to') }
  ],
  canDuplicate: false,
  isEditable: () => false,
  canDelete: () => true,
  columns: ({ t, i18n }) => [
    col('audit', t, 'createdUtc', (r) => <span {...tip(formatDateTime(r.createdUtc, i18n.language))}>{formatRelativeTime(r.createdUtc, i18n.language)}</span>, { sortable: true, pinned: true }),
    col('audit', t, 'eventType', (r) => <Badge tone={/Denied|Failure/.test(r.eventType) ? 'danger' : /Bypass/.test(r.eventType) ? 'warning' : 'neutral'} tip={enumTip(t, 'auditEventType', r.eventType)}>{t(`enums.auditEventType.${r.eventType}`, { defaultValue: r.eventType })}</Badge>),
    col('audit', t, 'principalName', (r) => r.principalName || r.principalId || '-'),
    col('audit', t, 'resource', (r) => [r.resourceType && enumLabel(t, 'resourceType', r.resourceType), r.operation && enumLabel(t, 'operationType', r.operation)].filter(Boolean).join(' / ') || '-', { csv: (r) => [r.resourceType, r.operation].filter(Boolean).join('/') }),
    col('audit', t, 'reason', (r) => r.reason || r.description || '-'),
    col('audit', t, 'sourceIp', (r) => r.sourceIp || '-', { defaultHidden: true }),
    col('audit', t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
  ],
  fields: (_d, { t }) =>
    ['eventType', 'principalType', 'principalName', 'principalId', 'resourceType', 'resourceId', 'operation', 'method', 'path', 'authResult', 'authorizationResult', 'reason', 'bypassReason', 'statusCode', 'sourceIp', 'requestId', 'createdUtc'].map((name) => ({
      name,
      type: name === 'reason' ? 'textarea' : 'text',
      label: t(`resources.audit.fields.${name}`),
      tip: resourceTip(t, 'audit', name)
    }))
};
