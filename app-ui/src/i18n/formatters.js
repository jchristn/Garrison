// Locale-aware formatting helpers. Every helper takes an optional locale (falling back to the active i18next
// language) and routes through Intl.

import i18n from './index.js';
import { toIntlLocale } from './localeRegistry.js';

function resolveLocale(locale) {
  return toIntlLocale(locale || i18n.resolvedLanguage || i18n.language || 'en');
}

/** Format a byte count with binary units (1 KB = 1024 bytes). */
export function formatBytes(value, locale) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let v = Number(value);
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  const nf = new Intl.NumberFormat(resolveLocale(locale), { maximumFractionDigits: i === 0 ? 0 : 1 });
  return `${nf.format(v)} ${units[i]}`;
}

/** Format a UTC timestamp as a local date and time; '-' when missing or invalid. */
export function formatDateTime(utcString, locale, options = { dateStyle: 'medium', timeStyle: 'short' }) {
  if (!utcString) return '-';
  const d = new Date(utcString);
  if (Number.isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat(resolveLocale(locale), options).format(d);
}

/** Relative time such as "5 minutes ago"; falls back to the date for anything older than a week. */
export function formatRelativeTime(utcString, locale, now = Date.now()) {
  if (!utcString) return '-';
  const d = new Date(utcString);
  if (Number.isNaN(d.getTime())) return '-';
  const seconds = Math.round((d.getTime() - now) / 1000);
  const abs = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat(resolveLocale(locale), { numeric: 'auto' });
  if (abs < 60) return rtf.format(seconds, 'second');
  if (abs < 3600) return rtf.format(Math.round(seconds / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(seconds / 3600), 'hour');
  if (abs < 604800) return rtf.format(Math.round(seconds / 86400), 'day');
  return formatDateTime(utcString, locale, { dateStyle: 'medium' });
}
