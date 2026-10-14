// Permission approvals (P12.3) against mocked APIs: the sidebar badge, the inbox with Allow and Deny, the detail
// page, 409 and 403 handling, the run detail banner and Approvals tab, approval events in the transcript, and the
// deployment editor's Approvals step with ordered rules and the rule tester.

import { test, expect } from '@playwright/test';
import { installMocks, approval } from './mocks.js';

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

test('the sidebar counts pending approvals and the inbox opens on them', async ({ page }) => {
  await login(page);
  const badge = page.locator('.sidebar-item[data-nav="approvals"] [data-testid="approvals-badge"]');
  // Two pending approvals plus one pending pipeline stage review (P12.9) share the one badge.
  await expect(badge).toHaveText('3');
  await expect(badge).toHaveAttribute('data-tip', /tool call approvals \(2\) and pipeline stage reviews \(1\)/);
  await page.locator('.sidebar-item[data-nav="approvals"]').click();
  await expect(page).toHaveURL(/\/dashboard\/approvals$/);
  await expect(page.locator('.page-header-title').first()).toHaveText('Approvals');
  const rows = page.locator('.data-table tbody tr');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('git push origin main');
  await expect(rows.first()).toContainText('Pending');

  await page.locator('select[aria-label="Status"]').selectOption('');
  await expect(rows).toHaveCount(6);
  await expect(page.locator('.data-table tbody tr', { hasText: 'git status --short' })).toContainText('Bash(git status:*)');
});

test('allows a pending approval from the inbox with a reason and a remembered rule', async ({ page }) => {
  let body = null;
  await page.route(/\/approvals\/apr_0001\/decide$/, (route) => {
    body = route.request().postDataJSON();
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...approval(1), status: 'Approved', decision: 'Allow', decisionSource: 'User' }) });
  });
  await login(page);
  await page.goto('/dashboard/approvals');
  await page.locator('.data-table tbody tr', { hasText: 'git push origin main' }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Allow' }).click();
  const modal = page.locator('.modal');
  await expect(modal).toContainText('Decide Bash');
  await page.locator('#approval-reason').fill('Release day');
  await page.getByTestId('decide-remember').check();
  await expect(page.getByTestId('decide-rule-pattern')).toHaveValue('Bash(git push:*)');
  await page.getByTestId('decide-submit').click();
  await expect.poll(() => body).not.toBeNull();
  expect(body).toEqual({ decision: 'Allow', reason: 'Release day', remember: true, rulePattern: 'Bash(git push:*)' });
  await expect(page.locator('.toast-success')).toContainText('Allowed Bash and added the rule Bash(git push:*).');
  await expect(modal).toHaveCount(0);
});

test('a 409 says the approval was already decided, and a 403 explains the missing permission', async ({ page }) => {
  let status = 409;
  await page.route(/\/approvals\/apr_0001\/decide$/, (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ code: status === 409 ? 'ApprovalNotPending' : 'AuthorizationDenied', message: 'no' }) })
  );
  await login(page);
  await page.goto('/dashboard/approvals/apr_0001');
  await page.getByTestId('approval-deny').click();
  await page.getByTestId('decide-submit').click();
  await expect(page.locator('.toast-warning')).toContainText('already decided');
  await expect(page.locator('.modal')).toHaveCount(0);

  status = 403;
  await page.getByTestId('approval-allow').click();
  await page.getByTestId('decide-remember').check();
  await page.getByTestId('decide-submit').click();
  await expect(page.locator('.toast-error')).toContainText('permission to update the deployment');
  await expect(page.locator('.modal')).toBeVisible();
});

test('the detail page shows the request, the redacted input, rules, and links', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/approvals/apr_0004');
  await expect(page.locator('.page-header-title')).toHaveText('Approval for Bash');
  await expect(page.locator('.sidebar-item[data-nav="approvals"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.getByTestId('approval-input-preview')).toContainText('[redacted]');
  await expect(page.locator('[data-approval-field="reason"]')).toContainText('Do not delete the build output.');
  await expect(page.getByTestId('approval-suggested-rule')).toHaveText('Bash(rm:*)');
  await expect(page.getByTestId('approval-allow')).toHaveCount(0);
  await page.getByTestId('approval-run-link').click();
  await expect(page).toHaveURL(/\/dashboard\/runs\/run_0004$/);
});

test('run detail flags a run awaiting approval and decides from its Approvals tab', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/runs/run_0002');
  await expect(page.getByTestId('awaiting-approval-badge')).toContainText('Awaiting approval');
  const banner = page.getByTestId('awaiting-approval');
  await expect(banner).toContainText('waiting for a person to approve 1 tool call');
  await banner.getByRole('button').click();
  await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText('Approvals (2)');
  await expect(page.getByTestId('run-approvals').locator('tbody tr')).toHaveCount(2);
  await page.getByTestId('run-approval-deny').first().click();
  await expect(page.locator('.modal')).toContainText('Decide Bash');
  await expect(page.getByTestId('decide-deny')).toBeChecked();
});

test('the deployment editor edits ordered approval rules and tests a tool call', async ({ page }) => {
  let body = null;
  let check = null;
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/deployments\/dep_0001$/, (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...body, id: 'dep_0001' }) });
  });
  await page.route(/\/deployments\/dep_0001\/approval-check$/, (route) => {
    check = route.request().postDataJSON();
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ action: 'Deny', source: 'Rule', ruleId: 'dar_0002', rulePattern: 'Bash(rm:*)', suggestedRule: 'Bash(rm:*)', approvalsEnabled: true }) });
  });
  await login(page);
  await page.goto('/dashboard/deployments');
  await page.locator('.data-table tbody tr', { hasText: 'deployment-1' }).getByText('deployment-1', { exact: true }).click();
  await page.locator('.modal .stepper-step').nth(6).click();
  const modal = page.locator('.modal');
  await expect(page.locator('#deployments-approvalsEnabled')).toBeChecked();
  await expect(page.locator('#deployments-approvalDefaultAction')).toHaveValue('Ask');
  await expect(modal.locator('.object-list-row')).toHaveCount(3);
  await expect(page.locator('#ol-0-pattern')).toHaveValue('Bash(git status:*)');
  // Move the Deny rule to the top.
  await modal.locator('.object-list-row').nth(1).getByRole('button', { name: 'Move up' }).click();
  await expect(page.locator('#ol-0-pattern')).toHaveValue('Bash(rm:*)');

  await page.getByTestId('approval-check-value').fill('rm -rf build');
  await page.getByTestId('approval-check-run').click();
  await expect(page.getByTestId('approval-check-result')).toContainText('Deny');
  await expect(page.getByTestId('approval-check-rule')).toHaveText('Bash(rm:*)');
  expect(check).toEqual({ toolName: 'Bash', input: { command: 'rm -rf build' } });

  await page.getByTestId('save-button').click();
  await expect.poll(() => body).not.toBeNull();
  expect(body.approvalRules.map((r) => [r.id, r.pattern])).toEqual([
    ['dar_0002', 'Bash(rm:*)'],
    ['dar_0001', 'Bash(git status:*)'],
    ['dar_0003', 'WebFetch']
  ]);
  expect(body.approvalTimeoutSeconds).toBe(300);
});
