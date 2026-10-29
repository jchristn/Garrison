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
