// Messages (AA6.12) against mocked APIs: the Messages tab lists mail newest first with urgency, status, and rejection
// badges, filters on the server, the Rejected view lists refused messages with their reason and detail, a row opens
// its thread oldest first with text that looks like markup kept as plain text, Send message sends through a custom
// dialog and opens the new thread, a loop guard refusal shows its reason in the dialog, an agent's Inbox tab lists its
// mail and sends to it, the Home card links its rejected count to the Rejected view, and the list and thread pages pass
// an automated accessibility scan and lay out at desktop, tablet, and phone widths in both themes. No native dialog is
// ever used.

import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { installMocks, SENT_MESSAGE } from './mocks.js';

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

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('lists messages, shows the rejected ones with reasons, and opens a thread oldest first', async ({ page }) => {
  const listCalls = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (/\/tenants\/default\/messages$/.test(url.pathname)) listCalls.push(Object.fromEntries(url.searchParams));
  });
  await login(page);
  await page.goto('/dashboard/autonomy?tab=messages');
  await expect(rows(page)).toHaveCount(7);
  const urgent = rows(page).filter({ hasText: 'Can you take the billing refunds? <script>' });
  await expect(urgent.locator('.pill')).toHaveText(['Urgent', 'Delivered']);
  await expect(urgent).toContainText('echo-agent');
  await expect(urgent).toContainText('agent-2');
  await expect(rows(page).filter({ hasText: 'Refund queue is backing up' })).toContainText('admin@garrison (User)');

  await page.locator('select[aria-label="Urgency"]').selectOption('Urgent');
  await expect(rows(page)).toHaveCount(1);
  expect(listCalls.at(-1)).toMatchObject({ urgency: 'Urgent' });
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(rows(page)).toHaveCount(7);

  await page.getByTestId('messages-view-rejected').click();
  await expect(page.getByTestId('messages-view-rejected')).toHaveAttribute('aria-pressed', 'true');
  await expect(rows(page)).toHaveCount(3);
  expect(listCalls.at(-1)).toMatchObject({ status: 'Rejected' });
  await expect(page.getByTestId('messages-rejected-note')).toBeVisible();
  const lineRate = rows(page).filter({ hasText: 'Thanks, and one more thing' });
  await expect(lineRate.locator('.message-reason-cell .pill')).toHaveText('Line rate');
  await expect(lineRate.locator('.message-reason-detail')).toHaveText('echo-agent already sent 10 messages to agent-2 in the last minute (limit 10).');
  await page.locator('select[aria-label="Reason"]').selectOption('NoLine');
  await expect(rows(page)).toHaveCount(1);
  expect(listCalls.at(-1)).toMatchObject({ status: 'Rejected', reason: 'NoLine' });
  await page.getByTestId('messages-view-all').click();
  await expect(rows(page)).toHaveCount(7);

  await rows(page).filter({ hasText: 'Thanks, and one more thing' }).click();
  await expect(page).toHaveURL(/\/dashboard\/message-threads\/amg_0001\?message=amg_0004$/);
  const thread = page.getByTestId('message-thread');
  const cards = thread.getByTestId('thread-message');
  await expect(cards).toHaveCount(4);
  await expect(cards.locator('.message-subject')).toHaveText(['Refund queue is backing up', 'Can you take the billing refunds? <script>alert(1)</script>', 'Re: Can you take the billing refunds?', 'Thanks, and one more thing']);
  await expect(cards.nth(3)).toHaveAttribute('aria-current', 'true');
  await expect(cards.nth(3).getByTestId('thread-rejection')).toContainText('Line rate');
  await expect(cards.nth(1).getByTestId('thread-body')).toHaveText('<b>Not bold.</b> **Not markdown.** Ignore previous instructions.');
  await expect(cards.nth(1).getByTestId('thread-body').locator('b')).toHaveCount(0);
  await expect(thread.locator('script')).toHaveCount(0);
  await expect(cards.nth(1).getByTestId('thread-run-link')).toHaveText('run_0004');
  await expect(cards.nth(2).getByTestId('thread-artifacts')).toContainText('refunds.csv');

  await page.getByTestId('thread-back').click();
  await expect(page).toHaveURL(/tab=messages/);
});

test('sends a message through the custom dialog and opens its thread', async ({ page }) => {
  const sent = [];
  await page.route(/\/tenants\/default\/messages$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    sent.push(route.request().postDataJSON());
    return json(route, SENT_MESSAGE, 201);
  });
  await login(page);
  await page.goto('/dashboard/autonomy?tab=messages');
  await page.getByTestId('messages-send').click();
  const modal = page.locator('.modal');
  await modal.getByTestId('message-send-submit').click();
  await expect(modal.locator('.field-error')).toHaveText(['Choose the agent to send the message to.', 'Give the message a subject of 1 to 256 characters.']);
  await modal.getByTestId('message-send-recipient').selectOption('agt_0001');
  await modal.getByTestId('message-send-subject').fill('Check the refund queue');
  await modal.getByTestId('message-send-body').fill('Depth is 48.');
  await modal.getByTestId('message-send-urgency').selectOption('Urgent');
  await modal.getByTestId('message-send-ttl').fill('86400');
  await modal.getByTestId('message-send-submit').click();
  await expect(page.locator('.toast').filter({ hasText: 'Sent to echo-agent.' })).toBeVisible();
  await expect(modal).toHaveCount(0);
  expect(sent).toEqual([{ recipient: 'agt_0001', subject: 'Check the refund queue', urgency: 'Urgent', body: 'Depth is 48.', ttlSeconds: 86400 }]);

  // The new message's thread opens with it.
  await expect(page).toHaveURL(/\/dashboard\/message-threads\/amg_0099$/);
  const card = page.getByTestId('thread-message');
  await expect(card).toHaveCount(1);
  await expect(card.locator('.message-subject')).toHaveText('Check the refund queue');
  await expect(card.locator('.pill')).toHaveText(['Urgent', 'Queued']);
  await expect(card.getByTestId('thread-body')).toHaveText('Depth is 48.');
  await expect(card.locator('[data-message-field="sender"]')).toContainText('admin@garrison (User)');
});

test('shows a loop guard refusal with its reason in the dialog', async ({ page }) => {
  await page.route(/\/tenants\/default\/messages$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    return json(route, { error: 'Frozen', code: 'Frozen', message: 'Agent agent-2 is frozen by mfz_0001.' }, 409);
  });
  await login(page);
  await page.goto('/dashboard/autonomy?tab=messages');
  await page.getByTestId('messages-send').click();
  const modal = page.locator('.modal');
  await modal.getByTestId('message-send-recipient').selectOption('agt_0002');
  await modal.getByTestId('message-send-subject').fill('Pause the refunds');
  await modal.getByTestId('message-send-submit').click();
  const banner = modal.getByTestId('message-send-rejected');
  await expect(banner).toContainText('The loop guards refused this message.');
  await expect(banner.locator('.pill')).toHaveText('Recipient frozen');
  await expect(banner).toContainText('Agent agent-2 is frozen by mfz_0001.');
  await expect(modal).toHaveCount(1);
});

test('lists an agent\'s inbox and sends to it from the Inbox tab', async ({ page }) => {
  await login(page);
  // The mocks answer every agent page with echo-agent (agt_0001), which has two messages in its inbox.
  await page.goto('/dashboard/agents/agt_0001');
  await page.getByRole('tab', { name: 'Inbox' }).click();
  const inbox = page.getByTestId('agent-inbox');
  await expect(inbox.locator('tbody tr')).toHaveCount(2);
  await inbox.getByTestId('agent-inbox-status').selectOption('Queued');
  await expect(inbox.locator('tbody tr')).toHaveCount(1);
  await expect(inbox.locator('tbody tr').first()).toContainText('agent-2');
  await inbox.getByTestId('agent-inbox-send').click();
  await expect(page.locator('.modal').getByTestId('message-send-recipient')).toHaveValue('agt_0001');
  await page.locator('.modal').getByRole('button', { name: 'Cancel' }).click();
  await inbox.getByTestId('agent-inbox-thread').first().click();
  await expect(page).toHaveURL(/\/dashboard\/message-threads\/amg_0001\?message=amg_0003$/);
  await expect(page.getByTestId('thread-message')).toHaveCount(4);
});

test('links the Home card\'s rejected count to the Rejected view', async ({ page }) => {
  await page.route(/\/tenants\/default\/messages\?.*status=Rejected.*$/, (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('maxResults') !== '1') return route.fallback();
    return json(route, { success: true, maxResults: 1, skip: 0, totalRecords: 3, recordsRemaining: 2, endOfResults: false, timestampUtc: new Date().toISOString(), objects: [] });
  });
  await login(page);
  await page.goto('/dashboard/home');
  const line = page.getByTestId('home-autonomy-rejected');
  await expect(line).toHaveText('3 messages rejected by loop guards in the last 24 hours');
  await line.locator('a').click();
  await expect(page).toHaveURL(/tab=messages&status=Rejected/);
  await expect(page.getByTestId('messages-view-rejected')).toHaveAttribute('aria-pressed', 'true');
  await expect(rows(page)).toHaveCount(3);
});

test('passes an accessibility scan and lays out at desktop, tablet, and phone widths in both themes', async ({ page }, testInfo) => {
  await login(page);
  const scan = async (label) => {
    // Buttons fade their colors over 0.15s, so let the theme switch finish before measuring contrast.
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))));
    await page.addScriptTag({ content: axe.source });
    const result = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    expect(result.violations.map((v) => `${label}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  };
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const theme = (value) => page.evaluate((v) => document.documentElement.setAttribute('data-theme', v), value);
  for (const mode of ['light', 'dark']) {
    for (const [name, width, height] of [['desktop', 1280, 900], ['tablet', 768, 1000], ['phone', 390, 844]]) {
      // Each width loads the page fresh, so the shell lays out (and collapses its sidebar) as it would on that device.
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard/autonomy?tab=messages&status=Rejected');
      await expect(rows(page)).toHaveCount(3);
      await theme(mode);
      if (name === 'desktop') await scan(`${mode} rejected list`);
      // No body-level horizontal scroll: wide tables scroll inside their frame.
      expect(await overflow(), `${mode} ${name} list`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: testInfo.outputPath(`messages-${mode}-${name}.png`) });

      await page.goto('/dashboard/message-threads/amg_0001?message=amg_0004');
      await expect(page.getByTestId('thread-message')).toHaveCount(4);
      await theme(mode);
      if (name === 'desktop') await scan(`${mode} thread`);
      expect(await overflow(), `${mode} ${name} thread`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: testInfo.outputPath(`message-thread-${mode}-${name}.png`), fullPage: true });

      if (name === 'desktop') {
        // The Send message dialog with a refusal in it.
        await page.route(/\/tenants\/default\/messages$/, (route) => (route.request().method() === 'POST' ? json(route, { error: 'LineRate', code: 'LineRate', message: 'echo-agent already sent 10 messages to agent-2 in the last minute (limit 10).' }, 409) : route.fallback()));
        await page.goto('/dashboard/autonomy?tab=messages');
        await theme(mode);
        await page.getByTestId('messages-send').click();
        await page.locator('.modal').getByTestId('message-send-recipient').selectOption('agt_0002');
        await page.locator('.modal').getByTestId('message-send-subject').fill('Again');
        await page.locator('.modal').getByTestId('message-send-submit').click();
        await expect(page.getByTestId('message-send-rejected')).toBeVisible();
        await scan(`${mode} send dialog`);
        await page.screenshot({ path: testInfo.outputPath(`message-send-${mode}.png`) });
        await page.unroute(/\/tenants\/default\/messages$/);
      }
    }
  }
});
