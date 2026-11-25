// Keepers (AA1.16) against mocked APIs: the Autonomy group and Keepers list with its status filter, creating a keeper
// (its first revision sent inline), pausing and waking from the row menu, the keeper page with ticks and revisions,
// the empty state, the Home Autonomy card, and the link from a keeper tick's run back to its keeper.

import { test, expect } from '@playwright/test';
import { installMocks, keeper } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const row = (page, name) => page.locator('.data-table tbody tr', { hasText: name });

async function menu(page, name, item) {
  await row(page, name).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: item }).click();
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('lists keepers under Autonomy and filters by status', async ({ page }) => {
  await login(page);
  await page.locator('[data-nav="autonomy"]').first().click();
  await expect(page).toHaveURL(/\/dashboard\/autonomy$/);
  await expect(page.locator('.data-table tbody tr')).toHaveCount(3);
  await expect(row(page, 'support-queue')).toContainText('Active');
  await expect(row(page, 'support-queue')).toContainText('30 min');
  await expect(row(page, 'nightly-costs')).toContainText('Needs attention');
  await page.locator('select[aria-label="Status"]').selectOption('Paused');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.data-table tbody tr')).toContainText('nightly-costs');
});

test('creates a keeper with its first revision', async ({ page }) => {
  let body = null;
  await page.route(/\/tenants\/default\/mandates$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ...keeper(1), id: 'mdt_0099', name: body.name }) });
  });
  await login(page);
  await page.goto('/dashboard/autonomy');
  await page.getByTestId('add-button').click();
  const modal = page.locator('.modal');
  await modal.locator('#keepers-name').fill('inbox-keeper');
  await modal.locator('#keepers-agentId').selectOption('agt_0001');
  await modal.locator('#keepers-deploymentId').selectOption('dep_0001');
  // Saving without an objective is refused before anything is sent.
  await page.getByTestId('save-button').click();
  await expect(modal.locator('.field-error')).toContainText('Describe the standing job');
  expect(body).toBeNull();
  await modal.locator('#keepers-objective').fill('Keep the inbox below 50 unread messages.');
  await modal.locator('#keepers-wakeMode').selectOption('Fixed');
  await expect(modal.locator('#keepers-maxIntervalSeconds')).toHaveCount(0);
  await modal.locator('#keepers-minIntervalSeconds').fill('600');
  await page.getByTestId('save-button').click();
  await expect.poll(() => body).not.toBeNull();
  expect(body).toMatchObject({ name: 'inbox-keeper', agentId: 'agt_0001', deploymentId: 'dep_0001', currentRevision: { objective: 'Keep the inbox below 50 unread messages.', wakeMode: 'Fixed', minIntervalSeconds: 600 } });
});

test('pauses and wakes keepers from the row menu', async ({ page }) => {
  const calls = [];
  await page.route(/\/mandates\/mdt_\d+\/(pause|resume|wake)$/, (route) => {
    calls.push(new URL(route.request().url()).pathname.split('/').slice(-2).join('/'));
    return route.fallback();
  });
  await login(page);
  await page.goto('/dashboard/autonomy');
  await menu(page, 'support-queue', 'Wake now');
  await expect(page.locator('.toast')).toContainText('support-queue wakes now.');
  await menu(page, 'support-queue', 'Pause');
  await menu(page, 'nightly-costs', 'Resume');
  expect(calls).toEqual(['mdt_0001/wake', 'mdt_0001/pause', 'mdt_0002/resume']);
});

test('opens a keeper with its ticks and revisions and publishes a new revision', async ({ page }) => {
  let revision = null;
  await page.route(/\/mandates\/mdt_0001\/revisions$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    revision = route.request().postDataJSON();
    return route.fallback();
  });
  await login(page);
  await page.goto('/dashboard/autonomy');
  await row(page, 'support-queue').locator('strong', { hasText: 'support-queue' }).click();
  await expect(page).toHaveURL(/\/dashboard\/keepers\/mdt_0001$/);
  await expect(page.getByTestId('keeper-objective')).toContainText('under 20 open tickets');
  await expect(page.locator('[data-testid="keeper-ticks-table"] tbody tr')).toHaveCount(6);
  await page.getByTestId('keeper-ticks-outcome').selectOption('Acted');
  await expect(page.locator('[data-testid="keeper-ticks-table"] tbody tr')).toHaveCount(1);
  await expect(page.locator('[data-testid="keeper-revisions-table"] tbody tr')).toHaveCount(3);
  await page.getByTestId('keeper-revision-diff-2').click();
  await expect(page.locator('.diff-viewer')).toContainText('Answer the simple ones yourself.');
  await page.locator('.modal .modal-header .icon-button').click();
  await page.getByTestId('keeper-new-revision').click();
  await page.locator('#keeper-revision-objective').fill('Keep the support queue under 10 open tickets.');
  await page.locator('#keeper-revision-changeNote').fill('Tighter target.');
  await page.getByTestId('keeper-revision-publish').click();
  await expect.poll(() => revision).not.toBeNull();
  expect(revision).toMatchObject({ objective: 'Keep the support queue under 10 open tickets.', changeNote: 'Tighter target.' });
});

test('shows the empty state when there are no keepers', async ({ page }) => {
  await page.route(/\/tenants\/default\/mandates\?/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, maxResults: 25, skip: 0, totalRecords: 0, recordsRemaining: 0, endOfResults: true, objects: [] }) })
  );
  await login(page);
  await page.goto('/dashboard/autonomy');
  await expect(page.locator('.state-block')).toContainText('No keepers yet');
});

test('shows keepers on Home and links a tick run back to its keeper', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/home');
  await expect(page.getByTestId('home-autonomy-attention')).toContainText('nightly-costs');
  await page.goto('/dashboard/runs/run_0019');
  await page.getByTestId('run-keeper-link').click();
  await expect(page).toHaveURL(/\/dashboard\/keepers\/mdt_0001$/);
});
