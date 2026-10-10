// Central locale registry for the Garrison dashboard.
// Canonical BCP 47 identifiers with direction, display, beta, and font metadata.
// Adding a locale, including a right-to-left one, is an entry here plus a catalog (see docs/I18N.md).

import { STORAGE_KEYS } from '../utils/constants';

export const STORAGE_KEY = STORAGE_KEYS.locale;
export const DEFAULT_LOCALE = 'en';

// Font stacks that put the right CJK face first, so shared Han characters render with the regional glyph shapes.
const FONT_BASE = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', 'Noto Sans'";
const FONT_ZH_HANS = `${FONT_BASE}, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Noto Sans SC', 'Noto Sans CJK SC', 'Source Han Sans SC', sans-serif`;
const FONT_ZH_HANT = `${FONT_BASE}, 'PingFang TC', 'Microsoft JhengHei', 'Noto Sans TC', 'Noto Sans CJK TC', 'Source Han Sans TC', sans-serif`;
const FONT_YUE_HANT = `${FONT_BASE}, 'PingFang HK', 'Microsoft JhengHei', 'Noto Sans HK', 'Noto Sans CJK HK', 'Source Han Sans HK', 'Noto Sans TC', sans-serif`;
const FONT_JA = `${FONT_BASE}, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', Meiryo, 'Noto Sans JP', 'Noto Sans CJK JP', sans-serif`;

/**
 * Supported locales, in selector order.
 *
 * Fields:
 *  - code: canonical BCP 47 tag; also the catalog file name and the i18next language.
 *  - englishName / nativeName: the selector shows nativeName (the autonym).
 *  - dir: 'ltr' or 'rtl'; applied to <html dir>.
 *  - intl: BCP 47 tag handed to Intl formatters (defaults to code).
 *  - aliases: lower-case tags and words that resolve to this locale.
 *  - beta / betaLabel: true until a native speaker has reviewed the catalog; the selector appends betaLabel.
 *  - fontFamily: optional font stack applied to <html> as --locale-font (CJK glyph selection).
 */
export const LOCALES = [
  { code: 'en', englishName: 'English', nativeName: 'English', dir: 'ltr', aliases: ['en-us', 'en-gb', 'en-ca', 'en-au'] },
  { code: 'de', englishName: 'German', nativeName: 'Deutsch', dir: 'ltr', aliases: ['de-de', 'de-at', 'de-ch'], beta: true, betaLabel: 'Beta' },
  { code: 'ja', englishName: 'Japanese', nativeName: '日本語', dir: 'ltr', aliases: ['ja-jp', 'kanji', 'japanese'], fontFamily: FONT_JA, beta: true, betaLabel: 'ベータ版' },
  { code: 'es', englishName: 'Spanish', nativeName: 'Español', dir: 'ltr', aliases: ['es-es', 'es-mx', 'es-419'], beta: true, betaLabel: 'beta' },
  { code: 'fr', englishName: 'French', nativeName: 'Français', dir: 'ltr', aliases: ['fr-fr', 'fr-ca', 'fr-be', 'fr-ch'], beta: true, betaLabel: 'bêta' },
  { code: 'it', englishName: 'Italian', nativeName: 'Italiano', dir: 'ltr', aliases: ['it-it', 'it-ch'], beta: true, betaLabel: 'beta' },
  {
    code: 'zh-Hans',
    englishName: 'Mandarin (Simplified)',
    nativeName: '简体中文',
    dir: 'ltr',
    aliases: ['zh', 'zh-cn', 'zh-sg', 'zh-hans-cn', 'cmn-hans'],
    beta: true,
    betaLabel: '测试版',
    fontFamily: FONT_ZH_HANS
  },
  {
    code: 'zh-Hant',
    englishName: 'Mandarin (Traditional)',
    nativeName: '繁體中文',
    dir: 'ltr',
    aliases: ['zh-tw', 'zh-hant-tw', 'cmn-hant'],
    beta: true,
    betaLabel: '測試版',
    fontFamily: FONT_ZH_HANT
  },
  {
    code: 'yue-Hant',
    englishName: 'Cantonese',
    nativeName: '粵語',
    dir: 'ltr',
    intl: 'zh-Hant-HK',
    aliases: ['yue', 'yue-hk', 'zh-hk', 'zh-mo', 'zh-hant-hk', 'cantonese'],
    beta: true,
    betaLabel: '測試版',
    fontFamily: FONT_YUE_HANT
  },
  { code: 'zz', englishName: 'Pseudo (RTL)', nativeName: '‏Pseudo·RTL‏', dir: 'rtl', intl: 'ar', aliases: ['pseudo', 'rtl'] }
];

export const SUPPORTED_CODES = LOCALES.map((l) => l.code);

// Lower-case lookup of every canonical code and alias.
const LOOKUP = new Map();
for (const l of LOCALES) {
  LOOKUP.set(l.code.toLowerCase(), l.code);
  for (const a of l.aliases || []) LOOKUP.set(a.toLowerCase(), l.code);
}

/**
 * Normalize an arbitrary locale string to a supported canonical code. Matching is case-insensitive and drops
 * subtags from the end until something matches ('es-AR' to 'es', 'zh-Hant-TW' to 'zh-Hant').
 */
export function canonicalizeLocale(input) {
  if (!input) return DEFAULT_LOCALE;
  const parts = String(input).replace(/_/g, '-').toLowerCase().split('-');
  while (parts.length) {
    const hit = LOOKUP.get(parts.join('-'));
    if (hit) return hit;
    parts.pop();
  }
  return DEFAULT_LOCALE;
}

/** Look up locale metadata (falls back to the default locale entry). */
export function getLocaleMeta(code) {
  const c = canonicalizeLocale(code);
  return LOCALES.find((l) => l.code === c) || LOCALES[0];
}

/** Direction for a locale ('ltr' | 'rtl'). */
export function getDirection(code) {
  return getLocaleMeta(code).dir;
}

/** Selector text: the autonym, plus the localized beta label while the catalog awaits native review. */
export function getLocaleLabel(code) {
  const meta = getLocaleMeta(code);
  return meta.beta && meta.betaLabel ? `${meta.nativeName} (${meta.betaLabel})` : meta.nativeName;
}

/**
 * The BCP 47 tag actually handed to Intl formatters. The pseudo-locale 'zz' is not a real Intl locale, so it maps
 * to Arabic ('ar') to exercise RTL numeral and date shaping. Cantonese formats with Hong Kong conventions
 * ('zh-Hant-HK'), which every browser ships. Every other locale maps to itself.
 */
export function toIntlLocale(code) {
  const meta = getLocaleMeta(code);
  return meta.intl || meta.code;
}
