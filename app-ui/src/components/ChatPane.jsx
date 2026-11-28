import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip.jsx';
import Composer from './Composer.jsx';
import Markdown from './Markdown.jsx';
import TurnView from './TurnView.jsx';
import { errorText } from '../utils/errors.js';

// The conversation: the welcome screen before the first message (title, subtitle, welcome text, and up to four
// starter prompts that send themselves when clicked), then every turn, then the message box. Errors from sending
// (busy, rate limited, and others) show above the box until dismissed or the next send. Links in an answer that
// point at files the agent wrote open them in the files panel (onFile). Agent messages carry the app's agent name
// and avatar when it sets them.
export default function ChatPane({ info, avatarUrl = null, conversation, conversationMissing, filePaths, onFile, footer = null }) {
  const { t } = useTranslation();
  const [sendError, setSendError] = useState(null);
  const end = useRef(null);
  const { turns, loading, error, busy, sending, stopping, send, stop } = conversation;
  const appName = info.displayName || info.slug;
  const agentName = info.agentDisplayName || appName;
  const starters = (Array.isArray(info.starterPrompts) ? info.starterPrompts : []).filter((p) => typeof p === 'string' && p.trim()).slice(0, 4);
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

  const onStop = async () => {
    setSendError(null);
    try {
      await stop();
    } catch (err) {
      setSendError(err);
    }
  };

  return (
    <section className="chat-pane" aria-label={appName}>
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
            <h1 className="welcome-title" dir="auto">
              {info.welcomeTitle || appName}
            </h1>
            {info.subtitle ? (
              <p className="welcome-subtitle" dir="auto" data-testid="welcome-subtitle">
                {info.subtitle}
              </p>
            ) : null}
            <Markdown text={info.welcomeText || t('chat.welcomeDefault')} />
            {starters.length ? (
              <ul className="starter-prompts" aria-label={t('chat.starterPrompts')} data-testid="starter-prompts">
                {starters.map((prompt, i) => (
                  <li key={i}>
                    <button type="button" className="button secondary starter-prompt" dir="auto" disabled={busy || sending} onClick={() => onSend(prompt)} {...tip(t('tips.starterPrompt'))} data-testid="starter-prompt">
                      {prompt}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        <ol className="turns">
          {turns.map((turn) => (
            <TurnView key={turn.runId} turn={turn} agentName={agentName} avatarUrl={avatarUrl} showDetail={!!info.showOperatorDetail} filePaths={filePaths} onFile={onFile} />
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
      <Composer onSend={onSend} onStop={stop ? onStop : null} busy={busy} sending={sending} stopping={stopping} disabled={loading} placeholder={info.composerPlaceholder || null} autoFocus />
      {footer}
    </section>
  );
}
