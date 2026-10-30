// Capability catalog (AD4.8) against mocked APIs: the Capabilities tab under Agents (kinds, origins, source links,
// hints with Unknown never shown as zero, refresh warnings), filters by kind, origin, and tag, derived entries whose Edit
// and Delete stay disabled with the reason, manual entries created, refused (InvalidJsonSchema, NameConflict), edited,
// and deleted, the Refresh dialog with per-server errors, tool probes on a harness profile, capabilities on an agent
// draft, and the NoToolWorker blocked reason on Run detail.

import { test, expect } from '@playwright/test';
import { installMocks, capability, agentRevision, CAPABILITY_REFRESH } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
const CAPABILITIES = '/dashboard/agents?tab=capabilities';
const row = (page, name) => page.locator('.data-table tbody tr', { has: page.locator('strong', { hasText: new RegExp(`^${name.replace('/', '\\/')}$`) }) });

async function openMenu(page, name) {
  await row(page, name).locator('.action-menu-trigger').click();
  await expect(page.locator('.action-menu-dropdown')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('lists the catalog with kinds, sources, hints, and refresh warnings', async ({ page }) => {
  await login(page);
  await page.goto(CAPABILITIES);
  await expect(page.getByRole('tab', { name: 'Capabilities' })).toHaveAttribute('aria-selected', 'true');
  const rows = page.locator('.data-table tbody tr');
  await expect(rows).toHaveCount(6);
  // Sorted by name in the browser (the server returns the catalog in one piece).
  await expect(rows.first()).toContainText('agent-2');
  await expect(row(page, 'echo-agent')).toContainText('Agent');
  await expect(row(page, 'echo-agent')).toContainText('Median 4.2 s, p90 9.1 s, $0.0123 per run');
  await expect(row(page, 'agent-2').locator('[data-hints]')).toHaveAttribute('data-hints', 'Unknown');
  await expect(row(page, 'agent-2').locator('[data-hints]')).toHaveText('Unknown');
  await expect(row(page, 'mcp-1/search')).toContainText('MCP tool');
  await expect(row(page, 'pandoc')).toContainText('Harness built-in');
  await expect(row(page, 'pandoc')).toContainText('Shared');
  await expect(row(page, 'doc-convert')).toContainText('Manual');
  await expect(row(page, 'doc-convert')).toContainText('Manual entry');

  // Source links: the agent page, the MCP server with its tool, the harness profile with the node label.
  await expect(row(page, 'echo-agent').getByTestId('capability-source-link')).toHaveAttribute('href', '/dashboard/agents/agt_0001');
  await expect(row(page, 'mcp-1/search').getByTestId('capability-source-link')).toHaveAttribute('href', '/dashboard/configuration?tab=mcp-servers&search=mcp-1');
  await expect(row(page, 'mcp-1/search').locator('[data-source="mcpServer"] code')).toHaveText('search');
  await expect(row(page, 'pandoc').getByTestId('capability-source-link')).toHaveText('builtin/claude-code');
  await expect(row(page, 'pandoc').getByTestId('capability-node-label')).toHaveText('garrison.io/tool-pandoc=true');

  // Two entries kept their last good content: the banner counts them and each row carries a badge.
  await expect(page.getByTestId('capability-warnings')).toContainText('2 entries kept their last good content');
  await expect(row(page, 'mcp-1/search').locator('[data-cell="refreshWarning"]')).toBeVisible();
  await expect(row(page, 'mcp-1/search').locator('[data-cell="refreshWarning"] .pill')).toHaveAttribute('data-tip', /Refresh failed at 2026-10-28 09:15:00Z: Connection refused/);

  await row(page, 'echo-agent').getByTestId('capability-source-link').click();
  await expect(page).toHaveURL(/\/dashboard\/agents\/agt_0001$/);
});

test('filters by kind on the server, by origin in the browser, and by tag', async ({ page }) => {
  const queries = [];
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (url.pathname.endsWith('/capabilities') && r.method() === 'GET') queries.push(Object.fromEntries(url.searchParams));
  });
  await login(page);
  await page.goto(CAPABILITIES);
  await expect(page.locator('.data-table tbody tr')).toHaveCount(6);
  await page.locator('select[aria-label="Kind"]').selectOption('HarnessBuiltIn');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(2);
  expect(queries[queries.length - 1]).toEqual({ kind: 'HarnessBuiltIn' });
  await page.locator('select[aria-label="Kind"]').selectOption('');
  await page.locator('select[aria-label="Origin"]').selectOption('Manual');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
  await expect(page.locator('.data-table tbody tr')).toContainText('doc-convert');
  await page.locator('select[aria-label="Origin"]').selectOption('');
  await page.locator('input[data-filter="tag"]').fill('tool');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(2);
  expect(queries[queries.length - 1]).toEqual({ tag: 'tool' });
  await page.getByRole('button', { name: 'Clear' }).click();
  await page.locator('input.filter-search').first().fill('doc-');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
  expect(queries[queries.length - 1]).toEqual({ search: 'doc-' });
});

test('keeps Edit and Delete of derived entries disabled and explains why', async ({ page }) => {
  let changed = 0;
  await page.route(/\/capabilities\/cap_0001$/, (route) => {
    if (route.request().method() === 'GET') return route.fallback();
    changed += 1;
    return route.fulfill(json(409, { error: 'Conflict', code: 'CapabilityDerived', message: 'Capability echo-agent is derived from its source and follows it; change the source instead.' }));
  });
  await login(page);
  await page.goto(CAPABILITIES);
  await openMenu(page, 'echo-agent');
  const edit = page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Edit' });
  const remove = page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Delete' });
  await expect(edit).toHaveAttribute('aria-disabled', 'true');
  await expect(edit).toHaveAttribute('data-tip', /Publish a new revision/);
  await expect(remove).toHaveAttribute('aria-disabled', 'true');
  // Playwright treats aria-disabled items as disabled; force the click to show it does nothing.
  await remove.click({ force: true });
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(changed).toBe(0);
  await expect(page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Duplicate' })).toHaveCount(0);
  // No row checkboxes: bulk delete would only hit derived entries the server refuses.
  await expect(page.locator('.data-table tbody input[type="checkbox"]')).toHaveCount(0);

  await page.keyboard.press('Escape');
  await page.mouse.click(5, 5);
  await openMenu(page, 'pandoc');
  await expect(page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Edit' })).toHaveAttribute('data-tip', /Shared by every tenant/);
  await page.mouse.click(5, 5);

  // A derived row opens its details: the reason it is locked, the warning, the hints, and the node labels.
  await row(page, 'libreoffice').locator('td').nth(1).click();
  const modal = page.locator('.modal');
  await expect(modal.getByTestId('capability-detail')).toHaveAttribute('data-origin', 'Derived');
  await expect(modal.getByTestId('capability-locked')).toContainText("Change the profile's tool probes instead.");
  await expect(modal.getByTestId('capability-warning')).toContainText('Workers probe libreoffice as soffice --version, which another harness profile defined first.');
  await expect(modal.getByTestId('capability-hints')).toHaveAttribute('data-status', 'Unknown');
  await expect(modal.locator('[data-item="medianDurationMs"] .detail-item-value')).toHaveText('Unknown');
  await expect(modal.locator('[data-item="meanCostUsd"] .detail-item-value')).toHaveText('Unknown');
  await expect(modal.getByTestId('capability-requirements')).toHaveText('garrison.io/tool-libreoffice=true');
  await expect(modal.getByRole('button', { name: 'Edit' })).toHaveCount(0);
});

test('creates a manual entry, with schema and name refusals', async ({ page }) => {
  const bodies = [];
  let attempt = 0;
  await page.route(/\/capabilities$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    bodies.push(route.request().postDataJSON());
    attempt += 1;
    if (attempt === 1) return route.fulfill(json(400, { error: 'BadRequest', code: 'InvalidJsonSchema', message: 'The capability is not valid: bad', fields: { inputSchema: "'type' must be a string or an array." }, fieldCodes: { inputSchema: 'InvalidJsonSchema' } }));
    if (attempt === 2) return route.fulfill(json(409, { error: 'Conflict', code: 'NameConflict', message: 'A manual capability named pdf-render already exists.' }));
    return route.fulfill(json(201, { ...capability(6), ...bodies[bodies.length - 1], id: 'cap_0099', origin: 'Manual' }));
  });
  await login(page);
  await page.goto(CAPABILITIES);
  await page.getByTestId('add-button').click();
  const modal = page.locator('.modal');
  await modal.locator('#capabilities-name').fill('pdf-render');
  await modal.locator('#capabilities-kind').selectOption('McpTool');
  await expect(modal.locator('#capabilities-sourceToolName')).toHaveCount(0);
  await modal.locator('#capabilities-sourceMcpServerId').selectOption('mcp_0001');
  await modal.locator('#capabilities-sourceToolName').fill('render');
  await modal.locator('#capabilities-summary').fill('Renders Markdown to PDF.');
  await modal.locator('#capabilities-tags').fill('docs\npdf');
  // Client-side check first: the schema is not JSON at all.
  await modal.locator('#capabilities-inputSchema').fill('{');
  await modal.getByTestId('save-button').click();
  await expect(modal.locator('.field-error')).toContainText('This is not valid JSON.');
  expect(bodies).toHaveLength(0);
  // Valid JSON the server refuses as a schema: the field shows the translated field code.
  await modal.locator('#capabilities-inputSchema').fill('{"type": 5}');
  await modal.getByTestId('save-button').click();
  await expect(modal.locator('.field-error')).toContainText('This is not a valid JSON Schema.');
  await expect(page.locator('.toast-error').first()).toContainText('not a valid JSON Schema');
  await modal.locator('#capabilities-inputSchema').fill('{"type": "object"}');
  await modal.getByTestId('save-button').click();
  await expect(page.locator('.toast-error', { hasText: 'A manual capability named pdf-render already exists.' })).toBeVisible();
  await modal.getByTestId('save-button').click();
  await expect(page.locator('.toast-success')).toBeVisible();
  await expect(modal).toHaveCount(0);
  expect(bodies[2]).toEqual({
    name: 'pdf-render',
    kind: 'McpTool',
    summary: 'Renders Markdown to PDF.',
    inputSchema: { type: 'object' },
    outputSchema: null,
    tags: ['docs', 'pdf'],
    requirements: [],
    sourceAgentId: null,
    sourceMcpServerId: 'mcp_0001',
    sourceToolName: 'render'
  });
});

test('edits and deletes a manual entry', async ({ page }) => {
  let put = null;
  let deleted = 0;
  await page.route(/\/capabilities\/cap_0006$/, (route) => {
    const method = route.request().method();
    if (method === 'PUT') {
      put = route.request().postDataJSON();
      return route.fulfill(json(200, { ...capability(6), ...put }));
    }
    if (method === 'DELETE') {
      deleted += 1;
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fallback();
  });
  await login(page);
  await page.goto(CAPABILITIES);
  await row(page, 'doc-convert').locator('td').nth(1).click();
  const modal = page.locator('.modal');
  await expect(modal.locator('#capabilities-name')).toHaveValue('doc-convert');
  await modal.getByRole('button', { name: 'Add row' }).click();
  await modal.locator('.kv-row input').first().fill('garrison.io/tool-pandoc');
  await modal.getByTestId('save-button').click();
  await expect.poll(() => put).not.toBeNull();
  expect(put.requirements).toEqual([{ key: 'garrison.io/tool-pandoc', value: 'true' }]);
  expect(put.outputSchema).toEqual({ type: 'object' });

  await openMenu(page, 'doc-convert');
  const remove = page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Delete' });
  await expect(remove).not.toHaveAttribute('aria-disabled', 'true');
  await remove.click();
  await page.locator('.modal').getByRole('button', { name: 'Delete' }).click();
  await expect.poll(() => deleted).toBe(1);
  await expect(page.locator('.toast-success').last()).toBeVisible();
});

test('refreshes the catalog and shows each server, including failures', async ({ page }) => {
  const urls = [];
  await page.route(/\/capabilities\/refresh/, (route) => {
    urls.push(new URL(route.request().url()));
    return route.fulfill(json(200, CAPABILITY_REFRESH));
  });
  await login(page);
  await page.goto(CAPABILITIES);
  await page.getByTestId('capability-refresh').click();
  const modal = page.locator('.modal');
  await expect(modal.getByTestId('capability-refresh-server').locator('option[value="mcp_0002"]')).toHaveCount(1);
  await modal.getByTestId('capability-refresh-run').click();
  const result = modal.getByTestId('capability-refresh-result');
  await expect(result).toBeVisible();
  expect(urls[0].searchParams.get('mcpServerId')).toBeNull();
  await expect(result.locator('[data-total="agents"]')).toContainText('2');
  await expect(result.locator('[data-total="tools"]')).toContainText('3');
  await expect(result.locator('[data-total="failed"]')).toContainText('1');
  await expect(result.locator('[data-server="mcp-1"]')).toHaveAttribute('data-failed', 'true');
  await expect(result.locator('[data-server="mcp-1"] [data-cell="error"]')).toHaveText('Connection refused (127.0.0.1:9000)');
  await expect(result.locator('[data-server="mcp-2"]')).toContainText('Listed');
  await expect(page.locator('.toast-warning')).toContainText('1 MCP server could not be listed');
  // One server only.
  await modal.getByTestId('capability-refresh-server').selectOption('mcp_0002');
  await modal.getByTestId('capability-refresh-run').click();
  await expect.poll(() => urls.length).toBe(2);
  expect(urls[1].searchParams.get('mcpServerId')).toBe('mcp_0002');
});

test('edits tool probes on a tenant harness profile', async ({ page }) => {
  let body = null;
  await page.route(/\/harness-profiles\/hp_0002$/, (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill(json(200, body));
  });
  await login(page);
  await page.goto('/dashboard/configuration?tab=harness-profiles');
  await page.locator('.data-table tbody tr', { hasText: 'profile-2' }).locator('td').nth(1).click();
  const modal = page.locator('.modal');
  await expect(modal.locator('[data-field="toolProbes"], label[for="harnessProfiles-toolProbes"]').first()).toBeVisible();
  await modal.getByRole('button', { name: 'Add tool probe' }).click();
  const probe = modal.locator('.object-list').filter({ has: page.locator('#ol-0-executable') }).locator('.object-list-row').first();
  await probe.locator('#ol-0-name').fill('pandoc');
  await probe.locator('#ol-0-executable').fill('/usr/bin/pandoc');
  await expect(probe.locator('#ol-0-argument')).toHaveValue('--version');
  await expect(probe.locator('#ol-0-argument option')).toHaveCount(8);
  await modal.getByTestId('save-button').click();
  await expect(modal.locator('.field-error')).toContainText('Item 1:');
  await expect(modal.locator('.field-error')).toContainText('bare file name');
  expect(body).toBeNull();
  await probe.locator('#ol-0-executable').fill('pandoc');
  await probe.locator('#ol-0-description').fill('Converts documents between formats.');
  await modal.getByTestId('save-button').click();
  await expect.poll(() => body).not.toBeNull();
  expect(body.toolProbes).toEqual([{ name: 'pandoc', executable: 'pandoc', arguments: ['--version'], description: 'Converts documents between formats.' }]);
});

test('shows revision capabilities and chooses them on the draft', async ({ page }) => {
  let body = null;
  await page.route(/\/agents\/agt_0001\/revisions$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill(json(200, { ...agentRevision('agt_0001', 3), capabilities: body.capabilities }));
  });
  await login(page);
  await page.goto('/dashboard/agents/agt_0001');
  await page.getByRole('tab', { name: 'Revisions' }).click();
  await expect(page.locator('[data-revision="3"] [data-cell="capabilities"]')).toHaveText('-');
  await page.locator('[data-revision="3"]').getByTestId('revision-capabilities').click();
  const modal = page.locator('.modal');
  await expect(modal.getByTestId('revision-capabilities-source')).toContainText('draft revision 3');
  await expect(modal.getByTestId('revision-capabilities-save')).toBeDisabled();
  await modal.getByTestId('revision-capability-choice').selectOption('pandoc');
  await modal.getByTestId('revision-capability-add').click();
  await expect(modal.locator('[data-capability="pandoc"]')).toContainText('Harness built-in');
  await modal.getByTestId('revision-capabilities-save').click();
  await expect.poll(() => body).not.toBeNull();
  expect(body.capabilities).toEqual(['pandoc']);
  expect(body.assetPins).toEqual(agentRevision('agt_0001', 3).assetPins);
  for (const key of ['id', 'state', 'number', 'contentHash']) expect(body).not.toHaveProperty(key);
  await expect(page.locator('.toast-success')).toContainText('Saved the capabilities on draft revision 3.');
});

test('explains a run waiting for a worker that reports its tool', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/runs/run_0033');
  const notice = page.getByTestId('blocked-notice');
  await expect(notice.locator('.blocked-badge')).toContainText('No worker with the tool');
  await expect(notice.getByTestId('blocked-reason-text')).toContainText('uses pandoc');
  await expect(notice.locator('.blocked-badge .pill')).toHaveAttribute('data-tip', /harness built-in tool/);
});
