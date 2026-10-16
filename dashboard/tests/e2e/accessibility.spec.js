import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { writeFile } from 'node:fs/promises';
import { installMocks } from './mocks.js';
import { PAGES, pathFor } from '../../src/config/navConfig.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

test.beforeEach(async ({ page }) => installMocks(page));

test('WCAG automated audit of login and every dashboard page', async ({ page }, testInfo) => {
  test.setTimeout(300000);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const results = [];
  async function scan(name) {
    await page.addScriptTag({ content: axe.source });
    const result = await page.evaluate(async () => window.axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] }
    }));
    results.push({ page: name, violations: result.violations.map(({ id, impact, description, helpUrl, nodes }) => ({
      id, impact, description, helpUrl,
      nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary }))
    })), incomplete: result.incomplete.map(({ id, nodes }) => ({ id, count: nodes.length })) });
  }
  await page.goto('/');
  await scan('login');
  await login(page);
  for (const route of PAGES) {
    await page.goto(pathFor(route.id));
    await expect(page.locator('.page-header-title').first()).toBeVisible();
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => document.documentElement.setAttribute('data-theme', value), theme);
      await scan(`${route.id}-${theme}`);
    }
  }
  await writeFile(testInfo.outputPath('accessibility-audit.json'), JSON.stringify(results, null, 2));
  await testInfo.attach('accessibility-audit.json', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
  const serious = results.flatMap((result) => result.violations
    .filter(({ impact }) => impact === 'serious' || impact === 'critical')
    .map(({ id, nodes }) => `${result.page}: ${id} (${nodes.length})`));
  expect(serious).toEqual([]);
});

test('modal has a name, traps keyboard focus, closes with Escape, and restores focus', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/agents');
  const add = page.getByTestId('add-button').first();
  await add.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toHaveAccessibleName(/agent/i);
  const close = dialog.getByRole('button', { name: 'Close', exact: true });
  await expect(close).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(dialog.locator(':focus')).toHaveCount(1);
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(add).toBeFocused();
});
