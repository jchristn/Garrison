import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import TranscriptExportMenu from '../components/TranscriptExportMenu';
import CopyableId from '../components/CopyableId';
import ConfirmModal from '../components/ConfirmModal';
import JsonViewerModal from '../components/JsonViewerModal';
import NamedId from '../components/NamedId';
import Explainer from '../components/Explainer';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { SendIcon, TrashIcon, CodeIcon } from '../components/Icons';
import { RunStatus, ConversationState, FallbackReason, TurnSession, conversationTitle } from './runConfigs';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { TERMINAL_RUN_STATUSES } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { errorMessage } from '../utils/errors';
import { enumTip } from '../utils/tips';
import { enumLabel } from '../utils/enums';
import { formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { textPreview } from '../utils/conversations';
import { tip } from '../components/Tooltip';

/** How often (ms) the page refreshes while a turn is unfinished. */
const POLL_MS = 2000;

function Detail({ label, tip: tipText, children }) {
  return (
    <div className="detail-item">
      <div className="detail-item-label" {...tip(tipText)}>
        {label}
      </div>
      <div className="detail-item-value">{children ?? '-'}</div>
    </div>
  );
}

/** A link to another dashboard page that navigates in place. */
function PageLink({ to, tipText, navigate, children, testId }) {
  return (
    <a
      href={to}
      data-testid={testId}
      {...tip(tipText)}
      onClick={(e) => {
        e.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

/** One conversation: summary, the turns (runs) oldest first, a box to send the next turn, and delete (P12.1). */
export default function ConversationDetailView({ recordId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const lng = i18n.language;
  const [conversation, setConversation] = useState(null);
  const [turns, setTurns] = useState([]);
  const [error, setError] = useState(null);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [pending, setPending] = useState(null);
  const [deployment, setDeployment] = useState(null);
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  const load = useCallback(() => {
    if (!apiClient || !recordId) return Promise.resolve();
    return Promise.all([apiClient.getConversation(tenantId, recordId), apiClient.listConversationRuns(tenantId, recordId).catch(() => null)])
      .then(([c, r]) => {
        if (unmounted.current) return;
        setConversation(c);
        if (r) setTurns(r.items || []);
        setError(null);
      })
      .catch((e) => !unmounted.current && setError(e));
  }, [apiClient, tenantId, recordId]);

  useEffect(() => {
    load();
  }, [load]);

  const deploymentId = conversation?.deploymentId;
  useEffect(() => {
    if (!apiClient || !deploymentId) return;
    apiClient
      .getDeployment(tenantId, deploymentId)
      .then((d) => setDeployment({ name: d?.name, deleted: false }))
      .catch((e) => setDeployment({ name: null, deleted: e?.status === 404 }));
  }, [apiClient, tenantId, deploymentId]);

  // Refresh while a turn is unfinished, so status, outcome, and the result appear without reloading.
  const pendingActive = !!pending && !TERMINAL_RUN_STATUSES.includes(pending.status);
  const working = !!conversation?.busy || pendingActive;
  useEffect(() => {
    if (!working) return undefined;
    const id = setInterval(async () => {
      if (pending?.id && pendingActive) {
        try {
          const r = await apiClient.getRun(tenantId, pending.id);
          if (!unmounted.current) setPending(r);
        } catch {
          /* keep polling */
        }
      }
      load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [working, pending, pendingActive, apiClient, tenantId, load]);

  const send = async () => {
    if (!conversation || sending || !message.trim() || conversation.busy) return;
    setSending(true);
    setSendError(null);
    try {
      const created = await apiClient.invokeAgent(tenantId, conversation.agentId, { input: message, conversationId: conversation.id }, { wait: false });
      const run = created?.run || created;
      if (unmounted.current) return;
      setMessage('');
      if (run?.id) setPending(run);
      addToast({ type: 'success', message: t('views.conversationDetail.turnStarted', { turn: run?.conversationTurn || (conversation.turnCount ?? 0) + 1 }) });
      load();
    } catch (e) {
      if (!unmounted.current) setSendError(e);
    } finally {
      if (!unmounted.current) setSending(false);
    }
  };

  const remove = async () => {
    try {
      await apiClient.deleteConversation(tenantId, recordId);
      addToast({ type: 'success', message: t('common.toasts.deleted') });
      setConfirmDelete(false);
      navigate(pathFor('conversations'));
    } catch (e) {
      // 409 ConversationBusy: the previous turn is unfinished; the translated message says to wait or cancel it.
      addToast({ type: 'error', message: errorMessage(t, e) });
      setConfirmDelete(false);
      load();
    }
  };

  if (error && !conversation) {
    return (
      <div>
        <PageHeader title={t('views.conversationDetail.title')} />
        <ErrorBanner message={errorMessage(t, error)} onRetry={load} />
        <EmptyState title={t('views.conversationDetail.notFoundTitle')} body={t('views.conversationDetail.notFoundBody')} />
      </div>
    );
  }
  if (!conversation) return <LoadingState />;

  const c = conversation;
  const when = (v) => (v ? <span {...tip(formatDateTime(v, lng))}>{formatRelativeTime(v, lng)}</span> : '-');
  const runLink = (id) => (
    <PageLink to={pathFor('runs', id)} tipText={t('tips.views.conversationDetail.openRun')} navigate={navigate}>
      <code>{id}</code>
    </PageLink>
  );

  return (
    <div data-testid="conversation-detail">
      <PageHeader
        title={conversationTitle(t, c)}
        subtitle={
          <span className="inline-meta">
            <CopyableId value={c.id} max={40} /> <ConversationState conversation={c} t={t} />
          </span>
        }
        actions={
          <>
            <button type="button" className="button-secondary" onClick={() => setJsonOpen(true)} {...tip(t('tips.views.conversationDetail.viewJson'))}>
              <CodeIcon /> {t('common.actions.viewJson')}
            </button>
            <TranscriptExportMenu id={c.id} load={(format, thinking) => apiClient.conversationTranscript(tenantId, c.id, format, thinking)} testId="conversation-transcript-export" />
            <button type="button" className="button-secondary" onClick={() => navigate(pathFor('runs', null, { conversationId: c.id }))} data-testid="conversation-runs" {...tip(t('tips.resources.conversations.actions.runs'))}>
              {t('resources.conversations.actions.runs')}
            </button>
            <button type="button" className="button-secondary" onClick={() => navigate(pathFor('invoke', null, { agentId: c.agentId, conversationId: c.id }))} data-testid="conversation-open-invoke" {...tip(t('tips.views.conversationDetail.openInvoke'))}>
              <SendIcon size={14} /> {t('views.conversationDetail.openInvoke')}
            </button>
            <button type="button" className="button-danger" onClick={() => setConfirmDelete(true)} data-testid="conversation-delete" {...tip(t(c.busy ? 'tips.views.conversationDetail.deleteBusy' : 'tips.views.conversationDetail.delete'))}>
              <TrashIcon size={14} /> {t('common.actions.delete')}
            </button>
          </>
        }
      />

      <Explainer topic="conversations" />

      <div className="panel detail-grid conversation-summary">
        <Detail label={t('resources.conversations.columns.agentName')} tip={t('tips.views.conversationDetail.agent')}>
          <PageLink to={pathFor('agents', c.agentId)} tipText={t('tips.views.conversationDetail.openAgent')} navigate={navigate}>
            {c.agentName || c.agentId}
          </PageLink>
        </Detail>
        <Detail label={t('views.conversationDetail.deployment')} tip={t('tips.views.conversationDetail.deployment')}>
          {c.deploymentId ? <NamedId id={c.deploymentId} name={deployment?.name || (deployment?.deleted ? c.deploymentId : null)} deleted={!!deployment?.deleted} /> : '-'}
        </Detail>
        <Detail label={t('resources.conversations.columns.harnessType')} tip={t('tips.resources.conversations.harnessType')}>
          <span {...tip(enumTip(t, 'harnessType', c.harnessType))}>{enumLabel(t, 'harnessType', c.harnessType)}</span>
        </Detail>
        <Detail label={t('resources.conversations.columns.turnCount')} tip={t('tips.resources.conversations.turnCount')}>{formatNumber(c.turnCount ?? 0, {}, lng)}</Detail>
        <Detail label={t('resources.conversations.columns.sessionId')} tip={t('tips.resources.conversations.sessionId')}>{c.sessionId ? <CopyableId value={c.sessionId} max={40} /> : null}</Detail>
        <Detail label={t('resources.conversations.columns.affinityNodeName')} tip={t('tips.resources.conversations.affinityNodeName')}>{c.affinityNodeName || c.affinityNodeId}</Detail>
        <Detail label={t('resources.conversations.columns.fallbackCount')} tip={t('tips.resources.conversations.fallbackCount')}>{formatNumber(c.fallbackCount ?? 0, {}, lng)}</Detail>
        <Detail label={t('resources.conversations.columns.lastFallbackReason')} tip={t('tips.resources.conversations.lastFallbackReason')}>
          {c.lastFallbackReason ? (
            <span className="inline-meta">
              <FallbackReason reason={c.lastFallbackReason} t={t} /> {c.lastFallbackUtc && <span className="text-muted">{when(c.lastFallbackUtc)}</span>}
            </span>
          ) : null}
        </Detail>
        <Detail label={t('resources.conversations.columns.contextId')} tip={t('tips.resources.conversations.contextId')}>{c.contextId ? <CopyableId value={c.contextId} max={40} /> : null}</Detail>
        <Detail label={t('resources.conversations.columns.callerName')} tip={t('tips.resources.conversations.callerName')}>
          {c.callerName || c.callerId ? `${c.callerName || c.callerId} (${enumLabel(t, 'principalType', c.callerType)})` : null}
        </Detail>
        <Detail label={t('views.conversationDetail.activeRun')} tip={t('tips.views.conversationDetail.activeRun')}>{c.activeRunId ? runLink(c.activeRunId) : null}</Detail>
        <Detail label={t('resources.conversations.columns.lastActivityUtc')} tip={t('tips.resources.conversations.lastActivityUtc')}>{when(c.lastActivityUtc)}</Detail>
        <Detail label={t('resources.conversations.columns.createdUtc')} tip={t('tips.resources.conversations.createdUtc')}>{formatDateTime(c.createdUtc, lng)}</Detail>
      </div>

      <section className="panel" aria-label={t('views.conversationDetail.turns')}>
        <h3 className="section-title" {...tip(t('tips.views.conversationDetail.turns'))}>
          {t('views.conversationDetail.turnsCount', { count: turns.length })}
        </h3>
        {turns.length === 0 ? (
          <div className="text-muted">{t('views.conversationDetail.noTurns')}</div>
        ) : (
          <div className="table-scroll">
            <table className="data-table" data-testid="conversation-turns">
              <thead>
                <tr>
                  <th scope="col" className="right" {...tip(t('tips.views.conversationDetail.columns.turn'))}>{t('views.conversationDetail.columns.turn')}</th>
                  <th scope="col" {...tip(t('tips.views.conversationDetail.columns.run'))}>{t('views.conversationDetail.columns.run')}</th>
                  <th scope="col" {...tip(t('tips.views.conversationDetail.columns.status'))}>{t('views.conversationDetail.columns.status')}</th>
                  <th scope="col" {...tip(t('tips.views.conversationDetail.columns.outcome'))}>{t('views.conversationDetail.columns.outcome')}</th>
                  <th scope="col" {...tip(t('tips.views.conversationDetail.columns.session'))}>{t('views.conversationDetail.columns.session')}</th>
                  <th scope="col" {...tip(t('tips.views.conversationDetail.columns.input'))}>{t('views.conversationDetail.columns.input')}</th>
                  <th scope="col" {...tip(t('tips.views.conversationDetail.columns.result'))}>{t('views.conversationDetail.columns.result')}</th>
                  <th scope="col" {...tip(t('tips.views.conversationDetail.columns.node'))}>{t('views.conversationDetail.columns.node')}</th>
                  <th scope="col" {...tip(t('tips.views.conversationDetail.columns.created'))}>{t('views.conversationDetail.columns.created')}</th>
                </tr>
              </thead>
              <tbody>
                {turns.map((r) => {
                  const input = textPreview(r.inputText, 120);
                  const result = textPreview(r.resultText || r.errorMessage, 160);
                  return (
                    <tr key={r.id} data-turn={r.conversationTurn}>
                      <td className="right">{formatNumber(r.conversationTurn ?? 0, {}, lng)}</td>
                      <td className="cell-id">{runLink(r.id)}</td>
                      <td>
                        <RunStatus status={r.status} t={t} />
                      </td>
                      <td>{r.outcome && r.outcome !== 'None' ? <span {...tip(enumTip(t, 'runOutcome', r.outcome))}>{enumLabel(t, 'runOutcome', r.outcome)}</span> : '-'}</td>
                      <td>
                        <TurnSession run={r} t={t} />
                      </td>
                      <td className="conversation-preview">{input ? <span {...tip(textPreview(r.inputText, 600))}>{input}</span> : '-'}</td>
                      <td className="conversation-preview">{result ? <span {...tip(textPreview(r.resultText || r.errorMessage, 600))}>{result}</span> : <span className="text-muted">{TERMINAL_RUN_STATUSES.includes(r.status) ? '-' : t('views.conversationDetail.pending')}</span>}</td>
                      <td>{r.leaseNodeName || '-'}</td>
                      <td className="nowrap">{when(r.createdUtc)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="panel conversation-continue" aria-label={t('views.conversationDetail.continueTitle')}>
        <h3 className="section-title" {...tip(t('tips.views.conversationDetail.continueTitle'))}>
          {t('views.conversationDetail.continueTitle')}
        </h3>
        <div className="field">
          <label htmlFor="conversation-message" {...tip(t('tips.views.conversationDetail.message'))}>{t('views.conversationDetail.message')}</label>
          <textarea
            id="conversation-message"
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t('views.conversationDetail.messagePlaceholder')}
            onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && send()}
            data-testid="conversation-message"
            {...tip(t('tips.views.conversationDetail.message'))}
          />
          <div className="field-hint">{t('views.invoke.shortcut')}</div>
        </div>
        {c.busy && (
          <div className="info-banner" role="status" data-testid="conversation-busy">
            {t('views.conversationDetail.busyNotice')}
          </div>
        )}
        {sendError && <ErrorBanner message={errorMessage(t, sendError)} />}
        <div className="flex gap-sm items-center">
          <button type="button" className="button-primary" onClick={send} disabled={sending || !message.trim() || !!c.busy} data-testid="conversation-send" {...tip(t(c.busy ? 'tips.views.conversationDetail.sendBusy' : 'tips.views.conversationDetail.send'))}>
            <SendIcon size={14} /> {sending ? t('views.invoke.sending') : t('views.conversationDetail.send')}
          </button>
          {pending && (
            <span className="inline-meta" data-testid="conversation-pending">
              <RunStatus status={pending.status} t={t} /> {runLink(pending.id)}
            </span>
          )}
        </div>
      </section>

      <ConfirmModal
        open={confirmDelete}
        danger
        title={t('resources.conversations.deleteTitle')}
        message={t('views.conversationDetail.confirmDelete', { title: conversationTitle(t, c) })}
        confirmLabel={t('common.actions.delete')}
        confirmTip={t('tips.views.conversationDetail.delete')}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
      <JsonViewerModal open={jsonOpen} value={c} onClose={() => setJsonOpen(false)} />
    </div>
  );
}
