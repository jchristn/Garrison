// Agent architects against mocked APIs: the Architects tab under Agents lists the tenant's architects (harness
// profile, model, prompt with its pin, status) one page at a time, creates one on the default prompt, edits one
// (rename, pin the guided prompt, turn it off), refuses a taken name on its field, deletes after confirming, opens the
// architect prompt manager and the underlying deployment from the row, and the studio links to the page.

import { test, expect } from '@playwright/test';
import { installMocks, ARCHITECT } from './mocks.js';

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
