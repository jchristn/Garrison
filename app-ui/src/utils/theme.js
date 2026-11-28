// Light and dark themes. With no saved choice the app follows the system (prefers-color-scheme) and keeps following
// it as it changes; the toggle saves an explicit choice in localStorage. The theme is data-theme on <html>.

import { STORAGE_KEYS, readStorage, writeStorage } from './storage.js';

function media() {
  try {
    return window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  } catch {
    return null;
  }
}

/** The saved choice ('light' or 'dark'), or null to follow the system. */
export function savedTheme() {
  const value = readStorage(STORAGE_KEYS.theme);
  return value === 'light' || value === 'dark' ? value : null;
}

/** The system theme. */
export function systemTheme() {
  const m = media();
  return m && m.matches ? 'dark' : 'light';
}

/** The theme to show now. */
export function resolveTheme() {
  return savedTheme() || systemTheme();
}

/** Set data-theme on <html>. */
export function applyTheme(theme, root = document.documentElement) {
  root.setAttribute('data-theme', theme === 'dark' ? 'dark' : 'light');
}

/** Save an explicit choice and apply it. */
export function saveTheme(theme) {
  writeStorage(STORAGE_KEYS.theme, theme === 'dark' ? 'dark' : 'light');
  applyTheme(theme);
}

/** Call listener(theme) when the system theme changes while no choice is saved. Returns an unsubscribe function. */
export function watchSystemTheme(listener) {
  const m = media();
  if (!m || !m.addEventListener) return () => {};
  const onChange = () => {
    if (!savedTheme()) listener(systemTheme());
  };
  m.addEventListener('change', onChange);
  return () => m.removeEventListener('change', onChange);
}

/** True unless the app turned the theme switch off (allowThemeSwitch false). */
export function themeSwitchAllowed(info) {
  return !(info && info.allowThemeSwitch === false);
}

/**
 * The theme an app shows now (LP-016): the saved choice when the app lets users switch, else the app's themeDefault
 * (Light or Dark), else the system theme. With allowThemeSwitch false a saved choice is ignored.
 */
export function appTheme(info) {
  const saved = themeSwitchAllowed(info) ? savedTheme() : null;
  if (saved) return saved;
  const preferred = info && info.themeDefault;
  if (preferred === 'Light') return 'light';
  if (preferred === 'Dark') return 'dark';
  return systemTheme();
}

/** Call listener() whenever the system theme changes. Returns an unsubscribe function. */
export function watchSystemChange(listener) {
  const m = media();
  if (!m || !m.addEventListener) return () => {};
  const onChange = () => listener();
  m.addEventListener('change', onChange);
  return () => m.removeEventListener('change', onChange);
}
