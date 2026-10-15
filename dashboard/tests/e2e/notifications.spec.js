// Notification endpoints (P12.14) against mocked APIs: the tab under Configuration, creating an endpoint (the signing
// secret shown once), a destination refused by the server (400 DestinationBlocked), Send test, the delivery log, and
// the new cluster settings.

import { test, expect } from '@playwright/test';
import { installMocks, SIGNING_SECRET, notificationEndpoint } from './mocks.js';

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

test('lists notification endpoints under Configuration', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/notifications');
  await expect(page).toHaveURL(/\/dashboard\/configuration\?tab=notifications$/);
  await expect(page.locator('.data-table tbody tr')).toHaveCount(2);
  await expect(page.locator('.data-table tbody tr', { hasText: 'ops-alerts' })).toContainText('4 events');
  await expect(page.locator('.data-table tbody tr', { hasText: 'agent-1-results' })).toContainText('Agent:');
});

test('creates an endpoint with chosen events and shows its signing secret once', async ({ page }) => {
  let body = null;
  await page.route(/\/tenants\/default\/notification-endpoints$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ...notificationEndpoint(1), ...body, id: 'nep_0099', signingSecret: SIGNING_SECRET }) });
  });
  await login(page);
  await page.goto('/dashboard/configuration?tab=notifications');
  await page.getByTestId('add-button').click();
  const modal = page.locator('.modal');
  await modal.locator('#notifications-name').fill('pager');
  await modal.locator('#notifications-url').fill('https://hooks.example.com/pager');
  await modal.locator('.checkbox-chip', { hasText: 'Pipeline failed' }).locator('input').check();
  await page.getByTestId('save-button').click();
  await expect.poll(() => body).not.toBeNull();
  expect(body).toMatchObject({ name: 'pager', url: 'https://hooks.example.com/pager', events: ['RunFailed', 'RunTimedOut', 'PipelineFailed'], includeResultText: false });
  await expect(page.getByTestId('signing-secret-value')).toHaveText(SIGNING_SECRET);
  await expect(page.getByTestId('signing-secret-url')).toHaveCount(0);
});

test('shows the server refusing a private destination on the URL field', async ({ page }) => {
  await page.route(/\/tenants\/default\/notification-endpoints$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    return route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'BadRequest', code: 'ValidationFailed', message: 'The notification endpoint is invalid.', fields: { url: 'The destination is refused (Loopback).' }, fieldCodes: { url: 'DestinationBlocked' } })
    });
  });
  await login(page);
  await page.goto('/dashboard/configuration?tab=notifications');
  await page.getByTestId('add-button').click();
  const modal = page.locator('.modal');
  await modal.locator('#notifications-name').fill('local');
  await modal.locator('#notifications-url').fill('http://127.0.0.1:9000/hook');
  await page.getByTestId('save-button').click();
  await expect(modal.locator('.field-error')).toContainText('The server refuses this destination');
});

test('sends a test notification and opens the delivery log with a payload', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/configuration?tab=notifications');
  await page.locator('.data-table tbody tr', { hasText: 'ops-alerts' }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Send test' }).click();
  await expect(page.getByTestId('notification-test-result')).toHaveAttribute('data-outcome', 'succeeded');
  await page.locator('.modal .modal-header .icon-button').click();

  await page.locator('.data-table tbody tr', { hasText: 'ops-alerts' }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Delivery log' }).click();
  const rows = page.locator('[data-testid="deliveries-table"] tbody tr');
  await expect(rows).toHaveCount(4);
  await rows.nth(1).locator('button').click();
  await expect(page.getByTestId('delivery-detail')).toContainText('The endpoint answered 503.');
  await expect(page.getByTestId('delivery-detail')).toContainText('"event": "RunTimedOut"');
  await page.getByTestId('deliveries-status').selectOption('Failed');
  await expect(rows).toHaveCount(1);
});

test('shows the trigger and notification cluster settings with their labels', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/system?tab=settings');
  await expect(page.locator('legend', { hasText: /^Triggers$/ })).toBeVisible();
  await expect(page.locator('legend', { hasText: /^Notifications$/ })).toBeVisible();
  await expect(page.locator('label', { hasText: 'Allow private destinations' })).toBeVisible();
  await expect(page.locator('label', { hasText: 'Cron catch-up limit (seconds)' })).toBeVisible();
});
