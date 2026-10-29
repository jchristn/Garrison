// i18next bootstrap. Imported for its side effect in main.jsx before the app renders, so the active locale is
// resolved before first paint. The language comes from ?lang=, then the saved choice, then the browser.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import resources from './resources.js';
import { STORAGE_KEY, DEFAULT_LOCALE, canonicalizeLocale, getLocaleMeta } from './localeRegistry.js';

function syncDocument(nextLocale) {
  const meta = getLocaleMeta(canonicalizeLocale(nextLocale));
  const root = document.documentElement;
  root.lang = meta.code;
  root.dir = meta.dir;
  if (meta.fontFamily) root.style.setProperty('--locale-font', meta.fontFamily);
  else root.style.removeProperty('--locale-font');
}

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      lng: undefined,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: Object.keys(resources),
      defaultNS: 'translation',
      ns: ['translation'],
      returnNull: false,
      returnEmptyString: false,
      interpolation: { escapeValue: false },
      detection: {
        order: ['querystring', 'localStorage', 'navigator'],
        lookupQuerystring: 'lang',
        lookupLocalStorage: STORAGE_KEY,
        caches: ['localStorage'],
        convertDetectedLanguage: canonicalizeLocale
      }
    });
}

syncDocument(i18n.resolvedLanguage || i18n.language || DEFAULT_LOCALE);
i18n.on('languageChanged', syncDocument);

export default i18n;
