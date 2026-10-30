// Agent architects against mocked APIs: the Architects tab under Agents lists the tenant's architects (harness
// profile, model, prompt with its pin, status) one page at a time, creates one on the default prompt, edits one
// (rename, pin the guided prompt, turn it off), refuses a taken name on its field, deletes after confirming, opens the
// architect prompt manager and the underlying deployment from the row, and the studio links to the page.

import { test, expect } from '@playwright/test';
import { installMocks, installControlledStream, pushRunEvent, ARCHITECT } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
const ARCHITECTS = '/dashboard/agents?tab=architects';
const row = (page, name) => page.locator('.data-table tbody tr', { has: page.locator('strong', { hasText: new RegExp(`^${name}$`) }) });
const fieldOf = (page, selector) => page.locator('.modal .field', { has: page.locator(selector) }).first();
const GUIDED = { ...ARCHITECT, id: 'dep_arch_2', name: 'guided-architect', model: null, active: false, architectPromptTemplateId: 'pt_builtin_agent_architect_guided', architectPromptName: 'builtin/agent-architect-guided', architectPromptVersion: 1, architectPromptCurrentVersion: 1, createdUtc: '2026-10-28T09:00:00Z' };

async function openMenu(page, name) {
  await row(page, name).locator('.action-menu-trigger').click();
  await expect(page.locator('.action-menu-dropdown')).toBeVisible();
}

function menuItem(page, name) {
  return page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: new RegExp(`^${name}$`) });
}

/** Route the architect list and record every request the page sends to it. */
async function withArchitects(page, rows = [ARCHITECT, GUIDED]) {
  const requests = [];
  await page.route(/\/tenants\/[^/]+\/studio\/architects(\/[^/?]+)?(\?.*)?$/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    requests.push({ method: request.method(), path: url.pathname, query: Object.fromEntries(url.searchParams), body: request.postDataJSON() });
    if (request.method() === 'GET' && url.pathname.endsWith('/studio/architects')) {
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const activeOnly = url.searchParams.get('activeOnly') === 'true';
      const list = rows.filter((r) => (!search || r.name.includes(search)) && (!activeOnly || r.active));
      return route.fulfill(json(200, { objects: list, totalRecords: list.length, skip: 0, maxResults: Number(url.searchParams.get('maxResults') || 25), endOfResults: true }));
    }
    return route.fallback();
  });
  return requests;
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('lists architects with their harness profile, model, prompt, and status, one page at a time', async ({ page }) => {
  const requests = await withArchitects(page);
  await login(page);
  await page.goto(ARCHITECTS);
  await expect(page.getByRole('tab', { name: 'Architects' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(2);
  const first = row(page, 'architect');
  await expect(first).toContainText('sonnet');
  await expect(first).toContainText('agent-architect-team');
  await expect(first).toContainText('Active');
  const guided = row(page, 'guided-architect');
  await expect(guided).toContainText('Profile default');
  await expect(guided).toContainText('builtin/agent-architect-guided (version 1)');
  await expect(guided).toContainText('Inactive');
  const list = requests.find((r) => r.method === 'GET' && r.path.endsWith('/studio/architects'));
  expect(list.query.maxResults).toBeTruthy();
  expect(list.query.skip).toBe('0');

  await page.locator('input.filter-search').first().fill('guided');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
  expect(requests.some((r) => r.query.search === 'guided')).toBe(true);
});

test('creates an architect on the default prompt and shows a taken name on its field', async ({ page }) => {
  await withArchitects(page, []);
  const bodies = [];
  await page.route(/\/tenants\/[^/]+\/studio\/architects$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    bodies.push(route.request().postDataJSON());
    if (bodies.length === 1) return route.fulfill(json(409, { error: 'Conflict', code: 'NameConflict', message: 'A deployment named architect already exists.' }));
    return route.fulfill(json(201, { ...ARCHITECT, ...bodies[bodies.length - 1], id: 'dep_0099' }));
  });
  await login(page);
  await page.goto(ARCHITECTS);
  await expect(page.getByText('No architects yet')).toBeVisible();
  await page.getByTestId('add-button').click();
  await expect(page.locator('#architects-name')).toHaveValue('architect');
  // The first harness profile and the default prompt are chosen once the lists load.
  await expect(page.locator('#architects-harnessProfileId')).toHaveValue('hp_0001');
  await expect(page.locator('#architects-architectPromptTemplateId')).toHaveValue('pt_builtin_agent_architect');
  await expect(page.locator('#architects-architectPromptTemplateId option').first()).toHaveText('builtin/agent-architect (default)');
  await page.locator('#architects-model').fill('opus');
  await page.getByTestId('save-button').click();
  await expect(fieldOf(page, '#architects-name').locator('.field-error')).toHaveText('Another deployment in this tenant already uses this name.');
  await page.locator('#architects-name').fill('architect-2');
  await page.getByTestId('save-button').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(bodies[1]).toEqual({ name: 'architect-2', description: null, harnessProfileId: 'hp_0001', active: true, model: 'opus', credentialSecretId: '', architectPromptTemplateId: 'pt_builtin_agent_architect' });
});

test('edits an architect: rename, pin the guided prompt, and turn it off', async ({ page }) => {
  await withArchitects(page);
  const bodies = [];
  await page.route(/\/tenants\/[^/]+\/studio\/architects\/dep_arch$/, (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    bodies.push(route.request().postDataJSON());
    return route.fulfill(json(200, { ...ARCHITECT, ...bodies[0] }));
  });
  await login(page);
  await page.goto(ARCHITECTS);
  await openMenu(page, 'architect');
  await menuItem(page, 'Edit').click();
  await expect(page.locator('#architects-name')).toHaveValue('architect');
  await expect(page.locator('#architects-architectPromptTemplateId')).toHaveValue('pt_0042');
  await page.locator('#architects-name').fill('research-architect');
  await page.locator('#architects-architectPromptTemplateId').selectOption('pt_builtin_agent_architect_guided');
  await page.locator('#architects-architectPromptVersion').fill('0');
  await page.getByTestId('save-button').click();
  await expect(fieldOf(page, '#architects-architectPromptVersion').locator('.field-error')).toHaveText('Enter a whole number from 1, or leave it empty.');
  expect(bodies).toHaveLength(0);
  await page.locator('#architects-architectPromptVersion').fill('1');
  await page.locator('#architects-active').uncheck();
  await page.getByTestId('save-button').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(bodies).toEqual([{ name: 'research-architect', description: 'Designs our research apps.', harnessProfileId: 'hp_0001', active: false, model: 'sonnet', credentialSecretId: '', architectPromptTemplateId: 'pt_builtin_agent_architect_guided', architectPromptVersion: 1 }]);
});

test('deletes an architect after confirming', async ({ page }) => {
  await withArchitects(page);
  const deleted = [];
  page.on('request', (r) => r.method() === 'DELETE' && deleted.push(new URL(r.url()).pathname));
  await login(page);
  await page.goto(ARCHITECTS);
  await openMenu(page, 'guided-architect');
  await menuItem(page, 'Delete').click();
  await expect(page.locator('.modal')).toContainText('guided-architect');
  expect(deleted).toEqual([]);
  await page.locator('.modal').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(deleted).toEqual(['/v1.0/api/tenants/default/studio/architects/dep_arch_2']);
});

test('opens the architect prompt manager and the deployment from the row', async ({ page }) => {
  await withArchitects(page);
  await login(page);
  await page.goto(ARCHITECTS);
  await openMenu(page, 'architect');
  await menuItem(page, 'Architect prompts').click();
  const modal = page.locator('.modal');
  await expect(modal).toContainText('Architect prompts for architect');
  await expect(page.getByTestId('architect-prompts-table')).toContainText('builtin/agent-architect');
  await expect(page.getByTestId('architect-prompt-selection')).toContainText('agent-architect-team');
  await modal.getByRole('button', { name: 'Close' }).first().click();
  await expect(page.locator('.modal')).toHaveCount(0);

  await openMenu(page, 'architect');
  await menuItem(page, 'Deployment settings').click();
  await expect(page).toHaveURL(/\/dashboard\/agents\?tab=deployments&search=architect$/);
});

test('the studio offers active architects and links to the Architects page', async ({ page }) => {
  await withArchitects(page);
  await login(page);
  await page.goto('/dashboard/studio/drf_0001');
  await expect(page.getByTestId('studio-architect').locator('option')).toHaveText(['Choose an architect', 'architect']);
  await page.getByTestId('studio-manage-architects').click();
  await expect(page).toHaveURL(/\/dashboard\/agents\?tab=architects$/);
  await expect(page.locator('.data-table tbody tr')).toHaveCount(2);
});

test('the studio warns before the first turn when the architect has no credential, and after a NotCredentialed turn', async ({ page }) => {
  // hp_0001 is a Codex profile, which needs a credential.
  const keyed = { ...ARCHITECT, credentialSecretId: 'sec_0001', credentialSecretName: 'secret-1', credentialSecretKind: 'AnthropicApiKey' };
  let rows = [ARCHITECT];
  await page.route(/\/tenants\/[^/]+\/studio\/architects(\?.*)?$/, (route) => route.fulfill(json(200, { objects: rows, totalRecords: rows.length, skip: 0, maxResults: 1000, endOfResults: true })));
  await login(page);
  await page.goto('/dashboard/studio/drf_0001');
  const banner = page.getByTestId('studio-not-credentialed');
  await expect(banner).toContainText('This architect has no credential');
  await expect(page.getByTestId('studio-fix-credential')).toHaveAttribute('href', '/dashboard/agents?tab=architects&search=architect');
  await expect(page.getByTestId('studio-open-secrets')).toHaveAttribute('href', '/dashboard/configuration?tab=secrets');

  // With a credential the warning goes away; a turn the harness could not sign in for brings it back.
  rows = [keyed];
  let failed = false;
  await page.route(/\/agents\/agt_arch\/invoke(\?.*)?$/, (route) => route.fulfill(json(200, { id: 'run_nc', kind: 'Invoke', status: 'Running', conversationId: 'cnv_nc', inputText: 'Hello' })));
  await page.route(/\/runs\/run_nc$/, (route) => {
    failed = true;
    return route.fulfill(json(200, { id: 'run_nc', kind: 'Invoke', status: 'Failed', outcome: 'NotCredentialed', conversationId: 'cnv_nc', inputText: 'Hello', errorMessage: 'Not logged in · Please run /login' }));
  });
  await page.route(/\/conversations\/cnv_nc\/runs(\?.*)?$/, (route) =>
    route.fulfill(json(200, { objects: [failed ? { id: 'run_nc', kind: 'Invoke', status: 'Failed', outcome: 'NotCredentialed', conversationId: 'cnv_nc', inputText: 'Hello', errorMessage: 'Not logged in · Please run /login' } : { id: 'run_nc', kind: 'Invoke', status: 'Running', conversationId: 'cnv_nc', inputText: 'Hello' }], totalRecords: 1 }))
  );
  await page.reload();
  await expect(page.getByTestId('studio-architect')).toHaveValue('dep_arch');
  await expect(banner).toHaveCount(0);
  await page.getByTestId('studio-chat-message').fill('Hello');
  await page.getByTestId('studio-chat-send').click();
  await expect(banner).toContainText('The architect could not sign in to its model provider');
  await page.getByTestId('studio-fix-credential').click();
  await expect(page).toHaveURL(/\/dashboard\/agents\?tab=architects&search=architect$/);
});

test('architect forms suggest the secret the harness signs in with and warn when there is none', async ({ page }) => {
  await withArchitects(page, [ARCHITECT, { ...GUIDED, credentialSecretId: 'sec_0001', credentialSecretName: 'secret-1', credentialSecretKind: 'AnthropicApiKey' }]);
  await login(page);
  await page.goto(ARCHITECTS);
  await expect(row(page, 'architect')).toContainText('None');
  await expect(row(page, 'guided-architect')).toContainText('secret-1');

  // The studio dialog: a Claude Code profile gets the tenant's Anthropic key; a Codex profile whose only login needs
  // reauthentication gets none and a warning with a link to Secrets.
  await page.goto('/dashboard/studio/drf_0001');
  await page.getByTestId('studio-new-architect').click();
  await page.getByTestId('architect-profile').selectOption('hp_0004');
  await expect(page.getByTestId('architect-credential')).toHaveValue('sec_0001');
  await expect(page.getByTestId('architect-credential-hint')).toHaveText(/^The secret profile-4 signs in with\./);
  await page.getByTestId('architect-profile').selectOption('hp_0001');
  await expect(page.getByTestId('architect-credential')).toHaveValue('');
  await expect(page.getByTestId('architect-credential-hint')).toContainText('every turn fails with Not logged in');
  // A choice the person makes is kept when the profile changes.
  await page.getByTestId('architect-credential').selectOption('sec_0003');
  await page.getByTestId('architect-profile').selectOption('hp_0004');
  await expect(page.getByTestId('architect-credential')).toHaveValue('sec_0003');
});

test('the architect form says where harness profiles, secrets, and prompts come from, and refreshes the secrets', async ({ page }) => {
  await withArchitects(page);
  let added = false;
  await page.route(/\/tenants\/[^/]+\/secrets(\?.*)?$/, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    const rows = added ? [{ id: 'sec_0099', tenantId: 'default', name: 'new-openai-key', kind: 'OpenAiApiKey', active: true, status: 'Ok' }] : [];
    return route.fulfill(json(200, { objects: rows, totalRecords: rows.length, skip: 0, maxResults: 1000, endOfResults: true }));
  });
  await login(page);
  await page.goto(ARCHITECTS);
  await row(page, 'architect').locator('.action-menu-trigger').click();
  await menuItem(page, 'Edit').click();
  // hp_0001 is a Codex profile and the tenant has no secrets: the hint says what to add and where.
  const hint = page.getByTestId('architect-credential-hint');
  // One message: what to add, where, and what happens without it.
  await expect(hint.locator('.field-warning')).toHaveText('builtin/claude-code signs in with a secret of kind OpenAiApiKey or CodexAuthJson, and this tenant has none yet. Add one on Configuration > Secrets, then choose it here. Without it, every turn fails with Not logged in.');
  await expect(hint.locator(':scope > span:not(.field-warning):not(.dependency-hint-actions)')).toHaveCount(0);
  await expect(page.locator('.modal .field-hint', { hasText: 'Refresh list' })).toHaveCount(1);
  await expect(page.getByTestId('architect-open-secrets')).toHaveAttribute('href', '/dashboard/configuration?tab=secrets');
  await expect(page.getByTestId('architect-open-secrets')).toHaveAttribute('target', '_blank');
  await expect(page.getByTestId('architect-harness-hint')).toContainText('Configuration > Harness Profiles');
  await expect(page.getByTestId('architect-prompt-hint')).toContainText('Configuration > Prompt Templates');
  // After adding the secret on the other page, Refresh list offers it without closing the form.
  added = true;
  await page.getByTestId('architect-credential-hint-refresh').click();
  await expect(page.locator('#architects-credentialSecretId option', { hasText: 'new-openai-key' })).toHaveCount(1);
  await page.locator('#architects-credentialSecretId').selectOption('sec_0099');
  await expect(hint.locator('.field-warning')).toHaveCount(0);
  await expect(hint).toContainText('The secret builtin/claude-code signs in with.');
});

test('the New architect dialog names Configuration > Secrets and picks up a secret added in another tab', async ({ page }) => {
  await withArchitects(page, []);
  let added = false;
  await page.route(/\/tenants\/[^/]+\/secrets(\?.*)?$/, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    const rows = added ? [{ id: 'sec_0098', tenantId: 'default', name: 'my-anthropic-key', kind: 'AnthropicApiKey', active: true, status: 'Ok' }] : [];
    return route.fulfill(json(200, { objects: rows, totalRecords: rows.length, skip: 0, maxResults: 1000, endOfResults: true }));
  });
  await login(page);
  await page.goto('/dashboard/studio/drf_0001');
  await page.getByTestId('studio-new-architect').click();
  await page.getByTestId('architect-profile').selectOption('hp_0004');
  const hint = page.getByTestId('architect-credential-hint');
  await expect(hint).toContainText('signs in with a secret of kind AnthropicApiKey or ClaudeCodeOAuthToken, and this tenant has none yet');
  await expect(page.getByTestId('architect-open-secrets')).toHaveAttribute('href', '/dashboard/configuration?tab=secrets');
  // Coming back to the tab reads the secrets again; the new key is suggested for the Claude Code profile.
  added = true;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByTestId('architect-credential')).toHaveValue('sec_0098');
  await expect(hint.locator('.field-warning')).toHaveCount(0);
});

test('the studio chat streams the answer in bubbles, waits with a phrase and a timer, then shows telemetry and copies', async ({ page }) => {
  await installControlledStream(page);
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.route(/\/tenants\/[^/]+\/studio\/architects(\?.*)?$/, (route) => route.fulfill(json(200, { objects: [{ ...ARCHITECT, credentialSecretId: 'sec_0001' }], totalRecords: 1 })));
  const created = { id: 'run_live', kind: 'Invoke', status: 'Running', conversationId: 'cnv_live', inputText: 'Build a desk', createdUtc: new Date(Date.now() - 3000).toISOString() };
  const finished = { ...created, status: 'Succeeded', outcome: 'Succeeded', resultText: 'I added a **classifier**.', servedModel: 'claude-sonnet-4-5', timeToFirstTokenMs: 900, streamingMs: 2400, totalMs: 3600, inputTokens: 1500, outputTokens: 220, cachedTokens: 1000, reasoningTokens: 40, outputTokensPerSecond: 91.7, costUsd: 0.0042, completedUtc: new Date().toISOString() };
  let done = false;
  await page.route(/\/agents\/agt_arch\/invoke(\?.*)?$/, (route) => route.fulfill(json(200, created)));
  await page.route(/\/runs\/run_live$/, (route) => route.fulfill(json(200, done ? finished : created)));
  await page.route(/\/conversations\/cnv_live\/runs(\?.*)?$/, (route) => route.fulfill(json(200, { objects: [done ? finished : created], totalRecords: 1 })));
  await login(page);
  await page.goto('/dashboard/studio/drf_0001');
  await page.getByTestId('studio-chat-message').fill('Build a desk');
  await page.getByTestId('studio-chat-send').click();

  // The person's message sits on the right, the architect's answer on the left.
  const user = page.getByTestId('studio-chat-user');
  const answer = page.getByTestId('studio-chat-assistant');
  await expect(user).toContainText('Build a desk');
  const userBox = await user.boundingBox();
  const answerBox = await answer.boundingBox();
  expect(userBox.x + userBox.width).toBeGreaterThan(answerBox.x + answerBox.width);
  expect(answerBox.x).toBeLessThan(userBox.x);

  // Before the first output: dots, a phrase, and the time waited so far.
  const wait = page.getByTestId('studio-chat-wait');
  await expect(wait).toBeVisible();
  await expect(wait).toHaveAttribute('data-stage', 'model');
  await expect(page.getByTestId('studio-chat-wait-elapsed')).toBeVisible();

  // The stream: text appears as it is written, with a caret, and tool calls as chips.
  await pushRunEvent(page, 'run_live', { sequence: 1, eventType: 'AssistantText', text: 'I added ' });
  await expect(page.getByTestId('studio-chat-answer').first()).toContainText('I added');
  await expect(wait).toHaveCount(0);
  await expect(page.locator('.chat-bubble.is-streaming')).toHaveCount(1);
  // A caret follows the text still being written.
  expect(await page.locator('.chat-stream-last .markdown-body > :last-child').evaluate((el) => getComputedStyle(el, '::after').content)).toContain('\u258D');
  await pushRunEvent(page, 'run_live', { sequence: 2, eventType: 'ToolCall', toolName: 'garrison_studio_put_item', toolCallId: 't1' });
  await expect(page.getByTestId('studio-chat-tool')).toContainText('garrison_studio_put_item');
  await pushRunEvent(page, 'run_live', { sequence: 3, eventType: 'ToolResult', toolCallId: 't1', success: true });
  await expect(page.locator('.chat-tool-ok')).toHaveCount(1);

  // The run finishes: the final answer replaces the stream and the telemetry appears under it.
  done = true;
  await page.evaluate((run) => window.__ssePush('run_live', 'run.completed', run), finished);
  await expect(page.locator('.chat-bubble.is-streaming')).toHaveCount(0);
  await expect(page.getByTestId('studio-chat-answer')).toContainText('I added a classifier.');
  const metrics = page.getByTestId('studio-chat-metrics');
  await expect(metrics).toContainText('claude-sonnet-4-5');
  for (const m of ['timeToFirstTokenMs', 'streamingMs', 'totalMs', 'inputTokens', 'outputTokens', 'cachedTokens', 'reasoningTokens', 'outputTokensPerSecond', 'costUsd']) await expect(metrics.locator(`[data-metric="${m}"]`)).toHaveCount(1);
  await expect(metrics.locator('[data-metric="inputTokens"]')).toContainText('1,500');

  // Copy the answer and the message.
  await page.getByTestId('studio-chat-copy-answer').click();
  await expect(page.getByTestId('studio-chat-copy-answer')).toHaveAttribute('data-copy-state', 'copied');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('I added a **classifier**.');
  await page.getByTestId('studio-chat-copy-user').click();
  await expect(page.getByTestId('studio-chat-copy-user')).toHaveAttribute('data-copy-state', 'copied');
});

test('copying works where the Clipboard API is missing (plain http to another host)', async ({ page }) => {
  // Simulate an insecure origin: no navigator.clipboard, so the copy goes through the textarea fallback.
  await page.addInitScript(() => {
    Object.defineProperty(window, 'isSecureContext', { get: () => false });
    Object.defineProperty(navigator, 'clipboard', { get: () => undefined });
    window.__copied = [];
    const original = document.execCommand.bind(document);
    document.execCommand = (cmd, ...rest) => {
      if (cmd === 'copy') {
        window.__copied.push(document.activeElement && document.activeElement.value);
        return true;
      }
      return original(cmd, ...rest);
    };
  });
  const turn = { id: 'run_done', kind: 'Invoke', status: 'Succeeded', outcome: 'Succeeded', conversationId: 'cnv_done', inputText: 'Hello', resultText: 'Hi there', createdUtc: new Date().toISOString() };
  await page.route(/\/tenants\/[^/]+\/studio\/architects(\?.*)?$/, (route) => route.fulfill(json(200, { objects: [{ ...ARCHITECT, credentialSecretId: 'sec_0001' }], totalRecords: 1 })));
  await page.route(/\/conversations\/cnv_done\/runs(\?.*)?$/, (route) => route.fulfill(json(200, { objects: [turn], totalRecords: 1 })));
  await page.addInitScript(() => localStorage.setItem('garrison.studio.conversation.drf_0001', JSON.stringify({ conversationId: 'cnv_done', deploymentId: 'dep_arch' })));
  await login(page);
  await page.goto('/dashboard/studio/drf_0001');
  await page.getByTestId('studio-chat-copy-answer').click();
  await expect(page.getByTestId('studio-chat-copy-answer')).toHaveAttribute('data-copy-state', 'copied');
  expect(await page.evaluate(() => window.__copied)).toEqual(['Hi there']);
});
