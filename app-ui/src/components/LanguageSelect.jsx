import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { LOCALES, canonicalizeLocale, getLocaleLabel } from '../i18n/localeRegistry.js';
import { tip } from './Tooltip.jsx';

// Language picker: each locale by its own name (autonym), the same list as the dashboard's.
export default function LanguageSelect({ className = '' }) {
  const { t, i18n } = useTranslation();
  const id = useId();
  const current = canonicalizeLocale(i18n.resolvedLanguage || i18n.language);
  return (
    <div className={`lang-select ${className}`}>
      <label htmlFor={id} className="visually-hidden" {...tip(t('tips.language'))}>
        {t('header.language')}
      </label>
      <select id={id} value={current} onChange={(e) => i18n.changeLanguage(e.target.value)} {...tip(t('tips.language'))} data-testid="language-select">
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {getLocaleLabel(l.code)}
          </option>
        ))}
      </select>
    </div>
  );
}
