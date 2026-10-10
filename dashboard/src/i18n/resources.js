// Translation catalogs for the Garrison dashboard.
//
// English (en) is the source of truth. Every other real locale (de, ja, es, fr, it, zh-Hans, zh-Hant, yue-Hant)
// carries a complete translation and is deep-merged over English as a safety net. The RTL and expansion
// pseudo-locale (zz) is generated from English.
// See docs/I18N.md for how to add a locale.

import en from './locales/en.js';
import de from './locales/de.js';
import ja from './locales/ja.js';
import es from './locales/es.js';
import fr from './locales/fr.js';
import it from './locales/it.js';
import zhHans from './locales/zh-Hans.js';
import zhHant from './locales/zh-Hant.js';
import yueHant from './locales/yue-Hant.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function deepMerge(base, override) {
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const [key, value] of Object.entries(override || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value) && typeof out[key] === 'object') {
      out[key] = deepMerge(out[key], value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

const ACCENT_MAP = {
  a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú', A: 'Á', E: 'É', I: 'Í', O: 'Ó', U: 'Ú',
  n: 'ñ', c: 'ç', s: 'š', y: 'ý'
};

/**
 * Generate a pseudo-locale string: accent letters, wrap in brackets, and pad to
 * ~35% longer to exercise expansion. Preserves {{interpolation}} placeholders.
 */
function pseudoString(value) {
  const parts = String(value).split(/(\{\{[^}]+\}\})/g);
  let accented = parts
    .map((part) => {
      if (part.startsWith('{{') && part.endsWith('}}')) return part;
      return part.replace(/[a-zA-Z]/g, (ch) => ACCENT_MAP[ch] || ch);
    })
    .join('');
  const padCount = Math.max(1, Math.round(accented.replace(/\{\{[^}]+\}\}/g, '').length * 0.35));
  const pad = '·'.repeat(padCount);
  return `⟦${accented}${pad}⟧`;
}

/** Recursively transform every leaf string of an object into pseudo-locale text. */
function pseudoize(node) {
  if (typeof node === 'string') return pseudoString(node);
  if (Array.isArray(node)) return node.map(pseudoize);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(node)) out[key] = pseudoize(value);
    return out;
  }
  return node;
}

const zz = pseudoize(en);

/** Every translated catalog by locale code, before merging over English. Tests iterate this. */
const TRANSLATIONS = {
  de,
  ja,
  es,
  fr,
  it,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
  'yue-Hant': yueHant
};

const resources = { en: { translation: en } };
for (const [code, catalog] of Object.entries(TRANSLATIONS)) resources[code] = { translation: deepMerge(en, catalog) };
resources.zz = { translation: zz };

export { en, de, ja, es, fr, it, zhHans, zhHant, yueHant, TRANSLATIONS, deepMerge, pseudoString };
export default resources;
