// The file panel (AD6.9): a file the agent writes appears while the turn is still running, downloads with a
// matching SHA-256 (through the download URL and through the version history), and a new version shows up live.
import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { openAnonymously, resetMock, send } from './helpers.js';

const REPORT_V1 = '# Weekly report\n\nRevenue grew 4 percent. Churn held steady.\n';
const REPORT_V2 = '# Weekly report\n\nRevenue grew 4 percent. Churn held steady.\n\n## Risks\n\nNone new.\n';
const sha = (text) => createHash('sha256').update(text).digest('hex');

async function downloadedSha(download) {
  const path = await download.path();
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
});

test('shows a file while the agent runs and downloads it with a matching SHA-256', async ({ page, request }) => {
  await resetMock(request, {
    scenario: {
      chunks: ['Writing ', 'the ', 'report ', 'now. ', 'Done.'],
      chunkMs: 400,
      holdMs: 1500,
      writeFile: { path: 'reports/weekly.md', content: REPORT_V1, atChunk: 1, secondVersion: REPORT_V2 }
    }
  });
  await openAnonymously(page);
  await expect(page.getByTestId('file-panel')).toBeVisible();
  await expect(page.getByTestId('file-panel')).toContainText('Files the agent writes show up here once a conversation starts.');
  await send(page, 'Write the weekly report');

  const turn = page.getByTestId('turn').first();
  const item = page.locator('[data-testid="file-item"][data-path="reports/weekly.md"]');
  await expect(item).toBeVisible();
  // The file showed up before the turn finished.
  expect(await turn.getAttribute('data-phase')).not.toBe('done');
  await expect(item.locator('.badge-new')).toBeVisible();
  await expect(page.getByTestId('toggle-files').locator('.count-badge')).toHaveText('1');

  // A second version arrives live.
  await expect(item).toContainText('Version 2');
  await expect(turn).toHaveAttribute('data-phase', 'done');

  const [current] = await Promise.all([page.waitForEvent('download'), item.getByTestId('file-download').click()]);
  expect(current.suggestedFilename()).toBe('weekly.md');
  expect(await downloadedSha(current)).toBe(sha(REPORT_V2));

  // Version history, newest first, and an earlier version downloads with its own hash.
  await item.getByTestId('file-versions').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAccessibleName('Versions of reports/weekly.md');
  const versions = dialog.locator('.version-item');
  await expect(versions).toHaveCount(2);
  await expect(versions.nth(0)).toContainText('Version 2');
  await expect(versions.nth(0)).toContainText('Current');
  await expect(versions.nth(1)).toContainText(sha(REPORT_V1).slice(0, 12));
  const [older] = await Promise.all([page.waitForEvent('download'), versions.nth(1).getByTestId('version-download').click()]);
  expect(await downloadedSha(older)).toBe(sha(REPORT_V1));
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(item.getByTestId('file-versions')).toBeFocused();
});

test('falls back to the content route when a download URL cannot be issued', async ({ page, request }) => {
  await resetMock(request, { scenario: { chunkMs: 50, holdMs: 50, writeFile: { path: 'notes.txt', content: 'plain notes\n', atChunk: 0 } } });
  await openAnonymously(page);
  await send(page, 'Take notes');
  await expect(page.getByTestId('turn').first()).toHaveAttribute('data-phase', 'done');
  await page.route('**/files/download-url**', (route) => route.fulfill({ status: 500, contentType: 'application/json', body: '{"code":"InternalError"}' }));
  const item = page.locator('[data-testid="file-item"][data-path="notes.txt"]');
  const [download] = await Promise.all([page.waitForEvent('download'), item.getByTestId('file-download').click()]);
  expect(download.suggestedFilename()).toBe('notes.txt');
  expect(await downloadedSha(download)).toBe(sha('plain notes\n'));
});
