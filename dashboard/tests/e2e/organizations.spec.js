// Organizations (AA7.14) against mocked APIs: the Organizations tab creates an organization and opens it, the chart
// gains a root unit and a unit below it through the unit editor, a second root is refused with a readable reason,
// publishing drafts a revision and makes it live, and the chart and unit editor pass an automated accessibility scan and
// lay out without horizontal page scroll at desktop and phone widths in both themes. No native dialog is ever used.

import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { installMocks, organizationStore } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

/** Route every organization call to a stateful store, so what the test creates is what the pages read back. */
async function useStore(page) {
  const store = organizationStore();
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/organizations/, (route) => {
    const req = route.request();
    const answer = store.handle(req.method(), new URL(req.url()), req.postDataJSON?.() ?? null);
    if (!answer) return route.fallback();
    if (answer.status === 204) return route.fulfill({ status: 204, body: '' });
    return route.fulfill({ status: answer.status, contentType: 'application/json', body: JSON.stringify(answer.body) });
  });
  return store;
}

const cards = (page) => page.getByTestId('org-unit');

async function addUnit(page, open, { name, lead, title, day }) {
  await open();
  const modal = page.locator('.modal');
  await modal.locator('#org-unit-name').fill(name);
  if (lead) await modal.locator('#org-unit-leadAgentId').selectOption(lead);
  if (title) await modal.locator('#org-unit-leadTitle').fill(title);
  if (day) await modal.locator('#org-unit-budgetDay').fill(String(day));
  await modal.getByTestId('org-unit-save').click();
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('creates an organization with two units and publishes it', async ({ page }) => {
  const store = await useStore(page);
  await login(page);
  await page.goto('/dashboard/autonomy?tab=organizations');
  await page.getByTestId('add-button').click();
  const form = page.locator('.modal');
  await form.locator('#organizations-name').fill('Refund operations');
  await form.locator('#organizations-mission').fill('Pay every valid refund within a day.');
  await form.getByTestId('save-button').click();

  // The new organization opens as a Draft with nothing live.
  await expect(page).toHaveURL(/\/dashboard\/organizations\/org_\d+$/);
  await expect(page.getByTestId('org-summary')).toContainText('Draft');
  await expect(page.getByTestId('org-mission')).toContainText('Pay every valid refund within a day.');

  await addUnit(page, () => page.getByTestId('org-add-unit').click(), { name: 'Leadership', lead: 'agt_0001', title: 'Chief executive', day: 50 });
  await expect(page.locator('.modal')).toHaveCount(0);
  await expect(cards(page)).toHaveCount(1);

  // A second unit without a parent is refused, and the reason stays in the editor.
  await page.getByTestId('org-add-unit').click();
  await page.locator('.modal #org-unit-parentUnitId').selectOption('');
  await page.locator('.modal #org-unit-name').fill('Rogue');
  await page.locator('.modal').getByTestId('org-unit-save').click();
  await expect(page.getByTestId('org-unit-error')).toContainText('An organization has exactly one root unit');
  await page.locator('.modal').getByRole('button', { name: 'Cancel' }).click();

  await addUnit(page, () => page.locator('[data-unit="Leadership"]').getByTestId('org-unit-add-child').click(), { name: 'Billing', lead: 'agt_0002', title: 'Head of billing', day: 20 });
  await expect(cards(page)).toHaveCount(2);
  await expect(cards(page).nth(1)).toContainText('agent-2');
  await expect(cards(page).nth(1)).toContainText('Head of billing');
  expect(store.orgs[0].units.map((u) => [u.name, u.parentUnitId ? 'child' : 'root'])).toEqual([
    ['Leadership', 'root'],
    ['Billing', 'child']
  ]);
  await expect(page.getByTestId('org-pending')).toContainText('Nothing is live yet');

  await page.getByTestId('org-publish').click();
  await page.getByTestId('org-publish-note').fill('First chart');
  await page.getByTestId('org-publish-submit').click();
  await expect(page.locator('.toast').filter({ hasText: 'Revision 1 is live.' })).toBeVisible();
  await expect(page.getByTestId('org-summary')).toContainText('Active');
  await expect(page.getByTestId('org-pending')).toHaveCount(0);
  expect(store.orgs[0]).toMatchObject({ status: 'Active', currentRevisionNumber: 1 });
  expect(store.orgs[0].revisions[0]).toMatchObject({ number: 1, state: 'Published', note: 'First chart' });

  // The live view shows the published tree, and the revision is listed as live.
  await page.getByTestId('org-view-live').click();
  await expect(cards(page)).toHaveCount(2);
  await page.getByRole('tab', { name: 'Revisions (1)' }).click();
  await expect(page.getByTestId('org-revisions-table').locator('tbody tr')).toHaveCount(1);
  await expect(page.getByTestId('org-revisions-table')).toContainText('First chart');
});

test('passes an accessibility scan and lays out the chart and unit editor at desktop and phone widths', async ({ page }, testInfo) => {
  await login(page);
  const scan = async (label) => {
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))));
    await page.addScriptTag({ content: axe.source });
    const result = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    expect(result.violations.map((v) => `${label}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  };
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const theme = (value) => page.evaluate((v) => document.documentElement.setAttribute('data-theme', v), value);
  for (const mode of ['light', 'dark']) {
    for (const [name, width, height] of [['desktop', 1280, 900], ['phone', 390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard/organizations/org_0001');
      await expect(cards(page)).toHaveCount(3);
      await theme(mode);
      await scan(`${mode} ${name} chart`);
      expect(await overflow(), `${mode} ${name} chart`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: testInfo.outputPath(`organization-chart-${mode}-${name}.png`), fullPage: true });

      await page.locator('[data-unit="Billing"]').getByTestId('org-unit-edit').click();
      await expect(page.getByTestId('org-unit-form')).toBeVisible();
      await scan(`${mode} ${name} unit editor`);
      expect(await overflow(), `${mode} ${name} unit editor`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: testInfo.outputPath(`organization-unit-${mode}-${name}.png`) });
      await page.locator('.modal').getByRole('button', { name: 'Cancel' }).click();

      await page.getByRole('tab', { name: 'Budgets and spend' }).click();
      await expect(page.getByTestId('org-budgets-table')).toBeVisible();
      expect(await overflow(), `${mode} ${name} budgets`).toBeLessThanOrEqual(1);
      await page.getByRole('tab', { name: 'Revisions (3)' }).click();
      await page.getByTestId('org-revision-diff-1').click();
      await expect(page.getByTestId('org-diff')).toBeVisible();
      if (name === 'desktop') await scan(`${mode} revision diff`);
      expect(await overflow(), `${mode} ${name} diff`).toBeLessThanOrEqual(1);
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/dashboard/autonomy?tab=organizations');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(3);
  await scan('list');
});
