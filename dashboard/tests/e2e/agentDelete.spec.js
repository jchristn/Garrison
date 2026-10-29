// Deleting an agent against mocked APIs: from the Agents table's row menu and from the agent's page, the dialog names
// the deployments deleted with it and the Delete button works only after the person types "delete"; a refusal from the
// server (409 AgentInUse) stays in the dialog; the protected agent-architect keeps Edit and Delete in the menu and on
// its page, disabled, with the reason.

import { test, expect } from '@playwright/test';
import { installMocks, respond, ARCHITECT_AGENT } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
const row = (page, name) => page.locator('.data-table tbody tr', { has: page.locator('strong', { hasText: new RegExp(`^${name}$`) }) });

/** Add the protected agent-architect to the agent list and answer its reads. */
async function withArchitectAgent(page) {
  await page.route(/\/tenants\/[^/]+\/agents(\?.*)?$/, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    const base = respond('GET', new URL(route.request().url()));
    return route.fulfill(json(200, { ...base, objects: [...base.objects, ARCHITECT_AGENT], totalRecords: base.totalRecords + 1 }));
  });
  await page.route(/\/tenants\/[^/]+\/agents\/agt_arch$/, (route) => (route.request().method() === 'GET' ? route.fulfill(json(200, ARCHITECT_AGENT)) : route.fallback()));
}

/** Record DELETE requests for agents; `status` answers them (204 by default). */
async function recordDeletes(page, answer = () => ({ status: 204, body: '' })) {
  const deleted = [];
  await page.route(/\/tenants\/[^/]+\/agents\/[^/?]+$/, (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback();
    deleted.push(new URL(route.request().url()).pathname);
    const { status, body } = answer(deleted.length);
    return route.fulfill({ status, contentType: 'application/json', body: typeof body === 'string' ? body : JSON.stringify(body) });
  });
  return deleted;
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('deletes an agent from the table only after typing delete', async ({ page }) => {
  const deleted = await recordDeletes(page);
  await login(page);
  await page.goto('/dashboard/agents');
  await row(page, 'echo-agent').locator('.action-menu-trigger').click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  const modal = page.locator('.modal');
  await expect(modal).toContainText('and its 2 deployments');
  await expect(modal).toContainText("Please type 'delete' in the box below to confirm.");
  const confirm = page.getByTestId('confirm-button');
  await expect(confirm).toHaveAttribute('aria-disabled', 'true');
  await confirm.click({ force: true });
  expect(deleted).toEqual([]);
  await page.getByTestId('confirm-word').fill('Delete');
  await expect(confirm).toHaveAttribute('aria-disabled', 'true');
  await confirm.click({ force: true });
  expect(deleted).toEqual([]);
  await page.getByTestId('confirm-word').fill('delete');
  await expect(confirm).not.toHaveAttribute('aria-disabled', 'true');
  await confirm.click();
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(deleted).toEqual(['/v1.0/api/tenants/default/agents/agt_0001']);
});

test('the typed word starts empty each time the dialog opens, and Enter confirms', async ({ page }) => {
  const deleted = await recordDeletes(page);
  await login(page);
  await page.goto('/dashboard/agents');
  await row(page, 'echo-agent').locator('.action-menu-trigger').click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await page.getByTestId('confirm-word').fill('delete');
  await page.locator('.modal').getByRole('button', { name: 'Cancel' }).click();
  await row(page, 'echo-agent').locator('.action-menu-trigger').click();
  await page.getByRole('menuitem', { name: 'Delete' }).click();
  await expect(page.getByTestId('confirm-word')).toHaveValue('');
  await page.getByTestId('confirm-word').fill('delete');
  await page.getByTestId('confirm-word').press('Enter');
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(deleted).toHaveLength(1);
});

test('deletes an agent from its page and returns to the list', async ({ page }) => {
  const deleted = await recordDeletes(page);
  await login(page);
  await page.goto('/dashboard/agents/agt_0001');
  await page.getByTestId('agent-delete').click();
  const modal = page.locator('.modal');
  await expect(modal).toContainText('and its 2 deployments');
  await expect(page.getByTestId('delete-affected').locator('li')).toHaveCount(2);
  await page.getByTestId('confirm-word').fill('delete');
  await page.getByTestId('confirm-button').click();
  await expect(page).toHaveURL(/\/dashboard\/agents$/);
  await expect(page.locator('.toast, [role="status"]').filter({ hasText: 'Deleted agent' }).first()).toBeVisible();
  expect(deleted).toEqual(['/v1.0/api/tenants/default/agents/agt_0001']);
});

test('a refusal from the server stays in the dialog', async ({ page }) => {
  await recordDeletes(page, () => ({ status: 409, body: { error: 'Conflict', code: 'AgentInUse', message: 'Agent echo-agent is a member of app research. Remove it from that app first.' } }));
  await login(page);
  await page.goto('/dashboard/agents/agt_0001');
  await page.getByTestId('agent-delete').click();
  await page.getByTestId('confirm-word').fill('delete');
  await page.getByTestId('confirm-button').click();
  const modal = page.locator('.modal');
  await expect(modal.locator('.error-banner')).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/agents\/agt_0001$/);
});

test('the protected agent-architect keeps Edit and Delete visible but disabled, with the reason', async ({ page }) => {
  await withArchitectAgent(page);
  const deleted = await recordDeletes(page);
  await login(page);
  await page.goto('/dashboard/agents');
  await row(page, 'agent-architect').locator('.action-menu-trigger').click();
  const del = page.getByRole('menuitem', { name: 'Delete' });
  await expect(del).toHaveAttribute('aria-disabled', 'true');
  await expect(del).toHaveAttribute('data-tip', /protected built-in agent/);
  await expect(page.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute('aria-disabled', 'true');
  await del.click({ force: true });
  await expect(page.locator('.modal')).toHaveCount(0);

  await page.goto('/dashboard/agents/agt_arch');
  const button = page.getByTestId('agent-delete');
  await expect(button).toHaveAttribute('aria-disabled', 'true');
  await expect(button).toHaveAttribute('data-tip', /protected built-in agent/);
  await button.click({ force: true });
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(deleted).toEqual([]);
});
