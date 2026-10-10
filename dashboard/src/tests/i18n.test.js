import { describe, it, expect, beforeAll } from 'vitest';
import i18n from '../i18n';
import { canonicalizeLocale, getDirection, toIntlLocale, STORAGE_KEY, SUPPORTED_CODES } from '../i18n/localeRegistry';
import { formatNumber, formatDateTime, formatDuration, formatCurrency, formatBytes, formatList, formatPercent } from '../i18n/formatters';

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

describe('locale registry', () => {
  it('supports en, de, ja, and zz', () => {
    expect(SUPPORTED_CODES).toEqual(['en', 'de', 'ja', 'zz']);
  });
  it('canonicalizes aliases and regions', () => {
    expect(canonicalizeLocale('de-AT')).toBe('de');
    expect(canonicalizeLocale('ja-JP')).toBe('ja');
    expect(canonicalizeLocale('fr-FR')).toBe('en');
    expect(canonicalizeLocale('')).toBe('en');
  });
  it('reports direction and Intl locale', () => {
    expect(getDirection('zz')).toBe('rtl');
    expect(getDirection('ja')).toBe('ltr');
    expect(toIntlLocale('zz')).toBe('ar');
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
