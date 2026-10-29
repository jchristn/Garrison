import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { writeFile } from 'node:fs/promises';
import { installMocks } from './mocks.js';
import { installCanvasMocks } from './canvasMocks.js';
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

test('the studio canvas passes the WCAG audit in light and dark, with each property panel open', async ({ page }, testInfo) => {
  test.setTimeout(120000);
  await installCanvasMocks(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const results = [];
  async function scan(name) {
    await page.addScriptTag({ content: axe.source });
    const result = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }));
    results.push({ page: name, violations: result.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) })) });
  }
  async function bothThemes(name) {
    for (const theme of ['light', 'dark']) {
      await page.evaluate((value) => document.documentElement.setAttribute('data-theme', value), theme);
      await scan(`${name}-${theme}`);
    }
  }
  await login(page);
  await page.goto('/dashboard/studio/drf_0001?tab=graph');
  await expect(page.locator('.react-flow__node[data-id="planner"]')).toBeVisible();
  await bothThemes('canvas-app');
  await page.locator('.react-flow__node[data-id="writer"]').click();
  await expect(page.getByTestId('studio-agent-panel')).toBeVisible();
  await bothThemes('canvas-agent');
  await page.getByTestId('studio-canvas-connect').click();
  await bothThemes('canvas-connecting');
  await page.getByTestId('studio-canvas-connect-cancel').click();
  await page.getByRole('tab', { name: 'Runtime' }).click();
  await expect(page.getByTestId('studio-runtime-form')).toBeVisible();
  await bothThemes('canvas-runtime');
  await page.locator('[data-call="planner>writer"]').click();
  await expect(page.getByTestId('studio-edge-panel')).toBeVisible();
  await bothThemes('canvas-call');
  await testInfo.attach('canvas-accessibility.json', { body: JSON.stringify(results, null, 2), contentType: 'application/json' });
  const serious = results.flatMap((r) => r.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical').map(({ id, nodes }) => `${r.page}: ${id} (${nodes.length}) ${JSON.stringify(nodes[0]?.target)} ${nodes[0]?.failureSummary || ''}`));
  expect(serious).toEqual([]);
});

test('the canvas focus order runs from the toolbar through the agents to the calls and the panel', async ({ page }) => {
  await installCanvasMocks(page);
  await login(page);
  await page.goto('/dashboard/studio/drf_0001?tab=graph');
  await expect(page.locator('.react-flow__node[data-id="planner"]')).toBeVisible();
  await page.getByTestId('studio-canvas-fit').focus();
  const order = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    order.push(await page.evaluate(() => {
      const el = document.activeElement;
      return el?.getAttribute('data-id') || el?.getAttribute('data-call') || el?.tagName.toLowerCase();
    }));
  }
  // The shortcuts summary, the agents in reading order (entry first), then each call.
  expect(order.slice(0, 6)).toEqual(['summary', 'planner', 'researcher', 'writer', 'planner>researcher', 'planner>writer']);
  const flow = page.locator('.react-flow');
  await expect(flow).toHaveAttribute('aria-label', 'Canvas of app research');
  await expect(page.locator(`#${await flow.getAttribute('aria-describedby')}`)).toHaveText('App research has 3 agents. There are 2 calls between them. The entry agent is planner.');
});
