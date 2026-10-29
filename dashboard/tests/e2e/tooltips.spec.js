// D-030 enforcement: every visible interactive or labeled element has a useful tooltip.
//
// The test signs in (mocked APIs), visits every route and tab, opens every create and edit form (every step),
// row action menus, the column picker, record modals, the setup wizard, and the tour, and fails when a visible
// button, link, input, select, textarea, table header, tab, label, or KPI card has no tooltip, has one shorter
// than 25 characters, or has one that only restates the element's visible text.

import { test, expect } from '@playwright/test';
import { installMocks, respond, OBSERVABILITY_CONFIGURED } from './mocks.js';
import { PAGES, pathFor } from '../../src/config/navConfig.js';

const SELECTOR = 'button, a[href], input:not([type="hidden"]), select, textarea, th, [role="tab"], label, .kpi-card';
const MIN_LENGTH = 25;

const stats = { checks: 0, unique: new Set(), contexts: 0 };
const failures = [];

/** Check every visible matching element on the page (including portaled modals and menus). */
async function audit(page, context) {
  const result = await page.evaluate(
    ({ selector, min }) => {
      const norm = (s) => String(s || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
      const visible = (el) => {
        if (!el.getClientRects().length) return false;
        const style = getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none') return false;
        if (el.closest('[aria-hidden="true"], .tooltip')) return false;
        return true;
      };
      const out = [];
      const seen = [];
      for (const el of document.querySelectorAll(selector)) {
        if (!visible(el)) continue;
        const tipText = (el.getAttribute('data-tip') || '').trim();
        const text = (el.innerText || (el.tagName === 'SELECT' ? '' : el.value) || el.getAttribute('aria-label') || '').trim().split('\n')[0];
        const tag = el.tagName.toLowerCase() + (el.getAttribute('role') ? `[role=${el.getAttribute('role')}]` : '') + (el.type && el.tagName === 'INPUT' ? `[type=${el.type}]` : '');
        const id = `${tag} "${text.slice(0, 40)}"${el.id ? ` #${el.id}` : ''}${el.className && typeof el.className === 'string' ? ` .${el.className.split(' ')[0]}` : ''}`;
        seen.push(`${tag}|${tipText}|${text}`);
        if (!tipText) out.push(`${id}: no tooltip`);
        else if (tipText.length < min) out.push(`${id}: tooltip too short ("${tipText}")`);
        else if (text && norm(tipText) === norm(text)) out.push(`${id}: tooltip restates the label`);
        else if (text && norm(tipText).startsWith(norm(text)) && tipText.length - text.length < 15) out.push(`${id}: tooltip barely extends the label ("${tipText}")`);
      }
      return { problems: out, seen };
    },
    { selector: SELECTOR, min: MIN_LENGTH }
  );
  stats.contexts += 1;
  stats.checks += result.seen.length;
  for (const s of result.seen) stats.unique.add(s);
  for (const p of result.problems) failures.push(`[${context}] ${p}`);
}

async function settle(page) {
  await page.waitForLoadState('networkidle');
  await expect(page.locator('.loading-spinner')).toHaveCount(0);
}

async function closeModal(page) {
  const modal = page.locator('.modal').last();
  if (await modal.count()) {
    await modal.locator('.modal-header .icon-button').click();
    await expect(page.locator('.modal')).toHaveCount(0);
  }
}

/** Open the add form (every step), the first row's action menu, the edit or view form, and the column picker. */
async function auditResourcePage(page, context) {
  const add = page.getByTestId('add-button').first();
  if (await add.isVisible().catch(() => false)) {
    await add.click();
    await expect(page.locator('.modal')).toBeVisible();
    const steps = page.locator('.modal .stepper-step');
    const stepCount = await steps.count();
    if (stepCount === 0) await audit(page, `${context} create form`);
    for (let i = 0; i < stepCount; i++) {
      await steps.nth(i).click();
      // Fill every list editor on the step so the per-item fields render.
      const addButtons = page.locator('.modal .object-list > button, .modal .kv-editor > button');
      for (let j = 0; j < (await addButtons.count()); j++) await addButtons.nth(j).click();
      await audit(page, `${context} create form step ${i + 1}`);
    }
    await closeModal(page);
  }
  const trigger = page.locator('.data-table .action-menu-trigger').first();
  if (await trigger.isVisible().catch(() => false)) {
    await trigger.click();
    await expect(page.locator('.action-menu-dropdown')).toBeVisible();
    await audit(page, `${context} row actions`);
    const edit = page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: /^(Edit|View)$/ }).first();
    if (await edit.count()) {
      await edit.click();
      const modal = page.locator('.modal');
      if (await modal.isVisible().catch(() => false)) {
        const steps = page.locator('.modal .stepper-step');
        const stepCount = await steps.count();
        if (stepCount === 0) await audit(page, `${context} edit or view form`);
        for (let i = 0; i < stepCount; i++) {
          await steps.nth(i).click();
          await audit(page, `${context} edit form step ${i + 1}`);
        }
        await closeModal(page);
      } else {
        await settle(page);
        await audit(page, `${context} detail page`);
        await page.goBack();
        await settle(page);
      }
    } else {
      await page.mouse.click(5, 5);
    }
  }
  const picker = page.getByTestId('column-picker').first();
  if (await picker.isVisible().catch(() => false)) {
    await picker.click();
    await expect(page.locator('.column-picker')).toBeVisible();
    await audit(page, `${context} column picker`);
    await page.keyboard.press('Escape');
  }
}

async function clickTabs(page, selector, context) {
  const tabs = page.locator(selector);
  const n = await tabs.count();
  for (let i = 0; i < n; i++) {
    await tabs.nth(i).click();
    await settle(page);
    await audit(page, `${context} tab ${i + 1}`);
    if (await page.getByTestId('add-button').first().isVisible().catch(() => false)) await auditResourcePage(page, `${context} tab ${i + 1}`);
  }
}

test.use({ actionTimeout: 15000 });

test.beforeEach(async ({ page }) => {
  await installMocks(page);
  // Configure every observability service so the audit also covers the Home cards and the Grafana deep links (P13.15).
  await page.route(/\/v1\.0\/api\/server-info$/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ...respond('GET', new URL(route.request().url())), observability: OBSERVABILITY_CONFIGURED }) })
  );
  await page.route(/\/v1\.0\/api\/observability\/status$/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(['grafana', 'prometheus', 'loki', 'tempo'].map((service, i) => ({ service, configured: true, reachable: i !== 2, version: i === 2 ? null : '1.0.0', checkedUtc: '2026-10-09T12:00:00Z' }))) })
  );
});

test('the sign-in server override has useful tooltips', async ({ page }) => {
  await page.route(/\/config\.js$/, (route) => route.fulfill({ status: 200, contentType: 'application/javascript', body: 'window.GARRISON_CONFIG = { apiUrl: "", allowCustomServer: true };' }));
  const before = failures.length;
  await page.goto('/');
  await audit(page, 'login, server override available');
  await page.getByTestId('login-use-different-server').click();
  await expect(page.locator('#serverUrl')).toBeVisible();
  await audit(page, 'login, Server URL field shown');
  expect(failures.slice(before)).toEqual([]);
});

test('every interactive and labeled element has a useful tooltip', async ({ page }) => {
  test.setTimeout(600000);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await audit(page, 'login, password tab');
  await page.getByRole('tab', { name: 'Access key' }).click();
  await audit(page, 'login, access key tab');
  await page.getByRole('tab', { name: 'Email and password' }).click();
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();

  for (const p of PAGES) {
    await page.goto(pathFor(p.id));
    await settle(page);
    const context = `${p.hub}${p.tab ? `/${p.tab}` : ''}`;
    await audit(page, context);
    if (p.id === 'roles' || p.id === 'assignments' || p.id === 'manifests') await clickTabs(page, '.hub-tab-panel [role="tablist"]:not(.hub-tab-strip) [role="tab"]', context);
    else await auditResourcePage(page, context);
  }

  // Explainers collapsed to their reopen buttons.
  await page.goto(pathFor('agents'));
  await page.getByTestId('explainer-dismiss-agents').click();
  await audit(page, 'agents with explainer dismissed');
  await page.getByTestId('explainer-open-agents').click();

  // Detail pages and their tabs.
  for (const [path, context] of [
    ['/dashboard/runs/run_0001', 'run detail'],
    ['/dashboard/agents/agt_0001', 'agent detail'],
    ['/dashboard/conversations/cnv_0001', 'conversation detail'],
    ['/dashboard/conversations/cnv_0002', 'busy conversation detail'],
    ['/dashboard/runs/run_0042', 'conversation turn run detail'],
    // AD5.8: a parent run with two fan-out groups (one running with a budget) and a member run of one of them.
    ['/dashboard/runs/run_0044?tab=children', 'fan-out parent run detail'],
    ['/dashboard/runs/run_0062', 'fan-out member run detail'],
    ['/dashboard/invoke?agentId=agt_0001&conversationId=cnv_0001', 'invoke continuing a conversation'],
    ['/dashboard/prompt-templates/pt_0004', 'template editor'],
    ['/dashboard/prompt-templates/new', 'new template'],
    // P12.9: a pipeline run awaiting review (review panel) and a failed one (Retry, Delete), and a stage run.
    ['/dashboard/pipeline-runs/plr_0001', 'pipeline run awaiting review'],
    ['/dashboard/pipeline-runs/plr_0003', 'failed pipeline run']
  ]) {
    await page.goto(path);
    await settle(page);
    await audit(page, context);
    await clickTabs(page, '.dashboard-content [role="tablist"]:not(.hub-tab-strip):not(.range-group) [role="tab"]', context);
  }
  await page.goto('/dashboard/prompt-templates/pt_0004');
  await settle(page);
  await page.getByRole('tab', { name: /Versions/ }).click();
  await page.getByRole('button', { name: 'Diff' }).first().click();
  await audit(page, 'template diff modal');
  await closeModal(page);

  // Analytics: grouped, custom range, and an opened data table.
  await page.goto('/dashboard/analytics?groupBy=agent');
  await settle(page);
  await audit(page, 'analytics grouped');
  await page.goto('/dashboard/analytics?groupBy=harnessModel&model=gpt-oss%3A20b');
  await settle(page);
  await audit(page, 'analytics by harness and model');
  await page.getByTestId('export-ttft').click();
  await audit(page, 'analytics export menu');
  await page.keyboard.press('Escape');
  await page.goto('/dashboard/analytics?range=custom&from=2026-10-08T00%3A00%3A00.000Z&to=2026-10-09T00%3A00%3A00.000Z');
  await settle(page);
  await page.locator('[data-testid="analytics-chart-outcomes"] summary').click();
  await audit(page, 'analytics custom range with data table');

  // Record modals opened from row actions.
  const modals = [
    ['agents?tab=deployments', 'Compile preview', 'compile preview'],
    // AD1.9: promote a revision and the promotion history with its Rollback action.
    ['agents?tab=deployments', 'Promote', 'promote'],
    ['agents?tab=deployments', 'Promotion history', 'promotion history'],
    ['configuration?tab=mcp-servers', 'Test connection', 'MCP test'],
    ['access?tab=users', 'Effective permissions', 'effective permissions'],
    ['configuration?tab=secrets', 'Set value', 'secret value'],
    ['configuration?tab=secrets', 'View JSON', 'JSON viewer'],
    // P12.9: start and preview a pipeline, and decide a stage review.
    ['agents?tab=pipelines', 'Start', 'pipeline start'],
    ['agents?tab=pipelines', 'Preview prompts', 'pipeline preview'],
    ['approvals?tab=pipeline-reviews', 'Request changes', 'stage review decide'],
    // P12.5 and P12.14: fire a trigger, its fire history, a test notification, and the delivery log.
    ['agents?tab=triggers', 'Fire now', 'trigger fire'],
    ['agents?tab=triggers', 'Fire history', 'trigger fire history'],
    ['configuration?tab=notifications', 'Send test', 'notification test'],
    ['configuration?tab=notifications', 'Delivery log', 'notification delivery log'],
    // AD2.8: an asset's version history with its files and the upload panel.
    ['configuration?tab=agent-assets', 'Versions', 'asset versions']
  ];
  for (const [path, item, context] of modals) {
    await page.goto(`/dashboard/${path}`);
    await settle(page);
    await page.locator('.data-table .action-menu-trigger').first().click();
    await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: item }).click();
    await expect(page.locator('.modal')).toBeVisible();
    await settle(page);
    await audit(page, context);
    await closeModal(page);
  }
  // AD1.9: the promote dialog with a target that skips an environment, and the rollback confirmation.
  await page.goto('/dashboard/agents?tab=deployments');
  await settle(page);
  await page.getByTestId('promote-button').click();
  await page.locator('#promote-agent').selectOption('agt_0001');
  await page.locator('#promote-source').selectOption('dev');
  await page.locator('#promote-target').selectOption('prod');
  await audit(page, 'promote skipping an environment');
  await closeModal(page);
  await page.getByTestId('promotion-history').click();
  await settle(page);
  await page.getByTestId('promotion-rollback').first().click();
  await audit(page, 'promotion rollback confirmation');
  await page.locator('.modal').last().getByRole('button', { name: 'Cancel' }).click();
  await closeModal(page);
  // The revision publish dialog on the agent page.
  await page.goto('/dashboard/agents/agt_0001');
  await settle(page);
  await page.getByRole('tab', { name: 'Revisions' }).click();
  await page.getByTestId('revision-publish').first().click();
  await audit(page, 'revision publish');
  await closeModal(page);
  // AD2.8: the asset pins editor on the draft, with a pin added.
  await page.getByTestId('revision-assets').first().click();
  await page.getByTestId('asset-pin-add').click();
  await audit(page, 'asset pins');
  await closeModal(page);
  // AD4.8: the capability editor on the draft, with a capability added (and one not in the catalog).
  await page.getByTestId('revision-capabilities').first().click();
  await settle(page);
  await page.getByTestId('revision-capability-choice').selectOption('pandoc');
  await page.getByTestId('revision-capability-add').click();
  await audit(page, 'revision capabilities');
  await closeModal(page);

  // AD4.8: the capability catalog: a derived entry's details with its warning, a row menu with disabled Edit and Delete,
  // a manual entry's form, a built-in's source and node label, and the refresh dialog with a failed server.
  await page.goto('/dashboard/agents?tab=capabilities');
  await settle(page);
  await audit(page, 'capability catalog with warnings');
  await page.locator('.data-table tbody tr', { hasText: 'mcp-1/search' }).locator('.action-menu-trigger').click();
  await audit(page, 'derived capability row actions');
  await page.getByRole('menuitem', { name: 'View', exact: true }).click();
  await expect(page.getByTestId('capability-warning')).toBeVisible();
  await audit(page, 'derived capability details');
  await closeModal(page);
  await page.locator('.data-table tbody tr', { hasText: 'doc-convert' }).locator('td').nth(1).click();
  await audit(page, 'manual capability form');
  await closeModal(page);
  await page.getByTestId('capability-refresh').click();
  await page.getByTestId('capability-refresh-run').click();
  await expect(page.getByTestId('capability-refresh-result')).toBeVisible();
  await audit(page, 'capability refresh result');
  await closeModal(page);

  // AD6.11: the Apps tab: the URL cell, the row menu, the view dialog with the link and graph, the editor on every step
  // with members, calls, and environments filled in, the delegation dialog after writing drafts (drift, draft, and
  // conflict badges), the revisions dialog, and the promote dialog with a target that skips an environment.
  await page.goto('/dashboard/agents?tab=apps');
  await settle(page);
  await audit(page, 'apps list');
  const appRow = page.locator('.data-table tbody tr', { has: page.locator('strong', { hasText: /^research$/ }) });
  await appRow.locator('.action-menu-trigger').click();
  await audit(page, 'app row actions');
  await page.getByRole('menuitem', { name: 'View', exact: true }).click();
  await expect(page.getByTestId('app-view')).toBeVisible();
  await audit(page, 'app details');
  await closeModal(page);
  await appRow.locator('td').nth(2).click();
  for (let i = 0; i < 5; i++) {
    await page.locator('.modal .stepper-step').nth(i).click();
    await audit(page, `app editor step ${i + 1}`);
  }
  await closeModal(page);
  await appRow.locator('.action-menu-trigger').click();
  await page.getByRole('menuitem', { name: 'Delegation', exact: true }).click();
  await expect(page.getByTestId('app-delegation')).toBeVisible();
  await audit(page, 'app delegation');
  await page.getByTestId('app-delegation-apply').click();
  await expect(page.getByTestId('app-delegation')).toContainText('Draft conflict');
  await audit(page, 'app delegation after writing drafts');
  await closeModal(page);
  await appRow.locator('.action-menu-trigger').click();
  await page.getByRole('menuitem', { name: 'Revisions and promotion', exact: true }).click();
  await expect(page.getByTestId('app-revisions')).toBeVisible();
  await audit(page, 'app revisions');
  await page.getByTestId('app-promote').click();
  await page.locator('#app-promote-target').selectOption('prod');
  await expect(page.locator('#app-promote-allow-skip')).toBeVisible();
  await audit(page, 'app promote');
  // Closing the promote dialog returns to the revisions dialog.
  await page.locator('.modal').last().locator('.modal-header .icon-button').click();
  await expect(page.getByTestId('app-revisions')).toBeVisible();
  await closeModal(page);
  // AD9.6: the Environments dialog (pins and overrides per environment, the difference, history) and its rollback.
  await appRow.locator('.action-menu-trigger').click();
  await page.getByRole('menuitem', { name: 'Environments', exact: true }).click();
  await expect(page.getByTestId('app-release-history')).toBeVisible();
  await audit(page, 'app environments');
  await page.getByTestId('app-release-rollback').first().click();
  await expect(page.getByTestId('app-release-rollback-note')).toBeVisible();
  await audit(page, 'app environments rollback');
  await page.locator('.modal').last().locator('.modal-header .icon-button').click();
  await page.getByTestId('app-release-promote').click();
  await expect(page.getByTestId('app-promote-submit')).toBeVisible();
  await audit(page, 'app environments promote');
  await page.locator('.modal').last().locator('.modal-header .icon-button').click();
  await closeModal(page);

  // AD7.10, AD7.16, AD9.2, AD9.3: the studio workspace on every tab (an open draft and one pending approval), the new
  // item form and the item editor, the New architect dialog, the apply approval decided inline, the architect prompt
  // editor, a playground turn, and a compile preview with placed assets and a file space.
  for (const [path, context] of [
    ['/dashboard/studio/drf_0001', 'studio draft'],
    ['/dashboard/studio/drf_0002', 'studio draft pending approval']
  ]) {
    await page.goto(path);
    await settle(page);
    await audit(page, context);
    await clickTabs(page, '.dashboard-content [role="tablist"]:not(.hub-tab-strip) [role="tab"]', context);
  }
  await page.goto('/dashboard/studio/drf_0001?tab=items');
  await settle(page);
  await page.getByTestId('studio-item-add').click();
  await audit(page, 'studio new item form');
  await page.locator('#studio-item-name').fill('reviewer');
  await page.getByTestId('studio-item-add-confirm').click();
  await expect(page.getByTestId('studio-item-editor')).toBeVisible();
  await audit(page, 'studio item editor');
  await page.goto('/dashboard/studio/drf_0001');
  await settle(page);
  await page.getByTestId('studio-new-architect').click();
  await expect(page.getByTestId('new-architect')).toBeVisible();
  await settle(page);
  await audit(page, 'studio new architect');
  await closeModal(page);
  await page.goto('/dashboard/studio/drf_0001?tab=apply');
  await settle(page);
  await page.getByTestId('studio-request-apply').click();
  await expect(page.getByTestId('studio-approval-allow')).toBeVisible();
  await audit(page, 'studio apply approval');
  await page.goto('/dashboard/studio/drf_0001?tab=prompts');
  await settle(page);
  await page.getByTestId('architect-prompt-edit-agent-architect-team').click();
  await expect(page.getByTestId('architect-prompt-editor')).toBeVisible();
  await settle(page);
  await audit(page, 'studio architect prompt editor');
  await page.goto('/dashboard/studio/drf_0001?tab=playground');
  await settle(page);
  await page.getByTestId('studio-playground-input').fill('Summarize the README');
  await page.getByTestId('studio-playground-send').click();
  await expect(page.locator('[data-playground-turn="1"]')).toBeVisible();
  await audit(page, 'studio playground turn');
  await page.route(/\/deployments\/dep_0001\/compile-preview$/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        commandLine: 'claude -p',
        deploymentId: 'dep_0001',
        spec: { executable: 'claude', arguments: ['-p'], assetFiles: [{ assetName: 'style', kind: 'Skill', version: 1, path: '.claude/skills/style/SKILL.md', sizeBytes: 20 }], fileSpace: { mountPath: 'files', maxFiles: 1000, maxFileBytes: 33554432, files: [] } }
      })
    })
  );
  await page.goto('/dashboard/studio/drf_0001?tab=preview');
  await settle(page);
  await page.getByTestId('studio-preview-deploymentId').selectOption('dep_0001');
  await page.getByTestId('studio-preview-compile').click();
  await expect(page.getByTestId('studio-preview-assets')).toBeVisible();
  await audit(page, 'studio compile preview');

  // AD8.2 to AD8.6: the canvas with an agent's properties and an asset row, a connection in progress with the keyboard
  // shortcuts open, the runtime tab with an approval rule, and a selected call.
  await page.goto('/dashboard/studio/drf_0001?tab=graph');
  await settle(page);
  await expect(page.getByTestId('studio-app-panel')).toBeVisible();
  await audit(page, 'studio canvas app panel');
  await page.locator('.react-flow__node[data-id="writer"]').click();
  await expect(page.getByTestId('studio-agent-panel')).toBeVisible();
  await page.getByTestId('studio-agent-add-asset').click();
  await audit(page, 'studio canvas agent panel');
  await page.getByTestId('studio-canvas-connect').click();
  await expect(page.getByTestId('studio-canvas-connect-bar')).toBeVisible();
  await page.locator('.studio-canvas-keys summary').click();
  await audit(page, 'studio canvas connecting');
  await page.getByTestId('studio-canvas-connect-cancel').click();
  await page.getByRole('tab', { name: 'Runtime' }).click();
  await expect(page.getByTestId('studio-runtime-form')).toBeVisible();
  await page.getByTestId('studio-runtime-add-rule').click();
  await audit(page, 'studio canvas runtime');
  await page.locator('[data-call="planner>writer"]').click();
  await expect(page.getByTestId('studio-edge-panel')).toBeVisible();
  await audit(page, 'studio canvas call');

  // AD2.8: the asset form for a system prompt, and the version dialog with a preview and files chosen for upload.
  await page.goto('/dashboard/configuration?tab=agent-assets');
  await settle(page);
  await page.getByTestId('add-button').click();
  await page.locator('#agentAssets-kind').selectOption('SystemPrompt');
  await audit(page, 'system prompt asset form');
  await closeModal(page);
  await page.locator('.data-table .action-menu-trigger').first().click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Versions' }).click();
  await settle(page);
  await page.getByTestId('asset-file-preview-button').first().click();
  await expect(page.getByTestId('asset-file-preview')).toContainText('Write short sentences.');
  await page.getByTestId('asset-upload-input').setInputFiles([{ name: 'notes.md', mimeType: 'text/markdown', buffer: Buffer.from('# Notes') }]);
  await audit(page, 'asset versions with preview and upload');
  await closeModal(page);

  // AD5.8: the run tree with fan-out groups, and the Cancel group confirmation.
  await page.goto('/dashboard/runs/run_0044?tab=children');
  await settle(page);
  await expect(page.getByTestId('fan-out-group')).toHaveCount(2);
  await audit(page, 'run tree with fan-out groups');
  await page.getByTestId('fan-out-cancel').click();
  await expect(page.locator('.modal')).toBeVisible();
  await audit(page, 'cancel fan-out group confirmation');
  await closeModal(page);

  // AD3.8: the conversation Files tab with deleted files shown and files chosen for upload, a file's version dialog
  // with a preview, and the delete confirmation.
  await page.goto('/dashboard/conversations/cnv_0001?tab=files');
  await settle(page);
  await page.getByTestId('files-include-deleted').check();
  await page.getByTestId('file-upload-input').setInputFiles([{ name: 'sources.md', mimeType: 'text/markdown', buffer: Buffer.from('# Mine') }]);
  await audit(page, 'conversation files with deleted files and upload');
  await page.locator('[data-file="notes/sources.md"]').getByTestId('file-versions-button').click();
  await settle(page);
  await page.getByTestId('file-version-preview-button').first().click();
  await expect(page.getByTestId('file-preview-text')).toBeVisible();
  await audit(page, 'conversation file versions with preview');
  await closeModal(page);
  await page.locator('[data-file="report.json"]').getByTestId('file-delete').click();
  await audit(page, 'conversation file delete confirmation');
  await page.keyboard.press('Escape');

  // The pipeline preview with rendered stage prompts and a render failure.
  await page.goto('/dashboard/agents?tab=pipelines');
  await settle(page);
  await page.locator('.data-table .action-menu-trigger').first().click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Preview prompts' }).click();
  await page.getByTestId('pipeline-preview-render').click();
  await expect(page.getByTestId('pipeline-preview-result')).toBeVisible();
  await audit(page, 'pipeline preview rendered');
  await closeModal(page);

  await page.goto('/dashboard/configuration?tab=secrets');
  await settle(page);
  await page.locator('.data-table .action-menu-trigger').first().click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Delete' }).click();
  await audit(page, 'delete confirmation');
  await page.locator('.modal').getByRole('button', { name: 'Cancel' }).click();

  await page.goto('/dashboard/monitoring?tab=requests');
  await settle(page);
  await page.locator('.data-table tbody tr').first().click();
  await expect(page.locator('.modal')).toContainText('Request details');
  await settle(page);
  await audit(page, 'request details');
  await closeModal(page);

  await page.goto('/dashboard/monitoring?tab=explorer');
  await settle(page);
  const select = page.locator('.explorer-op-select');
  await select.selectOption(await select.locator('option', { hasText: 'Create agent' }).getAttribute('value'));
  await audit(page, 'API Explorer with an operation');
  await page.getByTestId('explorer-execute').click();
  await audit(page, 'API Explorer with a response');

  await page.goto('/dashboard/invoke');
  await settle(page);
  await page.locator('#invoke-message').fill('hello');
  await page.getByTestId('invoke-send').click();
  await expect(page.locator('.invoke-run-head')).toBeVisible();
  await audit(page, 'invoke with a run');
  // P5.52: the streamed Preview (Markdown links, tool chips, reasoning, timing) and the Response tab.
  await expect(page.getByTestId('invoke-preview').locator('.markdown-body a').first()).toBeVisible();
  await page.getByTestId('stream-reasoning').locator('summary').click();
  await audit(page, 'invoke preview streamed');
  await page.getByRole('tab', { name: 'Response' }).click();
  await expect(page.getByTestId('invoke-response')).toBeVisible();
  await audit(page, 'invoke response');
  await page.getByTestId('invoke-result').getByTestId('markdown-raw-toggle').click();
  await audit(page, 'invoke response raw');

  // Setup wizard, every step.
  await page.goto('/dashboard/home');
  await settle(page);
  await page.locator('.sidebar-utility').first().click();
  await expect(page.locator('.wizard-steps')).toBeVisible();
  await audit(page, 'wizard welcome');
  await page.getByRole('button', { name: 'Start' }).click();
  await audit(page, 'wizard credential');
  await page.getByRole('button', { name: 'Skip this step' }).click();
  await expect(page.getByTestId('wizard-studio')).toBeVisible();
  await settle(page);
  await audit(page, 'wizard agent studio');
  await page.getByTestId('wizard-skip-studio').click();
  await audit(page, 'wizard manifest');
  await page.locator('.modal-footer').getByRole('button', { name: 'Apply' }).click();
  await expect(page.locator('.wizard-steps li.active')).toContainText('Test run');
  await audit(page, 'wizard test run');
  await closeModal(page);

  // Guided tour, every stop.
  await page.locator('.sidebar-utility').nth(1).click();
  for (let i = 0; i < 6; i++) {
    await audit(page, `tour step ${i + 1}`);
    const next = page.locator('.tour-card').getByRole('button', { name: /^(Next|Done)$/ });
    await next.click();
  }

  console.log(`Tooltip audit: ${stats.checks} element checks across ${stats.contexts} screens (${stats.unique.size} distinct elements).`);
  expect([...new Set(failures)]).toEqual([]);
  expect(stats.unique.size).toBeGreaterThan(400);
});

test('tooltips show on hover and keyboard focus, are described, portaled, and dismissible', async ({ page }) => {
  await page.goto('/');
  const submit = page.getByTestId('login-submit');
  await submit.hover();
  const bubble = page.locator('#garrison-tooltip');
  await expect(bubble).toHaveClass(/is-visible/);
  await expect(bubble).toHaveText(/Check the credentials/);
  await expect(submit).toHaveAttribute('aria-describedby', /garrison-tooltip/);
  expect(await bubble.evaluate((el) => el.parentElement === document.body)).toBe(true);
  const box = await bubble.boundingBox();
  const vp = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(vp.width);
  await page.keyboard.press('Escape');
  await expect(bubble).not.toHaveClass(/is-visible/);

  await page.mouse.move(0, 0);
  await page.locator('#tenantId').focus();
  await page.keyboard.press('Tab');
  await expect(bubble).toHaveClass(/is-visible/);
  await expect(page.locator(':focus')).toHaveAttribute('aria-describedby', /garrison-tooltip/);

  // Dark theme and RTL: the bubble still renders inside the viewport.
  await page.locator('.login-lang .icon-button').click();
  await page.locator('.login-lang select').selectOption('zz');
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  await page.getByTestId('login-submit').hover();
  await expect(bubble).toHaveClass(/is-visible/);
  const rtlBox = await bubble.boundingBox();
  expect(rtlBox.x).toBeGreaterThanOrEqual(0);
  expect(rtlBox.x + rtlBox.width).toBeLessThanOrEqual(vp.width);
});
