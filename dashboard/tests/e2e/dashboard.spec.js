// End-to-end coverage for the Garrison dashboard against mocked APIs (no backend required).

import { test, expect } from '@playwright/test';
import { installMocks } from './mocks.js';
import { ROUTES } from '../../src/utils/routes.js';

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 860 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 390, height: 844 }
];

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('ten_default');
  await page.locator('#email').fill('admin@garrison.local');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  // Every confirmation must be a custom modal, never a native dialog.
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('logs in, lands on Home, and logs out', async ({ page }) => {
  await login(page);
  await expect(page.locator('.page-header-title')).toContainText('Home');
  await expect(page.locator('.kpi-card').first()).toBeVisible();
  await expect(page.getByText('Grafana')).toBeVisible();
  await page.getByTestId('logout').click();
  await expect(page.getByTestId('login-submit')).toBeVisible();
});

test('navigates every route without errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await login(page);
  for (const route of ROUTES) {
    await page.goto(`/dashboard/${route.slug}`);
    await expect(page.locator('.page-header-title').first(), route.slug).toBeVisible();
    await expect(page.locator('.state-block', { hasText: 'permission' })).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('paginates and filters the runs table', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/runs');
  const rows = page.locator('.data-table tbody tr');
  await expect(rows).toHaveCount(25);
  await expect(page.locator('.table-pagination-summary')).toContainText('137');
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(rows.first()).toContainText('run_0026');
  await page.locator('.table-pagination-size select').selectOption('50');
  await expect(rows).toHaveCount(50);

  const statusRequest = page.waitForRequest((r) => r.url().includes('/runs') && r.url().includes('status=Failed'));
  await page.locator('.table-filter-row select').first().selectOption('Failed');
  await statusRequest;
});

test('row action menus are portaled and not clipped', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 700 });
  await login(page);
  await page.goto('/dashboard/agents');
  const triggers = page.locator('.action-menu-trigger');
  await expect(triggers.first()).toBeVisible();
  await triggers.last().scrollIntoViewIfNeeded();
  await triggers.last().click();
  const menu = page.locator('.action-menu-dropdown');
  await expect(menu).toBeVisible();
  const box = await menu.boundingBox();
  const vp = page.viewportSize();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(vp.height);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
  await expect(menu.getByText('Duplicate')).toBeVisible();
});

test('create, duplicate, and delete use custom modals', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/secrets');
  await page.getByRole('button', { name: 'Add secret' }).first().click();
  await expect(page.locator('.modal')).toBeVisible();
  await page.locator('.modal').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.locator('.modal')).toHaveCount(0);

  await page.locator('.action-menu-trigger').first().click();
  await page.locator('.action-menu-dropdown').getByText('Delete').click();
  await expect(page.locator('.modal')).toContainText('cannot be undone');
  await page.locator('.modal').getByRole('button', { name: 'Cancel' }).click();

  // Secrets cannot be duplicated because values are write-only; workspaces can.
  await page.locator('.action-menu-trigger').first().click();
  await expect(page.locator('.action-menu-dropdown').getByText('View JSON')).toBeVisible();
  await expect(page.locator('.action-menu-dropdown').getByText('Duplicate')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.goto('/dashboard/workspaces');
  await page.locator('.action-menu-trigger').first().click();
  await page.locator('.action-menu-dropdown').getByText('Duplicate').click();
  await expect(page.locator('.modal input').first()).toHaveValue(/-copy$/);
});

test('row click opens the record', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/workspaces');
  await page.locator('.data-table tbody tr').first().click();
  await expect(page.locator('.modal')).toBeVisible();
});

test('column picker hides and restores columns', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/agents');
  const headers = page.locator('.data-table thead th');
  await expect(page.locator('.data-table tbody tr').first()).toBeVisible();
  const before = await headers.count();
  await page.getByRole('button', { name: 'Select columns' }).click();
  const picker = page.locator('.column-picker');
  await expect(picker).toBeVisible();
  await picker.locator('.column-picker-item').filter({ hasNotText: 'Always shown' }).first().locator('input').uncheck();
  await expect(headers).toHaveCount(before - 1);
});

test('run detail streams the transcript', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/runs/run_0001');
  await expect(page.locator('.timeline-item').first()).toBeVisible();
  await expect(page.getByText('Hello from the fake harness.').first()).toBeVisible();
});

test('request inspector opens request details', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/requests');
  await page.locator('.data-table tbody tr').first().click();
  await expect(page.locator('.modal')).toContainText('Request details');
});

test('API Explorer executes an operation', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/explorer');
  const select = page.locator('.explorer-op-select');
  await expect(select).toBeVisible();
  const value = await select.locator('option', { hasText: 'Health check' }).getAttribute('value');
  await select.selectOption(value);
  await page.getByTestId('explorer-execute').click();
  await expect(page.locator('.explorer-panel').filter({ hasText: 'Healthy' }).first()).toBeVisible();
});

test('settings show restart badges and confirm restart', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/settings');
  await expect(page.getByText('Restart required').first()).toBeVisible();
  await page.getByRole('button', { name: 'Restart server' }).first().click();
  await expect(page.locator('.modal')).toBeVisible();
  await page.locator('.modal').getByRole('button', { name: 'Cancel' }).click();
});

test('theme and language toggles persist', async ({ page }) => {
  await login(page);
  await page.getByTestId('theme-toggle').click();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
  await page.locator('.topbar').getByLabel('Language').selectOption('de');
  await expect(page.locator('.page-header-title')).toContainText('Startseite');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await page.reload();
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('.page-header-title')).toContainText('Startseite');
  await page.locator('.topbar').getByLabel('Sprache').selectOption('zz');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('setup wizard opens for an empty tenant', async ({ page }) => {
  await page.route(/\/tenants\/[^/]+\/agents(\?|$)/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ objects: [], totalRecords: 0, skip: 0, maxResults: 1, endOfResults: true }) })
  );
  await login(page);
  await expect(page.locator('.wizard-steps')).toBeVisible();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('.wizard-steps li.active')).toContainText('Credential');
});

const SHOTS = [
  { name: 'home', path: '/dashboard/home' },
  { name: 'runs', path: '/dashboard/runs' },
  { name: 'run-detail', path: '/dashboard/runs/run_0001' },
  { name: 'deployments', path: '/dashboard/deployments' },
  { name: 'settings', path: '/dashboard/settings' }
];

for (const vp of VIEWPORTS) {
  for (const theme of ['light', 'dark']) {
    test(`screenshots ${vp.name} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.addInitScript((t) => localStorage.setItem('garrison_theme', t), theme);
      await page.goto('/');
      await page.screenshot({ path: `test-results/screenshots/${vp.width}-${theme}-login.png`, fullPage: true });
      await login(page);
      for (const shot of SHOTS) {
        await page.goto(shot.path);
        await expect(page.locator('.page-header-title').first()).toBeVisible();
        await page.waitForLoadState('networkidle');
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        expect(overflow, `${shot.name} horizontal overflow at ${vp.width}`).toBeLessThanOrEqual(1);
        await page.screenshot({ path: `test-results/screenshots/${vp.width}-${theme}-${shot.name}.png`, fullPage: true });
      }
    });
  }
}
