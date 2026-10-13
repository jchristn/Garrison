import { test, expect } from '@playwright/test';
import { installMocks, respond } from './mocks.js';

async function openQuotas(page, readOnly = false) {
  await installMocks(page);
  if (readOnly) await page.route('**/v1.0/token/details', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...respond('GET', new URL(route.request().url())), isAdmin: false, isTenantAdmin: false }) }));
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
  await page.goto('/dashboard/configuration?tab=usage-quotas');
}

test('quota usage distinguishes known cost from missing-cost completions', async ({ page }) => {
  await openQuotas(page);
  await page.locator('.action-menu-trigger').first().click();
  await page.locator('.action-menu-dropdown').getByText('Daily usage', { exact: true }).click();
  await expect(page.getByTestId('quota-cost-incomplete')).toContainText('does not block admission');
  await expect(page.locator('[data-usage="unknownCostRuns"]')).toContainText('2');
  await expect(page.locator('[data-usage="costUsd"]')).toContainText('$0.25');
  await expect(page.locator('[data-usage="activeRuns"]')).toContainText('1');
});

test('administrators can set zero and fractional limits while leaving counts unlimited', async ({ page }) => {
  await openQuotas(page);
  await page.getByTestId('add-button').click();
  await page.locator('#usageQuotas-name').fill('operator-quota');
  await page.locator('#usageQuotas-dailyRunLimit').fill('0');
  await page.locator('#usageQuotas-dailyCostUsdLimit').fill('0.125');
  const request = page.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith('/usage-quotas'));
  await page.getByTestId('save-button').click();
  expect((await request).postDataJSON()).toMatchObject({ scope: 'Tenant', dailyRunLimit: 0, dailyTokenLimit: null, dailyCostUsdLimit: 0.125, maxConcurrentRuns: null });
  await expect(page.locator('.modal')).toHaveCount(0);
});

test('read roles can inspect quotas but cannot open edit or create controls', async ({ page }) => {
  await openQuotas(page, true);
  await expect(page.getByTestId('add-button')).toHaveCount(0);
  await page.locator('.action-menu-trigger').first().click();
  await expect(page.locator('.action-menu-dropdown').getByText('Edit', { exact: true })).toHaveCount(0);
  await expect(page.locator('.action-menu-dropdown').getByText('Delete', { exact: true })).toHaveCount(0);
  await page.locator('.action-menu-dropdown').getByText('Daily usage', { exact: true }).click();
  await expect(page.getByTestId('quota-usage')).toBeVisible();
});
