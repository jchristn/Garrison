import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import CopyableId from '../components/CopyableId';
import JsonViewerModal from '../components/JsonViewerModal';
import SendMessageModal from '../components/SendMessageModal';
import { MessageRejectionBadge, MessageStatusBadge, MessageUrgencyBadge } from '../components/MessageBadges';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { CodeIcon } from '../components/Icons';
import { tip } from '../components/Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import useCallerPermissions from '../hooks/useCallerPermissions';
import { pathFor } from '../config/navConfig';
import { errorMessage, errorDetail } from '../utils/errors';
import { formatBytes, formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { MESSAGES_CHANGED_EVENT, messageDenied, recipientText, senderDetail } from '../utils/messages';

function Link({ to, tipText, children, testId }) {
  const navigate = useNavigate();
  return (
    <a
      href={to}
      data-testid={testId}
      {...tip(tipText)}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

function Field({ name, t, children }) {
  return (
    <div className="message-field" data-message-field={name}>
      <dt {...tip(t(`tips.views.messageThread.fields.${name}`))}>{t(`views.messageThread.fields.${name}`)}</dt>
      <dd>{children ?? '-'}</dd>
    </div>
  );
}

/** One message of the thread: who sent it to whom, its badges, the rejection, links, the body, and its artifacts. */
function ThreadMessage({ m, t, lng, picked, canReply, replyDenied, onReply }) {
  const when = (value) => (value ? <span {...tip(formatRelativeTime(value, lng))}>{formatDateTime(value, lng, { dateStyle: 'medium', timeStyle: 'medium' })}</span> : null);
  const sender = senderDetail(t, m);
  const recipient = recipientText(m);
  const artifacts = m.artifacts || [];
  return (
    <li className={`panel message-card ${picked ? 'message-card-picked' : ''} ${m.status === 'Rejected' ? 'message-card-rejected' : ''}`.trim()} data-testid="thread-message" data-message-id={m.id} aria-current={picked ? 'true' : undefined}>
      <div className="message-card-head">
        <h2 className="message-subject">{m.subject}</h2>
        <span className="inline-meta">
          <MessageUrgencyBadge urgency={m.urgency} t={t} /> <MessageStatusBadge status={m.status} t={t} />
        </span>
      </div>
      <dl className="message-fields">
        <Field name="sender" t={t}>
          {m.senderAgentId ? (
            <Link to={pathFor('agents', m.senderAgentId)} tipText={t('tips.views.messageThread.openSender')} testId="thread-sender-link">
              {sender}
            </Link>
          ) : (
            sender || '-'
          )}
        </Field>
        <Field name="recipient" t={t}>
          {m.recipientAgentId ? (
            <Link to={pathFor('agents', m.recipientAgentId)} tipText={t('tips.views.messageThread.openRecipient')} testId="thread-recipient-link">
              {recipient}
            </Link>
          ) : (
            recipient || '-'
          )}
        </Field>
        <Field name="createdUtc" t={t}>{when(m.createdUtc)}</Field>
        <Field name="hopCount" t={t}>{formatNumber(m.hopCount ?? 0, {}, lng)}</Field>
        {m.deliveredRunId && (
          <Field name="deliveredRunId" t={t}>
            <Link to={pathFor('runs', m.deliveredRunId)} tipText={t('tips.views.messageThread.openDeliveredRun')} testId="thread-run-link">
              <code>{m.deliveredRunId}</code>
            </Link>
          </Field>
        )}
        {m.deliveredUtc && <Field name="deliveredUtc" t={t}>{when(m.deliveredUtc)}</Field>}
        {m.acknowledgedUtc && <Field name="acknowledgedUtc" t={t}>{when(m.acknowledgedUtc)}</Field>}
        {m.expiresUtc && m.status === 'Queued' && <Field name="expiresUtc" t={t}>{when(m.expiresUtc)}</Field>}
        {m.wokeRecipient && <Field name="wokeRecipient" t={t}>{t('views.messageThread.woke')}</Field>}
        {m.escalationId && (
          <Field name="escalationId" t={t}>
            <Link to={pathFor('escalations', m.escalationId)} tipText={t('tips.views.messageThread.openEscalation')} testId="thread-escalation-link">
              <code>{m.escalationId}</code>
            </Link>
          </Field>
        )}
        <Field name="id" t={t}>
          <CopyableId value={m.id} />
        </Field>
      </dl>
      {m.rejectionReason && (
        <div className="message-rejected-note" data-testid="thread-rejection">
          <MessageRejectionBadge reason={m.rejectionReason} t={t} />
          <span className="message-text">{m.rejectionDetail || t('views.messageThread.noDetail')}</span>
        </div>
      )}
      {m.body ? (
        <pre className="message-body" data-testid="thread-body">
          {m.body}
        </pre>
      ) : (
        <p className="text-muted">{t('views.messageThread.noBody')}</p>
      )}
      {artifacts.length > 0 && (
        <ul className="message-artifacts" aria-label={t('views.messageThread.artifacts')} data-testid="thread-artifacts">
          {artifacts.map((a) => (
            <li key={a.artifactId}>
              <span className="message-text">{a.name || a.artifactId}</span> <span className="text-muted">{[a.mediaType, a.sizeBytes != null ? formatBytes(a.sizeBytes, lng) : ''].filter(Boolean).join(', ')}</span>
            </li>
          ))}
        </ul>
      )}
      {canReply && (
        <div className="message-card-actions">
          <button type="button" className="button-secondary button-sm" aria-disabled={replyDenied ? 'true' : undefined} onClick={() => !replyDenied && onReply(m)} data-testid="thread-reply" {...tip(replyDenied || t('tips.views.messageThread.reply'))}>
            {t('views.messageThread.reply')}
          </button>
        </div>
      )}
    </li>
  );
}

/**
 * One message thread (AA6.12): every message oldest first, rejected ones included with their reason, each with its
 * sender, recipient, urgency, status, hop count, time, and body. Bodies are data an agent or a person wrote and render
 * as plain text, never as markup. ?message=<id> picks one message out. Reply answers a message an agent sent.
 */
export default function MessageThreadView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const permissions = useCallerPermissions();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState(null);
  const [error, setError] = useState(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const lng = i18n.language;
  const picked = searchParams.get('message') || '';

  const load = useCallback(() => {
    if (!apiClient || !recordId) return;
    apiClient
      .getMessageThread(tenantId, recordId)
      .then((list) => {
        setMessages(Array.isArray(list) ? list : []);
        setError(null);
      })
      .catch((e) => setError(e));
  }, [apiClient, tenantId, recordId]);

  useEffect(load, [load]);

  useEffect(() => {
    window.addEventListener(MESSAGES_CHANGED_EVENT, load);
    return () => window.removeEventListener(MESSAGES_CHANGED_EVENT, load);
  }, [load]);

  useEffect(() => {
    if (!picked || !messages) return;
    const el = [...document.querySelectorAll('[data-testid="thread-message"]')].find((node) => node.getAttribute('data-message-id') === picked);
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'center' });
  }, [picked, messages]);

  if (error && !messages) {
    return (
      <div>
        <PageHeader title={t('views.messageThread.title')} />
        <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} onRetry={load} />
        {error?.status === 404 && <EmptyState title={t('views.messageThread.notFoundTitle')} body={t('views.messageThread.notFoundBody')} />}
      </div>
    );
  }
  if (!messages) return <LoadingState />;

  const first = messages[0];
  const rejected = messages.filter((m) => m.status === 'Rejected').length;
  const replyDenied = messageDenied(t, permissions, 'Create');

  return (
    <div data-testid="message-thread">
      <PageHeader
        title={first?.subject || t('views.messageThread.title')}
        subtitle={
          <span className="inline-meta">
            <CopyableId value={recordId} max={40} /> <span>{t('views.messageThread.count', { count: messages.length })}</span>
            {rejected > 0 && <span className="text-muted">{t('views.messageThread.rejectedCount', { count: rejected })}</span>}
          </span>
        }
        actions={
          <>
            <Link to={pathFor('messages')} tipText={t('tips.views.messageThread.back')} testId="thread-back">
              {t('views.messageThread.back')}
            </Link>
            <button type="button" className="button-secondary" onClick={() => setJsonOpen(true)} {...tip(t('tips.views.messageThread.viewJson'))}>
              <CodeIcon /> {t('common.actions.viewJson')}
            </button>
          </>
        }
      />

      <p className="text-muted message-untrusted" data-testid="thread-untrusted">
        {t('messages.untrusted')}
      </p>

      {messages.length === 0 ? (
        <EmptyState title={t('views.messageThread.emptyTitle')} body={t('views.messageThread.emptyBody')} />
      ) : (
        <ol className="message-thread" aria-label={t('views.messageThread.listLabel')}>
          {messages.map((m) => (
            <ThreadMessage key={m.id} m={m} t={t} lng={lng} picked={m.id === picked} canReply={!!m.senderAgentId && m.status !== 'Rejected'} replyDenied={replyDenied} onReply={setReplyTo} />
          ))}
        </ol>
      )}

      {replyTo && (
        <SendMessageModal
          initial={{ recipient: replyTo.senderAgentId, recipientName: replyTo.senderAgentName, subject: replySubject(t, replyTo.subject), parentMessageId: replyTo.id }}
          onClose={() => setReplyTo(null)}
          onDone={() => {
            setReplyTo(null);
            load();
          }}
        />
      )}
      <JsonViewerModal open={jsonOpen} value={messages} onClose={() => setJsonOpen(false)} />
    </div>
  );
}

/** "Re: subject", unless the subject already starts with the reply prefix; kept within the 256-character limit. */
function replySubject(t, subject) {
  const prefix = t('views.messageThread.replyPrefix');
  const text = subject || '';
  return (text.startsWith(prefix) ? text : `${prefix}${text}`).slice(0, 256);
}
