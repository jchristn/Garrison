// Button height consistency: on every dashboard page, every add dialog, and the dialogs behind each list's row actions,
// buttons and links styled as buttons that sit side by side on one line have the same height (within 0.6 px).

import { test, expect } from '@playwright/test';
import { installMocks, ARCHITECT } from './mocks.js';
import { PAGES, pathFor } from '../../src/config/navConfig.js';

const EXTRA = ['/dashboard/agents/agt_0001', '/dashboard/runs/run_0001', '/dashboard/studio/drf_0001', '/dashboard/studio/drf_0001?tab=items', '/dashboard/studio/drf_0001?tab=apply', '/dashboard/studio/drf_0001?tab=playground', '/dashboard/studio/drf_0001?tab=preview', '/dashboard/studio/drf_0001?tab=prompts', '/dashboard/studio/drf_0001?tab=release', '/dashboard/studio/drf_0001?tab=graph', '/dashboard/conversations/cnv_0001', '/dashboard/prompt-templates/pt_0004', '/dashboard/pipeline-runs/plr_0001', '/dashboard/approvals/apr_0001'];

async function audit(page) {
  return page.evaluate(() => {
    const isBtn = (el) => {
      if (!(el instanceof HTMLElement)) return false;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') return false;
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return false;
      if (el.tagName === 'BUTTON') return !el.classList.contains('button-link') && !el.closest('.data-table td, .tabs, [role=tablist], .action-menu-dropdown, .sidebar, nav, .pagination, .copy-btn');
      if (el.tagName === 'A' && /\bbutton\b|button-(primary|secondary|ghost|danger)/.test(el.className)) return true;
      return false;
    };
    const groups = new Map();
    for (const el of document.querySelectorAll('button, a')) {
      if (!isBtn(el)) continue;
      // Group by the nearest row container: walk up through wrappers that only hold this control.
      let row = el.parentElement;
      while (row && row.children.length === 1 && row.parentElement) row = row.parentElement;
      if (!groups.has(row)) groups.set(row, []);
      groups.get(row).push(el);
    }
    const out = [];
    for (const els of groups.values()) {
      if (els.length < 2) continue;
      // Only buttons on the same line.
      const lines = new Map();
      for (const el of els) {
        const r = el.getBoundingClientRect();
        const key = Math.round(r.top + r.height / 2);
        const near = [...lines.keys()].find((k) => Math.abs(k - key) < 6);
        const k = near ?? key;
        if (!lines.has(k)) lines.set(k, []);
        lines.get(k).push(el);
      }
      for (const items of lines.values()) {
        if (items.length < 2) continue;
        const hs = items.map((e) => Math.round(e.getBoundingClientRect().height * 10) / 10);
        if (Math.max(...hs) - Math.min(...hs) > 0.6) out.push(items.map((e, i) => `${(e.innerText || e.getAttribute('aria-label') || e.className).trim().slice(0, 28)}[${e.tagName.toLowerCase()}.${e.className.split(' ').filter(Boolean).join('.')}]=${hs[i]}`).join(' | '));
      }
    }
    return out;
  });
}

test('buttons side by side have the same height on every page, in add dialogs, and in row action dialogs', async ({ page }) => {
  test.setTimeout(600000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await installMocks(page);
  await page.route(/\/tenants\/[^/]+\/studio\/architects(\?.*)?$/, (r) => r.request().method() === 'GET' ? r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ objects: [ARCHITECT], totalRecords: 1 }) }) : r.fallback());
  await page.goto('/');
  await page.locator('#tenantId').fill('default'); await page.locator('#email').fill('admin@garrison'); await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click(); await expect(page.locator('.dashboard')).toBeVisible();
  const paths = [...PAGES.map((p) => pathFor(p.id)), ...EXTRA];
  const report = [];
  for (const p of paths) {
    await page.goto(p);
    await page.waitForTimeout(700);
    for (const line of await audit(page)) report.push(`${p} :: ${line}`);
    // Open the first modal on pages with an Add button.
    const add = page.getByTestId('add-button');
    if (await add.count()) {
      await add.first().click().catch(() => {});
      await page.waitForTimeout(500);
      for (const line of await audit(page)) report.push(`${p} [add modal] :: ${line}`);
      await page.keyboard.press('Escape');
    }
  }
  // Edit, delete, and row-action dialogs of the first row on each list page.
  for (const p of PAGES.map((x) => pathFor(x.id))) {
    await page.goto(p);
    await page.waitForTimeout(500);
    const trigger = page.locator('.data-table tbody tr').first().locator('.action-menu-trigger');
    if (!(await trigger.count())) continue;
    await trigger.click().catch(() => {});
    const labels = await page.locator('.action-menu-dropdown [role="menuitem"]:not([aria-disabled="true"])').allTextContents();
    await page.keyboard.press('Escape');
    for (const label of labels.filter((l) => !['View JSON', 'Duplicate'].includes(l.trim())).slice(0, 6)) {
      await trigger.click().catch(() => {});
      await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: label.trim() }).first().click().catch(() => {});
      await page.waitForTimeout(500);
      for (const line of await audit(page)) report.push(`${p} [${label.trim()}] :: ${line}`);
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');
      await page.goto(p);
      await page.waitForTimeout(300);
    }
  }
  expect([...new Set(report)]).toEqual([]);
});
