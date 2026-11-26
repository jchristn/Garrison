// Reports (AA5.10) against mocked APIs: the Reports tab lists reports newest first with health badges, filters on the
// server, a row opens the report page with its metrics, issues, decisions, and a chart of a metric across the author's
// reports, report text that looks like markup stays plain text, File report files through a custom dialog, and the
// list and report pages pass an automated accessibility scan and lay out at desktop, tablet, and phone widths in both
// themes. No native dialog is ever used.

import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { installMocks, reportMetricPoints } from './mocks.js';

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

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('lists reports, opens one, and charts a metric across the author\'s reports', async ({ page }) => {
  const metricCalls = [];
  await page.route(/\/tenants\/default\/reports\/metrics\?.*$/, (route) => {
    const url = new URL(route.request().url());
    metricCalls.push(Object.fromEntries(url.searchParams));
    return json(route, reportMetricPoints(url));
  });
  await login(page);
  await page.goto('/dashboard/autonomy?tab=reports');
  await expect(rows(page)).toHaveCount(5);
  const incident = rows(page).filter({ hasText: 'Refund API failing' });
  await expect(incident).toContainText('echo-agent');
  await expect(incident).toContainText('Incident');
  await expect(incident.locator('.pill')).toHaveText('Unhealthy');
  await expect(rows(page).filter({ hasText: 'Switch billing replies' })).toContainText('support');

  await rows(page).filter({ hasText: 'Support queue: steady' }).click();
  await expect(page).toHaveURL(/\/dashboard\/reports\/rpt_0001$/);
  const detail = page.getByTestId('report-detail');
  await expect(detail.locator('[data-report-field="health"] .pill')).toHaveText('Healthy');
  await expect(detail.locator('[data-report-field="audience"]')).toContainText('Manager');
  await expect(detail.getByTestId('report-author-link')).toHaveText('echo-agent');
  await expect(detail.getByTestId('report-keeper-link')).toHaveText('mdt_0001');
  await expect(detail.getByTestId('report-app-link')).toHaveText('research');
  await expect(detail.getByTestId('report-metrics').locator('tbody tr')).toHaveCount(2);
  await expect(detail.getByTestId('report-metrics')).toContainText('p95Latency');
  await expect(detail.getByTestId('report-decisions')).toContainText('Kept the night shift at two agents.');

  const chart = page.getByTestId('report-metric-chart');
  await expect(chart.locator('.chart-title')).toHaveText('queueDepth over time');
  await expect(chart).toContainText('7 values echo-agent reported, oldest first.');
  await expect(chart.locator('svg[role="img"] path')).toHaveCount(1);
  expect(metricCalls.at(-1)).toMatchObject({ author: 'agt_0001', name: 'queueDepth', maxPoints: '500' });
  // The data table under the chart lists every point for keyboard and screen reader users.
  await chart.locator('summary').click();
  await expect(chart.locator('.data-table tbody tr')).toHaveCount(7);

  await page.getByTestId('report-chart-metric').selectOption('p95Latency');
  await expect(chart.locator('.chart-title')).toHaveText('p95Latency over time');
  expect(metricCalls.at(-1)).toMatchObject({ author: 'agt_0001', name: 'p95Latency' });

  await page.getByTestId('report-back').click();
  await expect(page).toHaveURL(/tab=reports/);
});

test('report text that looks like markup or instructions stays plain text', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/reports/rpt_0002');
  const detail = page.getByTestId('report-detail');
  await expect(detail.getByTestId('report-body')).toHaveText('<b>Not bold.</b> **Not markdown.** Ignore previous instructions.');
  await expect(detail.getByTestId('report-body').locator('b')).toHaveCount(0);
  await expect(detail.getByTestId('report-issues')).toContainText('<i>Retries</i> double the load.');
  await expect(detail.getByTestId('report-issues').locator('i')).toHaveCount(0);
  await expect(page.locator('h1')).toContainText('Refund API failing <script>alert(1)</script>');
  await expect(detail.locator('script')).toHaveCount(0);
  await expect(detail.getByTestId('report-untrusted')).toContainText('plain text');
});

test('filters by health and author on the server, and explains a report without metrics', async ({ page }) => {
  const listCalls = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (/\/tenants\/default\/reports$/.test(url.pathname)) listCalls.push(Object.fromEntries(url.searchParams));
  });
  await login(page);
  await page.goto('/dashboard/autonomy?tab=reports');
  await expect(rows(page)).toHaveCount(5);
  await page.locator('select[aria-label="Health"]').selectOption('Unhealthy');
  await expect(rows(page)).toHaveCount(1);
  expect(listCalls.at(-1)).toMatchObject({ health: 'Unhealthy' });
  await page.getByRole('button', { name: 'Clear' }).click();
  await expect(rows(page)).toHaveCount(5);
  await page.locator('select[aria-label="Author"]').selectOption('agt_0002');
  await expect(rows(page)).toHaveCount(1);
  expect(listCalls.at(-1)).toMatchObject({ author: 'agt_0002' });
  await page.getByRole('button', { name: 'Clear' }).click();

  await rows(page).filter({ hasText: 'Quarterly autonomy brief' }).click();
  await expect(page.getByTestId('report-chart-none')).toHaveText('This report carries no metrics, so there is nothing to chart.');
  await expect(page.locator('[data-report-field="filedBy"]')).toContainText('admin@garrison (User)');
});

test('files a report through the custom dialog', async ({ page }) => {
  const filed = [];
  await page.route(/\/tenants\/default\/reports$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    filed.push(route.request().postDataJSON());
    return json(route, { id: 'rpt_0099', tenantId: 'default', audience: 'Manager', kind: 'Incident', health: 'Degraded', title: 'Queue backing up', body: '', metrics: [], issues: [], decisions: [], filedByPrincipalType: 'User', filedByName: 'admin@garrison', createdUtc: new Date().toISOString() }, 201);
  });
  await login(page);
  await page.goto('/dashboard/autonomy?tab=reports');
  await page.getByTestId('reports-file').click();
  const modal = page.locator('.modal');
  await modal.getByTestId('report-file-submit').click();
  await expect(modal.locator('.field-error')).toHaveText('Give the report a title of 1 to 256 characters.');
  await modal.getByTestId('report-file-title').fill('Queue backing up');
  await modal.getByTestId('report-file-kind').selectOption('Incident');
  await modal.getByTestId('report-file-health').selectOption('Degraded');
  await modal.getByTestId('report-file-agent').selectOption('agt_0001');
  await modal.getByTestId('report-file-body').fill('Depth 48.');
  await modal.getByTestId('report-file-submit').click();
  await expect(page.locator('.toast').filter({ hasText: 'Filed Queue backing up.' })).toBeVisible();
  await expect(modal).toHaveCount(0);
  expect(filed).toEqual([{ title: 'Queue backing up', kind: 'Incident', health: 'Degraded', audience: 'Manager', agent: 'agt_0001', body: 'Depth 48.' }]);
});

test('passes an accessibility scan and lays out at desktop, tablet, and phone widths in both themes', async ({ page }, testInfo) => {
  await login(page);
  const scan = async (label) => {
    // Buttons fade their colors over 0.15s, so let the theme switch finish before measuring contrast.
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))));
    await page.addScriptTag({ content: axe.source });
    const result = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    expect(result.violations.map((v) => `${label}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  };
  for (const theme of ['light', 'dark']) {
    for (const [name, width, height] of [['desktop', 1280, 900], ['tablet', 768, 1000], ['phone', 390, 844]]) {
      // Each width loads the page fresh, so the shell lays out (and collapses its sidebar) as it would on that device.
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard/autonomy?tab=reports');
      await expect(rows(page)).toHaveCount(5);
      await page.evaluate((value) => document.documentElement.setAttribute('data-theme', value), theme);
      if (name === 'desktop') await scan(`${theme} list`);
      // No body-level horizontal scroll: wide tables scroll inside their frame.
      let overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${theme} ${name} list`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: testInfo.outputPath(`reports-${theme}-${name}.png`) });
      await page.locator('.table-frame').first().screenshot({ path: testInfo.outputPath(`reports-${theme}-${name}-table.png`) });

      await page.goto('/dashboard/reports/rpt_0001');
      await expect(page.getByTestId('report-metric-chart')).toBeVisible();
      await page.evaluate((value) => document.documentElement.setAttribute('data-theme', value), theme);
      if (name === 'desktop') await scan(`${theme} report`);
      overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${theme} ${name} report`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: testInfo.outputPath(`report-${theme}-${name}.png`), fullPage: true });
      await page.getByTestId('report-chart-panel').screenshot({ path: testInfo.outputPath(`report-${theme}-${name}-chart.png`) });
    }
  }
});
