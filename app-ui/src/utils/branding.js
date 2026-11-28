// App branding (AD6.10), read at runtime from GET /v1.0/apps/{slug}, so a change shows on the next page load with no
// rebuild. Colors become CSS variables on <html>:
//   --app-primary / --app-on-primary   buttons, the user's messages, and the header accent, with a text color
//                                      (black or white) picked for the higher contrast, which is always at least 4.5:1
//   --app-accent / --app-on-accent     focus rings, the selected conversation, and highlights
// Only #rgb and #rrggbb colors are accepted; anything else keeps the built-in teal, so a stored value can never
// inject other CSS. Each role has a dark color too (darkPrimaryColor and so on); see roleColor for how a null one is
// filled in.

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

/**
 * Optional surface colors: the AppInfo field, its dark counterpart, the CSS variable it sets, and the text and muted
 * text variables beside it (dates, hints, and other secondary text on that surface).
 */
const SURFACES = [
  ['backgroundColor', 'darkBackgroundColor', '--app-background', '--app-on-background', '--app-muted-background'],
  ['headerColor', 'darkHeaderColor', '--app-header', '--app-on-header', '--app-muted-header'],
  ['agentBubbleColor', 'darkAgentBubbleColor', '--app-agent-bubble', '--app-on-agent-bubble', '--app-muted-agent-bubble'],
  ['conversationListColor', 'darkConversationListColor', '--app-conversations', '--app-on-conversations', '--app-muted-conversations'],
  ['composerColor', 'darkComposerColor', '--app-composer', '--app-on-composer', '--app-muted-composer'],
  ['filesColor', 'darkFilesColor', '--app-files', '--app-on-files', '--app-muted-files']
];

/** Secondary text on a surface: the readable text color, softened. */
export function mutedOn(background) {
  return readableOn(background) === LIGHT_TEXT ? 'rgba(255, 255, 255, 0.75)' : 'rgba(0, 0, 0, 0.62)';
}

/** Every variable branding may set, so a later call can clear the ones an app no longer uses. */
export const BRANDING_VARIABLES = ['--app-primary', '--app-on-primary', '--app-accent', '--app-on-accent', '--app-font', ...SURFACES.flatMap(([, , v, on, muted]) => [v, on, muted])];

// ------------------------------------------------------------------ dark colors (LP-017)
// A dark color an app leaves null is derived from its light color in OKLCH, which keeps the hue while the lightness
// moves: a light surface becomes a dark one of the same tint, and a brand color (primary, accent) is lifted so it
// stands out on a dark page. The dashboard mirrors this in dashboard/src/utils/appColors.js, and a dashboard test
// checks both give the same answer.

function toLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

function fromLinear(v) {
  const c = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return Math.round(Math.min(1, Math.max(0, c)) * 255);
}

/** OKLCH { l, c, h } of a #rrggbb color (h in radians). */
export function toOklch(hex) {
  const n = normalizeColor(hex) || '#000000';
  const r = toLinear(parseInt(n.slice(1, 3), 16));
  const g = toLinear(parseInt(n.slice(3, 5), 16));
  const b = toLinear(parseInt(n.slice(5, 7), 16));
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.sqrt(A * A + B * B), h: Math.atan2(B, A) };
}

function oklchToLinear(L, C, H) {
  const A = C * Math.cos(H);
  const B = C * Math.sin(H);
  const l = Math.pow(L + 0.3963377774 * A + 0.2158037573 * B, 3);
  const m = Math.pow(L - 0.1055613458 * A - 0.0638541728 * B, 3);
  const s = Math.pow(L - 0.0894841775 * A - 1.291485548 * B, 3);
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
}

/** A #rrggbb color for OKLCH values, lowering the chroma until the color fits in sRGB. */
export function fromOklch(L, C, H) {
  const inGamut = (rgb) => rgb.every((v) => v >= -0.0001 && v <= 1.0001);
  let c = C;
  if (!inGamut(oklchToLinear(L, c, H))) {
    let lo = 0;
    let hi = C;
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear(L, mid, H))) lo = mid;
      else hi = mid;
    }
    c = lo;
  }
  return `#${oklchToLinear(L, c, H).map((v) => fromLinear(v).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * The dark theme color for a light one. kind 'surface' (background, header, messages, lists, composer, files): a
 * light surface becomes dark with the same hue and a little of its tint (lighter surfaces stay lighter, so panels
 * still stand out from the page), and a surface that is already dark stays.
 * kind 'brand' (primary, accent): a color darker than OKLCH lightness 0.72 is lifted to it, keeping hue and chroma.
 */
export function deriveDarkColor(hex, kind = 'surface') {
  const n = normalizeColor(hex);
  if (!n) return null;
  const { l, c, h } = toOklch(n);
  if (kind === 'brand') return l >= 0.72 ? n : fromOklch(0.72, c, h);
  if (l < 0.5) return n;
  return fromOklch(Math.max(0.12, 0.22 - (1 - l) * 1.3), Math.min(c * 1.5, 0.04), h);
}

/**
 * The color one role shows in a theme: the light color in light mode; in dark mode the dark color when set, else,
 * for an app that chose a palette (paletteId set), one derived from the light color, else the light color itself
 * (so apps saved before palettes keep the look they had).
 */
export function roleColor(info, field, darkField, theme, kind) {
  const light = normalizeColor(info && info[field]);
  if (theme !== 'dark') return light;
  const dark = normalizeColor(info && info[darkField]);
  if (dark) return dark;
  if (light && info && info.paletteId) return deriveDarkColor(light, kind);
  return light;
}

/**
 * CSS variables for an AppInfo in a theme ('light' or 'dark'): the primary and accent colors (always, with
 * defaults), and the background, header, agent message, list, composer, and file colors and the typeface only when
 * the app sets them, so the theme's own colors apply otherwise. Each surface color comes with a readable text color.
 */
export function brandingVariables(info, theme = 'light') {
  const primary = roleColor(info, 'primaryColor', 'darkPrimaryColor', theme, 'brand') || DEFAULT_PRIMARY;
  const accent = roleColor(info, 'accentColor', 'darkAccentColor', theme, 'brand') || DEFAULT_ACCENT;
  const vars = {
    '--app-primary': primary,
    '--app-on-primary': readableOn(primary),
    '--app-accent': accent,
    '--app-on-accent': readableOn(accent)
  };
  for (const [field, darkField, variable, on, muted] of SURFACES) {
    const color = roleColor(info, field, darkField, theme, 'surface');
    if (!color) continue;
    vars[variable] = color;
    vars[on] = readableOn(color);
    vars[muted] = mutedOn(color);
  }
  const font = info && FONT_STACKS[info.fontFamily];
  if (font) vars['--app-font'] = font;
  return vars;
}

/** Corner style (AppCornerStyleEnum) and density (AppDensityEnum) as data attributes on <html>; the defaults set none. */
export function layoutAttributes(info) {
  const corners = info && info.cornerStyle;
  const density = info && info.density;
  return {
    'data-corners': corners === 'Sharp' ? 'sharp' : corners === 'Pill' ? 'pill' : null,
    'data-density': density === 'Compact' ? 'compact' : null
  };
}

/**
 * Apply branding to the document: CSS variables for the theme (by default the one data-theme on root names), the
 * corner style and density attributes, the page title, and the browser tab icon (faviconUrl, absolute).
 */
export function applyBranding(info, root = document.documentElement, faviconUrl = null, theme = null) {
  const vars = brandingVariables(info, theme || (root.getAttribute && root.getAttribute('data-theme')) || 'light');
  for (const [name, value] of Object.entries(layoutAttributes(info))) {
    if (value) root.setAttribute(name, value);
    else root.removeAttribute(name);
  }
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
