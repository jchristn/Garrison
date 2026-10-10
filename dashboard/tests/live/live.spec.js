// Read-only checks against a live Garrison deployment (no mocks). Nothing is created or deleted.

import { test, expect } from '@playwright/test';
import { ROUTES } from '../../src/utils/routes.js';

const TENANT = process.env.GARRISON_TENANT_ID || 'ten_default';
const EMAIL = process.env.GARRISON_ADMIN_EMAIL || 'admin@garrison.local';
const PASSWORD = process.env.GARRISON_ADMIN_PASSWORD || 'garrison';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill(TENANT);
  await page.locator('#email').fill(EMAIL);
  await page.locator('#password').fill(PASSWORD);
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

test('signs in and visits every route without page errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await login(page);
  for (const route of ROUTES) {
    await page.goto(`/dashboard/${route.slug}`);
    await expect(page.locator('.page-header-title').first(), route.slug).toBeVisible();
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.loading-spinner'), route.slug).toHaveCount(0);
    await expect(page.locator('.state-block', { hasText: 'permission' }), route.slug).toHaveCount(0);
    await expect(page.locator('.error-banner'), route.slug).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('lists the registered worker nodes', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/nodes');
  await expect(page.locator('table tbody tr').first()).toBeVisible();
});
