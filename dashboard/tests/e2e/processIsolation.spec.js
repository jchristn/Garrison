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

test('Process deployment and run views visibly identify trusted-only execution', async ({ page }) => {
  await installMocks(page);
  await page.route(/\/deployments\/dep_0001$/, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...respond('GET', new URL(route.request().url())), executor: 'Process' }) }));
  // The edit form opens from the list row, so the row must carry the explicit executor too; otherwise the deployment
  // inherits pool np-1's KubernetesJob default once the form's pick lists load and the warning correctly disappears.
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/deployments(\?.*)?$/, (route) => {
    const body = respond('GET', new URL(route.request().url()));
    const objects = (body.objects || []).map((d) => (d.id === 'dep_0001' ? { ...d, executor: 'Process' } : d));
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...body, objects }) });
  });
  await login(page);
  await page.goto('/dashboard/deployments');
  await page.locator('.data-table tbody tr', { hasText: 'deployment-1' }).getByText('deployment-1', { exact: true }).click();
  await expect(page.getByTestId('process-trusted-only')).toContainText('trusted only');
  await expect(page.getByTestId('process-trusted-only')).toContainText('worker credentials');
  await page.goto('/dashboard/runs/run_0001');
  await expect(page.getByTestId('process-trusted-only')).toContainText('trusted only');
});
