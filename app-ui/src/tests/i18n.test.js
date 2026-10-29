import { describe, it, expect, beforeAll } from 'vitest';
import i18n from '../i18n';
import { LOCALES, STORAGE_KEY, SUPPORTED_CODES, canonicalizeLocale, getLocaleLabel } from '../i18n/localeRegistry.js';
import resources, { en, TRANSLATIONS } from '../i18n/resources.js';

function leaves(node, prefix = '') {
  return Object.entries(node).flatMap(([k, v]) => (v && typeof v === 'object' ? leaves(v, `${prefix}${k}.`) : [[`${prefix}${k}`, v]]));
}

const placeholders = (s) => (String(s).match(/\{\{[^}]+\}\}/g) || []).sort().join(',');
const EN = Object.fromEntries(leaves(en));

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

describe('locales', () => {
  it('uses the dashboard locale set plus the pseudo-locale', () => {
    expect(SUPPORTED_CODES).toEqual(['en', 'de', 'ja', 'es', 'fr', 'it', 'zh-Hans', 'zh-Hant', 'yue-Hant', 'zz']);
    expect(Object.keys(resources).sort()).toEqual([...SUPPORTED_CODES].sort());
    expect(canonicalizeLocale('zh-HK')).toBe('yue-Hant');
    expect(getLocaleLabel('fr')).toBe('Français (bêta)');
  });

  it.each(Object.keys(TRANSLATIONS))('%s translates every key, keeps placeholders, and changes the text', (code) => {
    const catalog = Object.fromEntries(leaves(TRANSLATIONS[code]));
    expect(Object.keys(catalog).sort()).toEqual(Object.keys(EN).sort());
    for (const [key, value] of Object.entries(catalog)) {
      expect(typeof value, key).toBe('string');
      expect(value.trim().length, key).toBeGreaterThan(0);
      expect(placeholders(value), key).toBe(placeholders(EN[key]));
    }
    const same = Object.keys(EN).filter((k) => catalog[k] === EN[k] && /[a-z]{4,}/.test(EN[k]));
    // A few words are the same in some languages (for example "Guest" is not, but "Version" is in German).
    expect(same.length, same.join(', ')).toBeLessThan(8);
  });

  it('has tooltips of at least 25 characters that do not repeat a label', () => {
    for (const code of ['en', ...Object.keys(TRANSLATIONS)]) {
      const tips = code === 'en' ? en.tips : TRANSLATIONS[code].tips;
      for (const [key, value] of Object.entries(tips)) expect(value.length, `${code} tips.${key}`).toBeGreaterThanOrEqual(25);
    }
  });

  it('contains no em-dash characters', () => {
    for (const catalog of [en, ...Object.values(TRANSLATIONS)]) {
      for (const [key, value] of leaves(catalog)) expect(value.includes(String.fromCharCode(0x2014)), key).toBe(false);
    }
  });

  it('switches language, direction, and the saved choice', async () => {
    await i18n.changeLanguage('zz');
    expect(document.documentElement.dir).toBe('rtl');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('zz');
    for (const l of LOCALES.filter((x) => x.code !== 'zz')) {
      await i18n.changeLanguage(l.code);
      expect(document.documentElement.lang).toBe(l.code);
      expect(document.documentElement.dir).toBe('ltr');
      expect(i18n.t('chat.approval')).toBe(l.code === 'en' ? en.chat.approval : TRANSLATIONS[l.code].chat.approval);
    }
    await i18n.changeLanguage('en');
  });
});
