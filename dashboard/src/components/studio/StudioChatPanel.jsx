import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBanner } from '../States';
import { PlusIcon, SendIcon } from '../Icons';
import { tip } from '../Tooltip';
import ChatTurn from './ChatTurn';
import NewArchitectModal from './NewArchitectModal';
import StudioLink from './StudioLink';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { pathFor } from '../../config/navConfig';
import { TERMINAL_RUN_STATUSES } from '../../utils/constants';
import { errorMessage } from '../../utils/errors';
import { TURN_POLL_MS, conversationStorageKey, needsCredential, readStored, writeStored } from '../../utils/studio';
import { buildPreview } from '../../utils/streamPreview';
import { composerKeyDown } from '../../utils/composerKeys';

/** How often streamed events are folded into the answer, in milliseconds. */
const STREAM_FLUSH_MS = 100;

/** Pages of 500 events read for a finished turn's tool calls. */
const HISTORY_PAGES = 4;

/** How close to the bottom (pixels) the transcript must be for new output to keep it scrolled to the end. */
const STICK_PX = 140;

export { TurnStatus } from './ChatTurn';

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
  // The architect's harness profile, to warn before the first turn when its harness needs a credential and has none.
  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (!apiClient || !architect?.harnessProfileId) {
      setProfile(null);
      return undefined;
    }
    let active = true;
    apiClient
      .getHarnessProfile(tenantId, architect.harnessProfileId)
      .then((p) => active && setProfile(p))
      .catch(() => active && setProfile(null));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, architect?.harnessProfileId]);

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

  // Stream the running turn's events (SSE) so the answer appears as the model writes it. Events are buffered and
  // folded at most every STREAM_FLUSH_MS, so fast token streams do not re-render the Markdown on every delta. The
  // polling below stays as the fallback and settles the turn when the stream is unavailable.
  const [live, setLive] = useState({});
  const pendingId = pendingActive ? pending.id : null;
  useEffect(() => {
    if (!apiClient || !pendingId) return undefined;
    const runId = pendingId;
    const buffer = [];
    const seen = new Set();
    let events = [];
    let timer = null;
    const flush = () => {
      timer = null;
      if (!buffer.length || unmounted.current) return;
      events = [...events, ...buffer.splice(0)].sort((a, b) => a.sequence - b.sequence);
      setLive((prev) => ({ ...prev, [runId]: { events, preview: buildPreview(events) } }));
    };
    const controller = apiClient.streamRunEvents(
      tenantId,
      runId,
      0,
      (data) => {
        if (!data || typeof data !== 'object' || (data.runId && data.runId !== runId)) return;
        if (data.sequence === undefined) {
          // run.completed carries the final run; run.status carries only the status.
          if (data.id === runId && data.status) setPending(data);
          return;
        }
        if (seen.has(data.sequence)) return;
        seen.add(data.sequence);
        buffer.push(data);
        if (!timer) timer = setTimeout(flush, STREAM_FLUSH_MS);
      },
      () => {}
    );
    return () => {
      controller.abort();
      if (timer) clearTimeout(timer);
      flush();
    };
  }, [apiClient, tenantId, pendingId]);
  useEffect(() => {
    if (!pendingActive) return undefined;
    const id = setInterval(async () => {
      try {
        const run = await apiClient.getRun(tenantId, pending.id);
        if (unmounted.current) return;
        setPending(run);
      } catch {
        /* keep polling */
      }
    }, TURN_POLL_MS);
    return () => clearInterval(id);
  }, [pendingActive, pending, apiClient, tenantId]);

  // Finished turns show the tool calls they made as cards, so read their recorded events once (up to a few pages). A
  // turn streamed in this session is read again when it ends, in case the stream missed the last events.
  const loaded = useRef(new Set());
  useEffect(() => {
    if (!apiClient) return;
    for (const r of turns) {
      if (!TERMINAL_RUN_STATUSES.includes(r.status) || loaded.current.has(r.id)) continue;
      loaded.current.add(r.id);
      (async () => {
        let events = [];
        let after = 0;
        try {
          for (let page = 0; page < HISTORY_PAGES; page++) {
            const res = await apiClient.listRunEvents(tenantId, r.id, after, 500);
            events = events.concat(res.items || []);
            if (!res.hasMore || res.lastSequence === null) break;
            after = res.lastSequence;
          }
        } catch {
          return;
        }
        if (unmounted.current || !events.length) return;
        events.sort((a, b) => a.sequence - b.sequence);
        setLive((prev) => ({ ...prev, [r.id]: { events, preview: buildPreview(events) } }));
      })();
    }
  }, [turns, apiClient, tenantId]);

  // A turn ended (seen by the stream or by polling): read the conversation again and tell the draft, once per turn.
  const finished = useRef(null);
  useEffect(() => {
    if (!pending || !TERMINAL_RUN_STATUSES.includes(pending.status) || finished.current === pending.id) return;
    finished.current = pending.id;
    loadTurns();
    onTurnFinished?.();
  }, [pending, loadTurns, onTurnFinished]);

  // Follow the conversation as it grows, but only while the person is at the bottom: scrolling up to read an earlier
  // turn stops the follow, and scrolling back down (or sending) resumes it.
  const turnsRef = useRef(null);
  const stick = useRef(true);
  const onTurnsScroll = () => {
    const el = turnsRef.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < STICK_PX;
  };
  useLayoutEffect(() => {
    const el = turnsRef.current;
    if (!el || typeof MutationObserver === 'undefined') return undefined;
    const pin = () => {
      if (stick.current) el.scrollTop = el.scrollHeight;
    };
    pin();
    const observer = new MutationObserver(pin);
    observer.observe(el, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

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
        stick.current = true;
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

  const fixArchitect = architect ? pathFor('architects', null, { search: architect.name }) : pathFor('architects');
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
          <StudioLink to={pathFor('architects')} className="button button-secondary button-sm" testId="studio-manage-architects" tipText={t('tips.studio.chat.manageArchitects')}>
            {t('components.studio.chat.manageArchitects')}
          </StudioLink>
          {conversationId && (
            <>
              <StudioLink to={pathFor('conversations', conversationId)} className="button button-secondary button-sm" testId="studio-chat-conversation" tipText={t('tips.studio.chat.openConversation')}>
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
      {(() => {
        // A harness that could not sign in (outcome NotCredentialed, for example Claude Code's "Not logged in") needs a
        // credential secret on the architect; say so and link to where it is fixed.
        const last = [...shownTurns].reverse().find((r) => TERMINAL_RUN_STATUSES.includes(r.status));
        const failed = last?.outcome === 'NotCredentialed';
        const missing = !!architect && !architect.credentialSecretId && !!profile && needsCredential(profile.harnessType);
        if (!failed && !missing) return null;
        return (
          <div className="warning-banner studio-credential-banner" role="alert" data-testid="studio-not-credentialed">
            <div>
              <strong>{t(failed ? 'components.studio.chat.notCredentialedTitle' : 'components.studio.chat.noCredentialTitle')}</strong>
              <div>{t(failed ? 'components.studio.chat.notCredentialedBody' : 'components.studio.chat.noCredentialBody', { architect: architect?.name || '', profile: profile?.name || '' })}</div>
            </div>
            <div className="flex gap-sm items-center">
              <StudioLink to={fixArchitect} className="button button-primary button-sm" testId="studio-fix-credential" tipText={t('tips.studio.chat.fixCredential')}>
                {t('components.studio.chat.fixCredential')}
              </StudioLink>
              <StudioLink to={pathFor('secrets')} className="button button-secondary button-sm" testId="studio-open-secrets" tipText={t('tips.studio.chat.openSecrets')}>
                {t('components.studio.chat.openSecrets')}
              </StudioLink>
            </div>
          </div>
        );
      })()}
      <div className="studio-chat-turns chat-transcript" data-testid="studio-chat-turns" ref={turnsRef} onScroll={onTurnsScroll}>
        {shownTurns.length === 0 ? (
          <div className="text-muted">{t(architect ? 'components.studio.chat.empty' : 'components.studio.chat.pickFirst')}</div>
        ) : (
          shownTurns.map((r) => <ChatTurn key={r.id} run={r} live={live[r.id] || null} architectName={architect?.name || ''} />)
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
          onKeyDown={(e) => composerKeyDown(e, send, setMessage)}
          data-testid="studio-chat-message"
          {...tip(t('tips.studio.chat.message'))}
        />
        <div className="field-hint">
          {t(conversationId ? 'components.studio.chat.continueHint' : 'components.studio.chat.firstHint')} {t('components.studio.chat.keysHint')}
        </div>
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
      <p className="chat-disclaimer" data-testid="studio-chat-disclaimer" {...tip(t('tips.studio.chat.disclaimer'))}>
        {t('components.studio.chat.disclaimer')}
      </p>
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
