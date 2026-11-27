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

// AA13.9 QA: a file row's meta line used text separators, so a wrapped line ended in a dangling " ·". The dots are
// now drawn before each item and clipped when the item starts a line, so every visible dot sits between two items.
test('meta separators never dangle at a line end when the meta line wraps', async ({ page, request }) => {
  for (const [width, lang] of [[1280, 'en'], [390, 'de'], [390, 'zz']]) {
    await resetMock(request, { scenario: { chunkMs: 50, holdMs: 50, writeFile: { path: 'reports/weekly.md', content: 'x\n', atChunk: 0 } } });
    await page.setViewportSize({ width, height: 800 });
    await openAnonymously(page, `/apps/demo/?lang=${lang}`);
    await send(page, 'Write the weekly report');
    await expect(page.getByTestId('turn').first()).toHaveAttribute('data-phase', 'done');
    if (!(await page.getByTestId('file-panel').isVisible())) await page.getByTestId('toggle-files').click();
    const meta = page.locator('[data-testid="file-item"][data-path="reports/weekly.md"] .file-meta');
    await expect(meta).toBeVisible();
    const check = await meta.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const rtl = style.direction === 'rtl';
      const gap = parseFloat(style.columnGap);
      const items = [...el.children].map((child) => ({ child, r: child.getBoundingClientRect() }));
      const dots = [];
      items.forEach(({ child, r }, i) => {
        const content = getComputedStyle(child, '::before').content;
        if (i === 0 || content === 'none' || content === 'normal') return;
        const dotStart = rtl ? r.right : r.left - gap;
        const dotEnd = rtl ? r.right + gap : r.left;
        dots.push({ visible: dotStart >= box.left - 0.5 && dotEnd <= box.right + 0.5, sameLine: Math.abs(items[i - 1].r.bottom - r.bottom) < 2 });
      });
      return { text: el.textContent, lines: new Set(items.map((x) => Math.round(x.r.bottom))).size, dots };
    });
    // The pseudo-locale pads its strings with the same dot, so only real languages are checked for separator text.
    if (lang !== 'zz') expect(check.text, `${lang} at ${width}: no separator characters in the text`).not.toContain('·');
    expect(check.dots.length, `${lang} at ${width}: separators drawn`).toBeGreaterThan(0);
    for (const dot of check.dots) expect(dot.visible, `${lang} at ${width}: a dot shows only between two items on one line`).toBe(dot.sameLine);
    if (width < 500) expect(check.lines, `${lang} at ${width}: the meta line wraps`).toBeGreaterThan(1);
    await page.evaluate(() => sessionStorage.clear());
  }
});
