// ResourceView configurations for runs, nodes, and audit records.

import CopyableId from '../components/CopyableId';
import { Badge } from '../components/StatusBadge';
import { ENUMS, TERMINAL_RUN_STATUSES, runStatusTone, nodeStatusTone } from '../utils/constants';
import { pathFor } from '../utils/routes';
import { formatDateTime, formatRelativeTime, formatDuration, formatNumber, formatCurrency, elapsedMs } from '../i18n/formatters';
import { errorMessage } from '../utils/errors';

function col(id, t, key, render, extra = {}) {
  return { key, label: t(`resources.${id}.columns.${key}`), render, ...extra };
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
  return <Badge tone={runStatusTone(status)}>{t(`enums.runStatus.${status}`, { defaultValue: status })}</Badge>;
}

export const runsConfig = {
  id: 'runs',
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
    col('runs', t, 'status', (r) => <RunStatus status={r.status} t={t} />, { sortable: true, serverSort: false }),
    col('runs', t, 'outcome', (r) => (r.outcome && r.outcome !== 'None' ? t(`enums.runOutcome.${r.outcome}`, { defaultValue: r.outcome }) : '-')),
    col('runs', t, 'harnessType', (r) => t(`enums.harnessType.${r.harnessType}`, { defaultValue: r.harnessType })),
    col('runs', t, 'leaseNodeName', (r) => r.leaseNodeName || '-'),
    col('runs', t, 'duration', (r) => (r.startedUtc ? formatDuration(elapsedMs(r.startedUtc, r.completedUtc), i18n.language) : '-'), { cellClass: 'right' }),
    col('runs', t, 'tokens', (r) => formatNumber((r.inputTokens || 0) + (r.outputTokens || 0), {}, i18n.language), { cellClass: 'right', defaultHidden: true }),
    col('runs', t, 'costUsd', (r) => (r.costUsd != null ? formatCurrency(r.costUsd, i18n.language) : '-'), { cellClass: 'right', defaultHidden: true }),
    col('runs', t, 'depth', (r) => r.depth ?? 0, { cellClass: 'right', defaultHidden: true }),
    col('runs', t, 'createdUtc', (r) => <span title={formatDateTime(r.createdUtc, i18n.language)}>{formatRelativeTime(r.createdUtc, i18n.language)}</span>, { sortable: true })
  ],
  fields: () => [],
  detailPath: (r) => pathFor('runs', r.id),
  rowActions: (r, ctx) => [
    { label: ctx.t('resources.runs.actions.cancel'), hidden: TERMINAL_RUN_STATUSES.includes(r.status), onClick: () => act(ctx, () => ctx.apiClient.cancelRun(ctx.tenantId, r.id), 'resources.runs.toasts.cancelRequested') },
    { label: ctx.t('resources.runs.actions.retry'), hidden: !TERMINAL_RUN_STATUSES.includes(r.status), onClick: () => act(ctx, () => ctx.apiClient.retryRun(ctx.tenantId, r.id), 'resources.runs.toasts.retried') }
  ]
};

export const nodesConfig = {
  id: 'nodes',
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
    col('nodes', t, 'status', (r) => <Badge tone={nodeStatusTone(r.status)}>{t(`enums.nodeStatus.${r.status}`, { defaultValue: r.status })}</Badge>),
    col('nodes', t, 'capacity', (r) => `${r.activeRuns ?? 0} / ${r.maxConcurrentRuns ?? 0}`, { cellClass: 'right' }),
    col('nodes', t, 'harnesses', (r) =>
      (r.capabilities || [])
        .filter((c) => c.available)
        .map((c) => c.harnessType)
        .join(', ') || '-'
    ),
    col('nodes', t, 'labels', (r) => (r.labels || []).map((l) => `${l.key}=${l.value}`).join(', ') || '-', { defaultHidden: true }),
    col('nodes', t, 'nodeVersion', (r) => r.nodeVersion || '-', { defaultHidden: true }),
    col('nodes', t, 'lastHeartbeatUtc', (r) => (r.lastHeartbeatUtc ? formatRelativeTime(r.lastHeartbeatUtc, i18n.language) : '-')),
    col('nodes', t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
  ],
  fields: (_d, { t }) => [
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
        { name: 'harnessType', type: 'text', label: t('resources.runs.columns.harnessType') },
        { name: 'detectedVersion', type: 'text', label: t('resources.nodes.fields.detectedVersion') },
        { name: 'available', type: 'checkbox', label: t('resources.nodes.fields.available') },
        { name: 'detail', type: 'text', label: t('resources.nodes.fields.detail') }
      ]
    }
  ],
  rowActions: (r, ctx) => [
    { label: ctx.t('resources.nodes.actions.cordon'), hidden: r.status !== 'Ready', onClick: () => act(ctx, () => ctx.apiClient.cordonNode(r.id), 'resources.nodes.toasts.cordoned') },
    { label: ctx.t('resources.nodes.actions.uncordon'), hidden: r.status !== 'Cordoned', onClick: () => act(ctx, () => ctx.apiClient.uncordonNode(r.id), 'resources.nodes.toasts.uncordoned') },
    { label: ctx.t('resources.nodes.actions.drain'), hidden: r.status === 'Draining' || r.status === 'Lost', onClick: () => act(ctx, () => ctx.apiClient.drainNode(r.id), 'resources.nodes.toasts.draining') },
    { label: ctx.t('resources.nodes.actions.runs'), onClick: () => ctx.navigate(`${pathFor('runs')}?nodeId=${encodeURIComponent(r.id)}`) }
  ]
};

export const auditConfig = {
  id: 'audit',
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
    col('audit', t, 'createdUtc', (r) => <span title={formatDateTime(r.createdUtc, i18n.language)}>{formatRelativeTime(r.createdUtc, i18n.language)}</span>, { sortable: true, pinned: true }),
    col('audit', t, 'eventType', (r) => <Badge tone={/Denied|Failure/.test(r.eventType) ? 'danger' : /Bypass/.test(r.eventType) ? 'warning' : 'neutral'}>{t(`enums.auditEventType.${r.eventType}`, { defaultValue: r.eventType })}</Badge>),
    col('audit', t, 'principalName', (r) => r.principalName || r.principalId || '-'),
    col('audit', t, 'resource', (r) => [r.resourceType, r.operation].filter(Boolean).join(' / ') || '-'),
    col('audit', t, 'reason', (r) => r.reason || r.description || '-'),
    col('audit', t, 'sourceIp', (r) => r.sourceIp || '-', { defaultHidden: true }),
    col('audit', t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
  ],
  fields: (_d, { t }) =>
    ['eventType', 'principalType', 'principalName', 'principalId', 'resourceType', 'resourceId', 'operation', 'method', 'path', 'authResult', 'authorizationResult', 'reason', 'bypassReason', 'statusCode', 'sourceIp', 'requestId', 'createdUtc'].map((name) => ({
      name,
      type: name === 'reason' ? 'textarea' : 'text',
      label: t(`resources.audit.fields.${name}`)
    }))
};
