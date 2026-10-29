// Chat (AD6.8) and branding (AD6.10) against the mock gateway: two streamed turns, a dropped stream that resumes
// after the last sequence without duplicating text, the approval notice, busy and rate-limited sends, a lost
// session, and branding read at runtime.
import { test, expect } from '@playwright/test';
import { MOCK, mockLog, openAnonymously, resetMock, send } from './helpers.js';

test.beforeEach(async ({ page, request }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await resetMock(request);
});

test('shows branding and the welcome text, and picks up branding changes without a rebuild', async ({ page, request }) => {
  await page.goto('/apps/demo/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in to Research Desk');
  await expect(page.locator('.signin-description')).toHaveText('Ask the research team anything.');
  const logo = page.locator('img.brand-logo');
  await expect(logo).toHaveAttribute('src', '/v1.0/apps/demo/logo');
  await expect.poll(() => logo.evaluate((img) => img.naturalWidth)).toBeGreaterThan(0);
  const primary = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--app-primary').trim());
  expect(await primary()).toBe('#1e3a8a');
  await expect(page).toHaveTitle('Research Desk');

  await page.getByTestId('signin-anonymous').click();
  await expect(page.getByTestId('brand-name')).toHaveText('Research Desk');
  await expect(page.getByTestId('brand-logo')).toBeVisible();
  const welcome = page.getByTestId('welcome');
  await expect(welcome).toContainText('Welcome to Research Desk. Ask a question to get started.');
  await expect(welcome.locator('strong')).toHaveText('Research Desk');
  const userBubbleColor = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--app-on-primary').trim());
  expect(userBubbleColor).toBe('#ffffff');

  // Change branding on the "server" and reload: the same build shows the new values.
  await request.post(`${MOCK}/__mock/app`, { data: { displayName: 'Atlas Help', primaryColor: '#fde047', welcomeText: 'Hello from Atlas.' } });
  await page.reload();
  await expect(page.getByTestId('brand-name')).toHaveText('Atlas Help');
  await expect(page.getByTestId('welcome')).toContainText('Hello from Atlas.');
  expect(await primary()).toBe('#fde047');
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--app-on-primary').trim())).toBe('#000000');
  await expect(page).toHaveTitle('Atlas Help');
});

test('signs in with an email and password and refuses a wrong one', async ({ page, request }) => {
  await resetMock(request, { app: { authMode: 'AppUsers', anonymousAllowed: false } });
  await page.goto('/apps/demo/');
  await expect(page.getByTestId('signin-anonymous')).toHaveCount(0);
  await page.getByLabel('Email').fill('ana@example.com');
  await page.getByLabel('Password').fill('wrong');
  await page.getByTestId('signin-submit').click();
  await expect(page.getByTestId('signin-error')).toHaveText('The email or password is not correct.');
  await page.getByLabel('Password').fill('correct horse');
  await page.getByTestId('signin-submit').click();
  await expect(page.locator('.principal')).toHaveText('Signed in as ana@example.com');
  const stored = await page.evaluate(() => sessionStorage.getItem('garrison.app.session.demo'));
  expect(JSON.parse(stored).token).toMatch(/^gas_/);
});

test('sends two turns and sees each answer stream in', async ({ page }) => {
  await openAnonymously(page);
  await expect(page.getByTestId('welcome')).toBeVisible();
  await send(page, 'What changed this week?');
  await expect(page).toHaveURL(/\/apps\/demo\/c\/cnv_\d+$/);
  const first = page.getByTestId('turn').nth(0);
  await expect(first.locator('.message-user')).toContainText('What changed this week?');
  // Text arrives piece by piece: a partial answer shows while the turn is still streaming.
  await expect(first).toHaveAttribute('data-phase', 'streaming');
  await expect(first.getByTestId('answer')).toContainText('Here is');
  await expect(first.getByTestId('answer')).not.toContainText('question.');
  await expect(first).toHaveAttribute('data-phase', 'done');
  await expect(first.getByTestId('answer')).toHaveText('Here is the answer to your question.');
  await expect(page.getByTestId('welcome')).toHaveCount(0);

  await send(page, 'And the week before?');
  const second = page.getByTestId('turn').nth(1);
  await expect(second.locator('.message-user')).toContainText('And the week before?');
  await expect(second).toHaveAttribute('data-phase', 'streaming');
  await expect(second).toHaveAttribute('data-phase', 'done');
  await expect(second.getByTestId('answer')).toHaveText('Here is the answer to your question.');
  await expect(page.getByTestId('turn')).toHaveCount(2);

  // The conversation is listed and reopens from its URL with both turns.
  await expect(page.getByTestId('conversation-item')).toHaveCount(1);
  await expect(page.getByTestId('conversation-item')).toContainText('Messages: 2');
  await page.reload();
  await expect(page.getByTestId('turn')).toHaveCount(2);
  await expect(page.getByTestId('answer').nth(1)).toHaveText('Here is the answer to your question.');
});

test('reconnects after the stream drops and resumes from the last sequence without duplicating text', async ({ page, request }) => {
  // Events: 1 Lifecycle, 2 to 7 AssistantText, then Result. The first connection dies right after sequence 4;
  // on reconnect the mock also replays one event the browser already has, which the browser must drop.
  const chunks = ['Alpha ', 'bravo ', 'charlie ', 'delta ', 'echo ', 'foxtrot.'];
  await resetMock(request, { scenario: { chunks, chunkMs: 200, dropAfter: 4, replayOverlap: 1, holdMs: 2500 } });
  await openAnonymously(page);
  await send(page, 'Spell it out');
  const turn = page.getByTestId('turn').first();
  await expect(page.getByTestId('reconnecting')).toBeVisible();
  // Before the turn completes (the server's final answer would replace the streamed text), the streamed text is
  // exactly the chunks in order, once each.
  await expect(turn.getByTestId('answer')).toHaveText(chunks.join('').trim());
  await expect(turn).toHaveAttribute('data-phase', 'streaming');
  await expect(page.getByTestId('reconnecting')).toHaveCount(0);
  await expect(turn).toHaveAttribute('data-phase', 'done');
  await expect(turn.getByTestId('answer')).toHaveText(chunks.join('').trim());

  const connections = (await mockLog(request)).filter((c) => c.runId);
  expect(connections.length).toBeGreaterThanOrEqual(2);
  expect(connections[0].afterSequence).toBe(0);
  expect(connections[1].afterSequence).toBe(4);
});

test('shows the approval notice while an operator must approve a step', async ({ page, request }) => {
  await resetMock(request, { scenario: { approvalMs: 1500 } });
  await openAnonymously(page);
  await send(page, 'Delete the old reports');
  await expect(page.getByTestId('approval-notice')).toHaveText('Waiting for an operator to approve a step');
  await expect(page.getByTestId('turn').first()).toHaveAttribute('data-phase', 'approval');
  await expect(page.getByTestId('approval-notice')).toHaveCount(0);
  await expect(page.getByTestId('turn').first()).toHaveAttribute('data-phase', 'done');
});

test('explains busy and rate-limited sends and keeps the message', async ({ page, request }) => {
  await resetMock(request, { scenario: { holdMs: 100, chunkMs: 50 } });
  await openAnonymously(page);
  await send(page, 'First');
  await expect(page.getByTestId('turn').first()).toHaveAttribute('data-phase', 'done');

  await setReject(request, 409, 'ConversationBusy');
  await send(page, 'Second');
  await expect(page.getByTestId('send-error')).toHaveAttribute('data-code', 'ConversationBusy');
  await expect(page.getByTestId('send-error')).toContainText('still answering the previous message');
  await expect(page.getByTestId('composer-input')).toHaveValue('Second');

  await setReject(request, 409, 'AppRateLimited');
  await page.getByTestId('send-button').click();
  await expect(page.getByTestId('send-error')).toContainText('sending messages too quickly');
  await page.getByRole('button', { name: 'Dismiss' }).click();
  await expect(page.getByTestId('send-error')).toHaveCount(0);
  await page.getByTestId('send-button').click();
  await expect(page.getByTestId('turn')).toHaveCount(2);
});

test('returns to sign-in when the session ends', async ({ page, request }) => {
  await openAnonymously(page);
  await request.post(`${MOCK}/__mock/revoke`);
  await send(page, 'Still there?');
  await expect(page.getByTestId('signin-anonymous')).toBeVisible();
  await expect(page.locator('.notice-info')).toHaveText('Your session ended. Sign in again to continue.');
  expect(await page.evaluate(() => sessionStorage.getItem('garrison.app.session.demo'))).toBeNull();
});

test('shows a clear page for an unknown app', async ({ page }) => {
  await page.goto('/apps/no-such-app/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('App not found');
  await page.goto('/apps/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('No app selected');
});

async function setReject(request, status, code) {
  const res = await request.post(`${MOCK}/__mock/scenario`, { data: { rejectNext: { status, code } } });
  expect(res.ok()).toBe(true);
}
