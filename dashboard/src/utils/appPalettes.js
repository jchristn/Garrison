// App palettes (LP-016, LP-017): eight presets with a light and a dark variant, each covering the eight color roles of
// an app's chat page. A preset only fills the app's color fields and its paletteId; the server stores the colors, so a
// preset can change here without touching apps that used it. Every preset passes WCAG AA for text on each surface in
// both themes (appPalettes.test.js).

import { deriveDarkColor, normalizeColor } from './appColors';

/**
 * The eight color roles: the light field, the dark field, and the kind of color ('brand' for primary and accent, which
 * carry buttons and highlights, 'surface' for the areas text sits on).
 */
export const APP_COLOR_ROLES = [
  { role: 'primary', field: 'primaryColor', darkField: 'darkPrimaryColor', kind: 'brand' },
  { role: 'accent', field: 'accentColor', darkField: 'darkAccentColor', kind: 'brand' },
  { role: 'background', field: 'backgroundColor', darkField: 'darkBackgroundColor', kind: 'surface' },
  { role: 'header', field: 'headerColor', darkField: 'darkHeaderColor', kind: 'surface' },
  { role: 'agentBubble', field: 'agentBubbleColor', darkField: 'darkAgentBubbleColor', kind: 'surface' },
  { role: 'conversationList', field: 'conversationListColor', darkField: 'darkConversationListColor', kind: 'surface' },
  { role: 'composer', field: 'composerColor', darkField: 'darkComposerColor', kind: 'surface' },
  { role: 'files', field: 'filesColor', darkField: 'darkFilesColor', kind: 'surface' }
];

/** The dark color fields, in role order. */
export const APP_DARK_COLOR_FIELDS = APP_COLOR_ROLES.map((r) => r.darkField);

/** paletteId for colors that no longer match a preset. */
export const CUSTOM_PALETTE = 'custom';

/** What the app page draws for each role when the app leaves it empty, per theme (app-ui/src/index.css). */
export const THEME_DEFAULT_COLORS = {
  light: { primary: '#0F766E', accent: '#B45309', background: '#F8FAFC', header: '#FFFFFF', agentBubble: '#FFFFFF', conversationList: '#FFFFFF', composer: '#FFFFFF', files: '#FFFFFF' },
  dark: { primary: '#0F766E', accent: '#B45309', background: '#0B1220', header: '#111A2B', agentBubble: '#162034', conversationList: '#111A2B', composer: '#111A2B', files: '#111A2B' }
};

/**
 * The presets, in the order the picker shows them. Each has an id (stored as paletteId) and a light and a dark color
 * per role. Garrison teal is the built-in look.
 */
export const APP_PALETTES = [
  {
    id: 'garrison',
    light: { ...THEME_DEFAULT_COLORS.light },
    dark: { ...THEME_DEFAULT_COLORS.dark }
  },
  {
    id: 'slate',
    light: { primary: '#334155', accent: '#2563EB', background: '#F1F5F9', header: '#FFFFFF', agentBubble: '#FFFFFF', conversationList: '#F8FAFC', composer: '#FFFFFF', files: '#F8FAFC' },
    dark: { primary: '#94A3B8', accent: '#60A5FA', background: '#0F172A', header: '#1E293B', agentBubble: '#1E293B', conversationList: '#111827', composer: '#1E293B', files: '#111827' }
  },
  {
    id: 'ocean',
    light: { primary: '#0369A1', accent: '#0E7490', background: '#F0F9FF', header: '#E0F2FE', agentBubble: '#FFFFFF', conversationList: '#F0F9FF', composer: '#FFFFFF', files: '#F0F9FF' },
    dark: { primary: '#38BDF8', accent: '#22D3EE', background: '#082F49', header: '#0C4A6E', agentBubble: '#0B3B5A', conversationList: '#072A40', composer: '#0B3B5A', files: '#072A40' }
  },
  {
    id: 'forest',
    light: { primary: '#15803D', accent: '#A16207', background: '#F6FBF6', header: '#FFFFFF', agentBubble: '#FFFFFF', conversationList: '#EEF7EF', composer: '#FFFFFF', files: '#EEF7EF' },
    dark: { primary: '#4ADE80', accent: '#FACC15', background: '#0A1A10', header: '#10261A', agentBubble: '#133020', conversationList: '#0D2015', composer: '#10261A', files: '#0D2015' }
  },
  {
    id: 'sunset',
    light: { primary: '#C2410C', accent: '#BE185D', background: '#FFF7ED', header: '#FFFFFF', agentBubble: '#FFFFFF', conversationList: '#FFF1E6', composer: '#FFFFFF', files: '#FFF1E6' },
    dark: { primary: '#FB923C', accent: '#F472B6', background: '#1C0F0A', header: '#2A1710', agentBubble: '#331D14', conversationList: '#23130D', composer: '#2A1710', files: '#23130D' }
  },
  {
    id: 'plum',
    light: { primary: '#7E22CE', accent: '#BE185D', background: '#FAF5FF', header: '#FFFFFF', agentBubble: '#FFFFFF', conversationList: '#F5EEFC', composer: '#FFFFFF', files: '#F5EEFC' },
    dark: { primary: '#C084FC', accent: '#F472B6', background: '#150B1F', header: '#21122F', agentBubble: '#2A1840', conversationList: '#1B0F28', composer: '#21122F', files: '#1B0F28' }
  },
  {
    id: 'graphite',
    light: { primary: '#262626', accent: '#525252', background: '#FAFAFA', header: '#FFFFFF', agentBubble: '#F5F5F5', conversationList: '#F5F5F5', composer: '#FFFFFF', files: '#F5F5F5' },
    dark: { primary: '#E5E5E5', accent: '#A3A3A3', background: '#0A0A0A', header: '#171717', agentBubble: '#1F1F1F', conversationList: '#141414', composer: '#171717', files: '#141414' }
  },
  {
    id: 'contrast',
    light: { primary: '#000000', accent: '#1D4ED8', background: '#FFFFFF', header: '#FFFFFF', agentBubble: '#FFFFFF', conversationList: '#FFFFFF', composer: '#FFFFFF', files: '#FFFFFF' },
    dark: { primary: '#FFFFFF', accent: '#FFD60A', background: '#000000', header: '#000000', agentBubble: '#000000', conversationList: '#000000', composer: '#000000', files: '#000000' }
  }
];

/** A preset by id, or null. */
export function paletteById(id) {
  return APP_PALETTES.find((p) => p.id === id) || null;
}

/** The form with a preset's sixteen colors filled in and paletteId set to it. Unknown ids leave the form as it is. */
export function applyPalette(form, id) {
  const palette = paletteById(id);
  if (!palette) return form;
  const next = { ...form, paletteId: palette.id };
  for (const r of APP_COLOR_ROLES) {
    next[r.field] = palette.light[r.role];
    next[r.darkField] = palette.dark[r.role];
  }
  return next;
}

/** The form with one color changed. Any color edit makes the palette custom (LP-017). */
export function setAppColor(form, field, value) {
  return { ...form, [field]: value, paletteId: CUSTOM_PALETTE };
}

/** The form with every color cleared and no palette, so the app page uses its built-in colors in both themes. */
export function clearAppColors(form) {
  const next = { ...form, paletteId: '' };
  for (const r of APP_COLOR_ROLES) {
    next[r.field] = '';
    next[r.darkField] = '';
  }
  return next;
}

/**
 * What the app page draws for a role in a theme, as app-ui's roleColor does: the light color (or the built-in one) in
 * light mode; in dark mode the dark color when set, else one derived from the light color for an app with a palette,
 * else the light color itself for an app without one, else the built-in dark color. Returns { color, source }, where
 * source is 'set', 'derived', 'light' (the light color reused), or 'default'.
 */
export function effectiveColor(form, roleOrField, theme) {
  const r = APP_COLOR_ROLES.find((x) => x.role === roleOrField || x.field === roleOrField);
  if (!r) return { color: null, source: 'default' };
  const light = normalizeColor(form?.[r.field]);
  if (theme !== 'dark') return light ? { color: light, source: 'set' } : { color: THEME_DEFAULT_COLORS.light[r.role].toLowerCase(), source: 'default' };
  const dark = normalizeColor(form?.[r.darkField]);
  if (dark) return { color: dark, source: 'set' };
  if (light && form?.paletteId) return { color: deriveDarkColor(light, r.kind), source: 'derived' };
  if (light) return { color: light, source: 'light' };
  return { color: THEME_DEFAULT_COLORS.dark[r.role].toLowerCase(), source: 'default' };
}
