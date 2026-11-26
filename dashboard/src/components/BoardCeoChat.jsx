import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ChatTurn from './studio/ChatTurn';
import { ErrorBanner } from './States';
import { SendIcon, PlusIcon } from './Icons';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import useChatTranscript from '../hooks/useChatTranscript';
import { formatRelativeTime } from '../i18n/formatters';
import { composerKeyDown } from '../utils/composerKeys';
import { errorMessageWithDetail } from '../utils/errors';
import { BOARD_LIMITS, ceoUnavailable, messageBody } from '../utils/board';

/**
 * Talk to the CEO (AA10.6): an ordinary conversation with the CEO keeper's deployment, started through POST
 * /organizations/{id}/board/messages so the run is framed as the board speaking. The reply streams like any chat turn
 * (useChatTranscript); later messages continue the conversation the first one returned. Past board conversations of
 * this organization are listed newest first and can be reopened. `denied` is a reason the caller cannot send ('' when
 * it can).
 */
export default function BoardCeoChat({ organizationId, ceo, denied = '' }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const lng = i18n.language;
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const loadConversations = useCallback(() => {
    if (!apiClient?.listBoardConversations || !organizationId) return;
    apiClient
      .listBoardConversations(tenantId, organizationId, { pageNumber: 1, pageSize: 50 })
      .then((r) => setConversations(r?.items || []))
      .catch(() => setConversations([]));
  }, [apiClient, tenantId, organizationId]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const { turns, pendingActive, live, turnsRef, onTurnsScroll, startTurn, reset } = useChatTranscript({ apiClient, tenantId, conversationId, onTurnFinished: loadConversations });

  const blocked = ceoUnavailable(t, ceo) || denied;
  const tooLong = message.length > BOARD_LIMITS.messageMax;

  const send = async () => {
    const text = message.trim();
    if (!text || sending || pendingActive || blocked || tooLong) return;
    setSending(true);
    setError(null);
    try {
      const run = await apiClient.sendBoardMessage(tenantId, organizationId, messageBody(text, conversationId));
      setMessage('');
      if (!conversationId && run?.conversationId) {
        setConversationId(run.conversationId);
        loadConversations();
      }
      startTurn(run, text);
    } catch (e) {
      setError(e);
    } finally {
      setSending(false);
    }
  };

  const pick = (id) => {
    if (id === (conversationId || '')) return;
    reset();
    setError(null);
    setConversationId(id || null);
  };

  const label = (c) => `${c.title || c.id}${c.lastActivityUtc ? ` (${formatRelativeTime(c.lastActivityUtc, lng)})` : ''}`;

  return (
    <section className="panel board-panel board-wide" aria-labelledby="board-ceo-title" data-testid="board-ceo-chat">
      <div className="board-panel-head">
        <h2 id="board-ceo-title" {...tip(t('tips.board.ceoChat.title'))}>
          {t('board.ceoChat.title')}
        </h2>
        <div className="board-panel-tools">
          <label htmlFor="board-ceo-conversation" className="sr-only">
            {t('board.ceoChat.conversation')}
          </label>
          <select id="board-ceo-conversation" value={conversationId || ''} onChange={(e) => pick(e.target.value)} data-testid="board-ceo-conversation" {...tip(t('tips.board.ceoChat.conversation'))}>
            <option value="">{t('board.ceoChat.newConversation')}</option>
            {conversationId && !conversations.some((c) => c.id === conversationId) && <option value={conversationId}>{conversationId}</option>}
            {conversations.map((c) => (
              <option key={c.id} value={c.id}>
                {label(c)}
              </option>
            ))}
          </select>
          <button type="button" className="button-secondary button-sm" onClick={() => pick('')} disabled={!conversationId} data-testid="board-ceo-new" {...tip(t('tips.board.ceoChat.new'))}>
            <PlusIcon size={14} /> {t('board.ceoChat.new')}
          </button>
        </div>
      </div>
      <p className="text-muted">{ceo ? t('board.ceoChat.talkingTo', { name: ceo.agentName || ceo.agentId }) : t('board.ceoChat.note')}</p>
      {blocked && (
        <div className="info-banner" role="status" data-testid="board-ceo-blocked">
          {blocked}
        </div>
      )}
      <div className="chat-transcript board-ceo-transcript" ref={turnsRef} onScroll={onTurnsScroll} role="log" aria-live="polite" aria-label={t('board.ceoChat.transcript')} data-testid="board-ceo-turns">
        {turns.length === 0 ? <div className="text-muted">{t('board.ceoChat.empty')}</div> : turns.map((r) => <ChatTurn key={r.id} run={r} live={live[r.id] || null} architectName={ceo?.agentName || ''} />)}
      </div>
      <div className="field">
        <label htmlFor="board-ceo-message" {...tip(t('tips.board.ceoChat.message'))}>
          {t('board.ceoChat.message')}
        </label>
        <div className="chat-composer">
          <textarea
            id="board-ceo-message"
            rows={3}
            value={message}
            disabled={!!blocked}
            aria-invalid={tooLong ? 'true' : undefined}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => composerKeyDown(e, send, setMessage)}
            data-testid="board-ceo-message"
            {...tip(t('tips.board.ceoChat.message'))}
          />
          <button type="button" className="button-primary chat-composer-send" onClick={send} disabled={sending || pendingActive || !message.trim() || !!blocked || tooLong} data-testid="board-ceo-send" {...tip(t('tips.board.ceoChat.send'))}>
            <SendIcon size={14} /> {t('components.studio.chat.send')}
          </button>
        </div>
        <div className="field-hint">{tooLong ? t('board.ceoChat.tooLong', { max: BOARD_LIMITS.messageMax }) : t('components.studio.chat.keysHint')}</div>
      </div>
      {error && <ErrorBanner message={errorMessageWithDetail(t, error)} />}
    </section>
  );
}
