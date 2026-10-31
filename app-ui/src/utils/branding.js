// App branding (AD6.10), read at runtime from GET /v1.0/apps/{slug}, so a change shows on the next page load with no
// rebuild. Colors become CSS variables on <html>:
//   --app-primary / --app-on-primary   buttons, the user's messages, and the header accent, with a text color
//                                      (black or white) picked for the higher contrast, which is always at least 4.5:1
//   --app-accent / --app-on-accent     focus rings, the selected conversation, and highlights
// Only #rgb and #rrggbb colors are accepted; anything else keeps the built-in teal, so a stored value can never
// inject other CSS.

export const DEFAULT_PRIMARY = '#0f766e';
export const DEFAULT_ACCENT = '#b45309';
const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;
const DARK_TEXT = '#000000';
const LIGHT_TEXT = '#ffffff';

/** Normalize #rgb or #rrggbb to lower-case #rrggbb; null for anything else. */
export function normalizeColor(value) {
  const text = String(value || '').trim();
  if (!HEX.test(text)) return null;
  const hex = text.slice(1).toLowerCase();
  return hex.length === 3 ? `#${hex.split('').map((c) => c + c).join('')}` : `#${hex}`;
}

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of a #rrggbb color. */
export function luminance(hex) {
  const n = normalizeColor(hex);
  if (!n) return 0;
  const r = parseInt(n.slice(1, 3), 16);
  const g = parseInt(n.slice(3, 5), 16);
  const b = parseInt(n.slice(5, 7), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colors (1 to 21). */
export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/** The text color (white or near black) with the better contrast on the given background. */
export function readableOn(background) {
  return contrastRatio(background, LIGHT_TEXT) >= contrastRatio(background, DARK_TEXT) ? LIGHT_TEXT : DARK_TEXT;
}

/** Font stacks per typeface (AppFontEnum); System keeps the locale-aware default. Only fonts browsers already have. */
export const FONT_STACKS = {
  Sans: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  Serif: "Georgia, 'Times New Roman', Times, serif",
  Rounded: "ui-rounded, 'SF Pro Rounded', 'Nunito', 'Varela Round', 'Arial Rounded MT Bold', sans-serif",
  Mono: "ui-monospace, 'SFMono-Regular', 'Cascadia Code', Consolas, 'Liberation Mono', Menlo, monospace"
};

/** Optional surface colors: the AppInfo field, the CSS variable it sets, and the text color variable beside it. */
const SURFACES = [
  ['backgroundColor', '--app-background', '--app-on-background'],
  ['headerColor', '--app-header', '--app-on-header'],
  ['agentBubbleColor', '--app-agent-bubble', '--app-on-agent-bubble']
];

/** Every variable branding may set, so a later call can clear the ones an app no longer uses. */
export const BRANDING_VARIABLES = ['--app-primary', '--app-on-primary', '--app-accent', '--app-on-accent', '--app-font', ...SURFACES.flatMap(([, v, on]) => [v, on])];

/**
 * CSS variables for an AppInfo: the primary and accent colors (always, with defaults), and the background, header, and
 * agent message colors and the typeface only when the app sets them, so the theme's own colors apply otherwise. Each
 * surface color comes with a readable text color.
 */
export function brandingVariables(info) {
  const primary = normalizeColor(info && info.primaryColor) || DEFAULT_PRIMARY;
  const accent = normalizeColor(info && info.accentColor) || DEFAULT_ACCENT;
  const vars = {
    '--app-primary': primary,
    '--app-on-primary': readableOn(primary),
    '--app-accent': accent,
    '--app-on-accent': readableOn(accent)
  };
  for (const [field, variable, on] of SURFACES) {
    const color = normalizeColor(info && info[field]);
    if (!color) continue;
    vars[variable] = color;
    vars[on] = readableOn(color);
  }
  const font = info && FONT_STACKS[info.fontFamily];
  if (font) vars['--app-font'] = font;
  return vars;
}

/** Apply branding to the document: CSS variables, the page title, and the browser tab icon (faviconUrl, absolute). */
export function applyBranding(info, root = document.documentElement, faviconUrl = null) {
  const vars = brandingVariables(info);
  for (const name of BRANDING_VARIABLES) if (!(name in vars)) root.style.removeProperty(name);
  for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value);
  const name = info && (info.displayName || info.slug);
  if (name) document.title = name;
  if (faviconUrl && typeof document !== 'undefined') {
    let link = document.querySelector('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.removeAttribute('sizes');
    link.href = faviconUrl;
  }
  return vars;
}
