import { useTranslation } from 'react-i18next';
import CopyButton from './CopyButton';
import { tip } from './Tooltip';
import { appUrl, effectiveSlug, signInKey } from '../utils/apps';

/** The origin the app UI is served from: the dashboard's own (nginx serves /apps/{slug}/ next to the console). */
export function appOrigin() {
  return typeof window !== 'undefined' && window.location ? window.location.origin : '';
}

/**
 * The shareable URL of an app's chat UI (AD6.10): {origin}/apps/{slug}/ with a copy button and an Open link. The
 * tooltips say who can sign in under the app's current auth mode. `compact` draws one line for a table cell.
 */
export default function AgenticAppShare({ app, compact = false }) {
  const { t } = useTranslation();
  const slug = effectiveSlug(app);
  if (!slug) return compact ? '-' : <div className="text-muted">{t('components.apps.share.noSlug')}</div>;
  const url = appUrl(appOrigin(), slug);
  const who = t(`tips.apps.signIn.${signInKey(app)}`);
  const inactive = app?.active === false;
  const link = (
    <a href={url} target="_blank" rel="noopener noreferrer" className={compact ? 'app-share-open' : 'button-secondary button-sm app-share-open'} data-testid="app-open-link" onClick={(e) => e.stopPropagation()} {...tip(t('tips.apps.open', { who }))}>
      {t('components.apps.share.open')}
    </a>
  );
  const copy = <CopyButton value={url} title={t('components.apps.share.copy')} tipText={t('tips.apps.copyUrl', { who })} />;
  if (compact) {
    return (
      <span className="app-share-cell" data-testid="app-url" data-url={url}>
        <code className="app-share-url" {...tip(t('tips.apps.url', { who }))}>{`/apps/${slug}/`}</code>
        {copy}
        {link}
      </span>
    );
  }
  return (
    <div className="app-share" data-testid="app-share">
      <div className="app-share-row">
        <code className="app-share-url" data-testid="app-url" data-url={url} {...tip(t('tips.apps.url', { who }))}>
          {url}
        </code>
        {copy}
        {link}
      </div>
      <div className="field-hint" data-testid="app-sign-in">
        {t(`components.apps.share.signIn.${signInKey(app)}`)}
        {inactive && ` ${t('components.apps.share.inactive')}`}
      </div>
    </div>
  );
}
