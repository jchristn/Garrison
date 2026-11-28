// ResourceView configuration for escalations (AA2.13, Autonomy > Escalations): questions runs raise for a person, a
// role, or another agent. Re-exported by resourceConfigs.jsx so the configuration-wide tests (tooltips, i18n keys,
// enum labels) cover it.

import ConfirmModal from '../components/ConfirmModal';
import { agentSelectLabel } from '../utils/agentLabel';
import CopyableId from '../components/CopyableId';
import EscalationAnswerModal from '../components/EscalationAnswerModal';
import { EscalationStatusBadge, EscalationSeverityBadge } from '../components/EscalationBadges';
import { tip } from '../components/Tooltip';
import { ENUMS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatRelativeTime, truncate } from '../i18n/formatters';
import { errorMessage } from '../utils/errors';
import { resourceTip } from '../utils/tips';
import { enumLabel } from '../utils/enums';
import { loadCallerPermissions } from '../utils/apps';
import { permissionDenied } from '../utils/permissions';
import { isAnswerable, optionLabel, targetText } from '../utils/escalations';

const ID = 'escalations';

function col(t, key, render, extra = {}) {
  return { key, label: t(`resources.${ID}.columns.${key}`), tip: resourceTip(t, ID, key), render, ...extra };
}

const safeList = (promise) => promise.then((r) => r.items || []).catch(() => []);
const when = (value, lng) => (value ? <span {...tip(formatDateTime(value, lng))}>{formatRelativeTime(value, lng)}</span> : '-');

/** Open the answer dialog for an escalation from a list row or the Home card. */
export function openAnswer(ctx, escalation) {
  ctx.setExtraModal(
    <EscalationAnswerModal
      escalation={escalation}
      onClose={() => ctx.setExtraModal(null)}
      onAnswered={() => {
        ctx.setExtraModal(null);
        ctx.reload?.();
      }}
    />
  );
}

/** Confirm, then cancel an open escalation; a run blocked on it is cancelled too. */
export function openCancel(ctx, escalation, onDone) {
  const { t } = ctx;
  const close = () => ctx.setExtraModal(null);
  ctx.setExtraModal(
    <ConfirmModal
      open
      danger
      title={t(`resources.${ID}.cancelTitle`)}
      message={t(escalation.mode === 'Blocking' ? `resources.${ID}.cancelBlocking` : `resources.${ID}.cancelMessage`, { agent: escalation.agentName || escalation.agentId || '-' })}
      confirmLabel={t(`resources.${ID}.actions.cancel`)}
      confirmTip={t(`tips.resources.${ID}.actions.cancel`)}
      onCancel={close}
      onConfirm={async () => {
        try {
          await ctx.apiClient.cancelEscalation(ctx.tenantId, escalation.id, {});
          ctx.addToast({ type: 'success', message: t(`resources.${ID}.toasts.cancelled`) });
          close();
          ctx.reload?.();
          onDone?.();
        } catch (e) {
          ctx.addToast({ type: 'error', message: errorMessage(t, e) });
          close();
          ctx.reload?.();
        }
      }}
    />
  );
}

/**
 * Escalations (AA2.13): open ones first (the server orders them), then the newest. Opens on the open ones; rows open
 * the escalation's page, and Answer and Cancel work without leaving the list.
 */
export const escalationsConfig = {
  id: ID,
  explainer: 'escalations',
  autoRefresh: 15,
  search: true,
  defaultFilters: { status: 'Open' },
  urlFilters: ['status', 'severity', 'targetKind', 'agentId', 'mandateId', 'raisingRunId'],
  api: {
    list: (c, tenant, p) => c.listEscalations(tenant, p),
    create: null,
    update: null,
    remove: null
  },
  detailPath: (r) => pathFor('escalations', r.id),
  filters: [
    { name: 'status', label: (t) => t(`resources.${ID}.columns.status`), options: ENUMS.escalationStatus, enumGroup: 'escalationStatus' },
    { name: 'severity', label: (t) => t(`resources.${ID}.columns.severity`), options: ENUMS.escalationSeverity, enumGroup: 'escalationSeverity' },
    { name: 'targetKind', label: (t) => t(`resources.${ID}.filters.targetKind`), options: ENUMS.escalationTargetKind, enumGroup: 'escalationTargetKind' },
    {
      name: 'agentId',
      label: (t) => t(`resources.${ID}.columns.agent`),
      options: (lookups, filters) => [...new Set([...Object.keys(lookups?.agents || {}), ...(filters?.agentId ? [filters.agentId] : [])])],
      optionLabel: (o, _t, lookups) => lookups?.agents?.[o] || o
    }
  ],
  // Agent names for the agent filter, keeper names for the keeper column, and the caller's permissions (UT-03).
  loadLookups: async ({ apiClient, tenantId, principal }) => {
    const [agents, mandates, permissions] = await Promise.all([
      safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listMandates(tenantId, { pageNumber: 1, pageSize: 1000 })),
      loadCallerPermissions(apiClient, tenantId, principal).catch(() => null)
    ]);
    return { agents: Object.fromEntries(agents.map((a) => [a.id, agentSelectLabel(a)])), mandates: Object.fromEntries(mandates.map((m) => [m.id, m.name])), permissions };
  },
  canDuplicate: false,
  isEditable: () => false,
  canDelete: () => false,
  columns: ({ t, i18n, lookups }) => {
    const lng = i18n.language;
    const target = (r) => (r.targetKind ? `${enumLabel(t, 'escalationTargetKind', r.targetKind)}${targetText(r) ? `: ${targetText(r)}` : ''}` : '-');
    const answer = (r) => (r.answerChoice ? optionLabel(r, r.answerChoice) : '') || r.answerText || '';
    return [
      col(t, 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, pinned: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' }),
      col(t, 'severity', (r) => <EscalationSeverityBadge severity={r.severity} t={t} />, { csv: (r) => r.severity || '' }),
      col(t, 'status', (r) => <EscalationStatusBadge escalation={r} t={t} />, { csv: (r) => r.status || '' }),
      col(t, 'question', (r) => <span className="escalation-question-cell" {...tip(r.question)}>{truncate(r.question || '', 90)}</span>, { csv: (r) => r.question || '' }),
      col(t, 'agent', (r) => (r.agentName ? <strong>{r.agentName}</strong> : r.agentId || '-'), { csv: (r) => r.agentName || r.agentId || '' }),
      col(t, 'target', (r) => target(r), { csv: (r) => target(r) }),
      col(t, 'expiresUtc', (r) => (r.status === 'Open' ? when(r.expiresUtc, lng) : '-'), { cellClass: 'nowrap', csv: (r) => r.expiresUtc || '' }),
      col(t, 'answer', (r) => (answer(r) ? <span {...tip(answer(r))}>{truncate(answer(r), 60)}</span> : '-'), { csv: (r) => answer(r) }),
      col(t, 'mode', (r) => enumLabel(t, 'escalationMode', r.mode), { defaultHidden: true, csv: (r) => r.mode || '' }),
      col(t, 'mandate', (r) => (r.mandateId ? lookups?.mandates?.[r.mandateId] || r.mandateId : '-'), { defaultHidden: true, csv: (r) => r.mandateId || '' }),
      col(t, 'resolvedBy', (r) => r.resolvedBy || '-', { defaultHidden: true }),
      col(t, 'resolutionSource', (r) => (r.resolutionSource ? enumLabel(t, 'escalationResolutionSource', r.resolutionSource) : '-'), { defaultHidden: true, csv: (r) => r.resolutionSource || '' }),
      col(t, 'resolvedUtc', (r) => when(r.resolvedUtc, lng), { defaultHidden: true, cellClass: 'nowrap', csv: (r) => r.resolvedUtc || '' }),
      col(t, 'raisingRunId', (r) => (r.raisingRunId ? <CopyableId value={r.raisingRunId} /> : '-'), { cellClass: 'cell-id', defaultHidden: true }),
      col(t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
    ];
  },
  fields: () => [],
  rowActions: (r, ctx) => {
    const denied = permissionDenied(ctx.t, ctx.lookups?.permissions, 'Escalation', 'Update', { resourceId: r.id });
    return [
      { label: ctx.t(`resources.${ID}.actions.answer`), tip: denied || ctx.t(`tips.resources.${ID}.actions.answer`), hidden: !isAnswerable(r), disabled: !!denied, onClick: () => openAnswer(ctx, r) },
      { label: ctx.t(`resources.${ID}.actions.openEscalatedTo`), tip: ctx.t(`tips.resources.${ID}.actions.openEscalatedTo`), hidden: !(r.status === 'Open' && r.escalatedToId), onClick: () => ctx.navigate(pathFor('escalations', r.escalatedToId)) },
      { label: ctx.t(`resources.${ID}.actions.openRun`), tip: ctx.t(`tips.resources.${ID}.actions.openRun`), hidden: !r.raisingRunId, onClick: () => ctx.navigate(pathFor('runs', r.raisingRunId)) },
      { label: ctx.t(`resources.${ID}.actions.openKeeper`), tip: ctx.t(`tips.resources.${ID}.actions.openKeeper`), hidden: !r.mandateId, onClick: () => ctx.navigate(pathFor('keepers', r.mandateId)) },
      { label: ctx.t(`resources.${ID}.actions.cancel`), tip: denied || ctx.t(`tips.resources.${ID}.actions.cancel`), hidden: !isAnswerable(r), danger: !denied, disabled: !!denied, onClick: () => openCancel(ctx, r) }
    ];
  }
};
