import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MarkdownView from '../MarkdownView';
import { ErrorBanner } from '../States';
import { Badge } from '../StatusBadge';
import { PlusIcon, SendIcon } from '../Icons';
import { tip } from '../Tooltip';
import NewArchitectModal from './NewArchitectModal';
import StudioLink from './StudioLink';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { pathFor } from '../../config/navConfig';
import { TERMINAL_RUN_STATUSES, runStatusTone } from '../../utils/constants';
import { errorMessage } from '../../utils/errors';
import { enumLabel } from '../../utils/enums';
import { enumTip } from '../../utils/tips';
import { TURN_POLL_MS, conversationStorageKey, readStored, stripDraftPrefix, writeStored } from '../../utils/studio';

/** A run status pill. */
export function TurnStatus({ status }) {
  const { t } = useTranslation();
  return (
    <Badge tone={runStatusTone(status)} tip={enumTip(t, 'runStatus', status)}>
      {enumLabel(t, 'runStatus', status)}
    </Badge>
  );
}

/**
 * The chat with the agent architect for one draft (AD7.10). The person picks an architect deployment (managementAccess
 * Drafts) or creates one, and talks to it through the conversation API the Conversations page uses: the first message
 * starts a conversation on that deployment and carries the draft's ID and title, the next ones continue it. Replies
 * are polled until the turn ends, like a conversation's page; then `onTurnFinished` lets the workspace reload the draft
 * the architect changed. The conversation of a draft is remembered in this browser (the draft's own conversationId
 * when it has one).
 */
export default function StudioChatPanel({ draft, architects, architectId, onArchitectChange, onArchitectCreated, deniedArchitect = '', onTurnFinished }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const stored = readStored(conversationStorageKey(draft.id));
  const [binding, setBinding] = useState(() => stored || (draft.conversationId ? { conversationId: draft.conversationId, deploymentId: null } : null));
  const [turns, setTurns] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState(null);
  const [creating, setCreating] = useState(false);
  const unmounted = useRef(false);
  const architect = architects.find((d) => d.id === architectId) || null;
  // A conversation stays on the deployment of its first turn; another architect starts a new conversation.
  const conversationId = binding && (!binding.deploymentId || binding.deploymentId === architectId) ? binding.conversationId : null;

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  const loadTurns = useCallback(() => {
    if (!apiClient || !conversationId) {
      setTurns([]);
      return Promise.resolve();
    }
    return apiClient
      .listConversationRuns(tenantId, conversationId)
      .then((r) => !unmounted.current && setTurns(r.items || []))
      .catch(() => !unmounted.current && setTurns([]));
  }, [apiClient, tenantId, conversationId]);

  useEffect(() => {
    loadTurns();
  }, [loadTurns]);

  const pendingActive = !!pending && !TERMINAL_RUN_STATUSES.includes(pending.status);
  useEffect(() => {
    if (!pendingActive) return undefined;
    const id = setInterval(async () => {
      try {
        const run = await apiClient.getRun(tenantId, pending.id);
        if (unmounted.current) return;
        setPending(run);
        if (TERMINAL_RUN_STATUSES.includes(run.status)) {
          loadTurns();
          onTurnFinished?.();
        }
      } catch {
        /* keep polling */
      }
    }, TURN_POLL_MS);
    return () => clearInterval(id);
  }, [pendingActive, pending, apiClient, tenantId, loadTurns, onTurnFinished]);

  const send = async () => {
    const text = message.trim();
    if (!text || sending || pendingActive || !architect) return;
    setSending(true);
    setError(null);
    try {
      const body = conversationId ? { input: text, conversationId } : { input: text, deploymentId: architect.id, startConversation: true, studioDraftId: draft.id };
      const created = await apiClient.invokeAgent(tenantId, architect.agentId, body, { wait: false });
      const run = created?.run || created;
      if (unmounted.current) return;
      setMessage('');
      if (!conversationId && run?.conversationId) {
        const next = { conversationId: run.conversationId, deploymentId: architect.id };
        writeStored(conversationStorageKey(draft.id), next);
        setBinding(next);
      }
      if (run?.id) {
        setPending(run);
        setTurns((list) => [...list.filter((r) => r.id !== run.id), { ...run, inputText: run.inputText || body.input }]);
      }
    } catch (e) {
      if (!unmounted.current) setError(e);
    } finally {
      if (!unmounted.current) setSending(false);
    }
  };

  const newConversation = () => {
    writeStored(conversationStorageKey(draft.id), null);
    setBinding(null);
    setTurns([]);
    setPending(null);
  };

  const shownTurns = turns.map((r) => (pending && r.id === pending.id ? { ...r, ...pending, inputText: r.inputText || pending.inputText } : r));

  return (
    <section className="panel studio-chat" aria-label={t('components.studio.chat.title')} data-testid="studio-chat">
      <div className="studio-row-between">
        <h3 className="section-title" {...tip(t('tips.studio.chat.title'))}>
          {t('components.studio.chat.title')}
        </h3>
        <div className="flex gap-sm items-center">
          <label htmlFor="studio-architect" className="sr-only" {...tip(t('tips.studio.chat.architect'))}>
            {t('components.studio.chat.architect')}
          </label>
          <select id="studio-architect" value={architectId || ''} onChange={(e) => onArchitectChange(e.target.value)} data-testid="studio-architect" {...tip(t('tips.studio.chat.architect'))}>
            <option value="">{t('components.studio.chat.chooseArchitect')}</option>
            {architects.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="button-secondary button-sm"
            onClick={() => !deniedArchitect && setCreating(true)}
            aria-disabled={deniedArchitect ? 'true' : undefined}
            data-testid="studio-new-architect"
            {...tip(deniedArchitect || t('tips.studio.chat.newArchitect'))}
          >
            <PlusIcon size={14} /> {t('components.studio.chat.newArchitect')}
          </button>
          <StudioLink to={pathFor('architects')} testId="studio-manage-architects" tipText={t('tips.studio.chat.manageArchitects')}>
            {t('components.studio.chat.manageArchitects')}
          </StudioLink>
          {conversationId && (
            <>
              <StudioLink to={pathFor('conversations', conversationId)} testId="studio-chat-conversation" tipText={t('tips.studio.chat.openConversation')}>
                {t('components.studio.chat.openConversation')}
              </StudioLink>
              <button type="button" className="button-ghost button-sm" onClick={newConversation} data-testid="studio-chat-new-conversation" {...tip(t('tips.studio.chat.newConversation'))}>
                {t('components.studio.chat.newConversation')}
              </button>
            </>
          )}
        </div>
      </div>
      {architects.length === 0 && (
        <div className="info-banner" role="note" data-testid="studio-no-architect">
          <span>{t('components.studio.chat.noArchitect')}</span>
        </div>
      )}
      <div className="studio-chat-turns" data-testid="studio-chat-turns">
        {shownTurns.length === 0 ? (
          <div className="text-muted">{t(architect ? 'components.studio.chat.empty' : 'components.studio.chat.pickFirst')}</div>
        ) : (
          shownTurns.map((r) => (
            <div key={r.id} className="studio-turn" data-turn={r.id}>
              <div className="studio-turn-you">
                <span className="studio-turn-who" {...tip(t('tips.studio.chat.you'))}>
                  {t('components.studio.chat.you')}
                </span>
                <div className="studio-turn-text">{stripDraftPrefix(r.inputText)}</div>
              </div>
              <div className="studio-turn-architect">
                <span className="studio-turn-who inline-meta">
                  <span {...tip(t('tips.studio.chat.architectSays'))}>{t('components.studio.chat.architectSays')}</span> <TurnStatus status={r.status} />
                  <StudioLink to={pathFor('runs', r.id)} tipText={t('tips.studio.chat.openRun')}>
                    {t('components.studio.chat.openRun')}
                  </StudioLink>
                </span>
                {r.resultText || r.errorMessage ? (
                  <MarkdownView text={r.resultText || r.errorMessage} testId="studio-chat-answer" />
                ) : (
                  <div className="text-muted">{TERMINAL_RUN_STATUSES.includes(r.status) ? '-' : t('components.studio.chat.thinking')}</div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
      <div className="field">
        <label htmlFor="studio-chat-message" {...tip(t('tips.studio.chat.message'))}>
          {t('components.studio.chat.message')}
        </label>
        <textarea
          id="studio-chat-message"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t('components.studio.chat.placeholder')}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === 'Enter' && send()}
          data-testid="studio-chat-message"
          {...tip(t('tips.studio.chat.message'))}
        />
        <div className="field-hint">{t(conversationId ? 'components.studio.chat.continueHint' : 'components.studio.chat.firstHint')}</div>
      </div>
      {error && <ErrorBanner message={errorMessage(t, error)} />}
      <div className="flex gap-sm items-center">
        <button
          type="button"
          className="button-primary"
          onClick={send}
          disabled={sending || pendingActive || !message.trim() || !architect}
          data-testid="studio-chat-send"
          {...tip(t(!architect ? 'tips.studio.chat.sendNoArchitect' : pendingActive ? 'tips.studio.chat.sendBusy' : 'tips.studio.chat.send'))}
        >
          <SendIcon size={14} /> {sending ? t('views.invoke.sending') : t('components.studio.chat.send')}
        </button>
      </div>
      {creating && (
        <NewArchitectModal
          onClose={() => setCreating(false)}
          onCreated={(deployment) => {
            setCreating(false);
            onArchitectCreated?.(deployment);
          }}
        />
      )}
    </section>
  );
}
