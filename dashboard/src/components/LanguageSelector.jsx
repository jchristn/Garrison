import { useTranslation } from 'react-i18next';
import { LOCALES, canonicalizeLocale, getLocaleLabel } from '../i18n/localeRegistry';
import { tip } from './Tooltip';

/**
 * Locale <select>, rendering autonyms. Locales awaiting native-speaker review carry their localized beta label,
 * for example "Français (bêta)". Used in login, topbar, and settings.
 */
export default function LanguageSelector({ compact = false, className = '' }) {
  const { i18n, t } = useTranslation();
  const current = canonicalizeLocale(i18n.resolvedLanguage || i18n.language);

  return (
    <label className={`topbar-lang ${className}`} {...tip(t('tips.topbar.language'))} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
      {!compact && <span>{t('common.language.label')}</span>}
      <select
        aria-label={t('common.language.label')}
        {...tip(t('tips.topbar.language'))}
        value={current}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code} lang={l.code} dir={l.dir} data-beta={l.beta ? 'true' : undefined}>
            {getLocaleLabel(l.code)}
          </option>
        ))}
      </select>
    </label>
  );
}
