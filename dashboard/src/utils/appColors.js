// Color math for app appearance (LP-017): contrast, readable text, and the dark colors the app page derives. This
// mirrors app-ui/src/utils/branding.js so the dashboard shows what the app page will draw, and appPalettes.test.js
// checks that both give the same answers.

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Text colors the app page picks between: whichever contrasts more with the surface. */
export const DARK_TEXT = '#000000';
export const LIGHT_TEXT = '#ffffff';

/** The app page's own text colors per theme (app-ui/src/index.css), used for text that does not follow a surface. */
export const THEME_TEXT = { light: '#0f172a', dark: '#e6edf6' };

/** WCAG AA contrast for body text. */
export const AA_TEXT = 4.5;

/** Normalize #rgb or #rrggbb to lower-case #rrggbb; null for anything else. */
export function normalizeColor(value) {
  const text = String(value || '').trim();
  if (!HEX.test(text)) return null;
  const hex = text.slice(1).toLowerCase();
  return hex.length === 3 ? `#${hex.split('').map((c) => c + c).join('')}` : `#${hex}`;
}

function rgbOf(hex) {
  const n = normalizeColor(hex) || '#000000';
  return [parseInt(n.slice(1, 3), 16), parseInt(n.slice(3, 5), 16), parseInt(n.slice(5, 7), 16)];
}

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of a #rrggbb color. */
export function luminance(hex) {
  if (!normalizeColor(hex)) return 0;
  const [r, g, b] = rgbOf(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG contrast ratio between two colors (1 to 21). */
export function contrastRatio(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** The text color (white or black) with the better contrast on the given background. */
export function readableOn(background) {
  return contrastRatio(background, LIGHT_TEXT) >= contrastRatio(background, DARK_TEXT) ? LIGHT_TEXT : DARK_TEXT;
}

/**
 * Secondary text on a surface as a solid color: the app page draws the readable text at 75% (white) or 62% (black)
 * opacity, so this blends it over the surface to measure its contrast.
 */
export function mutedOn(background) {
  const [r, g, b] = rgbOf(background);
  const white = readableOn(background) === LIGHT_TEXT;
  const alpha = white ? 0.75 : 0.62;
  const top = white ? 255 : 0;
  return `#${[r, g, b].map((c) => Math.round(c * (1 - alpha) + top * alpha).toString(16).padStart(2, '0')).join('')}`;
}

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
  const [r, g, b] = rgbOf(hex).map(toLinear);
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
 * The dark theme color for a light one, as the app page derives it. kind 'surface': a light surface becomes dark with
 * the same hue and a little of its tint (lighter surfaces stay lighter, so panels still stand out from the page), and
 * one that is already dark stays. kind 'brand' (primary, accent): a color
 * darker than OKLCH lightness 0.72 is lifted to it.
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
 * The lowest contrast of the text the app page draws on a color in a theme. A surface carries its readable text,
 * its muted text, and some text in the theme's own color (list rows, header buttons); primary and accent carry only
 * their readable text.
 */
export function textContrast(color, theme, kind = 'surface') {
  const c = normalizeColor(color);
  if (!c) return null;
  const on = contrastRatio(c, readableOn(c));
  if (kind === 'brand') return on;
  return Math.min(on, contrastRatio(c, mutedOn(c)), contrastRatio(c, THEME_TEXT[theme === 'dark' ? 'dark' : 'light']));
}
