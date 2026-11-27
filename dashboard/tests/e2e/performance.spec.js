// Performance signals and org-scale brakes (AA11.7) against mocked APIs: the Performance tab picks an organization and
// the organization page links to its performance; one GET /organizations/{id}/performance renders the chart, the unit
// and agent tables, and the scheduled checks (linking to the eval run), and the window picker and unit filter read it
// again; New check opens the trigger editor preset to an EvalSet target; a unit is cascade-cancelled from the board's
// brakes panel and from the organization chart, with the confirm dialog naming the unit and the counts afterwards;
// rollback sends the in-flight ticks choice; the organization's budget freeze margin is edited; the tour stops at
// Performance. The page passes an automated accessibility scan without horizontal scroll at 1280 and 390 pixels.

import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { installMocks } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

/** Record request bodies (and GET URLs when asked) for a URL pattern while the shared mocks still answer. */
async function record(page, pattern, { gets = false } = {}) {
  const requests = [];
  page.on('request', (req) => {
    if (pattern.test(req.url()) && (gets || req.method() !== 'GET')) requests.push({ method: req.method(), url: req.url(), body: req.method() === 'GET' ? null : req.postDataJSON?.() ?? null });
  });
  return requests;
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('opens performance from the Performance tab and from the organization page', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/autonomy?tab=performance');
  await expect(page.getByTestId('performance-picker')).toBeVisible();
  await page.getByTestId('performance-picker-link-org_0001').click();
  await expect(page).toHaveURL(/\/dashboard\/performance\/org_0001$/);
  await expect(page.getByTestId('performance')).toContainText('Performance of Refund operations');

  await page.goto('/dashboard/organizations/org_0001');
  await page.getByTestId('org-open-performance').click();
  await expect(page).toHaveURL(/\/dashboard\/performance\/org_0001$/);
});

test('renders units, agents, the chart, and checks, and reads again for a window and a unit', async ({ page }) => {
  const reads = await record(page, /\/organizations\/org_0001\/performance/, { gets: true });
  await login(page);
  await page.goto('/dashboard/performance/org_0001');
  await expect(page.getByTestId('performance-chart').locator('[data-chart-unit]')).toHaveCount(3);
  await expect(page.locator('[data-perf-unit]')).toHaveCount(3);
  await expect(page.locator('[data-perf-unit="oun_0002"] [data-metric="successRate"]')).toHaveText('65.2%');
  await expect(page.locator('[data-perf-agent]')).toHaveCount(4);
  await expect(page.locator('[data-perf-agent="agt_0001"]')).toContainText('Lead');
  const check = page.locator('[data-check="trg_0099"]');
  await expect(check).toContainText('refund-answers-nightly');
  await expect(check).toContainText('Below threshold');
  await expect(page.getByTestId('performance-check-run-trg_0099')).toHaveAttribute('href', '/dashboard/eval-runs/evr_0001');

  const first = new URL(reads[0].url);
  expect(new Date(first.searchParams.get('toUtc')) - new Date(first.searchParams.get('fromUtc'))).toBe(7 * 86400000);
  await page.getByTestId('performance-window-30d').click();
  await expect.poll(() => reads.length).toBeGreaterThan(1);
  const second = new URL(reads.at(-1).url);
  expect(new Date(second.searchParams.get('toUtc')) - new Date(second.searchParams.get('fromUtc'))).toBe(30 * 86400000);

  await page.getByTestId('performance-unit').selectOption('oun_0002');
  await expect(page.locator('[data-perf-unit]')).toHaveCount(1);
  expect(new URL(reads.at(-1).url).searchParams.get('unitId')).toBe('oun_0002');
  await expect(page.getByTestId('performance-checks-empty')).toBeVisible();
});

test('New check opens the trigger editor preset to an EvalSet target', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/performance/org_0001');
  await page.getByTestId('performance-new-check').click();
  await expect(page).toHaveURL(/\/dashboard\/agents\?tab=triggers$/);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Create trigger');
  await expect(dialog.locator('#triggers-targetType')).toHaveValue('EvalSet');
  await expect(dialog.locator('#triggers-evalSetId')).toBeVisible();
  await expect(dialog.locator('#triggers-evalJudgeAgentId')).toBeVisible();
  await expect(dialog.locator('#triggers-evalRecentInputCount')).toHaveValue('20');
  await expect(dialog.locator('#triggers-agentId')).toHaveCount(0);
});

test('cascade-cancels a unit from the board brakes panel and shows the counts (AA11.4)', async ({ page }) => {
  const bodies = await record(page, /\/units\/[^/]+\/cancel-all$/);
  await login(page);
  await page.goto('/dashboard/board/org_0001');
  await expect(page.getByTestId('board-cancel-all')).toHaveAttribute('aria-disabled', 'true');
  await page.getByTestId('board-freeze-unit').selectOption('oun_0002');
  await page.getByTestId('board-cancel-all').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Cancel everything in Billing');
  expect(bodies).toHaveLength(0);
  await dialog.getByTestId('cascade-cancel-reason').fill('Billing is looping.');
  await dialog.getByTestId('cascade-cancel-confirm').click();
  const result = dialog.getByTestId('cascade-cancel-result');
  await expect(result).toContainText('Everything in Billing has stopped');
  await expect(result.locator('[data-count="runsCancelled"] dd')).toHaveText('3');
  await expect(result.locator('[data-count="ticksCancelled"] dd')).toHaveText('1');
  await expect(result.locator('[data-count="escalationsWithdrawn"] dd')).toHaveText('2');
  await expect(result.locator('[data-count="messagesExpired"] dd')).toHaveText('4');
  expect(bodies).toHaveLength(1);
  expect(bodies[0].url).toMatch(/\/organizations\/org_0001\/units\/oun_0002\/cancel-all$/);
  expect(bodies[0].body).toEqual({ reason: 'Billing is looping.' });

  // The separate freeze the result offers opens the freeze dialog for the same unit.
  await dialog.getByTestId('cascade-cancel-freeze').click();
  await expect(page.getByTestId('freeze-form')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Billing');
});

test('cascade-cancels a unit from the organization chart unit menu', async ({ page }) => {
  const bodies = await record(page, /\/units\/[^/]+\/cancel-all$/);
  await login(page);
  await page.goto('/dashboard/organizations/org_0001');
  const support = page.getByTestId('org-chart').locator('[data-unit="Support"]');
  await support.getByTestId('org-unit-cancel-all').click();
  await expect(page.getByRole('dialog')).toContainText('Cancel everything in Support');
  await page.getByTestId('cascade-cancel-confirm').click();
  await expect(page.getByTestId('cascade-cancel-result')).toContainText('Everything in Support has stopped');
  expect(bodies[0].url).toMatch(/\/units\/oun_0003\/cancel-all$/);
  expect(bodies[0].body).toEqual({ reason: null });
  await page.getByTestId('cascade-cancel-close').click();
  await expect(page.getByTestId('cascade-cancel-modal')).toBeHidden();
});

test('rollback sends the in-flight ticks choice and the margin is edited on the organization page', async ({ page }) => {
  const bodies = await record(page, /\/organizations\/org_0001(\/rollback)?$/);
  await login(page);
  await page.goto('/dashboard/board/org_0001');
  await page.getByTestId('board-rollback').click();
  await expect(page.getByTestId('rollback-ticks-finish')).toBeChecked();
  await page.getByTestId('rollback-ticks-cancel').check();
  await page.getByTestId('confirm-button').click();
  await expect(page.locator('.toast').filter({ hasText: 'Rolled back. Revision 4 is live.' })).toBeVisible();
  expect(bodies[0].body).toMatchObject({ activeTicks: 'Cancel' });

  await page.goto('/dashboard/organizations/org_0001');
  await expect(page.getByTestId('org-freeze-margin')).toContainText('Frozen at 10% over budget');
  await page.getByTestId('org-edit-details').click();
  const margin = page.locator('#org-details-budgetFreezeMarginPercent');
  await expect(margin).toHaveValue('10');
  await margin.fill('101');
  await page.getByTestId('org-details-save').click();
  await expect(page.getByRole('dialog')).toContainText('Enter a whole number from 0 to 100.');
  await margin.fill('25');
  await page.getByTestId('org-details-save').click();
  await expect.poll(() => bodies.filter((b) => b.method === 'PUT').length).toBe(1);
  expect(bodies.find((b) => b.method === 'PUT').body).toMatchObject({ name: 'Refund operations', budgetFreezeMarginPercent: 25 });
});

test('the guided tour stops at Performance', async ({ page }) => {
  await login(page);
  await page.locator('.sidebar-utility').nth(1).click();
  const card = page.locator('.tour-card');
  const titles = [];
  for (let i = 0; i < 9; i++) {
    titles.push(await card.locator('h3').textContent());
    await card.getByRole('button', { name: /^(Next|Done)$/ }).click();
  }
  expect(titles).toContain('Performance');
  await expect(card).toBeHidden();
});

test('passes an accessibility scan and lays out performance at desktop and phone widths', async ({ page }, testInfo) => {
  await login(page);
  const scan = async (label) => {
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))));
    await page.addScriptTag({ content: axe.source });
    const result = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    expect(result.violations.map((v) => `${label}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  };
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const theme = (value) => page.evaluate((v) => document.documentElement.setAttribute('data-theme', v), value);
  for (const mode of ['light', 'dark']) {
    for (const [name, width, height] of [['desktop', 1280, 900], ['phone', 390, 844]]) {
      await page.setViewportSize({ width, height });
      for (const id of ['org_0001', 'org_0002']) {
        const label = `${mode} ${name} ${id}`;
        await page.goto(`/dashboard/performance/${id}`);
        await expect(page.getByTestId('performance-units')).toBeVisible();
        await theme(mode);
        await scan(label);
        expect(await overflow(), label).toBeLessThanOrEqual(1);
        await page.screenshot({ path: testInfo.outputPath(`performance-${id}-${mode}-${name}.png`), fullPage: true });
      }
      await page.goto('/dashboard/board/org_0001');
      await page.getByTestId('board-freeze-unit').selectOption('oun_0002');
      await page.getByTestId('board-cancel-all').click();
      await theme(mode);
      await scan(`${mode} ${name} cascade confirm`);
      await page.getByTestId('cascade-cancel-confirm').click();
      await expect(page.getByTestId('cascade-cancel-result')).toBeVisible();
      await scan(`${mode} ${name} cascade result`);
    }
  }
});
