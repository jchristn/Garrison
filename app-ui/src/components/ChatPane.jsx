import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip.jsx';
import Composer from './Composer.jsx';
import Markdown from './Markdown.jsx';
import TurnView from './TurnView.jsx';
import { errorText } from '../utils/errors.js';

// The conversation: the welcome text before the first message, then every turn, then the message box. Errors from
// sending (busy, rate limited, and others) show above the box until dismissed or the next send.
export default function ChatPane({ info, conversation, conversationMissing }) {
  const { t } = useTranslation();
  const [sendError, setSendError] = useState(null);
  const end = useRef(null);
  const { turns, loading, error, busy, sending, send } = conversation;
  const agentName = info.displayName || info.slug;
  const lastLength = turns.length ? turns[turns.length - 1].streamed.length : 0;

  useEffect(() => {
    if (end.current && typeof end.current.scrollIntoView === 'function') end.current.scrollIntoView({ block: 'end' });
  }, [turns.length, lastLength]);

  const onSend = async (message) => {
    setSendError(null);
    try {
      return await send(message);
    } catch (err) {
      setSendError(err);
      return false;
    }
  };

  return (
    <section className="chat-pane" aria-label={agentName}>
      <div className="chat-scroll" aria-live="polite" aria-relevant="additions text">
        {loading ? <div className="spinner" role="status" aria-label={t('common.loading')} /> : null}
        {conversationMissing ? (
          <p className="notice notice-error" role="alert">
            {t('chat.missing')}
          </p>
        ) : null}
        {error && !conversationMissing ? (
          <p className="notice notice-error" role="alert">
            {t('chat.loadError')} {errorText(t, error)}
          </p>
        ) : null}
        {!loading && !turns.length ? (
          <div className="welcome" data-testid="welcome">
            <h1 className="welcome-title">{agentName}</h1>
            <Markdown text={info.welcomeText || t('chat.welcomeDefault')} />
          </div>
        ) : null}
        <ol className="turns">
          {turns.map((turn) => (
            <TurnView key={turn.runId} turn={turn} agentName={agentName} showDetail={!!info.showOperatorDetail} />
          ))}
        </ol>
        <div ref={end} />
      </div>
      {sendError ? (
        <div className="notice notice-error send-error" role="alert" data-testid="send-error" data-code={sendError.code || ''}>
          <span>{errorText(t, sendError)}</span>
          <button type="button" className="link-button" onClick={() => setSendError(null)} {...tip(t('tips.dismiss'))}>
            {t('chat.dismiss')}
          </button>
        </div>
      ) : null}
      <Composer onSend={onSend} busy={busy} sending={sending} disabled={loading} autoFocus />
    </section>
  );
}
