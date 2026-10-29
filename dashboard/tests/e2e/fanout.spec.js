// Fan-out groups (AD5.8) against mocked APIs: the run tree on Run detail groups a run's children under their fan-out
// groups (policy with quorum, status and reason, progress, cost and tokens against the budget, deadline, and members
// with links to their runs), Cancel group with confirmation, live updates over the fan-out:{id} WebSocket channel,
// polling when the channel is not available, and the link from a member run back to its group.

import { test, expect } from '@playwright/test';
import { installMocks, fanOutGroup, FAN_OUT_PARENT_RUN } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
const TREE = `/dashboard/runs/${FAN_OUT_PARENT_RUN}?tab=children`;
const group = (page, id) => page.locator(`[data-testid="fan-out-group"][data-group="${id}"]`);

test.use({ actionTimeout: 15000 });

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('the run tree shows a three-member fan-out group with its policy, progress, budget, deadline, and members', async ({ page }) => {
  await login(page);
  await page.goto(`/dashboard/runs/${FAN_OUT_PARENT_RUN}`);
  await page.getByRole('tab', { name: /Child runs/ }).click();
  await expect(page.getByTestId('fan-out-group')).toHaveCount(2);

  const running = group(page, 'fog_0002');
  await expect(running.getByTestId('fan-out-status')).toHaveText('Running');
  await expect(running.getByTestId('fan-out-policy')).toHaveText('Quorum: 2 of 3');
  await expect(running.getByTestId('fan-out-progress')).toHaveText('1 of 3 finished, 1 succeeded');
  await expect(running.getByTestId('fan-out-cost')).toContainText('$0.17 of $0.50');
  await expect(running.getByTestId('fan-out-cost').getByRole('meter')).toHaveAttribute('aria-valuenow', '34');
  await expect(running.getByTestId('fan-out-tokens')).toContainText('6,000 of 20,000');
  await expect(running.getByTestId('fan-out-tokens').getByRole('meter')).toHaveAttribute('aria-valuenow', '30');
  // The mocks run on a fixed clock, so check the exact deadline in the tooltip rather than the relative text.
  await expect(running.getByTestId('fan-out-deadline')).toHaveAttribute('data-tip', /2026/);
  await expect(running.getByTestId('fan-out-deadline')).not.toHaveText('None');
  await expect(running.getByTestId('fan-out-pending')).toHaveText('Still running: reviews, competitors');
  await expect(running.getByTestId('fan-out-live')).toHaveText('Polling');
  await expect(running.getByTestId('fan-out-cancel')).toBeVisible();

  const members = running.locator('[data-testid="fan-out-members"] tbody tr');
  await expect(members).toHaveCount(3);
  await expect(members.nth(0)).toContainText('pricing');
  await expect(members.nth(0)).toContainText('research-agent');
  await expect(members.nth(0)).toContainText('Succeeded');
  await expect(members.nth(1)).toContainText('Running');
  await expect(members.nth(2)).toContainText('competitors');
  await expect(members.nth(2)).toContainText('Queued');

  // The older group ended: no Cancel, a translated reason, a failed member, and no budget.
  const joined = group(page, 'fog_0001');
  await expect(joined.getByTestId('fan-out-status')).toHaveText('Joined');
  await expect(joined.getByTestId('fan-out-policy')).toHaveText('Any');
  await expect(joined.getByTestId('fan-out-reason')).toHaveText('A member succeeded.');
  await expect(joined.getByTestId('fan-out-failed')).toHaveText('Did not succeed: outline');
  await expect(joined.getByTestId('fan-out-cost')).toContainText('(no limit)');
  await expect(joined.getByTestId('fan-out-deadline')).toHaveText('None');
  await expect(joined.getByTestId('fan-out-cancel')).toHaveCount(0);
  await expect(joined.getByTestId('fan-out-live')).toHaveCount(0);

  // Children outside any group stay in a plain list; members are not listed twice.
  await expect(page.getByTestId('run-children')).toHaveCount(1);
  await expect(page.getByTestId('run-children').locator('li')).toHaveCount(1);
  await expect(page.getByTestId('run-children')).toContainText('run_child');

  await members.nth(1).getByTestId('fan-out-member-link').click();
  await expect(page).toHaveURL(/\/dashboard\/runs\/run_0062$/);
});

test('Cancel group asks first, posts the cancel, and shows the cancelled group', async ({ page }) => {
  const posts = [];
  await page.route(/\/fan-out-groups\/fog_0002\/cancel$/, (route) => {
    posts.push(route.request().method());
    return route.fallback();
  });
  await login(page);
  await page.goto(TREE);
  const running = group(page, 'fog_0002');
  await running.getByTestId('fan-out-cancel').click();
  const modal = page.locator('.modal');
  await expect(modal).toContainText('Cancel fan-out group fog_0002?');
  await modal.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(modal).toHaveCount(0);
  expect(posts).toEqual([]);

  await running.getByTestId('fan-out-cancel').click();
  await page.locator('.modal').getByRole('button', { name: 'Cancel group' }).click();
  await expect(page.locator('.toast-success')).toContainText('Fan-out group fog_0002 was cancelled.');
  expect(posts).toEqual(['POST']);
  await expect(running).toHaveAttribute('data-status', 'Cancelled');
  await expect(running.getByTestId('fan-out-status')).toHaveText('Cancelled');
  await expect(running.getByTestId('fan-out-reason')).toHaveText('Cancelled by admin@garrison.');
  await expect(running.getByTestId('fan-out-cancel')).toHaveCount(0);
  await expect(running.locator('[data-testid="fan-out-members"] tbody tr').nth(2)).toContainText('Cancelled');
});

test('a refused cancel ends in an error toast and leaves the group running', async ({ page }) => {
  await page.route(/\/fan-out-groups\/fog_0002\/cancel$/, (route) => route.fulfill(json(403, { error: 'AuthorizationFailed', code: 'AuthorizationFailed', message: 'You may not update this fan-out group.' })));
  await login(page);
  await page.goto(TREE);
  const running = group(page, 'fog_0002');
  await running.getByTestId('fan-out-cancel').click();
  await page.locator('.modal').getByRole('button', { name: 'Cancel group' }).click();
  await expect(page.locator('.toast-error')).toBeVisible();
  await expect(running.getByTestId('fan-out-status')).toHaveText('Running');
});

test('a running group follows the fan-out channel and updates when a member finishes', async ({ page }) => {
  let socket = null;
  await page.routeWebSocket(/\/v1\.0\/ws/, (ws) => {
    ws.onMessage((message) => {
      const data = JSON.parse(String(message));
      if (data.type === 'subscribe' && data.channel === 'fan-out:fog_0002') {
        socket = ws;
        ws.send(JSON.stringify({ type: 'subscribed', channel: data.channel }));
      }
    });
  });
  await login(page);
  await page.goto(TREE);
  const running = group(page, 'fog_0002');
  await expect(running.getByTestId('fan-out-live')).toHaveText('Live');

  const base = fanOutGroup('fog_0002');
  const members = base.members.map((m) => (m.label === 'reviews' ? { ...m, status: 'Succeeded', outcome: 'Succeeded', costUsd: 0.08, tokens: 2600 } : m));
  const joined = { ...base, members, status: 'Joined', statusReason: '2 members succeeded, meeting the quorum of 2.', finished: 2, succeeded: 2, pending: ['competitors'], costUsd: 0.2, tokens: 6800, completedUtc: new Date().toISOString() };
  socket.send(JSON.stringify({ type: 'fan-out.status', fanOutGroup: joined }));

  await expect(running.getByTestId('fan-out-status')).toHaveText('Joined');
  await expect(running.getByTestId('fan-out-reason')).toHaveText('2 members succeeded, meeting the quorum of 2.');
  await expect(running.getByTestId('fan-out-progress')).toHaveText('2 of 3 finished, 2 succeeded');
  await expect(running.getByTestId('fan-out-cost')).toContainText('$0.20 of $0.50');
  await expect(running.getByTestId('fan-out-cancel')).toHaveCount(0);
});

test('without the live channel a running group polls until it ends over budget', async ({ page }) => {
  let polls = 0;
  await page.route(/\/fan-out-groups\/fog_0002$/, (route) => {
    polls += 1;
    const base = fanOutGroup('fog_0002');
    return route.fulfill(json(200, { ...base, status: 'BudgetExceeded', statusReason: 'The members spent 0.62 USD, over the budget of 0.5 USD.', costUsd: 0.62, completedUtc: new Date().toISOString() }));
  });
  await login(page);
  await page.goto(TREE);
  const running = group(page, 'fog_0002');
  await expect(running.getByTestId('fan-out-live')).toHaveText('Polling');
  await expect(running.getByTestId('fan-out-status')).toHaveText('Over budget', { timeout: 15000 });
  expect(polls).toBeGreaterThan(0);
  await expect(running.getByTestId('fan-out-reason')).toHaveText('The members spent 0.62 USD, over the budget of 0.5 USD.');
  await expect(running.getByTestId('fan-out-cost')).toHaveAttribute('data-over', 'true');
  await expect(running.getByTestId('fan-out-cost').getByRole('meter')).toHaveAttribute('aria-valuenow', '100');
});

test('a member run links to its group in the parent run tree', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/runs/run_0062');
  const link = page.getByTestId('run-fan-out-link');
  await expect(link).toHaveText('fog_0002');
  await link.click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/runs/${FAN_OUT_PARENT_RUN}\\?tab=children&group=fog_0002$`));
  await expect(page.getByRole('tab', { name: /Child runs/ })).toHaveAttribute('aria-selected', 'true');
  await expect(group(page, 'fog_0002')).toHaveClass(/is-highlighted/);
  await expect(group(page, 'fog_0001')).not.toHaveClass(/is-highlighted/);

  // A run outside any group has no fan-out link.
  await page.goto('/dashboard/runs/run_0001');
  await expect(page.getByTestId('run-trust-level')).toBeVisible();
  await expect(page.getByTestId('run-fan-out-link')).toHaveCount(0);
});

test('fan-out labels are translated', async ({ page }) => {
  await login(page);
  await page.evaluate(() => localStorage.setItem('garrison.locale', 'de'));
  await page.goto(TREE);
  const running = group(page, 'fog_0002');
  await expect(running.getByTestId('fan-out-status')).toHaveText('Läuft');
  await expect(running.getByTestId('fan-out-policy')).toHaveText('Quorum: 2 von 3');
  await expect(group(page, 'fog_0001').getByTestId('fan-out-reason')).toHaveText('Ein Mitglied war erfolgreich.');
  await expect(running.getByTestId('fan-out-cancel')).toContainText('Gruppe abbrechen');
});
