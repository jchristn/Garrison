import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip.jsx';
import LanguageSelect from './LanguageSelect.jsx';

// A full-page message: app not found, no app in the URL, or the app could not be loaded (with a retry button).
export default function StatusScreen({ title, body, onRetry, busy }) {
  const { t } = useTranslation();
  return (
    <main className="status-screen" aria-busy={busy ? 'true' : undefined}>
      <div className="status-card">
        {busy ? <div className="spinner" role="status" aria-label={t('common.loading')} /> : null}
        {title ? <h1>{title}</h1> : null}
        {body ? <p>{body}</p> : null}
        {onRetry ? (
          <button type="button" className="button primary" onClick={onRetry} {...tip(t('tips.retry'))}>
            {t('common.retry')}
          </button>
        ) : null}
        {!busy ? <LanguageSelect className="status-lang" /> : null}
      </div>
    </main>
  );
}
