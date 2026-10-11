// Secret credential status (G-22): a Codex login the provider rejected shows a "Needs reauthentication" badge with a
// tooltip in the Secrets list, and its view and edit forms explain what happened and how to replace it.

import { test, expect } from '@playwright/test';
import { installMocks } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await installMocks(page);
});

test('G-22 secrets list shows the credential status with a tooltip', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/configuration?tab=secrets');
  const rejected = page.locator('.data-table tbody tr', { hasText: 'sec-2' });
  const badge = rejected.locator('.pill', { hasText: 'Needs reauthentication' });
  await expect(badge).toBeVisible();
  await expect(badge).toHaveAttribute('data-tip', /rejected the stored ChatGPT login/);
  await expect(page.locator('.data-table tbody tr', { hasText: 'sec-1' }).locator('.pill', { hasText: 'OK' })).toBeVisible();
});

test('G-22 secret form warns when the login needs reauthentication', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/configuration?tab=secrets');
  await page.locator('.data-table tbody tr', { hasText: 'sec-2' }).getByText('sec-2', { exact: true }).click();
  const warning = page.getByTestId('secret-reauth-warning');
  await expect(warning).toBeVisible();
  await expect(warning).toContainText('This login needs reauthentication');
  await expect(warning).toContainText('refresh_token_reused');
  await expect(warning).toContainText('CODEX_HOME');
  await expect(page.getByTestId('secret-codex-login')).toContainText('Last refreshed by Garrison');
  await expect(page.getByTestId('secret-codex-login')).toContainText('Access token expires');
  await page.locator('.modal').getByRole('button', { name: 'Close' }).click();

  await page.locator('.data-table tbody tr', { hasText: 'sec-1' }).getByText('sec-1', { exact: true }).click();
  await expect(page.locator('.modal')).toBeVisible();
  await expect(page.getByTestId('secret-reauth-warning')).toHaveCount(0);
});
