// Conversations (P12.1): the Runs hub tab, the detail page with its turns and the box that sends the next turn,
// delete with the 409 ConversationBusy message, Invoke starting and continuing a conversation, and the conversation
// details on Run detail.

import { test, expect } from '@playwright/test';
import { installMocks, mockRun } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

/** Capture invoke bodies and answer with a run that is a turn of `conversationId`. */
async function routeInvoke(page, conversationId, turn) {
  const bodies = [];
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/agents\/[^/]+\/invoke/, (route) => {
    bodies.push(JSON.parse(route.request().postData() || '{}'));
    const run = mockRun('run_turn', { status: 'Succeeded', outcome: 'Succeeded', conversationId, conversationTurn: turn });
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(run) });
  });
  return bodies;
}

test.use({ actionTimeout: 15000 });

test.beforeEach(async ({ page }) => {
  await installMocks(page);
});

test('the Conversations tab lists conversations with state, turns, and fallbacks', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/conversations');
  await expect(page).toHaveURL(/\/dashboard\/runs\?tab=conversations/);
  const first = page.locator('.data-table tbody tr', { hasText: 'Plan the release 1' });
  await expect(first).toBeVisible();
  await expect(first.locator('.pill', { hasText: 'Idle' })).toBeVisible();
  await expect(page.locator('.data-table tbody tr', { hasText: 'Plan the release 2' }).locator('.pill', { hasText: 'Working' })).toBeVisible();
  await expect(page.locator('.data-table tbody tr', { hasText: 'Untitled conversation' })).toBeVisible();
  await first.getByText('Plan the release 1').click();
  await expect(page).toHaveURL(/\/dashboard\/conversations\/cnv_0001/);
});

test('conversation detail shows the turns and sends the next one', async ({ page }) => {
  const bodies = await routeInvoke(page, 'cnv_0001', 4);
  await login(page);
  await page.goto('/dashboard/conversations/cnv_0001');
  const turns = page.getByTestId('conversation-turns');
  await expect(turns.locator('tbody tr')).toHaveCount(3);
  await expect(turns.locator('[data-turn-session="first"]')).toContainText('New session');
  await expect(turns.locator('[data-turn-session="resumed"]')).toContainText('Resumed');
  await expect(turns.locator('[data-turn-session="fallback"]')).toContainText('Affinity wait expired');
  await page.getByTestId('conversation-message').fill('And the rollback plan?');
  await page.getByTestId('conversation-send').click();
  await expect(page.getByTestId('conversation-pending')).toContainText('run_turn');
  expect(bodies[0]).toEqual({ input: 'And the rollback plan?', conversationId: 'cnv_0001' });
});

test('a busy conversation refuses the next turn and explains a refused delete', async ({ page }) => {
  await page.route(/\/conversations\/cnv_0002$/, (route) =>
    route.request().method() === 'DELETE'
      ? route.fulfill({ status: 409, contentType: 'application/json', body: JSON.stringify({ code: 'ConversationBusy', message: 'Conversation cnv_0002 has an unfinished turn (run run_0004).' }) })
      : route.fallback()
  );
  await login(page);
  await page.goto('/dashboard/conversations/cnv_0002');
  await expect(page.getByTestId('conversation-busy')).toBeVisible();
  await page.getByTestId('conversation-message').fill('Next');
  await expect(page.getByTestId('conversation-send')).toBeDisabled();
  await page.getByTestId('conversation-delete').click();
  await page.locator('.modal').getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('.toast', { hasText: 'still working on its previous turn' })).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/conversations\/cnv_0002/);
});

test('Invoke starts a conversation, then continues it', async ({ page }) => {
  const bodies = await routeInvoke(page, 'cnv_new', 1);
  await login(page);
  await page.goto('/dashboard/invoke?agentId=agt_0001');
  await page.getByTestId('invoke-conversation-mode').selectOption('start');
  await page.locator('#invoke-message').fill('Hello');
  await page.getByTestId('invoke-send').click();
  await expect(page.getByTestId('invoke-open-conversation')).toBeVisible();
  expect(bodies[0]).toMatchObject({ input: 'Hello', startConversation: true });
  await expect(page.getByTestId('invoke-conversation-mode')).toHaveValue('continue');
  await expect(page.getByTestId('invoke-conversation')).toHaveValue('cnv_new');
  await expect(page.locator('#invoke-deployment')).toBeDisabled();
  await page.locator('#invoke-message').fill('Again');
  await page.getByTestId('invoke-send').click();
  await expect.poll(() => bodies.length).toBe(2);
  expect(bodies[1]).toEqual({ input: 'Again', conversationId: 'cnv_new' });
});

test('Invoke pre-fills the conversation from the query string', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/conversations/cnv_0001');
  await page.getByTestId('conversation-open-invoke').click();
  await expect(page).toHaveURL(/\/dashboard\/invoke\?agentId=agt_0001&conversationId=cnv_0001/);
  await expect(page.getByTestId('invoke-conversation-mode')).toHaveValue('continue');
  await expect(page.getByTestId('invoke-conversation')).toHaveValue('cnv_0001');
});

test('Run detail links a turn to its conversation with the session and fallback reason', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/runs/run_0042');
  await expect(page.getByTestId('run-conversation-link')).toContainText('cnv_0001');
  await expect(page.locator('.run-summary')).toContainText('turn 3');
  await expect(page.locator('.run-summary [data-turn-session="fallback"]')).toContainText('Affinity wait expired');
  await page.getByTestId('run-conversation-link').click();
  await expect(page).toHaveURL(/\/dashboard\/conversations\/cnv_0001/);
});

test('Agent detail opens the agent\'s conversations', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/agents/agt_0001');
  await page.getByTestId('agent-conversations').click();
  await expect(page).toHaveURL(/\/dashboard\/runs\?tab=conversations&agentId=agt_0001/);
  await expect(page.locator('.data-table tbody tr').first()).toBeVisible();
});
