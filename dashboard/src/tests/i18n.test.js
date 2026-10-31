import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import i18n from '../i18n';
import { canonicalizeLocale, getDirection, getLocaleMeta, getLocaleLabel, toIntlLocale, LOCALES, STORAGE_KEY, SUPPORTED_CODES } from '../i18n/localeRegistry';
import resources from '../i18n/resources';
import { formatNumber, formatDateTime, formatDuration, formatCurrency, formatBytes, formatList, formatPercent, formatRelativeTime } from '../i18n/formatters';

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

describe('locale registry', () => {
  it('supports the Armada locale set plus the pseudo-locale', () => {
    expect(SUPPORTED_CODES).toEqual(['en', 'de', 'ja', 'es', 'fr', 'it', 'zh-Hans', 'zh-Hant', 'yue-Hant', 'zz']);
  });
  it('has a catalog for every registered locale and a registry entry for every catalog', () => {
    expect(Object.keys(resources).sort()).toEqual([...SUPPORTED_CODES].sort());
  });
  it('canonicalizes aliases and regions', () => {
    expect(canonicalizeLocale('de-AT')).toBe('de');
    expect(canonicalizeLocale('ja-JP')).toBe('ja');
    expect(canonicalizeLocale('fr-FR')).toBe('fr');
    expect(canonicalizeLocale('fr-CA')).toBe('fr');
    expect(canonicalizeLocale('es-419')).toBe('es');
    expect(canonicalizeLocale('es-AR')).toBe('es');
    expect(canonicalizeLocale('it-IT')).toBe('it');
    expect(canonicalizeLocale('zh')).toBe('zh-Hans');
    expect(canonicalizeLocale('zh-CN')).toBe('zh-Hans');
    expect(canonicalizeLocale('zh-hans')).toBe('zh-Hans');
    expect(canonicalizeLocale('zh-TW')).toBe('zh-Hant');
    expect(canonicalizeLocale('zh-Hant-TW')).toBe('zh-Hant');
    expect(canonicalizeLocale('zh-HK')).toBe('yue-Hant');
    expect(canonicalizeLocale('yue')).toBe('yue-Hant');
    expect(canonicalizeLocale('zh_TW')).toBe('zh-Hant');
    expect(canonicalizeLocale('pt-BR')).toBe('en');
    expect(canonicalizeLocale('')).toBe('en');
  });
  it('reports direction and Intl locale', () => {
    expect(getDirection('zz')).toBe('rtl');
    expect(getDirection('ja')).toBe('ltr');
    for (const code of ['es', 'fr', 'it', 'zh-Hans', 'zh-Hant', 'yue-Hant']) expect(getDirection(code)).toBe('ltr');
    expect(toIntlLocale('zz')).toBe('ar');
    expect(toIntlLocale('zh-Hans')).toBe('zh-Hans');
    expect(toIntlLocale('yue-Hant')).toBe('zh-Hant-HK');
    expect(toIntlLocale('fr-CA')).toBe('fr');
  });
  it('labels every locale by its own name, with no beta marker', () => {
    expect(getLocaleLabel('en')).toBe('English');
    expect(getLocaleLabel('es')).toBe('Español');
    expect(getLocaleLabel('fr')).toBe('Français');
    expect(getLocaleLabel('it')).toBe('Italiano');
    expect(getLocaleLabel('zh-Hans')).toBe('简体中文');
    expect(getLocaleLabel('zh-Hant')).toBe('繁體中文');
    expect(getLocaleLabel('yue-Hant')).toBe('粵語');
    for (const l of LOCALES) expect(l.beta, l.code).toBeUndefined();
  });
  it('gives CJK locales a regional font hint', () => {
    expect(getLocaleMeta('zh-Hans').fontFamily).toContain('PingFang SC');
    expect(getLocaleMeta('zh-Hant').fontFamily).toContain('PingFang TC');
    expect(getLocaleMeta('yue-Hant').fontFamily).toContain('PingFang HK');
    expect(getLocaleMeta('es').fontFamily).toBeUndefined();
  });
});

describe('language switching', () => {
  it('syncs html lang and dir and persists the choice', async () => {
    await i18n.changeLanguage('zz');
    expect(document.documentElement.lang).toBe('zz');
    expect(document.documentElement.dir).toBe('rtl');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('zz');
    await i18n.changeLanguage('de');
    expect(document.documentElement.lang).toBe('de');
    expect(document.documentElement.dir).toBe('ltr');
    expect(i18n.t('nav.items.home.label')).toBe('Startseite');
    await i18n.changeLanguage('ja');
    expect(i18n.t('nav.items.home.label')).toBe('ホーム');
    await i18n.changeLanguage('en');
    expect(localStorage.getItem(STORAGE_KEY)).toBe('en');
  });
  it.each([
    ['es', 'Inicio'],
    ['fr', 'Accueil'],
    ['it', 'Home'],
    ['zh-Hans', '首页'],
    ['zh-Hant', '首頁'],
    ['yue-Hant', '主頁']
  ])('switches to %s, syncs lang, dir, and the font hint, and persists it', async (code, home) => {
    await i18n.changeLanguage(code);
    expect(document.documentElement.lang).toBe(code);
    expect(document.documentElement.dir).toBe('ltr');
    expect(localStorage.getItem(STORAGE_KEY)).toBe(code);
    expect(i18n.t('nav.items.home.label')).toBe(home);
    const font = document.documentElement.style.getPropertyValue('--locale-font');
    if (code.startsWith('zh') || code.startsWith('yue')) expect(font).toContain('PingFang');
    else expect(font).toBe('');
    await i18n.changeLanguage('en');
  });
});

describe('formatters', () => {
  it('formats numbers per locale', () => {
    expect(formatNumber(1234567.5, {}, 'en')).toBe('1,234,567.5');
    expect(formatNumber(1234567.5, {}, 'de')).toBe('1.234.567,5');
  });
  it('formats currency per locale', () => {
    expect(formatCurrency(12.5, 'en')).toContain('$');
    expect(formatCurrency(12.5, 'de')).toMatch(/12,5/);
  });
  it('formats dates per locale', () => {
    const iso = '2026-03-04T05:06:07Z';
    expect(formatDateTime(iso, 'en', { year: 'numeric', month: 'long', timeZone: 'UTC' })).toBe('March 2026');
    expect(formatDateTime(iso, 'de', { year: 'numeric', month: 'long', timeZone: 'UTC' })).toBe('März 2026');
    expect(formatDateTime(iso, 'ja', { year: 'numeric', month: 'long', timeZone: 'UTC' })).toBe('2026年3月');
  });
  it('formats durations, bytes, lists, and percents', () => {
    expect(formatDuration(500, 'en')).toMatch(/^500 /);
    expect(formatDuration(null, 'en')).toBe('-');
    expect(formatBytes(2048, 'en')).toBe('2 KB');
    expect(formatList(['a', 'b', 'c'], 'en')).toBe('a, b, and c');
    expect(formatPercent(50, 'en', { alreadyPercent: true })).toMatch(/50/);
  });
});

// Explicit-locale formatter checks for every new locale. Intl output varies slightly between ICU versions, so
// whitespace is normalized (French uses U+202F and U+00A0 as group and unit separators) and a few checks use patterns.
describe('formatters in the new locales', () => {
  const norm = (v) => String(v).replace(/[\s\u00a0\u202f]+/g, ' ');
  const iso = '2026-03-04T05:06:07Z';
  const monthYear = { year: 'numeric', month: 'long', timeZone: 'UTC' };
  const cases = [
    { code: 'es', month: 'marzo de 2026', number: '1.234.567,5', minutesAgo: 'hace 5 minutos', yesterday: 'ayer', list: 'a, b y c', currency: /12,50/ },
    { code: 'fr', month: 'mars 2026', number: '1 234 567,5', minutesAgo: 'il y a 5 minutes', yesterday: 'hier', list: 'a, b et c', currency: /12,50/ },
    { code: 'it', month: 'marzo 2026', number: '1.234.567,5', minutesAgo: '5 minuti fa', yesterday: 'ieri', list: 'a, b e c', currency: /12,50/ },
    { code: 'zh-Hans', month: '2026年3月', number: '1,234,567.5', minutesAgo: /^5 ?分钟前$/, yesterday: '昨天', list: 'a、b和c', currency: /12\.50/ },
    { code: 'zh-Hant', month: '2026年3月', number: '1,234,567.5', minutesAgo: /^5 ?分鐘前$/, yesterday: '昨天', list: 'a、b和c', currency: /12\.50/ },
    { code: 'yue-Hant', month: '2026年3月', number: '1,234,567.5', minutesAgo: /^5 ?分鐘前$/, yesterday: '昨日', list: /^a、b(及|和)c$/, currency: /12\.50/ }
  ];
  const match = (actual, expected) => (expected instanceof RegExp ? expect(norm(actual)).toMatch(expected) : expect(norm(actual)).toBe(expected));

  afterEach(async () => {
    vi.useRealTimers();
    await i18n.changeLanguage('en');
  });

  it.each(cases)('formats dates and numbers in $code', ({ code, month, number, currency }) => {
    match(formatDateTime(iso, code, monthYear), month);
    match(formatNumber(1234567.5, {}, code), number);
    match(formatCurrency(12.5, code), currency);
    expect(norm(formatPercent(0.5, code))).toMatch(/50/);
    expect(formatDateTime(iso, code, { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' })).not.toMatch(/March|Mar /);
  });

  it.each(cases)('formats relative time in $code', async ({ code, minutesAgo, yesterday }) => {
    await i18n.changeLanguage(code);
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-04T05:11:07Z'));
    match(formatRelativeTime(iso, code), minutesAgo);
    vi.setSystemTime(new Date('2026-03-05T05:06:07Z'));
    match(formatRelativeTime(iso, code), yesterday);
    vi.setSystemTime(new Date('2026-03-04T05:06:08Z'));
    expect(formatRelativeTime(iso, code)).toBe(i18n.t('common.relativeTime.now'));
    expect(i18n.t('common.relativeTime.now')).not.toBe(resources.en.translation.common.relativeTime.now);
  });

  it.each(cases)('formats durations and lists in $code', async ({ code, list }) => {
    await i18n.changeLanguage(code);
    const decimal = new Intl.NumberFormat(toIntlLocale(code), { maximumFractionDigits: 2 }).format(1.5);
    expect(formatDuration(1500, code)).toBe(`${decimal} ${i18n.t('common.units.sShort')}`);
    expect(formatDuration(250, code)).toBe(`250 ${i18n.t('common.units.msShort')}`);
    expect(formatDuration(90000, code)).toBe(`${new Intl.NumberFormat(toIntlLocale(code), { maximumFractionDigits: 1 }).format(1.5)} ${i18n.t('common.units.mShort')}`);
    if (code === 'es' || code === 'fr' || code === 'it') expect(formatDuration(1500, code)).toContain('1,5');
    match(formatList(['a', 'b', 'c'], code), list);
  });
});
