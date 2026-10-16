// Control-plane replicas (P10.19): Fleet > Control plane, its detail, Home's Control plane card and Nodes panel, and
// the Server Info link, against mocked APIs.

import { test, expect } from '@playwright/test';
import { installMocks, respond, controlNode, controlNodeList, OBSERVABILITY_CONFIGURED } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const json = (route, body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

/** A Draining replica that has gone quiet (40 seconds without a heartbeat) answers, and nobody holds the lease. */
async function drainingCluster(page) {
  const now = Date.now();
  await page.clock.setFixedTime(now);
  const nodes = [
    controlNode('garrison-server-a', { activeRequests: 4, openStreams: 2, heldLongPolls: 3 }),
    controlNode('garrison-server-b', { status: 'Draining', address: '10.42.0.18:8700', lastHeartbeatUtc: new Date(now - 40000).toISOString() })
  ];
  await page.route(/\/v1\.0\/api\/control-nodes(\?.*)?$/, (route) => json(route, controlNodeList(nodes, 'garrison-server-b')));
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/overview$/, (route) => {
    const body = respond('GET', new URL(route.request().url()));
    delete body.leaderNodeId;
    return json(route, { ...body, controlNodesByStatus: [{ status: 'Ready', count: 1 }, { status: 'Draining', count: 1 }] });
  });
}

const rowFor = (page, name) => page.locator('.data-table tbody tr', { hasText: name });

test.beforeEach(async ({ page }) => {
  await installMocks(page);
});

test('Fleet has a Control plane tab next to Worker nodes', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/fleet');
  const tabs = page.locator('.hub-tab-strip [role="tab"]');
  await expect(tabs).toHaveText(['Worker nodes', 'Control plane', 'Node Pools']);
  await expect(page.locator('.hub .page-header-subtitle').first()).toHaveText('Control plane, worker nodes, and node pools');
  await tabs.nth(1).click();
  await expect(page).toHaveURL(/\/dashboard\/fleet\?tab=control-plane$/);
  await expect(page.getByTestId('explainer-controlNodes')).toContainText('Control nodes and worker nodes');
  await expect(page.getByTestId('explainer-controlNodes')).toContainText('leader');
  // The worker tab is still the hub's default, so existing links keep landing on worker nodes.
  await page.goto('/dashboard/fleet');
  await expect(page.getByTestId('explainer-nodes')).toBeVisible();
});

test('Control plane lists replicas with status, leader, versions, uptime, heartbeat, and activity', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/fleet?tab=control-plane');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(2);
  const headers = page.locator('.data-table thead th');
  for (const h of ['Name', 'Status', 'Version', 'Schema', 'Backplane', 'Uptime', 'Last heartbeat', 'Requests', 'Streams']) await expect(headers.filter({ hasText: new RegExp(`^${h}\\s*[▲▼⇅]?$`) }), h).toHaveCount(1);
  // Long polls and Address are in the column picker (hidden by default so the table fits at 1440 px) and in the detail.
  for (const h of ['Long polls', 'Address']) await expect(headers.filter({ hasText: new RegExp(`^${h}\\s*[▲▼⇅]?$`) }), h).toHaveCount(0);

  const a = rowFor(page, 'garrison-server-a');
  const b = rowFor(page, 'garrison-server-b');
  // Leader badge on the leader only, with a tooltip that explains it and names the epoch.
  await expect(a.locator('.pill', { hasText: 'Leader' })).toHaveCount(1);
  await expect(a.locator('.pill', { hasText: 'Leader' })).toHaveAttribute('data-tip', /maintenance lease \(epoch 4\)/);
  await expect(b.locator('.pill', { hasText: 'Leader' })).toHaveCount(0);
  // Status is a translated pill with color and text.
  await expect(a.locator('.pill-success', { hasText: 'Ready' })).toHaveAttribute('data-tip', /serving REST, MCP, and A2A/);
  await expect(a).toContainText('0.1.0-alpha');
  await expect(a).toContainText('7');
  await expect(a.locator('[data-tip*="LISTEN and NOTIFY"]')).toHaveText('PostgreSQL notifications');
  await expect(a).toContainText('3 hr, 25 min');
  await expect(a).toContainText(/just now|second/);
  await expect(page.getByTestId('heartbeat-stale')).toHaveCount(0);
  const cells = a.locator('td.right');
  await expect(cells).toHaveText(['7', '1', '2']);

  // Which replica answered, and auto-refresh every 15 seconds like the worker table.
  await expect(page.getByTestId('control-nodes-answered-by')).toHaveText('Which replica answered: garrison-server-a (the leader)');
  await expect(page.getByTestId('control-nodes-answered-by')).toHaveAttribute('data-tip', /respondingNodeId/);
  await expect(page.locator('.auto-refresh-select select')).toHaveValue('15');
  // Read-only: no add button, no delete or select boxes.
  await expect(page.getByTestId('add-button')).toHaveCount(0);
  await expect(page.locator('.data-table tbody input[type="checkbox"]')).toHaveCount(0);
});

test('Control plane auto-refreshes every 15 seconds', async ({ page }) => {
  let calls = 0;
  await page.route(/\/v1\.0\/api\/control-nodes(\?.*)?$/, (route) => {
    calls += 1;
    return json(route, controlNodeList());
  });
  await page.clock.install();
  await login(page);
  await page.goto('/dashboard/fleet?tab=control-plane');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(2);
  const before = calls;
  await page.clock.runFor(16000);
  await expect.poll(() => calls).toBeGreaterThan(before);
});

test('a row opens the full detail with a fresh read and which replica answered it', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/fleet?tab=control-plane');
  await rowFor(page, 'garrison-server-b').click();
  const modal = page.locator('.modal');
  await expect(modal.locator('.modal-header')).toContainText('Control node details');
  const detail = page.getByTestId('control-node-detail');
  for (const label of ['Name', 'Node ID', 'Host name', 'Address', 'Leader', 'Version', 'Schema version', 'Backplane', 'Started', 'Uptime', 'Last heartbeat', 'Active requests', 'Open streams', 'Held long polls', 'Answered by']) {
    await expect(detail.locator('.info-label', { hasText: new RegExp(`^${label}$`) }), label).toHaveCount(1);
    await expect(detail.locator('.info-label', { hasText: new RegExp(`^${label}$`) })).toHaveAttribute('data-tip', /.{25,}/);
  }
  await expect(detail.locator('.info-row', { hasText: 'Leader' }).first()).toContainText('No');
  await expect(detail.locator('.info-label', { hasText: 'Leader epoch' })).toHaveCount(0);
  await expect(detail.locator('.info-row', { hasText: 'Answered by' })).toContainText('garrison-server-a');
  await expect(detail.locator('.info-row', { hasText: 'Held long polls' })).toContainText('1');
  // Without Grafana configured there is no Grafana link.
  await expect(page.getByTestId('control-node-grafana')).toHaveCount(0);
  await modal.locator('.modal-header .icon-button').click();

  await rowFor(page, 'garrison-server-a').click();
  await expect(detail.locator('.info-row', { hasText: 'Leader epoch' })).toContainText('4');
  await expect(detail.locator('.pill', { hasText: 'Leader' })).toBeVisible();
});

test('a Draining replica with a stale heartbeat is highlighted', async ({ page }) => {
  await drainingCluster(page);
  await login(page);
  await page.goto('/dashboard/fleet?tab=control-plane');
  const b = rowFor(page, 'garrison-server-b');
  await expect(b.locator('.pill-warning', { hasText: 'Draining' })).toHaveAttribute('data-tip', /Readiness answers 503/);
  const stale = b.getByTestId('heartbeat-stale');
  await expect(stale).toContainText('40 seconds ago');
  await expect(stale.locator('.text-stale')).toBeVisible();
  await expect(stale.locator('.pill-warning', { hasText: 'Stale' })).toHaveAttribute('data-tip', /more than 15 seconds/);
  await expect(rowFor(page, 'garrison-server-a').getByTestId('heartbeat-stale')).toHaveCount(0);
  await expect(page.locator('.data-table .pill', { hasText: 'Leader' })).toHaveCount(0);
  await expect(page.getByTestId('control-nodes-answered-by')).toHaveText('Which replica answered: garrison-server-b');
  // The stale pill's tooltip shows on hover.
  await stale.locator('.pill').hover();
  await expect(page.locator('#garrison-tooltip')).toHaveText(/no heartbeat for more than 15 seconds/);

  // Home: one of two ready, no leader, so the card warns and its tooltip says maintenance is paused.
  await page.goto('/dashboard/home');
  const card = page.getByTestId('kpi-control-nodes');
  await expect(card.locator('.kpi-value')).toHaveText('1 / 2');
  await expect(card).toHaveClass(/kpi-warning/);
  await expect(card).toHaveAttribute('data-tip', /No replica holds the leader lease/);
  await expect(page.getByTestId('home-control-nodes').locator('.pill', { hasText: 'Draining' })).toBeVisible();
  await expect(page.getByTestId('home-control-nodes').getByTestId('heartbeat-stale')).toBeVisible();
});

test('with Grafana configured, each replica links to the overview dashboard filtered to it', async ({ page }) => {
  await page.route(/\/v1\.0\/api\/server-info$/, (route) => json(route, { ...respond('GET', new URL(route.request().url())), observability: OBSERVABILITY_CONFIGURED }));
  await page.addInitScript(() => {
    window.__opened = [];
    window.open = (url, target, features) => {
      window.__opened.push({ url: String(url), target, features });
      return null;
    };
  });
  await login(page);
  await page.goto('/dashboard/fleet?tab=control-plane');
  await rowFor(page, 'garrison-server-a').locator('.action-menu-trigger').click();
  const item = page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Open in Grafana' });
  await expect(item).toHaveAttribute('data-tip', /overview dashboard in Grafana.*garrison-server-a/);
  await item.click();
  expect(await page.evaluate(() => window.__opened)).toEqual([{ url: 'http://127.0.0.1:3000/d/garrison-overview?orgId=1&var-node=garrison-server-a', target: '_blank', features: 'noopener,noreferrer' }]);

  await rowFor(page, 'garrison-server-b').click();
  await expect(page.getByTestId('control-node-grafana')).toHaveAttribute('href', 'http://127.0.0.1:3000/d/garrison-overview?orgId=1&var-node=garrison-server-b');
});

test('Home shows Control plane ready next to Nodes ready, and a Nodes panel with both kinds', async ({ page }) => {
  await login(page);
  const cards = page.locator('.kpi-grid .kpi-card');
  const ids = await cards.evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')));
  expect(ids.indexOf('kpi-control-nodes')).toBe(ids.indexOf('kpi-nodes') + 1);
  const card = page.getByTestId('kpi-control-nodes');
  await expect(card.locator('.kpi-label')).toHaveText('Control plane ready');
  await expect(card.locator('.kpi-value')).toHaveText('2 / 2');
  await expect(card).toHaveAttribute('data-tip', /The leader is garrison-server-a\./);
  await expect(page.getByTestId('kpi-nodes').locator('.kpi-value')).toHaveText('2 / 3');

  const panel = page.getByTestId('home-nodes');
  await expect(panel.locator('#nodes-title')).toHaveText('Nodes');
  await expect(panel.locator('.node-section-title')).toHaveText(['Control plane', 'Worker nodes']);
  const control = page.getByTestId('home-control-nodes');
  await expect(control.locator('li')).toHaveCount(2);
  await expect(control.locator('li', { hasText: 'garrison-server-a' }).locator('.pill', { hasText: 'Leader' })).toBeVisible();
  await expect(control.locator('li', { hasText: 'garrison-server-b' }).locator('.pill', { hasText: 'Leader' })).toHaveCount(0);
  await expect(page.getByTestId('home-worker-nodes').locator('li')).toHaveCount(6);

  await control.getByRole('link', { name: 'View all' }).click();
  await expect(page).toHaveURL(/\/dashboard\/fleet\?tab=control-plane$/);
  await page.goBack();
  await page.getByTestId('home-worker-nodes').getByRole('link', { name: 'View all' }).click();
  await expect(page).toHaveURL(/\/dashboard\/fleet$/);
  await page.goBack();
  await page.getByTestId('kpi-control-nodes').click();
  await expect(page).toHaveURL(/\/dashboard\/fleet\?tab=control-plane$/);
});

test('Home says so when the server does not list control nodes', async ({ page }) => {
  await page.route(/\/v1\.0\/api\/control-nodes(\?.*)?$/, (route) => route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 'RouteNotFound', message: 'Not found' }) }));
  await login(page);
  await expect(page.getByTestId('home-control-nodes')).toContainText('Control nodes are not available');
  await expect(page.getByTestId('home-worker-nodes').locator('li')).toHaveCount(6);
});

test('Server Info links the answering control node to the Control plane tab', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/system?tab=server-info');
  const link = page.getByTestId('server-info-node');
  await expect(link).toHaveText('garrison-server-a');
  await expect(page.locator('.info-label', { hasText: 'Control node' })).toHaveAttribute('data-tip', /answered this page/);
  await expect(link).toHaveAttribute('data-tip', /Fleet > Control plane/);
  await link.click();
  await expect(page).toHaveURL(/\/dashboard\/fleet\?tab=control-plane$/);
});

test('the Control plane tab and Home card are translated', async ({ page }) => {
  await login(page);
  for (const [lang, tab, card, leader] of [
    ['de', 'Steuerungsebene', 'Steuerungsebene bereit', 'Leader'],
    ['ja', 'コントロールプレーン', 'コントロールプレーン準備完了', 'リーダー'],
    ['fr', 'Plan de contrôle', 'Plan de contrôle prêt', 'Leader'],
    ['zh-Hans', '控制平面', '控制平面就绪', '领导者'],
    ['yue-Hant', '控制平面', '控制平面就緒', '領導者']
  ]) {
    await page.goto(`/dashboard/home?lang=${lang}`);
    await expect(page.getByTestId('kpi-control-nodes').locator('.kpi-label'), lang).toHaveText(card);
    await page.goto(`/dashboard/fleet?tab=control-plane&lang=${lang}`);
    await expect(page.locator('.hub-tab-strip [role="tab"][aria-selected="true"]'), lang).toHaveText(tab);
    await expect(rowFor(page, 'garrison-server-a').locator('.pill').first(), lang).toHaveText(leader);
  }
});
