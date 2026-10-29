// The app UI half of the studio end-to-end flow (AD12.11): the app the studio built and applied ("docs") opens at its
// URL, a two-turn conversation streams both answers, the second turn writes a file into the conversation's file
// space, and the file downloads with the content the agent wrote. The sign-in screen names the platform (AD12.12).
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { MOCK, openAnonymously, resetMock, send } from './helpers.js';

const OUTLINE = '# Onboarding guide\n\n1. Accounts\n2. Tools\n3. First week\n';

test.beforeEach(async ({ page, request }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await page.setViewportSize({ width: 1280, height: 800 });
  await resetMock(request, {
    app: { slug: 'docs', displayName: 'Docs', description: 'Plans and writes documents.', welcomeText: 'Ask **Docs** for a document.', logoUrl: '/v1.0/apps/docs/logo' },
    scenario: { chunks: ['I will ', 'plan ', 'the guide ', 'first.'], chunkMs: 120, holdMs: 200 }
  });
});

test('a two-turn conversation with the studio-built app produces a file that downloads', async ({ page, request }) => {
  await page.goto('/apps/docs/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sign in to Docs');
  const powered = page.getByTestId('powered-by');
  await expect(powered).toHaveText('Built with Garrison Agent Studio');
  await expect(powered).toHaveAttribute('href', 'https://usegarrison.ai');
  await expect(powered).toHaveAttribute('target', '_blank');

  await openAnonymously(page, '/apps/docs/');
  await expect(page.getByTestId('welcome')).toContainText('Ask Docs for a document.');

  // Turn 1: the planner answers without writing anything.
  await send(page, 'Write an onboarding guide for new engineers.');
  await expect(page).toHaveURL(/\/apps\/docs\/c\/cnv_\d+$/);
  const first = page.getByTestId('turn').nth(0);
  await expect(first).toHaveAttribute('data-phase', 'done');
  await expect(first.getByTestId('answer')).toHaveText('I will plan the guide first.');
  await expect(page.getByTestId('file-panel')).toContainText('The agent has not written any files in this conversation yet.');

  // Turn 2: the writer saves the guide into the conversation's file space while it answers.
  await request.post(`${MOCK}/__mock/scenario`, { data: { chunks: ['Here is ', 'the guide; ', 'it is in ', 'guide.md.'], writeFile: { path: 'guide.md', content: OUTLINE, atChunk: 1 } } });
  await send(page, 'Go ahead and write it.');
  const second = page.getByTestId('turn').nth(1);
  await expect(second).toHaveAttribute('data-phase', 'done');
  await expect(second.getByTestId('answer')).toHaveText('Here is the guide; it is in guide.md.');
  await expect(page.getByTestId('turn')).toHaveCount(2);

  const item = page.locator('[data-testid="file-item"][data-path="guide.md"]');
  await expect(item).toBeVisible();
  await expect(item).toContainText('Version 1');
  const [download] = await Promise.all([page.waitForEvent('download'), item.getByTestId('file-download').click()]);
  expect(download.suggestedFilename()).toBe('guide.md');
  expect(await readFile(await download.path(), 'utf8')).toBe(OUTLINE);
});
