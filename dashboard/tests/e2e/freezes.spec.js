// Brakes (AA3.8) against mocked APIs: freezing a keeper from its page shows the frozen banner and Lift brings it back,
// the Freezes tab opens on the active freezes and lifts one after confirming, the Deployments list names its frozen
// deployment, and the kill switch turns on from Settings after confirming. No native dialog is ever used.

import { test, expect } from '@playwright/test';
import { installMocks, freeze, killSwitch } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const rows = (page) => page.locator('.data-table tbody tr');
const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

/** Serve freezes and the kill switch from local state, so freezing, lifting, and the switch change what pages show. */
async function statefulBrakes(page) {
  const freezes = [1, 2, 3, 4].map(freeze);
  let killOn = false;
  let next = 50;
  await page.route(/\/tenants\/default\/freezes(\?.*)?$/, (route) => {
    const req = route.request();
    if (req.method() === 'POST') {
      const body = req.postDataJSON();
      const created = { id: `mfz_00${next++}`, tenantId: 'default', targetKind: body.targetKind, targetId: body.targetId, targetName: body.targetId === 'mdt_0001' ? 'support-queue' : body.targetId, reason: body.reason || undefined, cancelActiveRuns: !!body.cancelActiveRuns, cancelledRunCount: 0, createdById: 'usr_0001', createdByName: 'admin@garrison', active: true, createdUtc: new Date().toISOString(), lastUpdateUtc: new Date().toISOString() };
      freezes.unshift(created);
      return json(route, created, 201);
    }
    const url = new URL(req.url());
    let list = freezes;
    const active = url.searchParams.get('active');
    if (active) list = list.filter((f) => String(f.active) === active);
    const kind = url.searchParams.get('targetKind');
    if (kind) list = list.filter((f) => f.targetKind === kind);
    return json(route, { success: true, maxResults: 1000, skip: 0, totalRecords: list.length, recordsRemaining: 0, endOfResults: true, objects: list });
  });
  await page.route(/\/tenants\/default\/freezes\/mfz_\d+\/lift$/, (route) => {
    const id = new URL(route.request().url()).pathname.match(/freezes\/(mfz_\d+)/)[1];
    const found = freezes.find((f) => f.id === id);
    Object.assign(found, { active: false, liftedById: 'usr_0001', liftedByName: 'admin@garrison', liftedUtc: new Date().toISOString(), liftReason: route.request().postDataJSON()?.reason || undefined });
    return json(route, found);
  });
  await page.route(/\/tenants\/default\/autonomy\/kill-switch$/, (route) => {
    if (route.request().method() === 'PUT') killOn = !!route.request().postDataJSON().enabled;
    return json(route, killSwitch(killOn));
  });
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('freezes a keeper from its page, sees the banner, and lifts it', async ({ page }) => {
  await statefulBrakes(page);
  await login(page);
  await page.goto('/dashboard/keepers/mdt_0001');
  await expect(page.getByTestId('keeper-detail')).toBeVisible();
  await expect(page.getByTestId('frozen-banner')).toHaveCount(0);
  await page.getByTestId('freeze-apply').click();
  const modal = page.locator('.modal');
  await expect(modal).toContainText('Freeze Keeper support-queue?');
  await modal.getByTestId('freeze-reason').fill('Runaway spend on the support queue.');
  await modal.getByTestId('confirm-button').click();
  await expect(page.locator('.toast').filter({ hasText: 'Keeper support-queue is frozen.' })).toBeVisible();
  const banner = page.getByTestId('frozen-banner');
  await expect(banner).toHaveCount(1);
  await expect(banner).toContainText('Frozen: new runs are refused until the freeze is lifted.');
  await expect(banner).toContainText('Reason: Runaway spend on the support queue.');
  await expect(page.getByTestId('freeze-apply')).toHaveCount(0);
  await banner.getByTestId('frozen-banner-lift').click();
  await expect(modal).toContainText('The keeper becomes active again');
  await modal.getByTestId('confirm-button').click();
  await expect(page.locator('.toast').filter({ hasText: 'The freeze on Keeper support-queue is lifted.' })).toBeVisible();
  await expect(page.getByTestId('frozen-banner')).toHaveCount(0);
  await expect(page.getByTestId('freeze-apply')).toBeVisible();
});

test('the Freezes tab opens on the active freezes and lifts one after confirming', async ({ page }) => {
  await statefulBrakes(page);
  await login(page);
  await page.goto('/dashboard/autonomy?tab=freezes');
  await expect(rows(page)).toHaveCount(2);
  await expect(rows(page).filter({ hasText: 'deployment-3' })).toContainText('Active');
  await page.locator('select[aria-label="Status"]').selectOption('');
  await expect(rows(page)).toHaveCount(4);
  await expect(rows(page).filter({ hasText: 'The autonomy kill switch' })).toContainText('Lifted');
  await page.locator('select[aria-label="Status"]').selectOption('true');
  await rows(page).filter({ hasText: 'support' }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Lift freeze' }).click();
  const modal = page.locator('.modal');
  await expect(modal).toContainText('Lift the freeze on App support?');
  await modal.getByTestId('lift-reason').fill('Legal approved the greeting.');
  await modal.getByTestId('confirm-button').click();
  await expect(rows(page)).toHaveCount(1);
});

test('the Deployments list names its frozen deployment and offers Lift in the row menu', async ({ page }) => {
  await statefulBrakes(page);
  await login(page);
  await page.goto('/dashboard/agents?tab=deployments');
  await expect(page.getByTestId('frozen-list-banner')).toContainText('Deployment deployment-3 is frozen');
  await rows(page).filter({ hasText: 'deployment-3' }).first().locator('.action-menu-trigger').click();
  await expect(page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Lift freeze' })).toBeVisible();
});

test('turns the kill switch on from Settings after confirming, and Home shows it', async ({ page }) => {
  await statefulBrakes(page);
  await login(page);
  await page.goto('/dashboard/settings');
  const control = page.getByTestId('kill-switch');
  await expect(control).toHaveAttribute('data-enabled', 'false');
  await control.getByTestId('kill-switch-toggle').click();
  const modal = page.locator('.modal');
  await expect(modal).toContainText('Every keeper in this tenant stops waking');
  await modal.getByTestId('kill-switch-reason').fill('Incident drill.');
  await modal.getByTestId('confirm-button').click();
  await expect(control).toHaveAttribute('data-enabled', 'true');
  await expect(control).toContainText('Turned on by admin@garrison');
  await page.goto('/dashboard/home');
  await expect(page.getByTestId('home-autonomy').getByTestId('kill-switch')).toHaveAttribute('data-enabled', 'true');
});
