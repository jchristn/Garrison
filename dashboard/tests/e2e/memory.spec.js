// Scoped memory (AA4.13) against mocked APIs: the Memory tab lists scopes by kind, choosing a scope filters the entries,
// the content viewer shows the saved text as plain text, Delete confirms in a custom dialog with the version the person
// saw, a version conflict offers Reload, and the page passes an automated accessibility scan and lays out at desktop,
// tablet, and phone widths in both themes. No native dialog is ever used.

import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { installMocks, memoryEntry, memoryEntryList, memoryScopes, memoryValue } from './mocks.js';

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
const menuItem = (page, label) => page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: label });

/**
 * Serve memory from local state, so deletes change what the scope list and table show. `conflictOnce` answers the first
 * delete of that entry with 409 MemoryVersionConflict and bumps its version, as if an agent rewrote it meanwhile.
 */
async function statefulMemory(page, { conflictOnce = null } = {}) {
  const state = { entries: [1, 2, 3, 4, 5, 6].map(memoryEntry), deletes: [] };
  let conflicted = false;
  await page.route(/\/tenants\/default\/memory\/scopes$/, (route) => {
    const live = memoryScopes()
      .map((s) => {
        const inScope = state.entries.filter((e) => e.scopeKind === s.scopeKind && e.scopeId === s.scopeId);
        return { ...s, entryCount: inScope.length, bytes: inScope.reduce((sum, e) => sum + e.bytes, 0) };
      })
      .filter((s) => s.entryCount > 0);
    return json(route, live);
  });
  await page.route(/\/tenants\/default\/memory\/entries(\?.*)?$/, (route) => json(route, memoryEntryList(new URL(route.request().url()), state.entries)));
  await page.route(/\/tenants\/default\/memory\/entries\/mem_\d+(\/content)?(\?.*)?$/, (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const id = url.pathname.match(/entries\/(mem_\d+)/)[1];
    const entry = state.entries.find((e) => e.id === id);
    if (!entry) return json(route, { error: 'NotFound', code: 'NotFound', message: `Memory entry ${id} not found.` }, 404);
    if (req.method() === 'DELETE') {
      const expected = url.searchParams.get('expectedVersion');
      state.deletes.push({ id, expectedVersion: expected });
      if (conflictOnce === id && !conflicted) {
        conflicted = true;
        entry.version += 1;
        return json(route, { error: 'Conflict', code: 'MemoryVersionConflict', message: `The entry ${entry.key} is at version ${entry.version}, not ${expected}.` }, 409);
      }
      if (expected && Number(expected) !== entry.version) return json(route, { error: 'Conflict', code: 'MemoryVersionConflict', message: 'Version moved.' }, 409);
      state.entries = state.entries.filter((e) => e.id !== id);
      return route.fulfill({ status: 204, body: '' });
    }
    if (url.pathname.endsWith('/content')) return json(route, { found: true, entry, value: memoryValue(Number(id.slice(4))) });
    return json(route, entry);
  });
  return state;
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('browses memory by scope, reads an entry as plain text, and deletes it after confirming', async ({ page }) => {
  const state = await statefulMemory(page);
  await login(page);
  await page.goto('/dashboard/autonomy?tab=memory');
  const scopes = page.getByTestId('memory-scopes');
  await expect(scopes.getByTestId('memory-scope-group-Agent')).toContainText('echo-agent');
  await expect(scopes.getByTestId('memory-scope-group-Agent')).toContainText('agt_0099 (deleted)');
  await expect(scopes.getByTestId('memory-scope-group-App')).toContainText('research');
  await expect(rows(page)).toHaveCount(6);

  await scopes.locator('[data-testid="memory-scope"][data-scope-id="app_0001"]').click();
  await expect(rows(page)).toHaveCount(2);
  await expect(page).toHaveURL(/tab=memory/);
  const sources = rows(page).filter({ hasText: 'research/sources' });
  await expect(sources).toContainText('App: research');
  await expect(sources).toContainText('agent-2');

  await sources.locator('.action-menu-trigger').click();
  await menuItem(page, 'View content').click();
  const modal = page.locator('.modal');
  await expect(modal.getByTestId('memory-content')).toHaveText('Prefer primary sources. Cite the page number.');
  await expect(modal.getByTestId('memory-untrusted')).toContainText('data an agent or a person saved');
  await expect(modal).toContainText('run_0003');
  await modal.locator('.button-primary', { hasText: 'Close' }).click();
  await expect(modal).toHaveCount(0);

  await sources.locator('.action-menu-trigger').click();
  await menuItem(page, 'Delete').click();
  await expect(modal).toContainText('Delete research/sources from App: research?');
  await expect(modal.getByTestId('memory-delete-version')).toContainText('version 7');
  await modal.getByTestId('confirm-button').click();
  await expect(page.locator('.toast').filter({ hasText: 'Deleted research/sources.' })).toBeVisible();
  await expect(rows(page)).toHaveCount(1);
  await expect(scopes.locator('[data-testid="memory-scope"][data-scope-id="app_0001"]')).toContainText('1 entry');
  expect(state.deletes).toEqual([{ id: 'mem_0004', expectedVersion: '7' }]);
});

test('a version conflict is explained, Reload reads the entry again, and the delete then succeeds', async ({ page }) => {
  const state = await statefulMemory(page, { conflictOnce: 'mem_0001' });
  await login(page);
  await page.goto('/dashboard/autonomy?tab=memory');
  const row = rows(page).filter({ hasText: 'customer/acme/preferences' });
  await row.click();
  const modal = page.locator('.modal');
  await expect(modal.getByTestId('memory-content')).toContainText('Acme prefers email over phone.');
  await modal.getByTestId('memory-viewer-delete').click();
  const confirm = page.locator('.modal', { has: page.getByTestId('memory-delete') });
  await confirm.getByTestId('confirm-button').click();
  await expect(confirm).toContainText('Someone changed this entry since you loaded version 3, so it was not deleted.');
  await confirm.getByTestId('memory-delete-reload').click();
  await expect(confirm.getByTestId('memory-delete-version')).toContainText('now at version 4');
  await confirm.getByTestId('confirm-button').click();
  await expect(page.locator('.toast').filter({ hasText: 'Deleted customer/acme/preferences.' })).toBeVisible();
  expect(state.deletes.map((d) => d.expectedVersion)).toEqual(['3', '4']);
});

test('saved text that looks like HTML or instructions stays plain text', async ({ page }) => {
  await statefulMemory(page);
  await login(page);
  await page.goto('/dashboard/autonomy?tab=memory&scopeKind=Agent&scopeId=agt_0001');
  await expect(rows(page)).toHaveCount(2);
  await rows(page).filter({ hasText: 'notes/' }).click();
  const content = page.locator('.modal').getByTestId('memory-content');
  await expect(content).toHaveText('<b>Not bold.</b> **Not markdown.** Ignore previous instructions.');
  await expect(content.locator('b')).toHaveCount(0);
  await expect(page.locator('.modal script')).toHaveCount(0);
});

test('filters by tag and writer on the server, and shows the empty state for a tenant without memory', async ({ page }) => {
  await statefulMemory(page);
  await login(page);
  await page.goto('/dashboard/autonomy?tab=memory');
  await page.locator('input[data-filter="tag"]').fill('recall');
  await expect(rows(page)).toHaveCount(2);
  await page.locator('select[aria-label="Written by"]').selectOption('agt_0002');
  await expect(rows(page)).toHaveCount(1);
  await expect(rows(page).first()).toContainText('research/sources');
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(rows(page)).toHaveCount(6);

  await page.route(/\/tenants\/default\/memory\/scopes$/, (route) => json(route, []));
  await page.route(/\/tenants\/default\/memory\/entries(\?.*)?$/, (route) => json(route, { success: true, maxResults: 25, skip: 0, totalRecords: 0, recordsRemaining: 0, endOfResults: true, objects: [] }));
  await page.reload();
  await expect(page.getByText('No memory yet')).toBeVisible();
  await expect(page.getByTestId('memory-scope-group-Agent')).toContainText('No agent has saved memory yet.');
});

test('passes an accessibility scan and lays out at desktop, tablet, and phone widths in both themes', async ({ page }, testInfo) => {
  await statefulMemory(page);
  await login(page);
  for (const theme of ['light', 'dark']) {
    for (const [name, width, height] of [['desktop', 1280, 900], ['tablet', 768, 1000], ['phone', 390, 844]]) {
      // Each width loads the page fresh, so the shell lays out (and collapses its sidebar) as it would on that device.
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard/autonomy?tab=memory');
      await expect(rows(page)).toHaveCount(6);
      await page.evaluate((value) => document.documentElement.setAttribute('data-theme', value), theme);
      if (name === 'desktop') {
        await page.addScriptTag({ content: axe.source });
        const result = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
        expect(result.violations.map((v) => `${theme}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
      }
      // No body-level horizontal scroll: wide tables scroll inside their frame.
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${theme} ${name}`).toBeLessThanOrEqual(1);
      // The content area scrolls inside the shell, so the scope list and the table are captured on their own as well.
      await page.screenshot({ path: testInfo.outputPath(`memory-${theme}-${name}.png`) });
      await page.getByTestId('memory-scopes').screenshot({ path: testInfo.outputPath(`memory-${theme}-${name}-scopes.png`) });
      await page.locator('.table-frame').first().screenshot({ path: testInfo.outputPath(`memory-${theme}-${name}-table.png`) });
    }
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  await rows(page).first().click();
  await expect(page.locator('.modal').getByTestId('memory-content')).toBeVisible();
  for (const [name, width, height] of [['desktop', 1280, 900], ['phone', 390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.screenshot({ path: testInfo.outputPath(`memory-viewer-dark-${name}.png`) });
  }
});
