// ResourceView configurations for runs, conversations, approvals, nodes, and audit records.

import CopyableId from '../components/CopyableId';
import { Badge } from '../components/StatusBadge';
import { ENUMS, TERMINAL_RUN_STATUSES, runStatusTone, nodeStatusTone } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatNumber, formatRelativeTime, formatUptime } from '../i18n/formatters';
import ControlNodeDetail from '../components/ControlNodeDetail';
import { ControlNodeStatus, LeaderBadge, HeartbeatAge } from '../components/ControlNodeBadges';
import { errorMessage } from '../utils/errors';
import { resourceTip, enumTip } from '../utils/tips';
import { enumLabel } from '../utils/enums';
import { runTelemetry, formatMs, formatCount, formatRate, formatUsd } from '../utils/telemetry';
import { BlockedBadge } from '../components/BlockedRun';
import { tip } from '../components/Tooltip';
import { turnSessionMode, turnSessionTone } from '../utils/conversations';
import NamedId from '../components/NamedId';
import ApprovalDecideModal from '../components/ApprovalDecideModal';
import { ApprovalStatusBadge, ApprovalDecisionBadge, AwaitingApprovalBadge } from '../components/ApprovalBadges';
import { truncate } from '../i18n/formatters';

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

/** Whether a conversation has an unfinished turn (busy) or waits for the next one (idle). */
export function ConversationState({ conversation, t }) {
  const busy = !!conversation?.busy;
  return (
    <Badge tone={busy ? 'info' : 'neutral'} tip={t(busy ? 'tips.resources.conversations.states.busy' : 'tips.resources.conversations.states.idle')}>
      {t(busy ? 'resources.conversations.states.busy' : 'resources.conversations.states.idle')}
    </Badge>
  );
}

/** Translated reason a conversation turn started a fresh session instead of resuming, with its explanation as tooltip. */
export function FallbackReason({ reason, t }) {
  if (!reason) return '-';
  return (
    <span data-fallback-reason={reason} {...tip(enumTip(t, 'conversationFallbackReason', reason))}>
      {enumLabel(t, 'conversationFallbackReason', reason)}
    </span>
  );
}

/** How a conversation turn got its harness session: resumed, a fresh session after a fallback (with the reason), or the first turn. */
export function TurnSession({ run, t }) {
  const mode = turnSessionMode(run);
  if (mode === 'none') return '-';
  return (
    <span className="inline-meta" data-turn-session={mode}>
      <Badge tone={turnSessionTone(mode)} tip={t(`tips.views.conversationDetail.session.${mode}`, { session: run.resumeSessionId || '' })}>
        {t(`views.conversationDetail.session.${mode}`)}
      </Badge>
      {mode === 'fallback' && <FallbackReason reason={run.conversationFallbackReason} t={t} />}
    </span>
  );
}

/** A conversation's title, or a muted placeholder for one whose first input had no text. */
export function conversationTitle(t, c) {
  return c?.title || t('resources.conversations.untitled');
}

export const conversationsConfig = {
  id: 'conversations',
  explainer: 'conversations',
  autoRefresh: 15,
  urlFilters: ['agentId', 'contextId', 'callerId'],
  api: {
    list: (c, tenant, p) => c.listConversations(tenant, p),
    create: null,
    update: null,
    remove: (c, tenant, id) => c.deleteConversation(tenant, id)
  },
  // Agent names for the filter; an agent named in the URL stays selectable even before the names load.
  loadLookups: async ({ apiClient, tenantId }) => {
    const r = await apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 });
    return { agents: Object.fromEntries((r.items || []).map((a) => [a.id, a.displayName || a.name])) };
  },
  filters: [
    {
      name: 'agentId',
      label: (t) => t('resources.conversations.columns.agentName'),
      options: (lookups, filters) => [...new Set([...Object.keys(lookups?.agents || {}), ...(filters?.agentId ? [filters.agentId] : [])])],
      optionLabel: (o, _t, lookups) => lookups?.agents?.[o] || o
    }
  ],
  canDuplicate: false,
  isEditable: () => false,
  // Deleting a conversation with an unfinished turn answers 409 ConversationBusy, shown as a translated message.
  canDelete: () => true,
  columns: ({ t, i18n }) => {
    const lng = i18n.language;
    const when = (v) => (v ? <span {...tip(formatDateTime(v, lng))}>{formatRelativeTime(v, lng)}</span> : '-');
    return [
      col('conversations', t, 'title', (r) => (r.title ? <strong>{r.title}</strong> : <span className="text-muted">{conversationTitle(t, r)}</span>), { pinned: true, sortable: true, serverSort: false, csv: (r) => r.title || '' }),
      col('conversations', t, 'agentName', (r) => r.agentName || '-', { sortable: true, serverSort: false }),
      col('conversations', t, 'state', (r) => <ConversationState conversation={r} t={t} />, { csv: (r) => (r.busy ? 'Busy' : 'Idle') }),
      col('conversations', t, 'turnCount', (r) => formatNumber(r.turnCount ?? 0, {}, lng), { cellClass: 'right', sortable: true, serverSort: false, csv: (r) => r.turnCount ?? 0 }),
      col('conversations', t, 'affinityNodeName', (r) => r.affinityNodeName || '-'),
      col('conversations', t, 'fallbackCount', (r) =>
        r.fallbackCount ? <span {...tip(t('tips.resources.conversations.fallbackLast', { reason: enumLabel(t, 'conversationFallbackReason', r.lastFallbackReason) }))}>{formatNumber(r.fallbackCount, {}, lng)}</span> : formatNumber(0, {}, lng),
        { cellClass: 'right', sortable: true, serverSort: false, csv: (r) => r.fallbackCount ?? 0 }
      ),
      col('conversations', t, 'lastFallbackReason', (r) => <FallbackReason reason={r.lastFallbackReason} t={t} />, { defaultHidden: true, csv: (r) => r.lastFallbackReason || '' }),
      col('conversations', t, 'harnessType', (r) => enumLabel(t, 'harnessType', r.harnessType), { defaultHidden: true, csv: (r) => r.harnessType || '' }),
      col('conversations', t, 'callerName', (r) => r.callerName || r.callerId || '-', { defaultHidden: true }),
      col('conversations', t, 'contextId', (r) => (r.contextId ? <CopyableId value={r.contextId} /> : '-'), { cellClass: 'cell-id', defaultHidden: true }),
      col('conversations', t, 'sessionId', (r) => (r.sessionId ? <CopyableId value={r.sessionId} /> : '-'), { cellClass: 'cell-id', defaultHidden: true }),
      col('conversations', t, 'lastActivityUtc', (r) => when(r.lastActivityUtc), { sortable: true, serverSort: false, cellClass: 'nowrap' }),
      col('conversations', t, 'createdUtc', (r) => when(r.createdUtc), { sortable: true, cellClass: 'nowrap' }),
      col('conversations', t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
    ];
  },
  fields: () => [],
  detailPath: (r) => pathFor('conversations', r.id),
  rowActions: (r, ctx) => [
    { label: ctx.t('resources.conversations.actions.continue'), tip: ctx.t('tips.resources.conversations.actions.continue'), onClick: () => ctx.navigate(pathFor('invoke', null, { agentId: r.agentId, conversationId: r.id })) },
    { label: ctx.t('resources.conversations.actions.runs'), tip: ctx.t('tips.resources.conversations.actions.runs'), onClick: () => ctx.navigate(pathFor('runs', null, { conversationId: r.id })) }
  ]
};

export const runsConfig = {
  id: 'runs',
  explainer: 'runs',
  autoRefresh: 5,
  urlFilters: ['status', 'agentId', 'deploymentId', 'nodeId', 'harnessType', 'fromUtc', 'toUtc', 'parentRunId', 'conversationId'],
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
        <AwaitingApprovalBadge run={r} t={t} />
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
    telemetryCol(t, i18n, 'approvalWaitMs', formatMs, { defaultHidden: true }),
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
    col('runs', t, 'conversationId', (r) =>
      r.conversationId ? (
        <>
          <CopyableId value={r.conversationId} /> <span className="text-muted nowrap" {...tip(t('tips.resources.runs.conversationTurn'))}>{t('resources.runs.turn', { turn: r.conversationTurn ?? 0 })}</span>
        </>
      ) : (
        '-'
      ),
    { cellClass: 'cell-id', defaultHidden: true, csv: (r) => r.conversationId || '' }),
    col('runs', t, 'createdUtc', (r) => <span {...tip(formatDateTime(r.createdUtc, i18n.language))}>{formatRelativeTime(r.createdUtc, i18n.language)}</span>, { sortable: true })
  ],
  fields: () => [],
  detailPath: (r) => pathFor('runs', r.id),
  rowActions: (r, ctx) => [
    { label: ctx.t('resources.runs.actions.cancel'), tip: ctx.t('tips.resources.runs.actions.cancel'), hidden: TERMINAL_RUN_STATUSES.includes(r.status), onClick: () => act(ctx, () => ctx.apiClient.cancelRun(ctx.tenantId, r.id), 'resources.runs.toasts.cancelRequested') },
    { label: ctx.t('resources.runs.actions.retry'), tip: ctx.t('tips.resources.runs.actions.retry'), hidden: !TERMINAL_RUN_STATUSES.includes(r.status), onClick: () => act(ctx, () => ctx.apiClient.retryRun(ctx.tenantId, r.id), 'resources.runs.toasts.retried') }
  ]
};

const safeList = (promise) => promise.then((r) => r.items || []).catch(() => []);
const aCol = (t, key, render, extra) => col('approvals', t, key, render, extra);
const when = (value, lng) => (value ? <span {...tip(formatDateTime(value, lng))}>{formatRelativeTime(value, lng)}</span> : '-');

/** Open the decide dialog for an approval from a list; reloads the list once it is decided (or found decided). */
export function openDecide(ctx, approval, decision) {
  ctx.setExtraModal(
    <ApprovalDecideModal
      approval={approval}
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
 * Permission approvals (P12.3): tool calls a harness asked to make, decided by a deployment rule, the deployment
 * default, a person, or a timeout. Opens on the pending ones; row actions allow or deny without leaving the inbox.
 */
export const approvalsConfig = {
  id: 'approvals',
  explainer: 'approvals',
  autoRefresh: 10,
  search: false,
  defaultFilters: { status: 'Pending' },
  urlFilters: ['status', 'agentId', 'runId', 'rootRunId', 'deploymentId', 'decisionSource'],
  api: {
    list: (c, tenant, p) => c.listApprovals(tenant, p),
    create: null,
    update: null,
    remove: null
  },
  filters: [
    { name: 'status', label: (t) => t('resources.approvals.columns.status'), options: ENUMS.approvalStatus, enumGroup: 'approvalStatus' },
    { name: 'agentId', label: (t) => t('resources.approvals.columns.agentName'), options: (lookups) => Object.keys(lookups?.agents || {}), optionLabel: (o, _t, lookups) => lookups?.agents?.[o] || o },
    { name: 'decisionSource', label: (t) => t('resources.approvals.columns.decisionSource'), options: ENUMS.approvalSource, enumGroup: 'approvalSource' },
    { name: 'runId', type: 'text', label: (t) => t('resources.approvals.filters.runId'), placeholder: (t) => t('resources.approvals.filters.runIdPlaceholder') }
  ],
  // Agent names for the agent filter.
  loadLookups: async ({ apiClient, tenantId }) => {
    const agents = await safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 }));
    return { agents: Object.fromEntries(agents.map((a) => [a.id, a.name])) };
  },
  canDuplicate: false,
  isEditable: () => false,
  canDelete: () => false,
  columns: ({ t, i18n }) => {
    const lng = i18n.language;
    const na = t('common.generic.notAvailable');
    return [
      aCol(t, 'createdUtc', (r) => when(r.requestedUtc || r.createdUtc, lng), { sortable: true, pinned: true, cellClass: 'nowrap', csv: (r) => r.requestedUtc || r.createdUtc || '' }),
      aCol(t, 'agentName', (r) => (r.agentName ? <strong>{r.agentName}</strong> : <NamedId id={r.agentId} />), { sortable: true, serverSort: false, csv: (r) => r.agentName || r.agentId || '' }),
      aCol(t, 'toolName', (r) => <code>{r.toolName}</code>, { sortable: true, serverSort: false, csv: (r) => r.toolName || '' }),
      aCol(t, 'summary', (r) => (r.summary ? <code className="approval-summary" {...tip(r.summary)}>{truncate(r.summary, 80)}</code> : '-'), { csv: (r) => r.summary || '' }),
      aCol(t, 'status', (r) => <ApprovalStatusBadge status={r.status} t={t} />, { sortable: true, serverSort: false, csv: (r) => r.status || '' }),
      aCol(t, 'decision', (r) => <ApprovalDecisionBadge decision={r.decision} t={t} />, { csv: (r) => r.decision || '' }),
      aCol(t, 'decisionSource', (r) =>
        r.decisionSource ? (
          <span {...tip(enumTip(t, 'approvalSource', r.decisionSource))}>
            {enumLabel(t, 'approvalSource', r.decisionSource)}
            {r.decisionSource === 'Rule' && r.rulePattern ? (
              <>
                {' '}
                <code>{r.rulePattern}</code>
              </>
            ) : null}
          </span>
        ) : (
          '-'
        ),
      { csv: (r) => [r.decisionSource, r.rulePattern].filter(Boolean).join(' ') }),
      aCol(t, 'decidedBy', (r) => r.decidedBy || '-'),
      aCol(t, 'expiresUtc', (r) => (r.status === 'Pending' ? when(r.expiresUtc, lng) : '-'), { cellClass: 'nowrap', csv: (r) => r.expiresUtc || '' }),
      aCol(t, 'kind', (r) => (r.kind ? <span {...tip(enumTip(t, 'approvalKind', r.kind))}>{enumLabel(t, 'approvalKind', r.kind)}</span> : '-'), { defaultHidden: true, csv: (r) => r.kind || '' }),
      aCol(t, 'harnessType', (r) => enumLabel(t, 'harnessType', r.harnessType), { defaultHidden: true, csv: (r) => r.harnessType || '' }),
      aCol(t, 'runId', (r) => <CopyableId value={r.runId} />, { cellClass: 'cell-id', defaultHidden: true }),
      aCol(t, 'waitMs', (r) => formatMs(r.waitMs ?? null, lng, na), { cellClass: 'right nowrap', defaultHidden: true, sortable: true, serverSort: false }),
      aCol(t, 'reason', (r) => r.reason || '-', { defaultHidden: true }),
      aCol(t, 'decidedUtc', (r) => when(r.decidedUtc, lng), { defaultHidden: true, csv: (r) => r.decidedUtc || '' }),
      aCol(t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
    ];
  },
  fields: () => [],
  detailPath: (r) => pathFor('approvals', r.id),
  rowActions: (r, ctx) => [
    { label: ctx.t('resources.approvals.actions.allow'), tip: ctx.t('tips.resources.approvals.actions.allow'), hidden: r.status !== 'Pending', onClick: () => openDecide(ctx, r, 'Allow') },
    { label: ctx.t('resources.approvals.actions.deny'), tip: ctx.t('tips.resources.approvals.actions.deny'), hidden: r.status !== 'Pending', onClick: () => openDecide(ctx, r, 'Deny') },
    { label: ctx.t('resources.approvals.actions.openRun'), tip: ctx.t('tips.resources.approvals.actions.openRun'), hidden: !r.runId, onClick: () => ctx.navigate(pathFor('runs', r.runId)) }
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
    col('nodes', t, 'executors', (r) => ((r.executors || []).length ? r.executors : ['Process']).map((x) => enumLabel(t, 'runExecutor', x)).join(', '), { csv: (r) => ((r.executors || []).length ? r.executors : ['Process']).join(' ') }),
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

/** Which replica answered the list request (respondingNodeId), noting when it is the leader. */
function AnsweredBy({ t, listInfo }) {
  const node = listInfo?.respondingNodeId;
  if (!node) return null;
  const isLeader = (listInfo.items || []).some((n) => n.id === node && n.isLeader);
  return (
    <span data-testid="control-nodes-answered-by" {...tip(t('tips.resources.controlNodes.answeredBy'))}>
      {t(isLeader ? 'resources.controlNodes.answeredByLeader' : 'resources.controlNodes.answeredBy', { node })}
    </span>
  );
}

const count = (lng) => (v) => (v === null || v === undefined ? '-' : formatNumber(v, {}, lng));

/**
 * Control nodes: the control-plane replicas (P10.19). Read-only; each replica registers and heartbeats itself.
 * Without a status filter because the server filters only by name.
 */
export const controlNodesConfig = {
  id: 'controlNodes',
  explainer: 'controlNodes',
  autoRefresh: 15,
  defaultSort: 'name',
  defaultSortDir: 'asc',
  api: {
    list: (c, _t, p) => c.listControlNodes(p),
    create: null,
    update: null,
    remove: null
  },
  canDuplicate: false,
  isEditable: () => false,
  canDelete: () => false,
  intro: (ctx) => <AnsweredBy t={ctx.t} listInfo={ctx.listInfo} />,
  columns: ({ t, i18n }) => {
    const lng = i18n.language;
    const now = Date.now();
    const n = count(lng);
    return [
      col('controlNodes', t, 'name', (r) => (
        <>
          <strong>{r.name}</strong> <LeaderBadge node={r} t={t} />
        </>
      ), { sortable: true, pinned: true, cellClass: 'nowrap', csv: (r) => (r.isLeader ? `${r.name} (leader)` : r.name) }),
      col('controlNodes', t, 'status', (r) => <ControlNodeStatus status={r.status} t={t} />, { sortable: true, serverSort: false, csv: (r) => r.status }),
      col('controlNodes', t, 'version', (r) => r.version || '-', { cellClass: 'nowrap' }),
      col('controlNodes', t, 'schemaVersion', (r) => r.schemaVersion ?? '-', { cellClass: 'right' }),
      col('controlNodes', t, 'backplane', (r) => (r.backplane ? <span {...tip(enumTip(t, 'backplane', r.backplane))}>{enumLabel(t, 'backplane', r.backplane)}</span> : '-'), { csv: (r) => r.backplane || '' }),
      col('controlNodes', t, 'uptime', (r) => <span {...tip(formatDateTime(r.startedUtc, lng, { dateStyle: 'medium', timeStyle: 'medium' }))}>{formatUptime(r.startedUtc, lng, now)}</span>, { cellClass: 'nowrap', csv: (r) => formatUptime(r.startedUtc, lng, now) }),
      col('controlNodes', t, 'lastHeartbeatUtc', (r) => <HeartbeatAge node={r} t={t} lng={lng} now={now} />, { cellClass: 'nowrap', sortable: true, serverSort: false, csv: (r) => r.lastHeartbeatUtc || '' }),
      col('controlNodes', t, 'activeRequests', (r) => n(r.activeRequests), { cellClass: 'right', sortable: true, serverSort: false }),
      col('controlNodes', t, 'openStreams', (r) => n(r.openStreams), { cellClass: 'right', sortable: true, serverSort: false }),
      col('controlNodes', t, 'heldLongPolls', (r) => n(r.heldLongPolls), { cellClass: 'right', sortable: true, serverSort: false, defaultHidden: true }),
      col('controlNodes', t, 'address', (r) => r.address || '-', { cellClass: 'nowrap', defaultHidden: true }),
      col('controlNodes', t, 'hostname', (r) => r.hostname || '-', { defaultHidden: true }),
      col('controlNodes', t, 'startedUtc', (r) => formatDateTime(r.startedUtc, lng), { defaultHidden: true }),
      col('controlNodes', t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
    ];
  },
  // The record modal shows the read-only detail (with a fresh single read) instead of form fields.
  fields: () => [],
  formSize: 'medium',
  viewExtra: (d) => <ControlNodeDetail node={d} />
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
