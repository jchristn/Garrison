// Deployment egress allowlists (P11.15): the list column, the form editor and its checks, and the blocked run text.

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

test('the deployment form edits egress rules and sends them with an empty port as null', async ({ page }) => {
  let body = null;
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/deployments\/dep_0004$/, (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...body, id: 'dep_0004' }) });
  });
  await login(page);
  await page.goto('/dashboard/deployments');
  await expect(page.locator('.data-table tbody tr', { hasText: 'deployment-4' }).getByTestId('egress-rules-cell')).toContainText('Allowlist, 2 rules');
  await expect(page.locator('.data-table tbody tr', { hasText: 'deployment-1' }).getByTestId('egress-rules-cell')).toHaveCount(0);
  await page.locator('.data-table tbody tr', { hasText: 'deployment-4' }).getByText('deployment-4', { exact: true }).click();
  await expect(page.locator('.modal')).toBeVisible();
  await page.locator('.modal .stepper-step').nth(5).click();
  await expect(page.getByTestId('egress-note')).toContainText('only run on Kubernetes workers with egress allowlists enabled');
  await expect(page.locator('#ol-0-cidr')).toHaveValue('203.0.113.0/24');
  await expect(page.locator('#ol-0-port')).toHaveValue('443');
  await expect(page.locator('#ol-1-protocol')).toHaveValue('UDP');
  await page.getByRole('button', { name: 'Add egress rule' }).click();
  await page.locator('#ol-2-cidr').fill('10.0.0.1/8');
  await page.getByTestId('save-button').click();
  await expect(page.locator('.modal')).toContainText('Invalid CIDR block.');
  expect(body).toBeNull();
  await page.locator('#ol-2-cidr').fill('10.0.0.0/8');
  await page.getByTestId('save-button').click();
  await expect.poll(() => body).not.toBeNull();
  expect(body.egressRules).toEqual([
    { cidr: '203.0.113.0/24', port: 443, protocol: 'TCP' },
    { cidr: '2001:db8::/32', port: null, protocol: 'UDP' },
    { cidr: '10.0.0.0/8', port: null, protocol: 'TCP' }
  ]);
});

test('an allowlisted deployment pinned to Process is flagged and not saved', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/deployments');
  await page.locator('.data-table tbody tr', { hasText: 'deployment-4' }).getByText('deployment-4', { exact: true }).click();
  await page.locator('.modal .stepper-step').nth(5).click();
  await page.locator('#deployments-executor').selectOption('Process');
  await expect(page.getByTestId('egress-process')).toContainText('enforced only for Kubernetes Job runs');
  await expect(page.getByTestId('process-trusted-only')).toHaveCount(0);
});

test('a run whose deployment has an egress allowlist explains the missing egress control', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/runs/run_0027');
  const notice = page.getByTestId('blocked-notice');
  await expect(notice).toContainText('egress allowlist');
  await expect(notice.locator('.blocked-badge')).toContainText('No isolating worker');
});
