// ResourceView configuration for messages between agents (AA6.12, Autonomy > Messages): mail agents and people sent,
// newest first, with the messages loop guards refused and why. Re-exported by resourceConfigs.jsx so the
// configuration-wide tests (tooltips, i18n keys, enum labels) cover it.

import CopyableId from '../components/CopyableId';
import SendMessageModal from '../components/SendMessageModal';
import { MessageRejectionBadge, MessageStatusBadge, MessageUrgencyBadge } from '../components/MessageBadges';
import { tip } from '../components/Tooltip';
import { ENUMS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatNumber, formatRelativeTime, truncate } from '../i18n/formatters';
import { copyToClipboard } from '../utils/clipboard';
import { loadCallerPermissions } from '../utils/apps';
import { resourceTip } from '../utils/tips';
import { MESSAGES_CHANGED_EVENT, messageDenied, recipientText, senderDetail, senderText, threadPath } from '../utils/messages';
import { PlusIcon } from '../components/Icons';

const ID = 'messages';

function col(t, key, render, extra = {}) {
  return { key, label: t(`resources.${ID}.columns.${key}`), tip: resourceTip(t, ID, key), render, ...extra };
}

const safeList = (promise) => promise.then((r) => r.items || []).catch(() => []);
const when = (value, lng) => (value ? <span {...tip(formatDateTime(value, lng))}>{formatRelativeTime(value, lng)}</span> : '-');
const agentOptions = (name) => (lookups, filters) => [...new Set([...Object.keys(lookups?.agents || {}), ...(filters?.[name] ? [filters[name]] : [])])];
const agentLabel = (o, _t, lookups) => lookups?.agents?.[o] || o;

/**
 * Open the Send message dialog. A sent message opens its thread; a refused one stays in the dialog with the reason, and
 * the list reloads so the Rejected view shows it.
 */
export function openSend(ctx, initial = {}) {
  const close = () => ctx.setExtraModal(null);
  ctx.setExtraModal(
    <SendMessageModal
      initial={initial}
      onClose={close}
      onDone={(sent) => {
        close();
        if (sent?.id) ctx.navigate(threadPath(sent));
        else ctx.reload?.();
      }}
    />
  );
}

/** Copy a message's ID and say whether the browser allowed it. */
async function copyId(ctx, id) {
  const ok = await copyToClipboard(id);
  ctx.addToast?.({ type: ok ? 'success' : 'error', message: ctx.t(ok ? 'messages.toasts.copied' : 'tips.copy.failed') });
}

/**
 * All messages, or only the rejected ones: a segmented control above the table that drives the status filter, so the
 * Rejected view is a link (?status=Rejected) the Home card can open.
 */
function MessagesIntro({ t, filters, setFilters }) {
  const rejected = filters?.status === 'Rejected';
  const pick = (status) => setFilters?.((prev) => ({ ...prev, status, reason: status === 'Rejected' ? prev.reason : '' }));
  return (
    <div className="messages-intro">
      <div className="range-group segmented" role="group" aria-label={t('messages.views.label')} data-testid="messages-view">
        <button type="button" aria-pressed={!rejected} className={`range-btn ${!rejected ? 'active' : ''}`} onClick={() => pick('')} data-testid="messages-view-all" {...tip(t('tips.messages.views.all'))}>
          {t('messages.views.all')}
        </button>
        <button type="button" aria-pressed={rejected} className={`range-btn ${rejected ? 'active' : ''}`} onClick={() => pick('Rejected')} data-testid="messages-view-rejected" {...tip(t('tips.messages.views.rejected'))}>
          {t('messages.views.rejected')}
        </button>
      </div>
      {rejected && (
        <p className="text-muted messages-intro-note" data-testid="messages-rejected-note">
          {t('messages.views.rejectedNote')}
        </p>
      )}
    </div>
  );
}

/**
 * Messages (AA6.12): newest first (the server orders them). Status, urgency, rejection reason, sender, recipient, and the
 * sending time window are server filters, as is search over the subject. A row opens the message's thread. Messages are
 * immutable, so there is no edit or delete; Send message in the header needs Create on AgentMessage and stays visible
 * but disabled with the reason without it. Subjects and rejection details are data and render as plain text.
 */
export const messagesConfig = {
  id: ID,
  explainer: 'messages',
  autoRefresh: 15,
  search: true,
  urlFilters: ['status', 'urgency', 'reason', 'sender', 'recipient', 'agent', 'thread', 'deliveredRunId', 'from', 'to'],
  lookupsEvents: [MESSAGES_CHANGED_EVENT],
  api: {
    list: (c, tenant, p) => c.listMessages(tenant, p),
    create: null,
    update: null,
    remove: null
  },
  detailPath: (r) => threadPath(r),
  intro: (ctx) => <MessagesIntro t={ctx.t} filters={ctx.filters} setFilters={ctx.setFilters} />,
  filters: [
    { name: 'status', label: (t) => t(`resources.${ID}.columns.status`), tip: (t) => t('tips.messages.filters.status'), options: ENUMS.messageStatus, enumGroup: 'messageStatus' },
    { name: 'urgency', label: (t) => t(`resources.${ID}.columns.urgency`), tip: (t) => t('tips.messages.filters.urgency'), options: ENUMS.messageUrgency, enumGroup: 'messageUrgency' },
    { name: 'reason', label: (t) => t('messages.filters.reason'), tip: (t) => t('tips.messages.filters.reason'), options: ENUMS.messageRejection, enumGroup: 'messageRejection' },
    { name: 'sender', label: (t) => t('messages.filters.sender'), tip: (t) => t('tips.messages.filters.sender'), options: agentOptions('sender'), optionLabel: agentLabel },
    { name: 'recipient', label: (t) => t('messages.filters.recipient'), tip: (t) => t('tips.messages.filters.recipient'), options: agentOptions('recipient'), optionLabel: agentLabel },
    { name: 'from', type: 'datetime', label: (t) => t('messages.filters.from'), tip: (t) => t('tips.messages.filters.from') },
    { name: 'to', type: 'datetime', label: (t) => t('messages.filters.to'), tip: (t) => t('tips.messages.filters.to') }
  ],
  // Agent names for the filters and columns, and the caller's permissions for Send message.
  loadLookups: async ({ apiClient, tenantId, principal }) => {
    const [agents, permissions] = await Promise.all([safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })), loadCallerPermissions(apiClient, tenantId, principal)]);
    return { agents: Object.fromEntries(agents.map((a) => [a.id, a.displayName || a.name])), permissions };
  },
  canDuplicate: false,
  bulkDelete: false,
  isEditable: () => false,
  canDelete: () => false,
  columns: ({ t, i18n, lookups }) => {
    const lng = i18n.language;
    const agents = lookups?.agents || {};
    return [
      col(t, 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, pinned: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' }),
      col(t, 'urgency', (r) => <MessageUrgencyBadge urgency={r.urgency} t={t} />, { csv: (r) => r.urgency || '' }),
      col(t, 'status', (r) => <MessageStatusBadge status={r.status} t={t} />, { csv: (r) => r.status || '' }),
      col(t, 'subject', (r) => <span className="message-subject-cell" {...tip(r.subject)}>{truncate(r.subject || '', 90)}</span>, { csv: (r) => r.subject || '' }),
      col(t, 'sender', (r) => (senderText(r, agents) ? <strong>{senderDetail(t, r, agents)}</strong> : '-'), { csv: (r) => senderText(r, agents) }),
      col(t, 'recipient', (r) => (recipientText(r, agents) ? <strong>{recipientText(r, agents)}</strong> : '-'), { csv: (r) => recipientText(r, agents) }),
      col(
        t,
        'reason',
        (r) =>
          r.rejectionReason ? (
            <span className="message-reason-cell">
              <MessageRejectionBadge reason={r.rejectionReason} t={t} />
              {r.rejectionDetail && (
                <span className="message-reason-detail" {...tip(r.rejectionDetail)}>
                  {truncate(r.rejectionDetail, 80)}
                </span>
              )}
            </span>
          ) : (
            '-'
          ),
        { csv: (r) => [r.rejectionReason || '', r.rejectionDetail || ''].filter(Boolean).join(': ') }
      ),
      col(t, 'hopCount', (r) => formatNumber(r.hopCount ?? 0, {}, lng), { defaultHidden: true, cellClass: 'right', csv: (r) => String(r.hopCount ?? 0) }),
      col(t, 'deliveredRunId', (r) => (r.deliveredRunId ? <CopyableId value={r.deliveredRunId} /> : '-'), { cellClass: 'cell-id', defaultHidden: true }),
      col(t, 'expiresUtc', (r) => when(r.expiresUtc, lng), { defaultHidden: true, cellClass: 'nowrap', csv: (r) => r.expiresUtc || '' }),
      col(t, 'escalationId', (r) => (r.escalationId ? <CopyableId value={r.escalationId} /> : '-'), { cellClass: 'cell-id', defaultHidden: true }),
      col(t, 'threadId', (r) => <CopyableId value={r.threadId || r.id} />, { cellClass: 'cell-id', defaultHidden: true }),
      col(t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
    ];
  },
  fields: () => [],
  headerActions: (ctx) => {
    const denied = messageDenied(ctx.t, ctx.lookups?.permissions, 'Create');
    return (
      <button type="button" className="button-primary" aria-disabled={denied ? 'true' : undefined} onClick={() => !denied && openSend(ctx)} data-testid="messages-send" {...tip(denied || ctx.t('tips.messages.actions.send'))}>
        <PlusIcon /> {ctx.t('messages.actions.send')}
      </button>
    );
  },
  rowActions: (r, ctx) => [
    { label: ctx.t('messages.actions.openThread'), tip: ctx.t('tips.messages.actions.openThread'), onClick: () => ctx.navigate(threadPath(r)) },
    { label: ctx.t('messages.actions.copyId'), tip: ctx.t('tips.messages.actions.copyId'), onClick: () => copyId(ctx, r.id) },
    { label: ctx.t('messages.actions.openSender'), tip: ctx.t('tips.messages.actions.openSender'), hidden: !r.senderAgentId, onClick: () => ctx.navigate(pathFor('agents', r.senderAgentId)) },
    { label: ctx.t('messages.actions.openRecipient'), tip: ctx.t('tips.messages.actions.openRecipient'), hidden: !r.recipientAgentId, onClick: () => ctx.navigate(pathFor('agents', r.recipientAgentId)) },
    { label: ctx.t('messages.actions.openDeliveredRun'), tip: ctx.t('tips.messages.actions.openDeliveredRun'), hidden: !r.deliveredRunId, onClick: () => ctx.navigate(pathFor('runs', r.deliveredRunId)) },
    { label: ctx.t('messages.actions.openEscalation'), tip: ctx.t('tips.messages.actions.openEscalation'), hidden: !r.escalationId, onClick: () => ctx.navigate(pathFor('escalations', r.escalationId)) }
  ]
};
