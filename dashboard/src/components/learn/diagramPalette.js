// Literal colors for the standalone SVG exports in docs/images/learn (LP4.4).
//
// In the dashboard the diagram classes take their colors from the theme tokens in index.css (the "Concept diagrams"
// section). A static SVG on GitHub cannot read those variables, so scripts/export-diagrams.mjs embeds this style
// sheet instead: the light theme's token values, and the dark theme's under prefers-color-scheme. Keep the two in
// step with the :root and [data-theme='dark'] tokens in index.css.

const LIGHT = {
  bg: '#ffffff',
  surface: '#ffffff',
  surfaceAlt: '#f1f5f9',
  border: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#526178',
  primary: '#0f766e',
  info: '#1d4ed8',
  warning: '#92400e',
  danger: '#b91c1c'
};

const DARK = {
  bg: '#111a2c',
  surface: '#111a2c',
  surfaceAlt: '#1a243a',
  border: '#1f2b44',
  text: '#e2e8f0',
  textSecondary: '#cbd5e1',
  textMuted: '#9aaac1',
  primary: '#2dd4bf',
  info: '#60a5fa',
  warning: '#fbbf24',
  danger: '#f87171'
};

function hex(value) {
  const n = parseInt(value.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** color-mix(in srgb, a p%, b), as a hex string. */
export function mix(a, b, percent) {
  const p = percent / 100;
  const [ar, ag, ab] = hex(a);
  const [br, bg, bb] = hex(b);
  const c = (x, y) => Math.round(x * p + y * (1 - p)).toString(16).padStart(2, '0');
  return `#${c(ar, br)}${c(ag, bg)}${c(ab, bb)}`;
}

function rules(c) {
  const tone = (name, color) =>
    `.lg-box--${name} .lg-box-bg{fill:${mix(color, c.surface, 9)};stroke:${mix(color, c.border, 55)}}`;
  return [
    `.lg-bg{fill:${c.bg}}`,
    `.lg-group rect{fill:${c.surfaceAlt};stroke:${c.border}}`,
    `.lg-group-label{fill:${c.textMuted}}`,
    `.lg-box-bg{fill:${c.surface};stroke:${mix(c.textMuted, c.border, 38)}}`,
    tone('core', c.primary),
    tone('actor', c.info),
    tone('check', c.warning),
    tone('stop', c.danger),
    `.lg-box-title{fill:${c.text}}`,
    `.lg-box-body{fill:${c.textSecondary}}`,
    `.lg-box-code{fill:${c.textMuted}}`,
    `.lg-arrow path{stroke:${c.textMuted}}`,
    `.lg-arrowhead{fill:${c.textMuted}}`,
    `.lg-arrow-label rect{fill:${c.surface};stroke:${c.border}}`,
    `.lg-arrow-label text{fill:${c.textSecondary}}`
  ].join('');
}

const SHAPE = [
  ".lg-svg{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue','Noto Sans',sans-serif}",
  '.lg-group-label{font-size:11.5px;font-weight:600}',
  '.lg-box-bg{stroke-width:1}',
  '.lg-box-title{font-size:13px;font-weight:600}',
  '.lg-box-body{font-size:11.5px}',
  ".lg-box-code{font-size:10.5px;font-family:'SFMono-Regular',ui-monospace,Menlo,Consolas,monospace}",
  '.lg-arrow path{fill:none;stroke-width:1.4}',
  '.lg-arrow--dashed path{stroke-dasharray:5 4}',
  '.lg-arrowhead{stroke:none}',
  '.lg-arrow-label text{font-size:11px}'
].join('');

/** The style sheet embedded in every exported SVG: shapes, the light palette, and the dark palette. */
export function exportStyleSheet() {
  return `${SHAPE}${rules(LIGHT)}@media (prefers-color-scheme: dark){${rules(DARK)}}`;
}
