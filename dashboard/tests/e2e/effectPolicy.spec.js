// Deployment effect policy (P12.29): the deployment form's policy select, the list column, and the run view.

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

test.use({ actionTimeout: 15000 });

test.beforeEach(async ({ page }) => {
  await installMocks(page);
});

test('the deployment form edits the effect policy and sends it without retryOnNodeLoss', async ({ page }) => {
  let body = null;
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/deployments\/dep_0002$/, (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...body, id: 'dep_0002', retryOnNodeLoss: false }) });
  });
  await login(page);
  await page.goto('/dashboard/deployments');
  await expect(page.locator('.data-table tbody tr', { hasText: 'deployment-2' })).toContainText('At least once');
  await expect(page.locator('.data-table tbody tr', { hasText: 'deployment-1' })).toContainText('At most once');
  await page.locator('.data-table tbody tr', { hasText: 'deployment-2' }).getByText('deployment-2', { exact: true }).click();
  await expect(page.locator('.modal')).toBeVisible();
  await page.locator('.modal .stepper-step').nth(5).click();
  const policy = page.locator('#deployments-effectPolicy');
  await expect(policy).toHaveValue('AtLeastOnce');
  await expect(page.locator('#deployments-retryOnNodeLoss')).toHaveCount(0);
  await expect(page.locator('.modal')).toContainText('Journaled behaves like At most once');
  await policy.selectOption('Journaled');
  await page.getByTestId('save-button').click();
  await expect.poll(() => body).not.toBeNull();
  expect(body.effectPolicy).toBe('Journaled');
  expect('retryOnNodeLoss' in body).toBe(false);
});

test('a new deployment defaults to At most once', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/deployments');
  await page.getByTestId('add-button').first().click();
  await expect(page.locator('.modal')).toBeVisible();
  await page.locator('.modal .stepper-step').nth(5).click();
  await expect(page.locator('#deployments-effectPolicy')).toHaveValue('AtMostOnce');
});

test('the run view shows the effect policy the run was admitted under', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/runs/run_0005');
  await expect(page.getByTestId('run-effect-policy')).toHaveText('At least once');
  await page.goto('/dashboard/runs/run_0001');
  await expect(page.getByTestId('run-effect-policy')).toHaveText('At most once');
});
