// Activity trail (LP2.10) against mocked APIs. The trail route answers with the LP1.5 fixture: a two-agent message
// chain (the incident lead messages triage, triage fans out, escalates, files a report, and messages the lead back)
// shaped exactly like GET .../runs/{id}/trail. The spec opens the trail from the first run's row menu, steps through it
// with the keyboard, opens a message in the drawer and checks its body is shown as escaped data with its provenance,
// then checks the list view, the narrow layout, both themes, right to left, and an accessibility scan. No native
// dialog is ever used.
//
// Not run by default (targeted-test rule). Run it with: npx playwright test tests/e2e/trail.spec.js

import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { installMocks } from './mocks.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const TRAIL = JSON.parse(fs.readFileSync(path.resolve(here, '../../src/tests/fixtures/runTrail.json'), 'utf8'));
const MARKUP = 'Disk on node 3 is at 97%. <script>window.__pwned = true</script> <b>Please triage.</b>';
const MESSAGE = { id: 'msg_1', threadId: 'msg_1', subject: 'Disk alarm on node 3', body: MARKUP, senderAgentId: 'agt_lead', senderAgentName: 'Incident lead', senderRunId: 'run_a1', recipientAgentId: 'agt_triage', recipientAgentName: 'Triage', status: 'Delivered', urgency: 'Normal', deliveredRunId: 'run_b2', hopCount: 1, createdUtc: '2026-11-27T10:00:21.000Z' };

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const json = (route, body, status = 200) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
  // Registered after installMocks, so these win for the trail and the drawer's message.
  const trailCalls = [];
  page.__trailCalls = trailCalls;
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/runs\/[^/]+\/trail(\?.*)?$/, (route) => {
    trailCalls.push(new URL(route.request().url()));
    return json(route, TRAIL);
  });
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/messages\/msg_1$/, (route) => json(route, MESSAGE));
});

test('opens the trail from the run menu, steps through it with the keyboard, and opens a message', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page);
  await page.goto('/dashboard/runs');
  const first = page.locator('.data-table tbody tr').first();
  await first.locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Open trail' }).click();
  await expect(page).toHaveURL(/\/dashboard\/runs\/[^/?]+\?tab=trail/);
  await expect(page.getByTestId('trail-sequence')).toBeVisible();
  expect(page.__trailCalls.at(-1).searchParams.get('includeEffects')).toBe('true');

  // The sequence is the default view; the focus run holds the single tab stop.
  await expect(page.getByTestId('trail-view-sequence')).toHaveAttribute('aria-pressed', 'true');
  const focus = page.locator('[data-testid="trail-step"][data-step-id="run_b2"]');
  await expect(focus).toHaveClass(/is-focus/);
  await focus.focus();
  // Up from the woken run reaches the message that woke it.
  await page.keyboard.press('ArrowUp');
  await expect(page.locator('[data-testid="trail-step"][data-step-id="msg_1"]')).toBeFocused();
  await page.keyboard.press('Enter');

  const drawer = page.getByTestId('trail-drawer');
  await expect(drawer).toHaveAttribute('data-step-id', 'msg_1');
  await expect(page).toHaveURL(/step=msg_1/);
  const body = drawer.locator('[data-testid="trail-agent-text"][data-text-key="body"]');
  await expect(body.locator('pre')).toHaveText(MARKUP);
  await expect(body.locator('[data-testid="trail-provenance"]')).toHaveText('Written by agent Incident lead in run run_a1');
  await expect(drawer.getByTestId('trail-data-note')).toBeVisible();
  expect(await page.evaluate(() => window.__pwned)).toBeUndefined();
  await expect(drawer.locator('pre b')).toHaveCount(0);

  // Escape closes the drawer and focus goes back to the step.
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(page.locator('[data-testid="trail-step"][data-step-id="msg_1"]')).toBeFocused();

  // The redacted step is a hatched box naming only its kind.
  await expect(page.locator('[data-testid="trail-step"][data-step-id="red_1"]')).toHaveText('Approval (hidden)');
  // No sideways page scroll at 1366x768 with the sidebar open.
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
});

test('lands on a step from an Open trail link and lists the same steps in the list view', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page);
  await page.goto('/dashboard/runs/run_b2?tab=trail&step=esc_1');
  await expect(page.getByTestId('trail-drawer')).toHaveAttribute('data-step-id', 'esc_1');
  await page.getByTestId('trail-view-list').click();
  await expect(page.locator('[data-testid="trail-list-table"] tbody tr')).toHaveCount(15);
  await page.getByTestId('trail-filter-kind').selectOption('Message');
  await expect(page.locator('[data-testid="trail-list-table"] tbody tr')).toHaveCount(2);
  await page.getByTestId('trail-view-graph').click();
  await expect(page.getByTestId('trail-graph')).toBeVisible();
  await expect(page.getByTestId('trail-graph-node')).toHaveCount(15);
});

test('shows only the list below 768px and passes an accessibility scan in both themes and right to left', async ({ page }) => {
  await login(page);
  const scan = async (label) => {
    await page.addScriptTag({ content: axe.source });
    const result = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    expect(result.violations.map((v) => `${label}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  };
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  for (const mode of ['light', 'dark']) {
    for (const [name, width, height] of [['desktop', 1366, 768], ['phone', 390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard/runs/run_b2?tab=trail');
      await page.evaluate((v) => document.documentElement.setAttribute('data-theme', v), mode);
      if (name === 'phone') {
        await expect(page.getByTestId('trail-list')).toBeVisible();
        await expect(page.getByTestId('trail-views')).toHaveCount(0);
        await expect(page.getByTestId('trail-sequence')).toHaveCount(0);
      } else {
        await expect(page.getByTestId('trail-sequence')).toBeVisible();
      }
      expect(await overflow(), `${mode} ${name}`).toBeLessThanOrEqual(0);
      await scan(`${mode} ${name}`);
    }
  }
  // Right to left mirrors the lanes: the caller lane sits on the right.
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto('/dashboard/runs/run_b2?tab=trail');
  await page.evaluate(() => {
    document.documentElement.dir = 'rtl';
  });
  await page.getByTestId('trail-view-list').click();
  await page.getByTestId('trail-view-sequence').click();
  const x = (id) => page.locator(`.trail-lane[data-lane-id="${id}"] .trail-lane-bg`).getAttribute('x').then(Number);
  expect(await x('caller')).toBeGreaterThan(await x('agt_lead'));
});
