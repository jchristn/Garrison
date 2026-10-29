// Accessibility: an axe WCAG 2.2 AA audit of every screen in light and dark themes (no serious or critical
// violations), keyboard use of the chat and the version dialog, and a 360 px wide phone layout with no horizontal
// scroll. Branding uses a pale primary color here so the readable-text logic is exercised.
import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { openAnonymously, resetMock, send } from './helpers.js';

async function scan(page, name, results) {
  // Evaluated rather than added as a script tag, so the image's Content-Security-Policy (no inline scripts) allows it.
  await page.evaluate(axe.source);
  const result = await page.evaluate(async () =>
    window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } })
  );
  for (const v of result.violations) {
    if (v.impact === 'serious' || v.impact === 'critical') results.push(`${name}: ${v.id} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
  }
}

async function bothThemes(page, name, results) {
  for (const theme of ['light', 'dark']) {
    await page.evaluate((value) => document.documentElement.setAttribute('data-theme', value), theme);
    await scan(page, `${name}-${theme}`, results);
  }
}

test('WCAG audit of sign-in, chat, files, and dialog in both themes', async ({ page, request }) => {
  test.setTimeout(120000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await resetMock(request, {
    app: { primaryColor: '#fde68a', accentColor: '#7c3aed', showOperatorDetail: true },
    scenario: { approvalMs: 800, chunkMs: 50, holdMs: 50, writeFile: { path: 'out/a.md', content: '# A\n', atChunk: 0 } }
  });
  const results = [];
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/apps/demo/');
  await expect(page.getByTestId('signin-anonymous')).toBeVisible();
  await bothThemes(page, 'sign-in', results);
  await page.getByTestId('signin-anonymous').click();
  await expect(page.getByTestId('welcome')).toBeVisible();
  await bothThemes(page, 'welcome', results);
  await send(page, 'Go');
  await expect(page.getByTestId('approval-notice')).toBeVisible();
  await bothThemes(page, 'approval', results);
  await expect(page.getByTestId('turn').first()).toHaveAttribute('data-phase', 'done');
  await bothThemes(page, 'answer', results);
  await page.getByTestId('file-versions').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await bothThemes(page, 'versions', results);
  await page.goto('/apps/missing-app/');
  await bothThemes(page, 'not-found', results);
  expect(results).toEqual([]);
});

test('follows the system theme until the toggle saves a choice', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/apps/demo/');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByTestId('theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.evaluate(() => localStorage.removeItem('garrison.app.theme'));
});

test('the chat works from the keyboard', async ({ page, request }) => {
  await resetMock(request, { scenario: { chunkMs: 30, holdMs: 30 } });
  await openAnonymously(page);
  await expect(page.getByTestId('composer-input')).toBeFocused();
  await page.keyboard.type('Typed with the keyboard');
  await page.keyboard.press('Shift+Enter');
  await page.keyboard.type('second line');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('turn').first().locator('.message-user .message-text')).toHaveText('Typed with the keyboard\nsecond line');
  await expect(page.getByTestId('turn').first()).toHaveAttribute('data-phase', 'done');
  // The skip link shows when focused and moves focus to the message box.
  const skip = page.locator('.skip-link');
  await skip.focus();
  expect((await skip.boundingBox()).y).toBeGreaterThanOrEqual(0);
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('composer-input')).toBeFocused();
});

test('fits a 360 px wide phone without horizontal scrolling', async ({ page, request }) => {
  await resetMock(request, { scenario: { chunks: ['A long answer with a very_long_unbroken_identifier_that_must_wrap_somewhere_in_the_bubble. '], chunkMs: 30, holdMs: 30, writeFile: { path: 'reports/2026/october/very-long-file-name-for-wrapping.md', content: 'x', atChunk: 0 } } });
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/apps/demo/');
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.getByTestId('signin-anonymous').click();
  await expect(page.locator('#conversation-sidebar')).toBeHidden();
  await expect(page.locator('#file-sidebar')).toBeHidden();
  await send(page, 'Hello from a phone');
  await expect(page.getByTestId('turn').first()).toHaveAttribute('data-phase', 'done');
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.getByTestId('toggle-files').click();
  await expect(page.locator('[data-testid="file-item"]')).toHaveCount(1);
  expect(await overflow()).toBeLessThanOrEqual(0);
  await page.getByRole('button', { name: 'Close files' }).click();
  await page.getByTestId('toggle-conversations').click();
  await expect(page.getByTestId('conversation-item')).toHaveCount(1);
  expect(await overflow()).toBeLessThanOrEqual(0);
});
