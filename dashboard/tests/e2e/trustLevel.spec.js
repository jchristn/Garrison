import { test, expect } from '@playwright/test';
import { installMocks, respond } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

test('an Untrusted run with no isolating worker explains the missing isolation', async ({ page }) => {
  await installMocks(page);
  await login(page);
  await page.goto('/dashboard/runs/run_0021');
  const notice = page.getByTestId('blocked-notice');
  await expect(notice).toContainText('needs Container isolation');
  await expect(notice.locator('.blocked-badge')).toContainText('No isolating worker');
  await expect(page.getByTestId('run-trust-level')).toHaveText('Untrusted');
  await expect(page.getByTestId('process-trusted-only')).toHaveCount(0);
  await page.goto('/dashboard/runs/run_0001');
  await expect(page.getByTestId('run-trust-level')).toHaveText('Trusted');
});

test('a tenant that requires Untrusted flags its Trusted deployments', async ({ page }) => {
  await installMocks(page);
  await page.route(/\/v1\.0\/api\/tenants(\?.*)?$/, (route) => {
    const body = respond('GET', new URL(route.request().url()));
    const objects = (body.objects || []).map((x) => (x.id === 'default' ? { ...x, requireUntrustedDeployments: true } : x));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...body, objects }) });
  });
  await login(page);
  await page.goto('/dashboard/deployments');
  await expect(page.locator('.data-table tbody tr', { hasText: 'deployment-1' }).getByTestId('trust-flagged')).toBeVisible();
  await expect(page.locator('.data-table tbody tr', { hasText: 'deployment-3' })).toContainText('Untrusted');
  await expect(page.locator('.data-table tbody tr', { hasText: 'deployment-3' }).getByTestId('trust-flagged')).toHaveCount(0);
  await page.locator('.data-table tbody tr', { hasText: 'deployment-1' }).getByText('deployment-1', { exact: true }).click();
  await expect(page.getByTestId('tenant-requires-untrusted')).toContainText('requires Untrusted deployments');
});
