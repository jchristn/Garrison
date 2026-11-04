import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip.jsx';
import { SendIcon, StopIcon } from './Icons.jsx';

// The message box. Enter sends; Shift+Enter adds a line. While the agent is still answering, the box stays
// editable and Send becomes Stop, which cancels the running turn. A message the server refused stays in the box so
// it can be sent again.
export default function Composer({ onSend, onStop, disabled, busy, sending, stopping, autoFocus }) {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const box = useRef(null);

  useEffect(() => {
    if (autoFocus && box.current) box.current.focus();
  }, [autoFocus]);

  const canSend = !disabled && !busy && !sending && text.trim().length > 0;

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!canSend) return;
    const message = text;
    const ok = await onSend(message);
    if (ok) setText('');
    if (box.current) box.current.focus();
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form className="composer" onSubmit={submit}>
      <label htmlFor="composer-input" className="visually-hidden" {...tip(t('tips.composer'))}>
        {t('chat.composerLabel')}
      </label>
      <textarea
        id="composer-input"
        ref={box}
        rows={1}
        value={text}
        placeholder={t('chat.composerPlaceholder')}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        disabled={disabled}
        aria-describedby="composer-hint"
        {...tip(t('tips.composer'))}
        data-testid="composer-input"
      />
      {busy && onStop ? (
        <button type="button" className="button danger send-button" onClick={onStop} disabled={stopping} aria-label={t('chat.stop')} {...tip(t('tips.stop'))} data-testid="stop-button">
          <StopIcon />
          <span className="send-label">{stopping ? t('chat.stopping') : t('chat.stop')}</span>
        </button>
      ) : (
        <button type="submit" className="button primary send-button" disabled={!canSend} aria-label={t('chat.send')} {...tip(t('tips.send'))} data-testid="send-button">
          <SendIcon />
          <span className="send-label">{sending ? t('chat.sending') : t('chat.send')}</span>
        </button>
      )}
      <p id="composer-hint" className="composer-hint">
        {busy ? t('chat.busyComposer') : t('chat.composerHint')}
      </p>
    </form>
  );
}
