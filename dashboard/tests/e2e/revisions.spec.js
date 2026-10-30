// Agent revisions, environments, and promotions (AD1.9) against mocked APIs: the draft notice and Revisions tab on the
// agent page, the diff between two revisions, publishing a draft (and a refused publish), the Environment and pinned
// revision columns with the environment filter, the revision pin and environment in the deployment form, promoting
// (next environment, skipping with allowSkip, and a refused promotion), and rolling a promotion back.

import { test, expect } from '@playwright/test';
import { installMocks, agentRevision, promotionRecord, revisionId } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('agent page shows the draft notice, lists revisions, and diffs latest published against the draft', async ({ page }) => {
  const diffs = [];
  await page.route(/\/agents\/agt_0001\/revisions\/diff/, (route) => {
    const url = new URL(route.request().url());
    diffs.push(`${url.searchParams.get('from')}..${url.searchParams.get('to')}`);
    return route.fallback();
  });
  await login(page);
  await page.goto('/dashboard/agents/agt_0001');
  await expect(page.getByTestId('agent-draft-notice')).toContainText('draft changes that are not published');
  // The deployments tab shows each deployment's environment and revision pin.
  await expect(page.locator('[data-deployment="deployment-1"] [data-cell="revision"]')).toContainText('Latest');
  await expect(page.locator('[data-deployment="deployment-2"] [data-cell="revision"]')).toContainText('Revision 1');

  await page.getByTestId('agent-review-draft').click();
  const rows = page.locator('[data-testid="agent-revisions"] tbody tr');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toHaveAttribute('data-state', 'Draft');
  await expect(rows.nth(0)).toContainText('Draft');
  await expect(rows.nth(1)).toContainText('Latest');
  await expect(rows.nth(1)).toContainText('Stricter reply format');
  await expect(rows.nth(0).getByTestId('revision-publish')).toBeVisible();
  await expect(rows.nth(1).getByTestId('revision-publish')).toHaveCount(0);

  // Default comparison: latest published (2) against the draft (3).
  const diff = page.getByTestId('revision-diff');
  await expect(diff).toBeVisible();
  expect(diffs[0]).toBe(`${revisionId('agt_0001', 2)}..${revisionId('agt_0001', 3)}`);
  await expect(diff.locator('[data-field="description"]')).toContainText('Sample agent that also summarizes');
  await expect(diff.locator('[data-field="description"]')).toContainText('Changed');
  await expect(diff.locator('[data-field="promptPins[System]"]')).toContainText('Added');
  // Multi-line values render as a line diff.
  await expect(diff.locator('[data-field="outputSchema"] .diff-line.diff-add', { hasText: 'required' })).toHaveCount(1);

  // Pick another pair: revision 1 against revision 2.
  await page.getByTestId('revision-diff-from').selectOption(revisionId('agt_0001', 1));
  await page.getByTestId('revision-diff-to').selectOption(revisionId('agt_0001', 2));
  await expect.poll(() => diffs[diffs.length - 1]).toBe(`${revisionId('agt_0001', 1)}..${revisionId('agt_0001', 2)}`);
  await expect(diff.locator('[data-field="tags"]')).toContainText('sample, strict');
  // The same revision on both sides asks for two different ones.
  await page.getByTestId('revision-diff-to').selectOption(revisionId('agt_0001', 1));
  await expect(page.getByTestId('revision-compare-panel')).toContainText('Select two different revisions');
});

test('publishes the draft with a change note', async ({ page }) => {
  let body = null;
  await page.route(/\/agents\/agt_0001\/revisions\/arv_0001_3\/publish$/, (route) => {
    body = route.request().postDataJSON();
    return route.fulfill(json(200, { ...agentRevision('agt_0001', 3), state: 'Published', changeNote: body.changeNote, publishedUtc: new Date().toISOString() }));
  });
  await login(page);
  await page.goto('/dashboard/agents/agt_0001');
  await page.getByRole('tab', { name: 'Revisions' }).click();
  await page.locator('[data-revision="3"]').getByTestId('revision-publish').click();
  const modal = page.locator('.modal');
  await expect(modal).toContainText('Publish revision 3');
  await modal.getByTestId('revision-change-note').fill('Adds a summary');
  await modal.getByTestId('revision-publish-submit').click();
  await expect.poll(() => body).toEqual({ changeNote: 'Adds a summary' });
  await expect(page.locator('.toast-success')).toContainText('Published revision 3.');
  await expect(page.locator('.modal')).toHaveCount(0);
});

test('keeps the publish dialog open with a readable message when the draft is unchanged', async ({ page }) => {
  await page.route(/\/revisions\/arv_0001_3\/publish$/, (route) =>
    route.fulfill(json(409, { error: 'Conflict', code: 'RevisionUnchanged', message: 'Draft revision 3 of agent echo-agent is the same as published revision 2.' }))
  );
  await login(page);
  await page.goto('/dashboard/agents/agt_0001');
  await page.getByRole('tab', { name: 'Revisions' }).click();
  await page.locator('[data-revision="3"]').getByTestId('revision-publish').click();
  await page.getByTestId('revision-publish-submit').click();
  await expect(page.locator('.modal')).toContainText('The draft is the same as the latest published revision');
});

test('discards the draft after confirmation', async ({ page }) => {
  let deleted = null;
  await page.route(/\/agents\/agt_0001\/revisions\/arv_0001_3$/, (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback();
    deleted = route.request().url();
    return route.fulfill({ status: 204, body: '' });
  });
  await login(page);
  await page.goto('/dashboard/agents/agt_0001');
  await page.getByRole('tab', { name: 'Revisions' }).click();
  await page.locator('[data-revision="3"]').getByTestId('revision-discard').click();
  await page.locator('.modal').getByRole('button', { name: 'Discard draft' }).click();
  await expect.poll(() => deleted).toContain('/revisions/arv_0001_3');
  await expect(page.locator('.toast-success')).toContainText('The draft was discarded.');
});

test('deployments list shows environments and revision pins and filters by environment', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/agents?tab=deployments');
  const row2 = page.locator('.data-table tbody tr', { hasText: 'deployment-2' });
  await expect(row2).toContainText('staging');
  await expect(row2).toContainText('Revision 1');
  await expect(page.locator('.data-table tbody tr', { hasText: 'deployment-1' })).toContainText('Latest');
  const total = await page.locator('.data-table tbody tr').count();
  expect(total).toBeGreaterThan(2);
  await page.locator('select[aria-label="Environment"]').selectOption('staging');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.data-table tbody tr')).toContainText('deployment-2');
  await page.locator('select[aria-label="Environment"]').selectOption('prod');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.data-table tbody tr')).toContainText('deployment-3');
});

test('edits a deployment environment and revision pin', async ({ page }) => {
  let body = null;
  await page.route(/\/tenants\/default\/deployments\/dep_0002$/, (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill(json(200, { ...body, id: 'dep_0002' }));
  });
  await login(page);
  await page.goto('/dashboard/agents?tab=deployments');
  await page.locator('.data-table tbody tr', { hasText: 'deployment-2' }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: /^Edit$/ }).click();
  const modal = page.locator('.modal');
  await expect(modal.locator('#deployments-environment')).toHaveValue('staging');
  const pin = modal.locator('#deployments-agentRevisionId');
  await expect(pin).toHaveValue(revisionId('agt_0001', 1));
  await expect(pin.locator('option')).toHaveText(['Follow latest published', 'Revision 2', 'Revision 1']);
  await modal.locator('#deployments-environment').selectOption('prod');
  await pin.selectOption('');
  await page.getByTestId('save-button').click();
  await expect.poll(() => body).not.toBeNull();
  expect(body).toMatchObject({ environment: 'prod', agentRevisionId: null });
});

test('promotes to the next environment from the deployments page', async ({ page }) => {
  let body = null;
  await page.route(/\/tenants\/default\/promotions$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill(json(201, { ...promotionRecord(1), id: 'pro_0099' }));
  });
  await login(page);
  await page.goto('/dashboard/agents?tab=deployments');
  await page.getByTestId('promote-button').click();
  const modal = page.locator('.modal');
  await modal.locator('#promote-agent').selectOption('agt_0001');
  await modal.locator('#promote-source').selectOption('dev');
  // The target defaults to the next environment.
  await expect(modal.locator('#promote-target option').first()).toHaveText('Next environment (staging)');
  await expect(modal.locator('#promote-allow-skip')).toHaveCount(0);
  await modal.locator('#promote-note').fill('Ship it');
  await modal.getByTestId('promote-submit').click();
  await expect.poll(() => body).toEqual({ agentId: 'agt_0001', sourceEnvironment: 'dev', targetEnvironment: 'staging', note: 'Ship it' });
  await expect(page.locator('.toast-success')).toContainText('Promoted to staging. Deployments updated: 1.');
});

test('promoting past the next environment needs Allow skipping, and a refusal reads clearly', async ({ page }) => {
  const bodies = [];
  await page.route(/\/tenants\/default\/promotions$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    bodies.push(route.request().postDataJSON());
    return route.fulfill(json(409, { error: 'Conflict', code: 'PromotionOrderViolation', message: 'Promotion goes from dev to the next environment, staging, not prod. Set allowSkip to promote out of order.' }));
  });
  await login(page);
  await page.goto('/dashboard/agents?tab=deployments');
  // Promote from a deployment row: agent and source come from the row.
  await page.locator('.data-table tbody tr', { hasText: 'deployment-1' }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: /^Promote$/ }).click();
  const modal = page.locator('.modal');
  await expect(modal.locator('#promote-agent')).toHaveValue('agt_0001');
  await expect(modal.locator('#promote-source')).toHaveValue('dev');
  await modal.locator('#promote-target').selectOption('prod');
  await expect(modal).toContainText('prod is not the environment right after dev.');
  await modal.getByTestId('promote-submit').click();
  await expect(modal.locator('.field-error')).toContainText('Turn on Allow skipping environments');
  expect(bodies).toEqual([]);
  await modal.locator('#promote-allow-skip').check();
  await modal.getByTestId('promote-submit').click();
  await expect.poll(() => bodies.length).toBe(1);
  expect(bodies[0]).toEqual({ agentId: 'agt_0001', sourceEnvironment: 'dev', targetEnvironment: 'prod', allowSkip: true });
  await expect(modal.getByTestId('promote-error')).toContainText('The target is not the next environment after the source.');
});

test('rolls back a promotion from the promotion history', async ({ page }) => {
  let rollback = null;
  await page.route(/\/promotions\/pro_0001\/rollback$/, (route) => {
    rollback = { url: route.request().url(), body: route.request().postDataJSON() };
    return route.fulfill(json(201, { ...promotionRecord(2), id: 'pro_0098', rollbackOfId: 'pro_0001' }));
  });
  await login(page);
  await page.goto('/dashboard/agents?tab=deployments');
  await page.getByTestId('promotion-history').click();
  const modal = page.locator('.modal');
  const rows = modal.locator('[data-testid="promotions-table"] tbody tr');
  await expect(rows).toHaveCount(3);
  await expect(rows.nth(0)).toContainText('dev to staging');
  await expect(rows.nth(0)).toContainText('deployment-2');
  await expect(rows.nth(0)).toContainText('(Revision 1 to Revision 2)');
  await expect(rows.nth(1)).toContainText('Rollback');
  await expect(rows.nth(2)).toContainText('Rolled back');
  // Only the applied promotion can be rolled back.
  await expect(modal.getByTestId('promotion-rollback')).toHaveCount(1);
  await rows.nth(0).getByTestId('promotion-rollback').click();
  await page.getByTestId('promotion-rollback-note').fill('Staging broke');
  await page.locator('.modal').last().getByRole('button', { name: 'Roll back' }).click();
  await expect.poll(() => rollback).not.toBeNull();
  expect(rollback.body).toEqual({ note: 'Staging broke' });
  await expect(page.locator('.toast-success')).toContainText('Rolled back. The previous revision pins are restored.');
});

test('a refused rollback shows the translated reason', async ({ page }) => {
  await page.route(/\/promotions\/pro_0001\/rollback$/, (route) =>
    route.fulfill(json(409, { error: 'Conflict', code: 'AlreadyRolledBack', message: 'Promotion pro_0001 was already rolled back by pro_0042.' }))
  );
  await login(page);
  await page.goto('/dashboard/agents?tab=deployments');
  await page.locator('.data-table tbody tr', { hasText: 'deployment-1' }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Promotion history' }).click();
  const modal = page.locator('.modal');
  await expect(modal.getByTestId('promotions-agent')).toHaveValue('agt_0001');
  await modal.getByTestId('promotion-rollback').click();
  await page.locator('.modal').last().getByRole('button', { name: 'Roll back' }).click();
  await expect(page.getByTestId('promotions-error')).toContainText('This promotion was already rolled back.');
});
