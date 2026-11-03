import { test, expect } from '@playwright/test';
import { installMocks, studioDraft, PRINCIPAL } from './mocks.js';

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

async function installDrafts(page, rejectId = '') {
  const drafts = [1, 2, 3, 4].map(studioDraft);
  const deleted = [];
  await page.route(/\/studio\/drafts(?:\/drf_\d+)?(?:\?.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    if (route.request().method() === 'DELETE') {
      const id = url.pathname.split('/').pop();
      deleted.push(id);
      if (id === rejectId) {
        rejectId = '';
        return route.fulfill(json(409, { code: 'Conflict', message: 'An approval is changing. Refresh and try again.' }));
      }
      drafts.splice(drafts.findIndex((draft) => draft.id === id), 1);
      return route.fulfill({ status: 204 });
    }
    if (route.request().method() !== 'GET') return route.fallback();
    const shown = drafts.filter((draft) => !url.searchParams.get('mine') || draft.ownerUserId === 'usr_admin');
    return route.fulfill(json(200, { objects: shown, totalRecords: shown.length, skip: 0, maxResults: 1000, endOfResults: true }));
  });
  return deleted;
}

async function openStudio(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
  await page.goto('/dashboard/agents?tab=studio');
  await expect(page.getByTestId('studio-drafts')).toBeVisible();
}

test.beforeEach(async ({ page }) => { await installMocks(page); });

test('selects drafts, clears filtered selections, and confirms deleting all selected statuses', async ({ page }, testInfo) => {
  const deleted = await installDrafts(page);
  await openStudio(page);
  const button = page.getByTestId('studio-delete-multiple');
  const first = page.locator('[data-draft="drf_0001"] input[type="checkbox"]');
  await expect(button).toHaveCount(0);
  await first.check();
  await expect(button).toHaveText('Delete Multiple');
  await expect(page.getByRole('checkbox', { name: 'Select all rows on this page' })).toHaveJSProperty('indeterminate', true);
  await first.uncheck();
  await expect(button).toHaveCount(0);
  await first.check();
  await page.getByTestId('studio-status-Applied').check();
  await expect(button).toHaveCount(0);
  await page.getByTestId('studio-status-Applied').uncheck();
  await page.getByTestId('studio-scope-all').click();
  await expect(page.locator('[data-testid="studio-drafts"] tbody tr')).toHaveCount(4);
  await page.getByRole('checkbox', { name: 'Select all rows on this page' }).check();
  await page.screenshot({ path: testInfo.outputPath('studio-drafts-selected.png') });
  await button.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('4 selected drafts');
  await expect(dialog).toContainText('Pending apply approvals will be cancelled');
  await expect(dialog).toContainText('Research app');
  await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
  expect(deleted).toHaveLength(0);
  await button.click();
  await page.getByTestId('confirm-button').click();
  await expect(button).toHaveCount(0);
  await expect(page.getByTestId('studio-drafts')).toHaveCount(0);
  expect(deleted.sort()).toEqual(['drf_0001', 'drf_0002', 'drf_0003', 'drf_0004']);
});

test('keeps only failed drafts selected with their reasons and retries them', async ({ page }) => {
  const deleted = await installDrafts(page, 'drf_0001');
  await openStudio(page);
  await page.getByRole('checkbox', { name: 'Select all rows on this page' }).check();
  await page.getByTestId('studio-delete-multiple').click();
  await page.getByTestId('confirm-button').click();
  await expect(page.locator('[data-testid="studio-drafts"] tbody tr')).toHaveCount(1);
  await expect(page.locator('[data-draft="drf_0001"] input')).toBeChecked();
  await expect(page.locator('.error-banner')).toContainText('Research app: An approval is changing. Refresh and try again.');
  expect(deleted).toEqual(['drf_0001', 'drf_0003', 'drf_0004']);
  await page.getByTestId('studio-delete-multiple').click();
  await page.getByTestId('confirm-button').click();
  await expect(page.getByTestId('studio-delete-multiple')).toHaveCount(0);
  await expect(page.locator('.error-banner')).toHaveCount(0);
  expect(deleted).toEqual(['drf_0001', 'drf_0003', 'drf_0004', 'drf_0001']);
});

test('draft selection is disabled without Delete permission', async ({ page }) => {
  const deleted = await installDrafts(page);
  await page.route(/\/v1\.0\/token\/details$/, (route) => route.fulfill(json(200, { ...PRINCIPAL, isAdmin: false, isTenantAdmin: false })));
  await page.route(/\/users\/usr_admin\/permissions$/, (route) => route.fulfill(json(200, {
    principalType: 'User', principalId: 'usr_admin', tenantId: 'default', isAdmin: false, isTenantAdmin: false,
    grants: [{ permissionType: 'Permit', resourceTypes: ['StudioDraft'], operations: ['Read'], scope: 'Tenant', inheritsToChildren: true }], hasPermission: []
  })));
  await openStudio(page);
  await expect(page.getByRole('checkbox', { name: 'Select all rows on this page' })).toBeDisabled();
  await expect(page.locator('[data-draft="drf_0001"] input')).toBeDisabled();
  await expect(page.getByTestId('studio-delete-multiple')).toHaveCount(0);
  expect(deleted).toHaveLength(0);
});
