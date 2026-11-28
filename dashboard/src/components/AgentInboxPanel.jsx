import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SendMessageModal from './SendMessageModal';
import { MessageRejectionBadge, MessageStatusBadge, MessageUrgencyBadge } from './MessageBadges';
import { ErrorBanner } from './States';
import TableFrame from './TableFrame';
import usePageSizePref from '../hooks/usePageSizePref';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import useCallerPermissions from '../hooks/useCallerPermissions';
import { pathFor } from '../config/navConfig';
import { ENUMS } from '../utils/constants';
import { enumLabel } from '../utils/enums';
import { errorMessage, errorDetail } from '../utils/errors';
import { formatDateTime, formatRelativeTime, truncate } from '../i18n/formatters';
import { MESSAGES_CHANGED_EVENT, messageDenied, senderDetail, threadPath } from '../utils/messages';

const TABLE_ID = 'agent-inbox';

/**
 * An agent's inbox (AA6.12): the newest messages sent to it, with a status filter, links to each thread, and Send
 * message addressed to the agent (disabled with the reason without Create on AgentMessage). Polls every 30 seconds and
 * reloads after a message is sent from the dashboard. Subjects are data and render as plain text.
 */
export default function AgentInboxPanel({ agent }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const permissions = useCallerPermissions();
  const [status, setStatus] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = usePageSizePref(TABLE_ID);
  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const lng = i18n.language;
  const agentId = agent?.id;

  const load = useCallback(() => {
    if (!apiClient || !agentId) return;
    apiClient
      .listMessages(tenantId, { recipient: agentId, ...(status ? { status } : {}), pageNumber, pageSize })
      .then((r) => {
        setPage(r);
        setError(null);
      })
      .catch(setError);
  }, [apiClient, tenantId, agentId, status, pageNumber, pageSize]);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    window.addEventListener(MESSAGES_CHANGED_EVENT, load);
    return () => {
      clearInterval(id);
      window.removeEventListener(MESSAGES_CHANGED_EVENT, load);
    };
  }, [load]);

  const denied = messageDenied(t, permissions, 'Create');
  const items = page?.items || [];
  const open = (e, to) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to);
  };
  const all = pathFor('messages', null, { recipient: agentId });
  const col = (key, extra) => ({ key, label: t(`resources.messages.columns.${key}`), tip: t(`tips.resources.messages.${key}`), ...extra });
  const columns = [
    col('createdUtc', { cellClass: 'nowrap', render: (m) => (m.createdUtc ? <span {...tip(formatDateTime(m.createdUtc, lng))}>{formatRelativeTime(m.createdUtc, lng)}</span> : '-') }),
    col('urgency', { render: (m) => <MessageUrgencyBadge urgency={m.urgency} t={t} /> }),
    col('status', { render: (m) => <MessageStatusBadge status={m.status} t={t} /> }),
    col('subject', {
      pinned: true,
      cellClass: 'message-subject-cell',
      render: (m) => (
        <a href={threadPath(m)} onClick={(e) => open(e, threadPath(m))} {...tip(t('tips.views.agentDetail.inbox.openThread'))} data-testid="agent-inbox-thread">
          {truncate(m.subject || '', 90)}
        </a>
      )
    }),
    col('sender', { render: (m) => senderDetail(t, m) || '-' }),
    col('reason', { render: (m) => (m.rejectionReason ? <MessageRejectionBadge reason={m.rejectionReason} t={t} /> : '-') })
  ];

  return (
    <div className="flex-col gap-sm" data-testid="agent-inbox">
      <div className="agent-inbox-bar">
        <label className="filter-select" {...tip(t('tips.views.agentDetail.inbox.status'))}>
          <span className="sr-only">{t('views.agentDetail.inbox.status')}</span>
          <select aria-label={t('views.agentDetail.inbox.status')} value={status} onChange={(e) => {
              setStatus(e.target.value);
              setPageNumber(1);
            }} data-testid="agent-inbox-status" {...tip(t('tips.views.agentDetail.inbox.status'))}>
            <option value="">
              {t('views.agentDetail.inbox.status')}: {t('common.generic.all')}
            </option>
            {ENUMS.messageStatus.map((s) => (
              <option key={s} value={s}>
                {enumLabel(t, 'messageStatus', s)}
              </option>
            ))}
          </select>
        </label>
        <a href={all} className="button-ghost button-sm" onClick={(e) => open(e, all)} {...tip(t('tips.views.agentDetail.inbox.openAll'))}>
          {t('views.agentDetail.inbox.openAll')}
        </a>
        <button type="button" className="button-primary button-sm" aria-disabled={denied ? 'true' : undefined} onClick={() => !denied && setSending(true)} data-testid="agent-inbox-send" {...tip(denied || t('tips.views.agentDetail.inbox.send'))}>
          {t('messages.actions.send')}
        </button>
      </div>
      {error && <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} onRetry={load} />}
      {page && (
        <TableFrame
          tableId={TABLE_ID}
          columns={columns}
          items={items}
          compact
          testId="agent-inbox-table"
          rowProps={(m) => ({ 'data-message-id': m.id })}
          emptyMessage={t(status ? 'views.agentDetail.inbox.noneWithStatus' : 'views.agentDetail.inbox.none')}
          totalRecords={page.totalCount ?? items.length}
          pageNumber={pageNumber}
          pageSize={pageSize}
          onPageChange={setPageNumber}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageNumber(1);
          }}
          onRefresh={load}
        />
      )}
      {sending && (
        <SendMessageModal
          initial={{ recipient: agentId, recipientName: agent.displayName || agent.name }}
          onClose={() => setSending(false)}
          onDone={() => {
            setSending(false);
            load();
          }}
        />
      )}
    </div>
  );
}
