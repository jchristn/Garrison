#!/usr/bin/env node
// UX pass capture (LEARNABILITY_PLAN.md LP5.1): screenshot the whole dashboard across viewports, themes, and locales.
//
// It extends tableWidths.mjs. It signs in to a running server through a running dashboard dev server and, for every
// combination of locale, theme, and viewport, captures:
//   - every page in src/config/navConfig.js (standalone pages and every hub tab, hidden ones included);
//   - detail pages of the seeded records (seed.json from seed.mjs, falling back to the first records of each list), and
//     each local tab on them (the organization Design and Chart tabs among them);
//   - the Trail tab of the seeded origin run in its Sequence, Graph, and List views, and with a step drawer open;
//   - the row action menu of representative lists, and every dialog its items open;
//   - loading, empty, and error states of representative routes, forced by mocking their API responses.
//
// The capture never changes the server: every request other than GET, HEAD, and OPTIONS is answered 409
// CaptureReadOnly before it leaves the browser, except the read-only POSTs listed in READ_ONLY_POSTS. Blocked requests
// are recorded per shot, so a dialog that tried to load something through a POST can be told apart from a real error.
//
// For each shot it records the console errors and page errors, whether the page scrolls sideways
// (document.documentElement.scrollWidth > innerWidth), and text that overflows its box: buttons, badges and pills, table
// headers, nav items, tabs, and titles whose scrollWidth exceeds their clientWidth while text-overflow is not ellipsis.
//
// Output, under --out:
//   shots/<locale>/<theme>/<viewport>/<route-slug>.png
//   coverage.json    route by viewport by theme by locale; every cell is captured or carries a reason
//   shots.json       one entry per captured shot with its URL, timings, console errors, scroll, and overflows
//   mechanical.json  console errors, sideways scroll, and overflows grouped by route
// A targeted run (any of the filters below) merges into the existing files instead of replacing them.
//
// Run it from dashboard/, with the stack from seed.mjs running:
//
//   node tests/audit/capture.mjs --out /path/to/scratch/uxpass1
//   node tests/audit/capture.mjs --out ... --routes 'runs--runs,detail-runs-*' --viewports 1366x768 --locales en --themes dark
//
// Options:
//   --out DIR            output root, also where seed.json is read from        UXCAP_OUT (required)
//   --dashboard URL      dashboard base URL                                     default http://127.0.0.1:18955
//   --api URL            server URL, for sign-in and record IDs                 default http://127.0.0.1:18950
//   --routes a,b*        route slugs to capture; * matches anything             default all
//   --viewports list     WIDTHxHEIGHT list                                      default 1366x768,1280x800,768x1024,390x844
//   --themes list        light,dark                                             default both
//   --locales list       en,de,ja                                               default en,de,ja (ja at 1366x768 only)
//   --ja-viewports list  viewports captured in Japanese                         default 1366x768
//   --state-viewports    viewports for forced loading, empty, and error states  default 1366x768,390x844
//   --state-locales      locales for forced states                              default en,de
//   --workers N          browser contexts in parallel                           default 4
//   --no-states          skip the forced states
//   --no-actions         skip row action menus and dialogs
//   --list               print the route slugs and exit
//
// Exits 0 when the run finished, whatever it found; findings are data for the reviewers.

import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { PAGES, pathFor } from '../../src/config/navConfig.js';

// ---------------------------------------------------------------- options

function parseArgs(argv) {
  const o = {
    out: process.env.UXCAP_OUT || '',
    dashboard: 'http://127.0.0.1:18955',
    api: 'http://127.0.0.1:18950',
    routes: [],
    viewports: ['1366x768', '1280x800', '768x1024', '390x844'],
    themes: ['light', 'dark'],
    locales: ['en', 'de', 'ja'],
    jaViewports: ['1366x768'],
    stateViewports: ['1366x768', '390x844'],
    stateLocales: ['en', 'de'],
    workers: 4,
    states: true,
    actions: true,
    list: false
  };
  const csv = (v) => v.split(',').map((s) => s.trim()).filter(Boolean);
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--out') o.out = next();
    else if (a === '--dashboard') o.dashboard = next();
    else if (a === '--api') o.api = next();
    else if (a === '--routes') o.routes = csv(next());
    else if (a === '--viewports') o.viewports = csv(next());
    else if (a === '--themes') o.themes = csv(next());
    else if (a === '--locales') o.locales = csv(next());
    else if (a === '--ja-viewports') o.jaViewports = csv(next());
    else if (a === '--state-viewports') o.stateViewports = csv(next());
    else if (a === '--state-locales') o.stateLocales = csv(next());
    else if (a === '--workers') o.workers = Math.max(1, Number(next()) || 1);
    else if (a === '--no-states') o.states = false;
    else if (a === '--no-actions') o.actions = false;
    else if (a === '--list') o.list = true;
    else if (a === '-h' || a === '--help') {
      const src = fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n');
      process.stdout.write(src.slice(1, 50).map((l) => l.replace(/^\/\/ ?/, '')).join('\n') + '\n');
      process.exit(0);
    } else throw new Error(`unknown option ${a} (try --help)`);
  }
  if (!o.out && !o.list) throw new Error('--out DIR (or UXCAP_OUT) is required');
  o.out = o.out ? path.resolve(o.out) : '';
  o.dashboard = o.dashboard.replace(/\/$/, '');
  o.api = o.api.replace(/\/$/, '');
  return o;
}

const O = parseArgs(process.argv.slice(2));
const TENANT = 'default';
const EMAIL = 'admin@garrison';
const PASSWORD = 'password';
const SLACK = 1;
const MAX_ACTIONS = 5;
const MAX_SHOT_HEIGHT = 8000;
const UNREACHED = 'not in the filters of any capture run yet';
const T0 = Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (m) => process.stdout.write(`[${((Date.now() - T0) / 1000).toFixed(0).padStart(5)}s] ${m}\n`);

/** POSTs that only read or check, so dialogs that preview or validate still work during the capture. */
const READ_ONLY_POSTS = [/\/prompt-templates\/render(\?|$)/, /\/validate(\?|$)/, /\/compile-preview(\?|$)/, /\/preview(\?|$)/, /\/files\/download-url(\?|$)/, /\/approval-check(\?|$)/];

// ---------------------------------------------------------------- API and seed

async function signIn() {
  const res = await fetch(`${O.api}/v1.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD, tenantId: TENANT })
  });
  if (!res.ok) throw new Error(`sign-in failed: HTTP ${res.status}`);
  return (await res.json()).token;
}

async function listIds(token, sub, count) {
  try {
    const res = await fetch(`${O.api}/v1.0/api/tenants/${TENANT}/${sub}${sub.includes('?') ? '&' : '?'}maxResults=${count}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return [];
    const body = await res.json();
    const objects = Array.isArray(body) ? body : body.objects || [];
    return objects.slice(0, count);
  } catch {
    return [];
  }
}

function readSeed() {
  const f = path.join(O.out, 'seed.json');
  if (!fs.existsSync(f)) return {};
  try {
    return JSON.parse(fs.readFileSync(f, 'utf8')).ids || {};
  } catch {
    return {};
  }
}

// ---------------------------------------------------------------- targets

/**
 * A target is one route slug with how to reach it. kind: page (a navConfig page), detail (a record), trail, action
 * (row menu or dialog), state (forced loading, empty, or error).
 */
async function buildTargets(token) {
  const S = readSeed();
  const targets = [];
  for (const p of PAGES) {
    // Hidden detail-only tabs need a record; they are captured as details below.
    if (p.id === 'messageThreads') continue;
    targets.push({ slug: `${p.hub}--${p.slug}`, kind: 'page', url: pathFor(p.id), label: `${p.hub} / ${p.id}` });
  }

  // Detail records: seeded IDs first, then the first records of each list.
  const detail = [];
  const add = (slug, name, id) => id && detail.push({ slug, name, id });
  add('runs', 'chain-origin', S.chainOriginRun);
  add('runs', 'fanout-parent', S.fanoutParentRun);
  add('runs', 'failed', S.failedRun);
  add('runs', 'shadow-copy', S.shadowRun);
  add('runs', 'approvals', S.approvalRun);
  add('conversations', 'seeded', S.conversation);
  add('pipeline-runs', 'review', S.pipelineRun);
  add('keepers', 'gerbil', S.gerbilMandate);
  add('keepers', 'latency', S.sreLatencyMandate);
  add('reports', 'agent', (S.sreReports || [])[0]);
  add('reports', 'person', S.personReport);
  add('escalations', 'answered', S.answeredEscalation);
  add('escalations', 'open', S.openEscalation);
  add('message-threads', 'peer', S.srePeerThread);
  add('organizations', 'support-desk', S.chainOrganization);
  add('organizations', 'site-reliability', S.sreOrganization);
  add('board', 'site-reliability', S.sreOrganization);
  add('performance', 'site-reliability', S.sreOrganization);
  add('evaluations', 'docs-helper', S.evalSet);
  add('eval-runs', 'docs-helper', S.evalRun);
  add('shadow-trials', 'seeded', S.shadowTrial);
  add('canary-releases', 'seeded', S.canaryRelease);
  add('agents', 'docs-helper', S.echoAgent);
  add('agents', 'gerbil', S.gerbilAgent);
  add('approvals', 'seeded', S.approval);
  add('studio', 'seeded', S.studioDraft);
  const fallbacks = [
    ['runs', 'runs', 'first'],
    ['conversations', 'conversations', 'first'],
    ['pipeline-runs', 'pipeline-runs', 'first'],
    ['keepers', 'mandates', 'first'],
    ['reports', 'reports', 'first'],
    ['escalations', 'escalations', 'first'],
    ['message-threads', 'messages', 'first', (m) => m.threadId || m.id],
    ['organizations', 'organizations', 'first'],
    ['evaluations', 'eval-sets', 'first'],
    ['eval-runs', 'eval-runs', 'first'],
    ['shadow-trials', 'shadow-trials', 'first'],
    ['canary-releases', 'canary-releases', 'first'],
    ['agents', 'agents', 'first'],
    ['approvals', 'approvals', 'first'],
    ['prompt-templates', 'prompt-templates', 'first'],
    ['studio', 'studio/drafts', 'first']
  ];
  for (const [slug, sub, name, idOf] of fallbacks) {
    if (detail.some((d) => d.slug === slug)) continue;
    const [obj] = await listIds(token, sub, 1);
    if (obj) add(slug, name, idOf ? idOf(obj) : obj.id);
    else targets.push({ slug: `detail-${slug}-${name}`, kind: 'missing', reason: `no ${sub} record on the server to open` });
  }
  for (const d of detail) {
    targets.push({ slug: `detail-${d.slug}-${d.name}`, kind: 'detail', url: `/dashboard/${d.slug}/${encodeURIComponent(d.id)}`, recordId: d.id, tabs: true });
  }

  // The trail of the run with the deepest chain.
  const trailRun = S.chainOriginRun || S.fanoutParentRun;
  if (trailRun) {
    const base = `/dashboard/runs/${encodeURIComponent(trailRun)}?tab=trail`;
    for (const view of ['sequence', 'graph', 'list']) targets.push({ slug: `trail-${view}`, kind: 'trail', url: base, view });
    targets.push({ slug: 'trail-drawer', kind: 'trail', url: base, view: 'sequence', drawer: true });
  } else targets.push({ slug: 'trail-sequence', kind: 'missing', reason: 'seed.json names no origin run' });
  if (S.fanoutParentRun) targets.push({ slug: 'trail-fanout-graph', kind: 'trail', url: `/dashboard/runs/${encodeURIComponent(S.fanoutParentRun)}?tab=trail`, view: 'graph' });

  // Row action menus and the dialogs they open.
  if (O.actions) {
    const ACTION_PAGES = ['runs', 'agents', 'deployments', 'keepers', 'messages', 'reports', 'escalations', 'freezes', 'organizations', 'changeRules', 'evaluations', 'canaryReleases', 'shadowTrials', 'promptTemplates', 'secrets', 'users'];
    for (const id of ACTION_PAGES) {
      const p = PAGES.find((x) => x.id === id);
      if (!p) continue;
      const slug = `${p.hub}--${p.slug}`;
      targets.push({ slug: `${slug}~menu`, kind: 'action', url: pathFor(p.id), item: -1 });
      for (let i = 0; i < MAX_ACTIONS; i += 1) targets.push({ slug: `${slug}~action-${i + 1}`, kind: 'action', url: pathFor(p.id), item: i });
    }
  }

  // Forced states.
  if (O.states) {
    const list = (sub) => new RegExp(`/v1\\.0/api/tenants/${TENANT}/${sub}(\\?|$)`);
    const STATE_ROUTES = [
      { slug: 'runs--runs', url: pathFor('runs'), match: list('runs') },
      { slug: 'agents--agents', url: pathFor('agents'), match: list('agents') },
      { slug: 'autonomy--keepers', url: pathFor('keepers'), match: list('mandates') },
      { slug: 'autonomy--messages', url: pathFor('messages'), match: list('messages') },
      { slug: 'autonomy--escalations', url: pathFor('escalations'), match: list('escalations') },
      { slug: 'autonomy--reports', url: pathFor('reports'), match: list('reports') },
      { slug: 'autonomy--freezes', url: pathFor('freezes'), match: list('freezes') },
      { slug: 'organizations--organizations', url: pathFor('organizations'), match: list('organizations') },
      { slug: 'evaluations--eval-runs', url: pathFor('evalRuns'), match: list('eval-runs') }
    ];
    if (trailRun) STATE_ROUTES.push({ slug: 'trail', url: `/dashboard/runs/${encodeURIComponent(trailRun)}?tab=trail`, match: /\/runs\/[^/]+\/trail(\?|$)/, modes: ['loading', 'error'] });
    if (S.chainOrganization) STATE_ROUTES.push({ slug: 'detail-organizations', url: `/dashboard/organizations/${encodeURIComponent(S.chainOrganization)}`, match: new RegExp(`/organizations/${S.chainOrganization}(\\?|$)`), modes: ['loading', 'error'] });
    for (const r of STATE_ROUTES) {
      for (const mode of r.modes || ['loading', 'empty', 'error']) targets.push({ slug: `${r.slug}~state-${mode}`, kind: 'state', url: r.url, match: r.match, mode });
    }
  }
  return targets;
}

// ---------------------------------------------------------------- page helpers

function matchesAny(slug, patterns) {
  if (!patterns.length) return true;
  return patterns.some((p) => new RegExp(`^${p.split('*').map((s) => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`).test(slug));
}

class Probe {
  constructor(page) {
    this.page = page;
    this.inflight = 0;
    this.errors = [];
    this.blocked = [];
    this.lastChange = Date.now();
    page.on('console', (msg) => {
      if (msg.type() === 'error') this.errors.push(msg.text().slice(0, 500));
    });
    page.on('pageerror', (err) => this.errors.push(`pageerror: ${String(err.message || err).slice(0, 500)}`));
    const api = (req) => req.url().includes('/v1.0/') && req.resourceType() !== 'websocket';
    page.on('request', (req) => {
      if (!api(req)) return;
      this.inflight += 1;
      this.lastChange = Date.now();
    });
    const done = (req) => {
      if (!api(req)) return;
      this.inflight = Math.max(0, this.inflight - 1);
      this.lastChange = Date.now();
    };
    page.on('requestfinished', done);
    page.on('requestfailed', done);
  }

  reset() {
    this.errors = [];
    this.blocked = [];
  }

  /** Wait until no API request has been in flight for 500 ms (at most 8 s), then until spinners are gone (at most 5 s). */
  async settle({ spinners = true } = {}) {
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      if (this.inflight === 0 && Date.now() - this.lastChange > 500) break;
      await sleep(100);
    }
    if (spinners) {
      try {
        await this.page.waitForFunction(() => ![...document.querySelectorAll('.loading-spinner')].some((el) => el.offsetParent !== null), null, { timeout: 5000 });
      } catch {
        /* a page that keeps a spinner is captured as it is */
      }
    }
    await sleep(350);
  }
}

async function spaNavigate(page, url) {
  await page.keyboard.press('Escape').catch(() => {});
  const ok = await page
    .evaluate((u) => {
      if (!window.history) return false;
      window.history.pushState({}, '', u);
      window.dispatchEvent(new PopStateEvent('popstate', { state: {} }));
      return true;
    }, url)
    .catch(() => false);
  if (!ok) await page.goto(`${O.dashboard}${url}`);
}

async function measure(page) {
  return page.evaluate((slack) => {
    const doc = document.documentElement;
    // The shell does not scroll the document: the main column (.dashboard-content) scrolls inside it, so check both.
    const main = document.querySelector('.dashboard-content');
    const mainScroll = main ? { scrollWidth: main.scrollWidth, clientWidth: main.clientWidth } : null;
    const hscroll = doc.scrollWidth > window.innerWidth + slack || (main ? main.scrollWidth > main.clientWidth + slack : false);
    const sel = [
      'button',
      '.pill',
      '[class*="badge"]',
      'th',
      'nav a',
      '.sidebar-item',
      '[role="tab"]',
      '[role="menuitem"]',
      '[class*="card"] [class*="title"]',
      '[class*="-title"]',
      '.kpi-label',
      '.kpi-value'
    ].join(',');
    const seen = new Set();
    const overflows = [];
    for (const el of document.querySelectorAll(sel)) {
      if (!(el instanceof HTMLElement) || seen.has(el)) continue;
      seen.add(el);
      if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') continue;
      if (el.clientWidth === 0) continue;
      if (el.scrollWidth <= el.clientWidth + slack) continue;
      const cs = getComputedStyle(el);
      if (cs.textOverflow === 'ellipsis') continue;
      // A scroll container (a tab strip, a table frame) overflows on purpose.
      if (cs.overflowX === 'auto' || cs.overflowX === 'scroll') continue;
      const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text) continue;
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
      const testId = el.getAttribute('data-testid');
      overflows.push({
        element: `${el.tagName.toLowerCase()}${cls ? `.${cls}` : ''}${testId ? `[data-testid=${testId}]` : ''}`,
        text: text.slice(0, 80),
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth
      });
      if (overflows.length >= 40) break;
    }
    return { docScrollWidth: doc.scrollWidth, innerWidth: window.innerWidth, mainScroll, hscroll, overflows };
  }, SLACK);
}

/**
 * Screenshot. With expand, the whole main column: the shell keeps the document at the viewport height and scrolls
 * .dashboard-content inside it, so a full-page shot would show only the viewport. The viewport is made as tall as the
 * content (at most MAX_SHOT_HEIGHT) for the shot, then restored. Dialogs and menus are shot at the real viewport.
 */
async function shoot(page, file, expand) {
  const vp = page.viewportSize();
  let grown = false;
  if (expand && vp) {
    const need = await page
      .evaluate(() => {
        const main = document.querySelector('.dashboard-content');
        if (!main) return 0;
        return main.scrollHeight - main.clientHeight;
      })
      .catch(() => 0);
    if (need > 0) {
      await page.evaluate(() => document.querySelector('.dashboard-content')?.scrollTo(0, 0)).catch(() => {});
      await page.setViewportSize({ width: vp.width, height: Math.min(MAX_SHOT_HEIGHT, vp.height + need) });
      grown = true;
      await sleep(300);
    }
  }
  try {
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
  } finally {
    if (grown) {
      await page.setViewportSize(vp);
      await sleep(100);
    }
  }
}

const dialogOpen = (page) =>
  page.evaluate(() => [...document.querySelectorAll('[role="dialog"]')].some((d) => d.offsetParent !== null || getComputedStyle(d).position === 'fixed'));

// ---------------------------------------------------------------- one target

/** Captures one target into one cell, or returns the reason it could not. */
async function captureTarget(page, probe, t, combo, shotPath) {
  const before = page.url();
  let note = '';
  if (t.kind === 'state') {
    let release = null;
    let errors = [];
    const held = new Promise((r) => {
      release = r;
    });
    const handler = async (route) => {
      const req = route.request();
      if (req.method() !== 'GET' || !t.match.test(new URL(req.url()).pathname + new URL(req.url()).search)) return route.fallback();
      if (t.mode === 'loading') {
        await held;
        return route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"CaptureReleased"}' }).catch(() => {});
      }
      if (t.mode === 'empty') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ objects: [], totalRecords: 0, maxResults: 25, skip: 0, endOfResults: true, nodes: [], edges: [] }) });
      return route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: 'InternalServerError', message: 'Mocked failure for the UX pass capture.', statusCode: 500 }) });
    };
    await page.route('**/v1.0/api/**', handler);
    try {
      await spaNavigate(page, '/dashboard/server-info');
      await probe.settle({ spinners: false });
      probe.reset();
      await spaNavigate(page, t.url);
      if (t.mode === 'loading') await sleep(1200);
      else await probe.settle();
      const m = await measure(page);
      errors = probe.errors.filter((e) => !/Failed to load resource: the server responded with a status of (500|503)/.test(e));
      await shoot(page, shotPath, true);
      return { note: `${t.mode} forced by mocking ${t.match}`, measure: m, errors };
    } finally {
      release();
      await page.unroute('**/v1.0/api/**', handler);
    }
  }

  probe.reset();
  if (t.kind === 'page' || t.kind === 'detail') {
    await spaNavigate(page, t.url);
    await probe.settle();
    if (t.tabKey) {
      const tab = page.locator(`main [role="tablist"]:not(.hub-tab-strip) [role="tab"][data-tab-key="${t.tabKey}"]`).first();
      if (!(await tab.count())) return { skip: `tab ${t.tabKey} not shown in this layout` };
      probe.reset();
      await tab.click({ timeout: 4000 });
      await probe.settle();
    }
  } else if (t.kind === 'trail') {
    await spaNavigate(page, t.url);
    await probe.settle();
    const btn = page.locator(`[data-testid="trail-view-${t.view}"]`);
    if (await btn.count()) {
      if (await btn.isVisible()) await btn.click({ timeout: 4000 });
      else note = `view ${t.view} control hidden at this width`;
    } else if (t.view !== 'sequence') note = `view ${t.view} control not present`;
    await probe.settle();
    if (t.drawer) {
      const step = page.locator('[data-testid="trail-step"], [data-testid="trail-list-open"], [data-testid="trail-graph-node"]');
      const n = await step.count();
      if (!n) return { skip: 'no trail step to open at this width' };
      await step.nth(Math.min(2, n - 1)).click({ timeout: 4000, force: true });
      await probe.settle();
      if (!(await page.locator('[data-testid="trail-drawer"]').count())) note = 'step clicked, drawer did not open';
    }
  } else if (t.kind === 'action') {
    await spaNavigate(page, t.url);
    await probe.settle();
    const trigger = page.locator('main table .action-menu-trigger, main .action-menu-trigger').first();
    if (!(await trigger.count())) return { skip: 'no row action menu on this page' };
    await trigger.scrollIntoViewIfNeeded().catch(() => {});
    await trigger.click({ timeout: 4000 });
    await sleep(250);
    const items = page.locator('.action-menu-dropdown [role="menuitem"]');
    const n = await items.count();
    if (t.item >= 0) {
      if (t.item >= n) {
        await page.keyboard.press('Escape');
        return { skip: `the row menu has ${n} item(s)` };
      }
      const item = items.nth(t.item);
      const label = ((await item.textContent()) || '').trim();
      if ((await item.getAttribute('aria-disabled')) === 'true') {
        await page.keyboard.press('Escape');
        return { skip: `menu item "${label}" is disabled for this row` };
      }
      probe.reset();
      await item.click({ timeout: 4000 });
      await sleep(400);
      await probe.settle();
      const dialog = await dialogOpen(page);
      if (!dialog) {
        const moved = page.url() !== before && !page.url().endsWith(t.url);
        if (moved) await spaNavigate(page, t.url);
        return { skip: `menu item "${label}" ${moved ? 'navigates to a page' : 'opens no dialog'}${probe.blocked.length ? ` (blocked ${probe.blocked.join(', ')})` : ''}` };
      }
      note = `dialog from menu item "${label}"`;
    } else note = `${n} menu item(s)`;
  }

  const m = await measure(page);
  await shoot(page, shotPath, t.kind !== 'action');
  if (t.kind === 'action') await page.keyboard.press('Escape').catch(() => {});
  return { note, measure: m };
}

// ---------------------------------------------------------------- combos and workers

function comboKey(c) {
  return `${c.locale}/${c.theme}/${c.viewport}`;
}

function combosFor() {
  const all = [];
  for (const locale of O.locales) for (const theme of O.themes) for (const viewport of O.viewports) all.push({ locale, theme, viewport });
  return all;
}

/** Why a target is not captured in a combo, or null when it is. */
function cellReason(t, c) {
  if (t.kind === 'missing') return t.reason;
  if (c.locale === 'ja' && !O.jaViewports.includes(c.viewport)) return `Japanese is captured at ${O.jaViewports.join(', ')} only (LP5.1)`;
  if (t.kind === 'state') {
    if (!O.stateViewports.includes(c.viewport)) return `forced states are captured at ${O.stateViewports.join(', ')} only`;
    if (!O.stateLocales.includes(c.locale)) return `forced states are captured in ${O.stateLocales.join(', ')} only`;
  }
  return null;
}

async function runCombo(browser, token, combo, targets, store) {
  const [w, h] = combo.viewport.split('x').map(Number);
  const context = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: combo.theme === 'dark' ? 'dark' : 'light', locale: combo.locale === 'en' ? 'en-US' : combo.locale });
  await context.addInitScript(
    ({ tok, tenant, locale, theme }) => {
      try {
        if (sessionStorage.getItem('__uxcapInit')) return;
        sessionStorage.setItem('__uxcapInit', '1');
        localStorage.clear();
        localStorage.setItem('garrison_token', tok);
        localStorage.setItem('garrison_tenant', tenant);
        localStorage.setItem('garrison.locale', locale);
        localStorage.setItem('garrison_theme', theme);
        localStorage.setItem('garrison_tour_done', 'true');
        localStorage.setItem(`garrison_setup_dismissed:${tenant}`, 'true');
        localStorage.setItem('garrison_sidebar_collapsed', 'false');
      } catch {
        /* storage unavailable: the page shows its defaults */
      }
    },
    { tok: token, tenant: TENANT, locale: combo.locale, theme: combo.theme }
  );
  const page = await context.newPage();
  const probe = new Probe(page);
  await page.route('**/v1.0/**', (route) => {
    const req = route.request();
    const method = req.method();
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return route.fallback();
    const u = new URL(req.url());
    if (method === 'POST' && READ_ONLY_POSTS.some((re) => re.test(u.pathname))) return route.fallback();
    if (u.pathname === '/v1.0/token' || u.pathname.startsWith('/v1.0/token/')) return route.fallback();
    probe.blocked.push(`${method} ${u.pathname}`);
    return route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ error: 'CaptureReadOnly', message: 'The UX capture does not change the server.' }) });
  });
  await page.goto(`${O.dashboard}/dashboard/home`);
  await probe.settle();

  // Expand detail targets into one target per local tab, found on the first visit in this combo.
  const expanded = [];
  for (const t of targets) {
    expanded.push(t);
    if (t.kind !== 'detail' || !t.tabs || cellReason(t, combo)) continue;
    if (O.routes.length && !matchesAny(`${t.slug}--tab`, O.routes) && !O.routes.some((r) => r.startsWith(`${t.slug}--`))) continue;
    try {
      await spaNavigate(page, t.url);
      await probe.settle();
      const keys = await page.$$eval('main [role="tablist"]:not(.hub-tab-strip) [role="tab"]', (els) => els.map((e) => e.getAttribute('data-tab-key')).filter(Boolean));
      for (const key of keys.slice(1)) expanded.push({ ...t, slug: `${t.slug}--${key}`, tabKey: key, tabs: false });
      // Tabs another layout shows: keep their rows in the matrix.
      for (const known of store.knownTabs[t.slug] || []) if (!keys.includes(known)) expanded.push({ ...t, slug: `${t.slug}--${known}`, tabKey: known, tabs: false });
      store.knownTabs[t.slug] = [...new Set([...(store.knownTabs[t.slug] || []), ...keys.slice(1)])];
    } catch {
      /* the base visit records the failure */
    }
  }

  const dir = path.join(O.out, 'shots', combo.locale, combo.theme, combo.viewport);
  fs.mkdirSync(dir, { recursive: true });
  const key = comboKey(combo);
  let done = 0;
  for (const t of expanded) {
    if (!matchesAny(t.slug, O.routes)) continue;
    const reason = cellReason(t, combo);
    store.route(t).cells[key] = reason ? { status: 'skipped', reason } : store.route(t).cells[key] || { status: 'pending' };
    if (reason) continue;
    const file = path.join(dir, `${t.slug.replace(/[^A-Za-z0-9._~-]/g, '_')}.png`);
    const start = Date.now();
    try {
      const r = await captureTarget(page, probe, t, combo, file);
      if (r.skip) {
        store.route(t).cells[key] = { status: 'skipped', reason: r.skip };
      } else {
        const m = r.measure || (await measure(page).catch(() => null));
        const shot = {
          route: t.slug,
          cell: key,
          url: t.url,
          file: path.relative(O.out, file),
          ms: Date.now() - start,
          note: r.note || '',
          consoleErrors: r.errors ? [...r.errors] : [...probe.errors],
          blockedRequests: [...probe.blocked],
          hscroll: m ? m.hscroll : null,
          mainScroll: m ? m.mainScroll : null,
          docScrollWidth: m ? m.docScrollWidth : null,
          innerWidth: m ? m.innerWidth : null,
          overflows: m ? m.overflows : []
        };
        store.shots.push(shot);
        store.route(t).cells[key] = { status: 'captured', file: shot.file, consoleErrors: shot.consoleErrors.length, hscroll: shot.hscroll, overflows: shot.overflows.length, note: shot.note || undefined };
        done += 1;
      }
    } catch (err) {
      store.route(t).cells[key] = { status: 'failed', reason: String(err.message || err).split('\n')[0].slice(0, 300) };
      // Start the next target from a clean page.
      await page.goto(`${O.dashboard}/dashboard/home`).catch(() => {});
      await probe.settle().catch(() => {});
    }
  }
  await context.close();
  return done;
}

// ---------------------------------------------------------------- reports

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeOutputs(store, combos, seconds) {
  const covFile = path.join(O.out, 'coverage.json');
  const shotsFile = path.join(O.out, 'shots.json');
  const partial = O.routes.length > 0 || combos.length < O.locales.length * O.themes.length * O.viewports.length || O.merge;
  const prevCov = partial ? loadJson(covFile, null) : null;
  const prevShots = partial ? loadJson(shotsFile, []) : [];
  const routes = prevCov?.routes || {};
  for (const [slug, r] of Object.entries(store.routes)) {
    routes[slug] = { ...(routes[slug] || {}), kind: r.kind, url: r.url, cells: { ...(routes[slug]?.cells || {}), ...r.cells } };
  }
  const newKeys = new Set(store.shots.map((s) => `${s.route}|${s.cell}`));
  const touched = new Set(Object.entries(store.routes).flatMap(([slug, r]) => Object.keys(r.cells).map((c) => `${slug}|${c}`)));
  const shots = [...prevShots.filter((s) => !touched.has(`${s.route}|${s.cell}`) && !newKeys.has(`${s.route}|${s.cell}`)), ...store.shots];
  const allCells = Object.values(routes).flatMap((r) => Object.values(r.cells));
  const coverage = {
    generatedUtc: new Date().toISOString(),
    dashboard: O.dashboard,
    api: O.api,
    dimensions: { locales: ['en', 'de', 'ja'], themes: ['light', 'dark'], viewports: ['1366x768', '1280x800', '768x1024', '390x844'], cellKey: 'locale/theme/viewport' },
    lastRun: { seconds, captured: store.shots.length, filters: { routes: O.routes, viewports: O.viewports, themes: O.themes, locales: O.locales } },
    totals: {
      routes: Object.keys(routes).length,
      captured: allCells.filter((c) => c.status === 'captured').length,
      skipped: allCells.filter((c) => c.status === 'skipped').length,
      failed: allCells.filter((c) => c.status === 'failed').length,
      pending: allCells.filter((c) => c.status === 'pending').length
    },
    routes
  };
  // Every cell of the full matrix exists: a cell no run reached says so.
  for (const r of Object.values(routes)) {
    for (const l of coverage.dimensions.locales) for (const th of coverage.dimensions.themes) for (const v of coverage.dimensions.viewports) {
      const k = `${l}/${th}/${v}`;
      if (r.cells[k] && !(r.cells[k].status === 'skipped' && r.cells[k].reason === UNREACHED)) continue;
      const why = r.kind === 'missing' ? null : cellReason({ kind: r.kind }, { locale: l, theme: th, viewport: v });
      r.cells[k] = { status: 'skipped', reason: why || UNREACHED };
    }
  }
  const filled = Object.values(routes).flatMap((r) => Object.values(r.cells));
  for (const status of ['captured', 'skipped', 'failed', 'pending']) coverage.totals[status] = filled.filter((c) => c.status === status).length;
  coverage.totals.cells = filled.length;
  fs.writeFileSync(covFile, JSON.stringify(coverage, null, 2));
  fs.writeFileSync(shotsFile, JSON.stringify(shots, null, 2));

  const byRoute = {};
  for (const s of shots) {
    const r = (byRoute[s.route] ||= { consoleErrors: {}, hscroll: [], overflows: {} });
    for (const e of s.consoleErrors) (r.consoleErrors[e] ||= []).push(s.cell);
    if (s.hscroll) r.hscroll.push(`${s.cell} (document ${s.docScrollWidth}/${s.innerWidth}${s.mainScroll ? `, main ${s.mainScroll.scrollWidth}/${s.mainScroll.clientWidth}` : ''})`);
    for (const o of s.overflows) (r.overflows[`${o.element} "${o.text}"`] ||= []).push(`${s.cell} ${o.scrollWidth}/${o.clientWidth}`);
  }
  for (const [k, v] of Object.entries(byRoute)) if (!Object.keys(v.consoleErrors).length && !v.hscroll.length && !Object.keys(v.overflows).length) delete byRoute[k];
  fs.writeFileSync(path.join(O.out, 'mechanical.json'), JSON.stringify(byRoute, null, 2));
  return coverage;
}

// ---------------------------------------------------------------- main

async function main() {
  const token = await signIn();
  const targets = await buildTargets(token);
  if (O.list) {
    for (const t of targets) process.stdout.write(`${t.slug.padEnd(52)} ${t.kind.padEnd(8)} ${t.url || t.reason}\n`);
    return;
  }
  fs.mkdirSync(path.join(O.out, 'shots'), { recursive: true });
  const store = {
    routes: {},
    shots: [],
    knownTabs: {},
    route(t) {
      return (this.routes[t.slug] ||= { kind: t.kind, url: t.url || null, cells: {} });
    }
  };
  const combos = combosFor();
  log(`${targets.length} targets before tab expansion, ${combos.length} combinations, ${O.workers} workers`);
  const browser = await chromium.launch();
  // The first combination runs alone so it learns every detail page's tabs for the others' matrix rows.
  const queue = [...combos];
  const first = queue.shift();
  let total = 0;
  const runOne = async (c) => {
    const t = Date.now();
    const n = await runCombo(browser, token, c, targets, store);
    total += n;
    log(`${comboKey(c)}: ${n} shots in ${((Date.now() - t) / 1000).toFixed(0)} s (total ${total})`);
  };
  if (first) await runOne(first);
  await Promise.all(
    Array.from({ length: O.workers }, async () => {
      while (queue.length) await runOne(queue.shift());
    })
  );
  await browser.close();
  const seconds = Math.round((Date.now() - T0) / 1000);
  const cov = writeOutputs(store, combos, seconds);
  log(`done: ${store.shots.length} shots in ${seconds} s; matrix ${JSON.stringify(cov.totals)}`);
  log(`wrote ${path.join(O.out, 'coverage.json')}, shots.json, mechanical.json`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 2;
});
