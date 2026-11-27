import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import SendMessageModal from './SendMessageModal';
import { MessageRejectionBadge, MessageStatusBadge, MessageUrgencyBadge } from './MessageBadges';
import { EmptyNote, ErrorBanner } from './States';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import useCallerPermissions from '../hooks/useCallerPermissions';
import { pathFor } from '../config/navConfig';
import { ENUMS } from '../utils/constants';
import { enumLabel } from '../utils/enums';
import { errorMessage, errorDetail } from '../utils/errors';
import { formatDateTime, formatNumber, formatRelativeTime, truncate } from '../i18n/formatters';
import { MESSAGES_CHANGED_EVENT, messageDenied, senderDetail, threadPath } from '../utils/messages';

/** How many of the newest messages the tab shows; the Messages page lists the rest. */
const PAGE = 50;

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
  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);
  const [sending, setSending] = useState(false);
  const lng = i18n.language;
  const agentId = agent?.id;

  const load = useCallback(() => {
    if (!apiClient || !agentId) return;
    apiClient
      .listMessages(tenantId, { recipient: agentId, ...(status ? { status } : {}), pageNumber: 1, pageSize: PAGE })
      .then((r) => {
        setPage(r);
        setError(null);
      })
      .catch(setError);
  }, [apiClient, tenantId, agentId, status]);

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

  return (
    <div className="flex-col gap-sm" data-testid="agent-inbox">
      <div className="agent-inbox-bar">
        <label className="filter-select" {...tip(t('tips.views.agentDetail.inbox.status'))}>
          <span className="sr-only">{t('views.agentDetail.inbox.status')}</span>
          <select aria-label={t('views.agentDetail.inbox.status')} value={status} onChange={(e) => setStatus(e.target.value)} data-testid="agent-inbox-status" {...tip(t('tips.views.agentDetail.inbox.status'))}>
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
      {page && items.length === 0 && !error && <EmptyNote>{t(status ? 'views.agentDetail.inbox.noneWithStatus' : 'views.agentDetail.inbox.none')}</EmptyNote>}
      {items.length > 0 && (
        <>
          <div className="table-scroll">
            <table className="data-table compact" data-testid="agent-inbox-table">
              <thead>
                <tr>
                  {['createdUtc', 'urgency', 'status', 'subject', 'sender', 'reason'].map((k) => (
                    <th key={k} scope="col" {...tip(t(`tips.resources.messages.${k}`))}>
                      {t(`resources.messages.columns.${k}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((m) => (
                  <tr key={m.id} data-message-id={m.id}>
                    <td className="nowrap">{m.createdUtc ? <span {...tip(formatDateTime(m.createdUtc, lng))}>{formatRelativeTime(m.createdUtc, lng)}</span> : '-'}</td>
                    <td>
                      <MessageUrgencyBadge urgency={m.urgency} t={t} />
                    </td>
                    <td>
                      <MessageStatusBadge status={m.status} t={t} />
                    </td>
                    <td className="message-subject-cell">
                      <a href={threadPath(m)} onClick={(e) => open(e, threadPath(m))} {...tip(t('tips.views.agentDetail.inbox.openThread'))} data-testid="agent-inbox-thread">
                        {truncate(m.subject || '', 90)}
                      </a>
                    </td>
                    <td>{senderDetail(t, m) || '-'}</td>
                    <td>{m.rejectionReason ? <MessageRejectionBadge reason={m.rejectionReason} t={t} /> : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(page.totalCount ?? items.length) > items.length && (
            <p className="text-muted">{t('views.agentDetail.inbox.more', { shown: formatNumber(items.length, {}, lng), total: formatNumber(page.totalCount, {}, lng) })}</p>
          )}
        </>
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
