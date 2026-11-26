// Escalations (AA2.13) against mocked APIs: the Autonomy badge and the Escalations tab opening on the open ones, the
// severity filter, answering from the escalation page (the badge drops), the Home attention list with Answer, and
// cancelling a blocking escalation after confirming.

import { test, expect } from '@playwright/test';
import { installMocks, escalation } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const rows = (page) => page.locator('.data-table tbody tr');
const badge = (page) => page.locator('.sidebar-item[data-nav="autonomy"] [data-testid="escalations-badge"]');

/** Serve the escalation list from local state so an answer or cancel changes what the list and badge show next. */
async function statefulEscalations(page) {
  const resolved = new Map();
  const current = (i) => ({ ...escalation(i), ...(resolved.get(`esc_${String(i).padStart(4, '0')}`) || {}) });
  await page.route(/\/tenants\/default\/escalations(\?.*)?$/, (route) => {
    const url = new URL(route.request().url());
    let list = [1, 2, 3, 4, 5].map(current);
    const status = url.searchParams.get('status');
    const severity = url.searchParams.get('severity');
    if (status) list = list.filter((e) => e.status === status);
    if (severity) list = list.filter((e) => e.severity === severity);
    const max = Number(url.searchParams.get('maxResults') || 25);
    const skip = Number(url.searchParams.get('skip') || 0);
    const objects = list.slice(skip, skip + max);
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, maxResults: max, skip, totalRecords: list.length, recordsRemaining: 0, endOfResults: true, objects }) });
  });
  await page.route(/\/tenants\/default\/escalations\/esc_\d+(\/(answer|cancel))?$/, (route) => {
    const url = new URL(route.request().url());
    const [, id, action] = url.pathname.match(/escalations\/(esc_\d+)(?:\/(answer|cancel))?$/);
    const i = Number(id.slice(4));
    if (action === 'answer') {
      const body = route.request().postDataJSON();
      resolved.set(id, { status: 'Answered', answerChoice: body.choice, answerText: body.text, resolvedBy: 'admin@garrison', resolutionSource: 'User', resolvedUtc: new Date().toISOString() });
    }
    if (action === 'cancel') resolved.set(id, { status: 'Cancelled', resolvedBy: 'admin@garrison', resolutionSource: 'User', resolvedUtc: new Date().toISOString() });
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(current(i)) });
  });
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('the Autonomy badge counts open escalations and the tab opens on them', async ({ page }) => {
  await login(page);
  // Three are open, but one was passed up to another, so two wait for an answer here.
  await expect(badge(page)).toHaveText('2');
  await expect(badge(page)).toHaveAttribute('data-tip', /2 escalations are waiting for an answer/);
  await page.goto('/dashboard/autonomy?tab=escalations');
  await expect(rows(page)).toHaveCount(3);
  await expect(rows(page).filter({ hasText: 'Refund order 4411' })).toContainText('Urgent');
  await expect(rows(page).filter({ hasText: 'Refund order 4411' })).toContainText('admin@garrison');
  await expect(rows(page).filter({ hasText: 'Escalated up' })).toHaveCount(1);
  await page.locator('select[aria-label="Severity"]').selectOption('Urgent');
  await expect(rows(page)).toHaveCount(1);
  await page.locator('select[aria-label="Status"]').selectOption('');
  await page.locator('select[aria-label="Severity"]').selectOption('');
  await expect(rows(page)).toHaveCount(5);
  await expect(rows(page).filter({ hasText: 'Is invoice 88 already paid?' })).toContainText('Answered');
});

test('answers an escalation from its page and the badge drops', async ({ page }) => {
  await statefulEscalations(page);
  await login(page);
  await expect(badge(page)).toHaveText('2');
  await page.goto('/dashboard/escalations/esc_0001');
  await expect(page.getByTestId('escalation-question')).toContainText('Refund order 4411');
  await expect(page.getByTestId('escalation-open-banner')).toContainText('suspended');
  await expect(page.getByTestId('escalation-keeper-link')).toHaveAttribute('href', '/dashboard/keepers/mdt_0001');
  await page.getByTestId('escalation-answer').click();
  const modal = page.locator('.modal');
  await expect(modal.getByTestId('escalation-choice-wait')).toHaveAttribute('aria-checked', 'true');
  await expect(modal.getByTestId('escalation-choice-wait')).toContainText('Default');
  await modal.getByTestId('escalation-choice-refund').click();
  await modal.getByTestId('escalation-answer-text').fill('Two captures, refund one.');
  await modal.getByTestId('escalation-answer-submit').click();
  await expect(page.locator('.toast').filter({ hasText: 'Answer sent to echo-agent.' })).toBeVisible();
  await expect(badge(page)).toHaveText('1');
  await expect(page.getByTestId('escalation-answer-panel')).toContainText('Two captures, refund one.');
  await expect(page.getByTestId('escalation-answer')).toHaveCount(0);
});

test('Home lists open escalations most urgent first and answers one', async ({ page }) => {
  await statefulEscalations(page);
  await login(page);
  const list = page.getByTestId('home-escalations-list');
  await expect(list.locator('li')).toHaveCount(2);
  await expect(list.locator('li').first()).toContainText('Refund order 4411');
  await page.getByTestId('home-escalation-answer-esc_0002').click();
  const modal = page.locator('.modal');
  await modal.getByTestId('escalation-answer-submit').click();
  await expect(modal.locator('.field-error')).toHaveText('Write an answer.');
  await modal.getByTestId('escalation-answer-text').fill('Finance owns them since March.');
  await modal.getByTestId('escalation-answer-submit').click();
  await expect(list.locator('li')).toHaveCount(1);
  await expect(badge(page)).toHaveText('1');
});

test('cancels a blocking escalation after confirming', async ({ page }) => {
  await statefulEscalations(page);
  await login(page);
  await page.goto('/dashboard/escalations/esc_0001');
  await page.getByTestId('escalation-cancel').click();
  const confirm = page.locator('.modal');
  await expect(confirm).toContainText('Cancelling the escalation cancels that run too.');
  await confirm.getByRole('button', { name: 'Cancel escalation' }).click();
  await expect(page.locator('.toast').filter({ hasText: 'Escalation cancelled.' })).toBeVisible();
  await expect(page.getByTestId('escalation-detail').locator('.page-header')).toContainText('Cancelled');
  await expect(badge(page)).toHaveText('1');
});
