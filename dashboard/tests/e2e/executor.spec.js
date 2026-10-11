// Pod-per-run executor (Phase 11): the deployment form's executor select and run pod resources, the
// PersistentVolume workspace kind, node pool default executors, and node executors.

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

test('the deployment form sets the executor and pod resources and sends them as podResources', async ({ page }) => {
  let body = null;
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/deployments\/dep_0002$/, (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...body, id: 'dep_0002' }) });
  });
  await login(page);
  await page.goto('/dashboard/deployments');
  await page.locator('.data-table tbody tr', { hasText: 'deployment-2' }).getByText('deployment-2', { exact: true }).click();
  await expect(page.locator('.modal')).toBeVisible();
  await page.locator('.modal .stepper-step').nth(5).click();
  const modal = page.locator('.modal');
  await expect(modal).toContainText('Executor and pod resources');

  const executor = page.locator('#deployments-executor');
  await expect(executor).toHaveValue('');
  await expect(executor.locator('option').first()).toHaveText('Node pool default');
  await expect(executor).toHaveAttribute('data-tip', /Kubernetes Job/);
  // deployment-2 is in np-1, whose default executor is Kubernetes Job.
  await expect(modal).toContainText('Empty uses the node pool default: Kubernetes Job.');
  await expect(modal).toContainText('Pod resources apply to Kubernetes Job runs only.');

  await executor.selectOption('Process');
  await expect(page.locator('#deployments-podCpuRequest')).toHaveCount(0);
  await executor.selectOption('KubernetesJob');
  const cpu = page.locator('#deployments-podCpuRequest');
  await expect(cpu).toHaveAttribute('placeholder', '250m');
  await expect(page.locator('label[for="deployments-podMemoryLimit"]')).toHaveAttribute('data-tip', /Run pod failed/);
  await cpu.fill('lots');
  await page.locator('#deployments-podMemoryLimit').fill('1Gi');
  await page.getByTestId('save-button').click();
  await expect(modal.locator('.field-error')).toContainText('Use a Kubernetes quantity');
  expect(body).toBeNull();

  await cpu.fill('250m');
  await page.getByTestId('save-button').click();
  await expect.poll(() => body).not.toBeNull();
  expect(body.executor).toBe('KubernetesJob');
  expect(body.podResources).toEqual({ cpuRequest: '250m', memoryLimit: '1Gi' });
  expect(Object.keys(body).filter((k) => /^pod[A-Z]/.test(k) && k !== 'podResources')).toEqual([]);
});

test('workspace templates offer the PersistentVolume kind with a claim name', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/configuration?tab=workspaces');
  await page.getByTestId('add-button').first().click();
  await page.locator('#workspaces-name').fill('shared');
  await expect(page.locator('#workspaces-persistentVolumeClaim')).toHaveCount(0);
  await page.locator('#workspaces-kind').selectOption('PersistentVolume');
  const claim = page.locator('#workspaces-persistentVolumeClaim');
  await expect(claim).toBeVisible();
  await expect(page.locator('label[for="workspaces-persistentVolumeClaim"]')).toHaveAttribute('data-tip', /PersistentVolumeClaim/);
  await claim.fill('Bad_Name');
  await page.getByTestId('save-button').click();
  await expect(page.locator('.modal .field-error')).toContainText('lowercase letters');
});

test('node pools show their default executor and nodes list their executors', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/fleet?tab=node-pools');
  const pool = page.locator('.data-table tbody tr', { hasText: 'np-1' });
  await expect(pool).toContainText('Kubernetes Job');
  await expect(page.locator('.data-table tbody tr', { hasText: 'np-2' })).toContainText('Process');

  await page.goto('/dashboard/fleet');
  const node = page.locator('.data-table tbody tr', { hasText: 'garrison-worker-0' });
  await expect(node).toContainText('Process, Kubernetes Job');
});
