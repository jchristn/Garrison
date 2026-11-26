// Organizations on the studio canvas (AA7.10) against the stateful mock of drf_0001 (tests/e2e/canvasMocks.js), here
// holding the research-org organization as well as the research app: the Apps and Organizations switch, units drawn
// nested inside the unit they report to with their leads, members, and peer lines, a unit added from the toolbar that
// then shows in the draft's diff, a second root refused with the field code's text, members added and removed and a
// peer line drawn and removed from the keyboard, a unit removed after a confirmation, and an accessibility scan with no
// horizontal page scroll at desktop and phone widths in both themes. No native dialog is ever used.

import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { installMocks } from './mocks.js';
import { installCanvasMocks, orgCanvasState } from './canvasMocks.js';

const GRAPH = '/dashboard/studio/drf_0001?tab=graph';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const unit = (page, name) => page.locator(`.react-flow__node[data-id="${name}"]`);

async function openOrganizations(page) {
  await page.goto(GRAPH);
  // The canvas remembers the view per draft, so a reload may already show organizations.
  await expect(page.getByTestId('studio-canvas-view-organizations')).toBeVisible();
  await page.getByTestId('studio-canvas-view-organizations').click();
  await expect(unit(page, 'Leadership')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('adds a unit on the canvas and sees it in the draft diff', async ({ page }) => {
  const { state } = await installCanvasMocks(page, orgCanvasState());
  await login(page);
  await openOrganizations(page);
  await expect(page.getByTestId('studio-canvas-view-organizations')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  await expect(page.getByTestId('studio-org-summary')).toHaveText('Organization research-org has 3 units. The root unit is Leadership. There is 1 peer line.');
  await expect(page.locator('[data-unit-line="Research"]')).toHaveText('Research reports to Leadership and is led by researcher.');
  await expect(page.locator('[data-unit-people="Research"]')).toContainText('writer');
  await expect(page.locator('.react-flow__edge[data-peer="Research~Publishing"]')).toHaveCount(1);
  // Research and Publishing sit inside Leadership's box.
  const outer = await unit(page, 'Leadership').boundingBox();
  const inner = await unit(page, 'Research').boundingBox();
  expect(inner.x).toBeGreaterThan(outer.x);
  expect(inner.y).toBeGreaterThan(outer.y);
  expect(inner.x + inner.width).toBeLessThan(outer.x + outer.width);
  expect(inner.y + inner.height).toBeLessThan(outer.y + outer.height);

  await page.getByTestId('studio-org-add-unit').fill('Archive');
  await page.getByTestId('studio-org-add-parent').selectOption('Research');
  await page.getByTestId('studio-org-add-lead').fill('reviewer');
  await page.getByTestId('studio-org-add-role').fill('Archivist');
  await page.getByTestId('studio-org-add').click();
  await expect(unit(page, 'Archive')).toBeFocused();
  await expect(page.getByTestId('studio-unit-panel')).toContainText('Unit Archive');
  await expect(page.getByTestId('studio-canvas-announce')).toHaveText('Added unit Archive to research-org.');
  expect(state.operations.at(-1)).toEqual({ version: 3, operation: 'AddUnit', organization: 'research-org', unit: 'Archive', parent: 'Research', agent: 'reviewer', role: 'Archivist' });
  await expect(page.locator('[data-unit-line="Archive"]')).toHaveText('Archive reports to Research and is led by reviewer.');

  await page.getByRole('tab', { name: 'Diff and apply' }).click();
  const row = page.locator('tr[data-diff="Organization/research-org"]');
  await expect(row).toContainText('Update');
  await expect(row).toContainText('units');
  await expect(row).toContainText('Archive');
});

test('refuses a second root, and edits members, peer lines, and units by keyboard and panel', async ({ page }) => {
  const { state } = await installCanvasMocks(page, orgCanvasState());
  await login(page);
  await openOrganizations(page);

  // A unit with no parent would be a second root: the server refuses it and the canvas says why.
  await page.getByTestId('studio-org-add-unit').fill('Rogue');
  await page.getByTestId('studio-org-add-parent').selectOption('');
  await page.getByTestId('studio-org-add-unit').press('Enter');
  const error = page.getByTestId('studio-canvas-error');
  await expect(error).toContainText('Adding a unit');
  await expect(error.locator('[data-field-error="parent"]')).toContainText('The organization already has a root unit. Pick a parent for this unit.');
  await expect(unit(page, 'Rogue')).toHaveCount(0);

  // Keyboard: select Publishing, add a member from its panel, then draw a peer line from it to Leadership with C.
  await unit(page, 'Publishing').focus();
  await page.keyboard.press('Enter');
  const panel = page.getByTestId('studio-unit-panel');
  await expect(panel).toContainText('Unit Publishing');
  await panel.getByTestId('studio-unit-member-agent').fill('writer');
  await panel.getByTestId('studio-unit-member-title').fill('Copy editor');
  await panel.getByTestId('studio-unit-member-title').press('Enter');
  await expect(page.locator('[data-unit-people="Publishing"]')).toContainText('writer');
  expect(state.operations.at(-1)).toMatchObject({ operation: 'AddUnitMember', organization: 'research-org', unit: 'Publishing', agent: 'writer', role: 'Copy editor' });
  await panel.getByTestId('studio-unit-remove-member-writer').click();
  await expect(page.locator('[data-unit-people="Publishing"]')).not.toContainText('writer');

  await unit(page, 'Publishing').focus();
  await page.keyboard.press('c');
  await expect(page.getByTestId('studio-org-connect-bar')).toContainText('Drawing a peer line from Publishing');
  await unit(page, 'Leadership').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-peer-line="Publishing~Leadership"]')).toHaveText('Publishing and Leadership have a peer line.');
  expect(state.operations.at(-1)).toMatchObject({ operation: 'ConnectUnits', organization: 'research-org', from: 'Publishing', to: 'Leadership' });

  // The outline lists peer lines as buttons; Delete removes one.
  await page.locator('[data-peer-line="Research~Publishing"]').focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('[data-peer-line="Research~Publishing"]')).toHaveCount(0);
  expect(state.operations.at(-1)).toMatchObject({ operation: 'DisconnectUnits', from: 'Research', to: 'Publishing' });

  // Delete on a unit asks first; Leadership has units below it, so the server refuses.
  await unit(page, 'Leadership').focus();
  await page.keyboard.press('Delete');
  await page.getByTestId('confirm-button').click();
  await expect(page.getByTestId('studio-canvas-error').locator('[data-field-error="unit"]')).toContainText('Remove the units below this one first.');
  await unit(page, 'Publishing').focus();
  await page.keyboard.press('Delete');
  await expect(page.locator('.modal')).toContainText('Remove unit Publishing from organization research-org');
  await page.getByTestId('confirm-button').click();
  await expect(unit(page, 'Publishing')).toHaveCount(0);
  await expect(page.locator('[data-peer-line="Publishing~Leadership"]')).toHaveCount(0);
  expect(state.operations.at(-1)).toMatchObject({ operation: 'RemoveUnit', organization: 'research-org', unit: 'Publishing' });
  for (const op of state.operations.filter((o) => o.operation !== 'MoveNode')) expect(op.app, op.operation).toBeUndefined();
});

test('the organization canvas passes an accessibility scan and lays out at desktop and phone widths', async ({ page }, testInfo) => {
  await installCanvasMocks(page, orgCanvasState());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await login(page);
  const scan = async (label) => {
    await page.addScriptTag({ content: axe.source });
    const result = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] } }));
    const serious = result.violations.filter(({ impact }) => impact === 'serious' || impact === 'critical');
    expect(serious.map((v) => `${label}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  };
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const theme = (value) => page.evaluate((v) => document.documentElement.setAttribute('data-theme', v), value);
  for (const [name, width, height] of [['desktop', 1280, 900], ['phone', 390, 844]]) {
    await page.setViewportSize({ width, height });
    await openOrganizations(page);
    for (const mode of ['light', 'dark']) {
      await theme(mode);
      await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))));
      await scan(`${mode} ${name} organization`);
      expect(await overflow(), `${mode} ${name} organization`).toBeLessThanOrEqual(1);
      await unit(page, 'Research').click();
      await expect(page.getByTestId('studio-unit-panel')).toBeVisible();
      await scan(`${mode} ${name} unit panel`);
      await page.getByTestId('studio-unit-start-peer').click();
      await expect(page.getByTestId('studio-org-connect-bar')).toBeVisible();
      await scan(`${mode} ${name} peer line`);
      expect(await overflow(), `${mode} ${name} peer line`).toBeLessThanOrEqual(1);
      await page.getByTestId('studio-org-connect-cancel').click();
      await page.locator('[data-peer-line="Research~Publishing"]').click();
      await expect(page.getByTestId('studio-peer-panel')).toBeVisible();
      await scan(`${mode} ${name} peer panel`);
      await page.screenshot({ path: testInfo.outputPath(`canvas-org-${mode}-${name}.png`), fullPage: true });
    }
  }
});
