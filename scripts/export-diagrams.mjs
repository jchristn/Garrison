#!/usr/bin/env node
// Render the Learn page's concept diagrams (LP4.4) to standalone SVG files for the docs.
//
// The diagrams are React components (dashboard/src/components/learn), so this script loads them through Vite's SSR
// module loader from the dashboard's own node_modules and renders each one with react-dom/server. It adds no
// dependency. Each file embeds a style sheet with the light palette and a prefers-color-scheme dark palette, because a
// static SVG cannot read the dashboard's CSS variables; GitHub shows it in either theme.
//
// Usage (from the repository root):
//   node scripts/export-diagrams.mjs                     English SVGs into docs/images/learn/
//   node scripts/export-diagrams.mjs --locale de --out /tmp/learn-de   another locale, somewhere else
//   node scripts/export-diagrams.mjs --rtl --out /tmp/learn-rtl        mirrored, to check right-to-left layout
//
// Run `npm install` in dashboard/ first.

import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..');
const dashboard = path.join(repo, 'dashboard');

function argValue(name, fallback) {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const locale = argValue('--locale', 'en');
const outDir = path.resolve(argValue('--out', path.join(repo, 'docs', 'images', 'learn')));
const rtl = process.argv.includes('--rtl');

// File names for the docs, kebab case.
const FILE_NAMES = {
  runtime: 'runtime',
  request: 'request',
  autonomy: 'autonomy',
  teams: 'teams',
  organization: 'organization',
  selfRevision: 'self-revision',
  brakes: 'brakes'
};

// One virtual module renders everything, so React, i18next, react-i18next, and the diagram components all come from
// the same module graph (both i18n packages ship separate ESM and CommonJS builds, and mixing them splits the context).
const ENTRY = 'virtual:learn-diagram-export';
const ENTRY_SOURCE = `
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import resources from '/src/i18n/resources.js';
import { DiagramSvg } from '/src/components/learn/Diagram.jsx';
import { DIAGRAMS } from '/src/components/learn/diagrams.js';
import { exportStyleSheet } from '/src/components/learn/diagramPalette.js';

export const locales = Object.keys(resources);

export async function renderAll(locale, dir) {
  const i18n = i18next.createInstance();
  await i18n.init({ resources, lng: locale, fallbackLng: 'en', interpolation: { escapeValue: false }, returnNull: false });
  const styleSheet = exportStyleSheet();
  return DIAGRAMS.map((def) => ({
    id: def.id,
    markup: renderToStaticMarkup(
      createElement(I18nextProvider, { i18n }, createElement(DiagramSvg, { def, dir, links: { standalone: true, docBase: '../../', onNavigate: null }, styleSheet, idPrefix: 'lg-' + def.id }))
    )
  }));
}
`;

const { createServer } = await import(pathToFileURL(path.join(dashboard, 'node_modules', 'vite', 'dist', 'node', 'index.js')).href);
const server = await createServer({
  root: dashboard,
  configFile: path.join(dashboard, 'vite.config.js'),
  logLevel: 'error',
  server: { middlewareMode: true, hmr: false, watch: null },
  appType: 'custom',
  plugins: [
    {
      name: 'learn-diagram-export',
      resolveId: (id) => (id === ENTRY ? `\0${ENTRY}` : null),
      load: (id) => (id === `\0${ENTRY}` ? ENTRY_SOURCE : null)
    }
  ]
});

try {
  const entry = await server.ssrLoadModule(ENTRY);
  if (!entry.locales.includes(locale)) throw new Error(`Unknown locale ${locale}. Known: ${entry.locales.join(', ')}`);
  mkdirSync(outDir, { recursive: true });
  for (const { id, markup } of await entry.renderAll(locale, rtl ? 'rtl' : 'ltr')) {
    const file = path.join(outDir, `${FILE_NAMES[id] || id}.svg`);
    writeFileSync(file, `<?xml version="1.0" encoding="UTF-8"?>\n${markup}\n`);
    console.log(`wrote ${path.relative(process.cwd(), file)}`);
  }
} finally {
  await server.close();
}
