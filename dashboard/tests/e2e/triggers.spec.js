// Triggers (P12.5) against mocked APIs: the tab under Agents, the list and type filter, creating a webhook trigger
// (the signing secret shown once with the webhook URL), editing (type read-only), Fire now, fire history, secret
// rotation, and the link from a run back to its trigger.

import { test, expect } from '@playwright/test';
import { installMocks, SIGNING_SECRET, trigger } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('lists triggers under Agents and filters by type', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/triggers');
  await expect(page).toHaveURL(/\/dashboard\/agents\?tab=triggers$/);
  await expect(page.locator('.data-table tbody tr')).toHaveCount(3);
  const cron = page.locator('.data-table tbody tr', { hasText: 'nightly-report' });
  await expect(cron).toContainText('0 9 * * 1-5');
  await expect(cron).toContainText('Europe/Berlin');
  await expect(page.locator('.data-table tbody tr', { hasText: 'github-issues' })).toContainText('When a signed webhook arrives');
  await page.locator('select[aria-label="Type"]').selectOption('Webhook');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
});

test('creates a webhook trigger and shows its signing secret once', async ({ page }) => {
  let body = null;
  await page.route(/\/tenants\/default\/triggers$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ...trigger(2), ...body, id: 'trg_0099', signingSecret: SIGNING_SECRET, signingSecretLast4: '6789' }) });
  });
  await login(page);
  await page.goto('/dashboard/agents?tab=triggers');
  await page.getByTestId('add-button').click();
  const modal = page.locator('.modal');
  await modal.locator('#triggers-name').fill('github-hook');
  await modal.locator('#triggers-type').selectOption('Webhook');
  // A webhook trigger has no schedule fields, and its URL appears only after saving.
  await expect(modal.locator('#triggers-cronExpression')).toHaveCount(0);
  await expect(modal.getByTestId('trigger-webhook-pending')).toBeVisible();
  await modal.locator('#triggers-agentId').selectOption('agt_0001');
  await page.getByTestId('save-button').click();
  await expect.poll(() => body).not.toBeNull();
  expect(body).toMatchObject({ name: 'github-hook', type: 'Webhook', targetType: 'Agent', agentId: 'agt_0001', cronExpression: null });
  await expect(page.getByTestId('signing-secret-value')).toHaveText(SIGNING_SECRET);
  await expect(page.getByTestId('signing-secret-url')).toContainText('/v1.0/api/tenants/default/triggers/trg_0099/webhook');
  await page.getByTestId('signing-secret-done').click();
  await expect(page.getByTestId('signing-secret-value')).toHaveCount(0);
});

test('rejects an invalid cron expression before saving', async ({ page }) => {
  let posted = false;
  await page.route(/\/tenants\/default\/triggers$/, (route) => {
    if (route.request().method() === 'POST') posted = true;
    return route.fallback();
  });
  await login(page);
  await page.goto('/dashboard/agents?tab=triggers');
  await page.getByTestId('add-button').click();
  const modal = page.locator('.modal');
  await modal.locator('#triggers-name').fill('bad-cron');
  await modal.locator('#triggers-agentId').selectOption('agt_0001');
  await modal.locator('#triggers-cronExpression').fill('0 9 *');
  await page.getByTestId('save-button').click();
  await expect(modal.locator('.field-error')).toContainText('five fields');
  expect(posted).toBe(false);
});

test('edits a webhook trigger with the type locked and the webhook URL shown', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/agents?tab=triggers');
  await page.locator('.data-table tbody tr', { hasText: 'github-issues' }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: /^Edit$/ }).click();
  const modal = page.locator('.modal');
  await expect(modal.locator('#triggers-type')).toBeDisabled();
  await expect(modal.getByTestId('trigger-webhook-url')).toContainText('/triggers/trg_0002/webhook');
  await expect(modal.getByTestId('trigger-run-as-notice')).toContainText('admin@garrison');
});

test('fires a trigger by hand and opens the fire history', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/agents?tab=triggers');
  await page.locator('.data-table tbody tr', { hasText: 'nightly-report' }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Fire now' }).click();
  await page.getByTestId('trigger-fire-body').fill('{"reason":"manual check"}');
  await page.getByTestId('trigger-fire-submit').click();
  await expect(page.getByTestId('trigger-fire-result')).toContainText('Started');
  await expect(page.getByTestId('trigger-fire-run')).toHaveText('run_0001');
  await page.locator('.modal .modal-header .icon-button').click();

  await page.locator('.data-table tbody tr', { hasText: 'nightly-report' }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Fire history' }).click();
  await expect(page.locator('[data-testid="trigger-fires-table"] tbody tr')).toHaveCount(5);
  await page.getByTestId('trigger-fires-outcome').selectOption('Skipped');
  await expect(page.locator('[data-testid="trigger-fires-table"] tbody tr')).toHaveCount(1);
  await expect(page.locator('[data-testid="trigger-fires-table"] tbody tr')).toContainText('MissedSchedule');
});

test('rotates a webhook secret after confirming and shows the new one once', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/agents?tab=triggers');
  await page.locator('.data-table tbody tr', { hasText: 'github-issues' }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Rotate secret' }).click();
  await expect(page.locator('.modal')).toContainText('stops working at once');
  await page.locator('.modal .modal-footer button', { hasText: 'Rotate secret' }).click();
  await expect(page.getByTestId('signing-secret-value')).toHaveText(SIGNING_SECRET);
});

test('opens a trigger fire history from the ?fires= link a run uses', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/agents?tab=triggers&fires=trg_0001');
  await expect(page.locator('[data-testid="trigger-fires-table"] tbody tr')).toHaveCount(5);
  await expect(page.locator('.modal .modal-header')).toContainText('nightly-report');
});
