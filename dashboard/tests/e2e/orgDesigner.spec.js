// The organization designer (LP3.11) against mocked APIs: start from the Blank template, build the site reliability
// shape on the Design tab (a root unit with three units below it, leads placed from the people palette, peer lines,
// and Day budgets), watch the live checks clear, undo and redo a change, and publish. Everything is done from the
// keyboard or the toolbar except one drag, so the keyboard path is covered too. No native dialog is ever used.
// Not run by default (targeted-test rule): npx playwright test tests/e2e/orgDesigner.spec.js

import { test, expect } from '@playwright/test';
import { installMocks, organizationStore } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

/** Every organization call goes to a stateful store. The validate route answers 404, so the client checks run. */
async function useStore(page) {
  const store = organizationStore();
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/organizations/, (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.pathname.endsWith('/validate')) return route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ code: 'RouteNotFound', message: 'Not found.' }) });
    const answer = store.handle(req.method(), url, req.postDataJSON?.() ?? null);
    if (!answer) return route.fallback();
    if (answer.status === 204) return route.fulfill({ status: 204, body: '' });
    return route.fulfill({ status: answer.status, contentType: 'application/json', body: JSON.stringify(answer.body) });
  });
  return store;
}

const node = (page, unit) => page.locator(`.react-flow__node[data-id="${unit}"]`);

async function addUnit(page, { name, parent }) {
  await page.getByTestId('studio-org-add-unit').fill(name);
  if (parent !== undefined) await page.getByTestId('studio-org-add-parent').selectOption(parent);
  await page.getByTestId('studio-org-add-unit').press('Enter');
  await expect(node(page, name)).toBeVisible();
}

/** Pick an agent in the palette and press L on a unit: the keyboard path to a lead. */
async function placeLead(page, agent, unit) {
  await page.locator(`[data-palette-agent="${agent}"]`).click();
  await node(page, unit).focus();
  await page.keyboard.press('l');
  await expect(node(page, unit)).toContainText(agent);
}

async function connect(page, from, to) {
  await node(page, from).focus();
  await page.keyboard.press('c');
  await page.getByTestId('studio-org-connect-to').selectOption(to);
  await page.getByTestId('studio-org-connect-confirm').click();
  await expect(page.locator(`[data-peer-line="${from}~${to}"], [data-peer-line="${to}~${from}"]`)).toBeVisible();
}

async function setDayBudget(page, unit, amount) {
  await node(page, unit).click();
  await page.getByTestId('org-design-panel').getByRole('tab', { name: 'Budget' }).click();
  await page.getByTestId('org-budget-input-Day').fill(String(amount));
  await page.getByTestId('org-budget-save-Day').click();
  await expect(page.getByTestId('org-budget-error-Day')).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('builds the site reliability shape from Blank on the Design tab', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  const store = await useStore(page);
  await login(page);
  await page.goto('/dashboard/autonomy?tab=organizations');

  // Blank asks for a name and opens the new organization on Design.
  await page.getByTestId('org-open-templates').click();
  await page.getByTestId('org-template-blank').check();
  await page.locator('#org-template-blank-name').fill('site-reliability');
  await page.getByTestId('org-template-apply').click();
  await expect(page).toHaveURL(/\/dashboard\/organizations\/org_\d+\?tab=design$/);
  await expect(page.getByTestId('org-design-empty')).toBeVisible();
  await expect(page.getByTestId('org-designer')).toBeVisible();

  // The root unit, then three units below it.
  await addUnit(page, { name: 'reliability' });
  for (const name of ['uptime', 'latency', 'dependencies']) await addUnit(page, { name, parent: 'reliability' });
  expect(store.orgs[0].units.map((u) => [u.name, u.parentUnitId ? 'child' : 'root'])).toEqual([
    ['reliability', 'root'],
    ['uptime', 'child'],
    ['latency', 'child'],
    ['dependencies', 'child']
  ]);

  // Every unit lacks a lead, which the live checks list as warnings with a link to each unit.
  await expect(page.locator('[data-problem-group="warnings"] [data-problem="UnitWithoutLead"]')).toHaveCount(4);
  await page.locator('[data-problem-unit="latency"] button').click();
  await expect(page.locator('[data-unit-panel="latency"]')).toBeVisible();

  // Leads from the palette: three from the keyboard and one by drag and drop.
  await placeLead(page, 'echo-agent', 'reliability');
  await placeLead(page, 'agent-2', 'uptime');
  await placeLead(page, 'agent-3', 'latency');
  await page.locator('[data-palette-agent="agent-4"]').dragTo(page.locator('[data-lead-slot="dependencies"]'));
  await expect(node(page, 'dependencies')).toContainText('agent-4');
  await expect(page.getByTestId('org-problems-none')).toBeVisible();

  // Peer lines: latency with dependencies and with uptime.
  await connect(page, 'latency', 'dependencies');
  await connect(page, 'latency', 'uptime');

  // Undo removes the last peer line by sending the opposite change, and Redo puts it back.
  await page.getByTestId('org-undo').click();
  await expect(page.locator('[data-peer-line="latency~uptime"], [data-peer-line="uptime~latency"]')).toHaveCount(0);
  await page.getByTestId('org-redo').click();
  await expect(page.locator('[data-peer-line="latency~uptime"], [data-peer-line="uptime~latency"]')).toHaveCount(1);

  // Day budgets: 10 at the root, 2, 2, and 3 below it. A budget above the root's is refused inline by the server.
  await setDayBudget(page, 'reliability', 10);
  await setDayBudget(page, 'uptime', 2);
  await setDayBudget(page, 'latency', 2);
  await setDayBudget(page, 'dependencies', 3);

  const units = Object.fromEntries(store.orgs[0].units.map((u) => [u.name, u]));
  expect(Object.keys(units)).toEqual(['reliability', 'uptime', 'latency', 'dependencies']);
  expect(units.reliability.leadAgentId).toBe('agt_0001');
  expect(units.dependencies.leadAgentId).toBe('agt_0004');
  expect(units.latency.peerLines.map((p) => p.peerUnitId).sort()).toEqual([units.dependencies.id, units.uptime.id].sort());
  expect(units.dependencies.budgets).toEqual([{ period: 'Day', amountUsd: 3 }]);

  // Publishing still happens from the page header.
  await page.getByTestId('org-publish').click();
  await page.getByTestId('org-publish-note').fill('Site reliability from the designer');
  await page.getByTestId('org-publish-submit').click();
  await expect(page.getByTestId('org-pending')).toHaveCount(0);

  // No sideways page scroll at 1366x768 with the sidebar open.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
