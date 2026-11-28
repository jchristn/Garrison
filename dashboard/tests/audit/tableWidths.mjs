// Table width audit: does any dashboard table scroll sideways with its default columns?
//
// Signs in to a running Garrison server through a running dashboard dev server, clears the saved column choices,
// visits every hub tab in src/config/navConfig.js plus the detail pages of a few records of each kind, and reports, for
// every `.table-scroll`, its scrollWidth against its clientWidth, the table's tableId (from its export menu) or
// data-testid, its narrowest possible width (min, every wrappable cell wrapped; the headroom is clientWidth - min), and
// the visible header labels. It also reports when the document itself scrolls sideways.
//
// Run it (from dashboard/), with a server on 18950 and the dev server on 18955:
//
//   GARRISON_API_URL=http://127.0.0.1:18950 npx vite --port 18955 --host 127.0.0.1 --strictPort &
//   node tests/audit/tableWidths.mjs
//
// Environment (all optional):
//   AUDIT_DASHBOARD_URL  dashboard base URL                      default http://127.0.0.1:18955
//   AUDIT_API_URL        server URL, for sign-in and record IDs   default http://127.0.0.1:18950
//   AUDIT_EMAIL, AUDIT_PASSWORD, AUDIT_TENANT                     default admin@garrison, password, default
//   AUDIT_VIEWPORT       WIDTHxHEIGHT                             default 1366x768
//   AUDIT_LOCALE         dashboard locale                         default en
//   AUDIT_ONLY           comma list of page ids or detail slugs to visit (default every page)
//   AUDIT_NO_DETAILS     set to 1 to skip the detail pages
//   AUDIT_JSON           path to also write the raw results as JSON
//
// Exits 1 when any table or the document overflows (a slack of 1 pixel is allowed for rounding).

import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { PAGES, pathFor } from '../../src/config/navConfig.js';

const DASH = (process.env.AUDIT_DASHBOARD_URL || 'http://127.0.0.1:18955').replace(/\/$/, '');
const API = (process.env.AUDIT_API_URL || 'http://127.0.0.1:18950').replace(/\/$/, '');
const EMAIL = process.env.AUDIT_EMAIL || 'admin@garrison';
const PASSWORD = process.env.AUDIT_PASSWORD || 'password';
const TENANT = process.env.AUDIT_TENANT || 'default';
const [VW, VH] = (process.env.AUDIT_VIEWPORT || '1366x768').split('x').map(Number);
const LOCALE = process.env.AUDIT_LOCALE || 'en';
const ONLY = (process.env.AUDIT_ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);
const SLACK = 1;

// Detail routes and the list each one's record IDs come from. `query` narrows the list.
const DETAILS = [
  { slug: 'runs', list: 'runs', count: 2 },
  { slug: 'conversations', list: 'conversations', count: 1 },
  { slug: 'pipeline-runs', list: 'pipeline-runs', count: 1 },
  { slug: 'keepers', list: 'mandates', count: 2 },
  { slug: 'reports', list: 'reports', count: 2 },
  { slug: 'escalations', list: 'escalations', count: 1 },
  { slug: 'message-threads', list: 'messages', count: 1, idOf: (m) => m.threadId || m.id },
  { slug: 'organizations', list: 'organizations', count: 1 },
  { slug: 'board', list: 'organizations', count: 1 },
  { slug: 'performance', list: 'organizations', count: 1 },
  { slug: 'evaluations', list: 'eval-sets', count: 1 },
  { slug: 'eval-runs', list: 'eval-runs', count: 1 },
  { slug: 'shadow-trials', list: 'shadow-trials', count: 1 },
  { slug: 'canary-releases', list: 'canary-releases', count: 1 },
  { slug: 'agents', list: 'agents', count: 2 },
  { slug: 'prompt-templates', list: 'prompt-templates', count: 1 }
];

async function signIn() {
  const res = await fetch(`${API}/v1.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, tenantId: TENANT })
  });
  if (!res.ok) throw new Error(`sign-in failed: HTTP ${res.status}`);
  const body = await res.json();
  if (!body.token) throw new Error('sign-in returned no token');
  return body.token;
}

async function listIds(token, list, count, idOf) {
  try {
    const res = await fetch(`${API}/v1.0/api/tenants/${TENANT}/${list}?maxResults=${count}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const body = await res.json();
    const objects = Array.isArray(body) ? body : body.objects || [];
    return objects.slice(0, count).map((o) => (idOf ? idOf(o) : o.id)).filter(Boolean);
  } catch {
    return [];
  }
}

async function settle(page) {
  try {
    await page.waitForLoadState('networkidle', { timeout: 8000 });
  } catch {
    // Live pages (streams, auto refresh) never go idle; measure what is on screen.
  }
  await page.waitForTimeout(600);
}

async function measure(page) {
  return page.evaluate(() => {
    const doc = document.documentElement;
    const tables = [...document.querySelectorAll('.table-scroll')]
      .filter((el) => el.offsetParent !== null && el.querySelector('table'))
      .map((el) => {
        const table = el.querySelector('table');
        const frame = el.closest('.table-frame');
        const exportBtn = frame && frame.querySelector('[data-testid^="export-table-"]');
        const tableId = exportBtn ? exportBtn.getAttribute('data-testid').replace(/^export-table-/, '') : '';
        // The narrowest the table can get (every wrappable cell wrapped): above clientWidth it scrolls.
        const before = table.style.width;
        table.style.width = '1px';
        const minWidth = table.offsetWidth;
        table.style.width = before;
        const headers = [...table.querySelectorAll('thead th')].map((th) => th.textContent.replace(/[▲▼⇅]/g, '').trim()).filter((s) => s.length > 0);
        return {
          tableId,
          testId: table.getAttribute('data-testid') || '',
          scrollWidth: el.scrollWidth,
          clientWidth: el.clientWidth,
          minWidth,
          rows: table.querySelectorAll('tbody tr').length,
          headers
        };
      });
    return { docScroll: doc.scrollWidth, docClient: doc.clientWidth, tables };
  });
}

async function visit(page, label, url, results) {
  await page.goto(`${DASH}${url}`);
  await settle(page);
  const first = await measure(page);
  results.push({ label, url, ...first });
  // Local tabs inside the page (detail views): visit each and measure again. The hub tab strip is not one of them;
  // every hub tab is its own entry in PAGES.
  const tabs = page.locator('main [role="tablist"]:not(.hub-tab-strip) [role="tab"]');
  const n = await tabs.count();
  for (let i = 1; i < n; i += 1) {
    const tab = tabs.nth(i);
    let name = '';
    try {
      name = ((await tab.textContent()) || '').trim();
      await tab.click({ timeout: 2000 });
    } catch {
      continue;
    }
    await settle(page);
    const m = await measure(page);
    results.push({ label: `${label} [${name}]`, url, ...m });
  }
}

function report(results) {
  let failures = 0;
  const lines = [];
  for (const r of results) {
    const docOver = r.docScroll > r.docClient + SLACK;
    if (docOver) failures += 1;
    if (!r.tables.length && !docOver) continue;
    lines.push(`\n${r.label}  ${r.url}${docOver ? `  DOCUMENT OVERFLOW ${r.docScroll}/${r.docClient}` : ''}`);
    for (const t of r.tables) {
      const over = t.scrollWidth > t.clientWidth + SLACK;
      if (over) failures += 1;
      lines.push(
        `  ${over ? 'OVER' : 'ok  '} ${String(t.scrollWidth).padStart(5)}/${String(t.clientWidth).padEnd(5)} min ${String(t.minWidth).padEnd(5)} ${t.tableId || t.testId || '(no id)'} rows=${t.rows} cols=${t.headers.length}: ${t.headers.join(' | ')}`
      );
    }
  }
  console.log(lines.join('\n'));
  console.log(`\n${failures} overflow(s) at ${VW}x${VH}, locale ${LOCALE}`);
  return failures;
}

async function main() {
  const token = await signIn();
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: VW, height: VH } });
  await context.addInitScript(
    ({ tok, tenant, locale }) => {
      if (sessionStorage.getItem('__auditInit')) return;
      sessionStorage.setItem('__auditInit', '1');
      localStorage.setItem('garrison_token', tok);
      localStorage.setItem('garrison_tenant', tenant);
      localStorage.setItem('garrison.locale', locale);
      localStorage.setItem('garrison_theme', 'light');
      localStorage.setItem('garrison_tour_done', 'true');
      localStorage.setItem(`garrison_setup_dismissed:${tenant}`, 'true');
      localStorage.setItem('garrison_sidebar_collapsed', 'false');
      localStorage.removeItem('garrison_columns');
      localStorage.removeItem('garrison_page_size');
    },
    { tok: token, tenant: TENANT, locale: LOCALE }
  );
  const page = await context.newPage();
  const results = [];
  const wanted = (key) => !ONLY.length || ONLY.includes(key);

  for (const p of PAGES) {
    if (!wanted(p.id)) continue;
    await visit(page, `${p.hub}/${p.id}`, pathFor(p.id), results);
  }
  if (!process.env.AUDIT_NO_DETAILS) {
    for (const d of DETAILS) {
      if (!wanted(d.slug)) continue;
      const ids = await listIds(token, d.list, d.count, d.idOf);
      for (const id of ids) await visit(page, `detail ${d.slug}`, `/dashboard/${d.slug}/${encodeURIComponent(id)}`, results);
    }
  }
  await browser.close();
  if (process.env.AUDIT_JSON) writeFileSync(process.env.AUDIT_JSON, JSON.stringify(results, null, 2));
  process.exitCode = report(results) ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 2;
});
