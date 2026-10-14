// Pipelines (P12.9) against mocked APIs: the tabs under Agents, Runs, and Approvals (no new sidebar item), the
// combined approvals badge, the pipeline form with its ordered stage editor, Start, the pipeline run page with its
// stage timeline and review panel, and the stage review decide dialog with its 409 errors.

import { test, expect } from '@playwright/test';
import { installMocks, pipelineRun, pipelineReview } from './mocks.js';
import { HUBS } from '../../src/config/navConfig.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('pipelines live in tabs and the approvals badge counts stage reviews too', async ({ page }) => {
  await login(page);
  await expect(page.locator('.sidebar-item')).toHaveCount(HUBS.length);
  await expect(page.locator('.sidebar-item[data-nav="approvals"] [data-testid="approvals-badge"]')).toHaveText('3');

  await page.goto('/dashboard/agents?tab=pipelines');
  await expect(page.locator('.data-table tbody tr', { hasText: 'triage-and-fix' })).toContainText('3 stages');
  await page.goto('/dashboard/runs?tab=pipeline-runs');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(4);
  await page.locator('select[aria-label="Status"]').selectOption('Failed');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
  await page.goto('/dashboard/approvals?tab=pipeline-reviews');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.data-table tbody tr').first()).toContainText('fix');

  await page.goto('/dashboard/pipelines');
  await expect(page).toHaveURL(/\/dashboard\/agents\?tab=pipelines$/);
});

test('creates a pipeline with ordered stages, a deployment of the stage agent, and a review gate', async ({ page }) => {
  let body = null;
  await page.route(/\/tenants\/default\/pipelines$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ...body, id: 'ppl_0099', version: 1, stages: [] }) });
  });
  await login(page);
  await page.goto('/dashboard/agents?tab=pipelines');
  await page.getByTestId('add-button').click();
  const modal = page.locator('.modal');
  await modal.locator('#pipelines-name').fill('review-flow');
  await modal.locator('#pipelines-stage-0-name').fill('draft');
  await modal.locator('#pipelines-stage-0-agentId').selectOption('agt_0001');
  // Only the deployments of the chosen agent are offered.
  const deploymentValues = await modal.locator('#pipelines-stage-0-deploymentId option').evaluateAll((os) => os.map((o) => o.value));
  expect(deploymentValues[0]).toBe('');
  await modal.locator('#pipelines-stage-0-deploymentId').selectOption('dep_0001');
  await modal.getByTestId('pipeline-add-stage').click();
  await modal.locator('#pipelines-stage-1-name').fill('check');
  await modal.locator('#pipelines-stage-1-agentId').selectOption('agt_0002');
  await modal.locator('#pipelines-stage-1-requiresReview').check();
  await modal.locator('#pipelines-stage-1-maxRevisions').fill('1');
  await modal.getByTestId('stage-2-up').click();
  await expect(modal.locator('#pipelines-stage-0-name')).toHaveValue('check');
  await page.getByTestId('save-button').click();
  await expect.poll(() => body).not.toBeNull();
  expect(body.name).toBe('review-flow');
  expect(body.stages.map((s) => [s.position, s.name, s.agentId, s.deploymentId, s.requiresReview, s.maxRevisions])).toEqual([
    [1, 'check', 'agt_0002', null, true, 1],
    [2, 'draft', 'agt_0001', 'dep_0001', false, 3]
  ]);
});

test('shows server validation errors on the stage they belong to', async ({ page }) => {
  await page.route(/\/tenants\/default\/pipelines\/ppl_0001$/, (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    return route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'ValidationFailed', message: 'The pipeline is invalid.', fields: { 'stages[1].handoffTemplateId': 'Prompt template x is a System template; a pipeline stage handoff template must be a Task template.' } })
    });
  });
  await login(page);
  await page.goto('/dashboard/agents?tab=pipelines');
  await page.locator('.data-table tbody tr', { hasText: 'triage-and-fix' }).click();
  await expect(page.getByTestId('pipeline-version-notice')).toContainText('Version 3');
  await page.getByTestId('save-button').click();
  await expect(page.locator('.pipeline-stage[data-stage="2"]')).toContainText('must be a Task template');
  await expect(page.getByTestId('pipeline-stages')).toContainText('Item 2:');
});

test('starts a pipeline with an Idempotency-Key and opens the pipeline run', async ({ page }) => {
  let key = null;
  await page.route(/\/pipelines\/ppl_0001\/start/, (route) => {
    key = route.request().headers()['idempotency-key'];
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ ...pipelineRun(4), id: 'plr_0004' }) });
  });
  await login(page);
  await page.goto('/dashboard/agents?tab=pipelines');
  await page.locator('.data-table tbody tr', { hasText: 'triage-and-fix' }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Start' }).click();
  await page.getByTestId('pipeline-start-input').fill('Fix issue 42');
  await page.getByTestId('pipeline-start-submit').click();
  await expect(page).toHaveURL(/\/dashboard\/pipeline-runs\/plr_0004$/);
  expect(key).toMatch(/^dash-/);
  await expect(page.getByTestId('pipeline-timeline')).toBeVisible();
});

test('the pipeline run page shows the timeline and decides the pending review', async ({ page }) => {
  let body = null;
  await page.route(/\/pipeline-reviews\/prv_0001\/decide$/, (route) => {
    body = route.request().postDataJSON();
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...pipelineReview(1), status: 'Approved', decision: 'Approve' }) });
  });
  await login(page);
  await page.goto('/dashboard/pipeline-runs/plr_0001');
  await expect(page.locator('.pipeline-timeline-stage')).toHaveCount(3);
  await expect(page.locator('.pipeline-timeline-stage[data-stage="2"]')).toHaveAttribute('data-status', 'AwaitingReview');
  await expect(page.locator('.sidebar-item[data-nav="runs"]')).toHaveClass(/active/);
  await page.getByTestId('stage-run-run_0011').click();
  await expect(page).toHaveURL(/\/dashboard\/runs\/run_0011$/);
  await page.goBack();
  await page.getByTestId('pipeline-review-approve').click();
  await page.getByTestId('review-decide-comment').fill('Mention Safari 18');
  await page.getByTestId('review-decide-submit').click();
  await expect.poll(() => body).toEqual({ decision: 'Approve', comment: 'Mention Safari 18' });
  await expect(page.locator('.toast-success')).toContainText('Approved stage fix of triage-and-fix.');
});

test('a 409 RevisionLimitReached stays in the dialog and a 409 ReviewNotPending closes it', async ({ page }) => {
  let code = 'RevisionLimitReached';
  await page.route(/\/pipeline-reviews\/prv_0001\/decide$/, (route) => route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ code, message: 'no' }) }));
  await login(page);
  await page.goto('/dashboard/approvals?tab=pipeline-reviews');
  await page.locator('.data-table tbody tr').first().locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Request changes' }).click();
  await page.getByTestId('review-decide-comment').fill('Try again');
  await page.getByTestId('review-decide-submit').click();
  await expect(page.getByTestId('review-decide-conflict')).toContainText('already used all its revisions');
  await expect(page.locator('.modal')).toHaveCount(1);
  code = 'ReviewNotPending';
  await page.getByTestId('review-decide-submit').click();
  await expect(page.locator('.toast-warning')).toContainText('already decided');
  await expect(page.locator('.modal')).toHaveCount(0);
});

test('a failed pipeline run offers Retry and Delete', async ({ page }) => {
  let retried = false;
  await page.route(/\/pipeline-runs\/plr_0003\/retry$/, (route) => {
    retried = true;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...pipelineRun(3, false), status: 'Running', outcome: 'None' }) });
  });
  await login(page);
  await page.goto('/dashboard/pipeline-runs/plr_0003');
  await expect(page.getByTestId('pipeline-run-cancel')).toHaveCount(0);
  await page.getByTestId('pipeline-run-retry').click();
  await expect.poll(() => retried).toBe(true);
  await page.getByTestId('pipeline-run-delete').click();
  await page.locator('.modal').getByRole('button', { name: 'Delete' }).click();
  await expect(page).toHaveURL(/\/dashboard\/runs\?tab=pipeline-runs$/);
});
