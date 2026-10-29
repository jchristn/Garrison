// Agentic apps (AD6.11) against mocked APIs: the Apps tab under Agents (name, URL, entry agent, members, live
// environment, sign-in, status, search), creating an app through the five-step editor with server refusals shown on
// their fields (UnknownEnvironment, 409 AppSlugTaken) and a client-side cycle check, the read-only graph, the shareable
// URL (copy and Open), delegation drift and Write drafts with DraftConflict, taking and publishing a revision, a
// promotion refused with NoTargetDeployments naming the member, delete with confirmation, and actions disabled with
// the missing permission for a caller who may only read apps.

import { test, expect } from '@playwright/test';
import { installMocks, PRINCIPAL } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
const APPS = '/dashboard/agents?tab=apps';
const row = (page, name) => page.locator('.data-table tbody tr', { has: page.locator('strong', { hasText: new RegExp(`^${name}$`) }) });
const fieldOf = (page, selector) => page.locator('.modal .field', { has: page.locator(selector) }).first();

async function openMenu(page, name) {
  await row(page, name).locator('.action-menu-trigger').click();
  await expect(page.locator('.action-menu-dropdown')).toBeVisible();
}

async function menuItem(page, name) {
  return page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: new RegExp(`^${name}$`) });
}

async function step(page, name) {
  await page.locator('.modal .stepper-step', { hasText: name }).click();
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('lists apps with their URL, entry agent, members, live environment, sign-in, and status', async ({ page }) => {
  const searches = [];
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (url.pathname.endsWith('/apps') && r.method() === 'GET') searches.push(url.searchParams.get('search'));
  });
  await login(page);
  await page.goto(APPS);
  await expect(page.getByRole('tab', { name: 'Apps' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(2);
  const research = row(page, 'research');
  await expect(research).toContainText('/apps/research/');
  await expect(research).toContainText('echo-agent');
  await expect(research).toContainText('App users');
  await expect(research).toContainText('Active');
  await expect(research.locator('td span', { hasText: /^3$/ })).toHaveAttribute('data-tip', /echo-agent, agent-2, agent-3/);
  const support = row(page, 'support');
  await expect(support).toContainText('/apps/support-desk/');
  await expect(support).toContainText('Anonymous');
  await expect(support).toContainText('staging');
  await expect(support).toContainText('Inactive');
  // The URL cell's tooltip says who can sign in under the app's sign-in setting.
  await expect(support.getByTestId('app-open-link')).toHaveAttribute('data-tip', /Anyone with the link/);
  await expect(research.getByTestId('app-open-link')).toHaveAttribute('data-tip', /AppUser role/);

  await page.locator('input.filter-search').first().fill('sup');
  await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
  expect(searches[searches.length - 1]).toBe('sup');
});

test('copies the app URL and opens the app in a new tab', async ({ page }) => {
  await page.addInitScript(() => {
    window.__copied = [];
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text) => window.__copied.push(text) } });
  });
  await login(page);
  await page.goto(APPS);
  const research = row(page, 'research');
  const origin = new URL(page.url()).origin;
  await research.locator('.copy-btn').click();
  await expect.poll(() => page.evaluate(() => window.__copied)).toEqual([`${origin}/apps/research/`]);
  await expect(page.locator('.modal')).toHaveCount(0);
  const open = research.getByTestId('app-open-link');
  await expect(open).toHaveAttribute('href', `${origin}/apps/research/`);
  await expect(open).toHaveAttribute('target', '_blank');
  await expect(open).toHaveAttribute('rel', /noopener/);

  // The view dialog leads with the same link, who can sign in, and the graph.
  await openMenu(page, 'research');
  await (await menuItem(page, 'View')).click();
  await expect(page.getByTestId('app-view').getByTestId('app-url')).toHaveText(`${origin}/apps/research/`);
  await expect(page.getByTestId('app-view').getByTestId('app-sign-in')).toContainText('AppUser role');
  await expect(page.getByTestId('app-view').locator('[data-node]')).toHaveCount(3);
  await expect(page.getByTestId('app-view').locator('[data-node="agt_0001"]')).toHaveClass(/is-entry/);
  await expect(page.getByTestId('app-view').locator('[data-edge="agt_0002>agt_0003"]')).toHaveClass(/is-single/);
});

test('creates an app, showing server refusals on their fields and catching a cycle before sending', async ({ page }) => {
  const bodies = [];
  let attempt = 0;
  await page.route(/\/tenants\/[^/]+\/apps$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    bodies.push(route.request().postDataJSON());
    attempt += 1;
    if (attempt === 1) {
      return route.fulfill(
        json(400, {
          error: 'BadRequest',
          code: 'ValidationFailed',
          message: 'The app is not valid: liveEnvironment: Environments are dev, staging, prod.',
          fields: { liveEnvironment: 'Environments are dev, staging, prod.', 'environments[0].deploymentId': 'The deployment must be the entry agent\'s, in environment staging.' },
          fieldCodes: { liveEnvironment: 'UnknownEnvironment', 'environments[0].deploymentId': 'InvalidEntryDeployment' }
        })
      );
    }
    if (attempt === 2) return route.fulfill(json(409, { error: 'Conflict', code: 'AppSlugTaken', message: 'The URL slug docs is taken. Slugs are unique across the cluster; choose another.' }));
    return route.fulfill(json(201, { ...bodies[bodies.length - 1], id: 'app_0099', createdUtc: '2026-10-28T09:00:00Z' }));
  });
  await login(page);
  await page.goto(APPS);
  await page.getByTestId('add-button').click();
  await expect(page.locator('.modal .stepper-step')).toHaveCount(5);
  await page.locator('#apps-name').fill('docs');

  await step(page, 'Members and calls');
  await page.getByRole('button', { name: 'Add member' }).click();
  await page.getByRole('button', { name: 'Add member' }).click();
  await page.locator('#ol-0-agentId').selectOption('agt_0001');
  await page.locator('#ol-1-agentId').selectOption('agt_0002');
  await page.locator('#apps-entryAgentId').selectOption('agt_0001');
  await page.getByRole('button', { name: 'Add call' }).click();
  await page.getByRole('button', { name: 'Add call' }).click();
  await page.locator('#ol-0-callerAgentId').selectOption('agt_0001');
  await page.locator('#ol-0-calleeAgentId').selectOption('agt_0002');
  await expect(page.locator('#ol-0-fanOutAllowed')).toBeChecked();
  await page.locator('#ol-1-callerAgentId').selectOption('agt_0002');
  await page.locator('#ol-1-calleeAgentId').selectOption('agt_0001');
  await expect(page.getByTestId('app-graph').locator('[data-node]')).toHaveCount(2);

  // A loop is caught in the browser: no request, and the message sits under the calls.
  await page.getByTestId('save-button').click();
  await expect(page.locator('.modal .field-error', { hasText: 'form a cycle' })).toBeVisible();
  expect(bodies).toHaveLength(0);
  await page.locator('.modal .object-list').nth(1).locator('.object-list-row').nth(1).getByRole('button', { name: 'Remove' }).click();

  await step(page, 'Environments');
  await page.getByRole('button', { name: 'Add environment' }).click();
  await page.locator('#ol-0-environment').selectOption('staging');
  // Only the entry agent's deployments in that environment are offered.
  await expect(page.locator('#ol-0-deploymentId option')).toHaveText(['First active deployment', 'deployment-2']);
  await page.locator('#ol-0-deploymentId').selectOption('dep_0002');
  await page.locator('#apps-liveEnvironment').selectOption('staging');

  await step(page, 'Branding');
  await page.locator('#apps-primaryColor').fill('#1f6feb');

  // The server refuses: each message is translated and shown on its field, on the step that holds it.
  await step(page, 'App');
  await page.getByTestId('save-button').click();
  await expect(page.locator('.modal .stepper-step.active')).toContainText('Environments');
  await expect(fieldOf(page, '#apps-liveEnvironment').locator('.field-error')).toHaveText('This environment does not exist in the tenant.');
  await expect(page.locator('.modal .field-error', { hasText: 'Choose a deployment of the entry agent in this environment.' })).toBeVisible();
  expect(bodies[0]).toMatchObject({
    name: 'docs',
    slug: 'docs',
    entryAgentId: 'agt_0001',
    members: [{ agentId: 'agt_0001', role: null }, { agentId: 'agt_0002', role: null }],
    edges: [{ callerAgentId: 'agt_0001', calleeAgentId: 'agt_0002', fanOutAllowed: true }],
    environments: [{ environment: 'staging', deploymentId: 'dep_0002' }],
    liveEnvironment: 'staging',
    authMode: 'AppUsers',
    primaryColor: '#1f6feb'
  });

  // A taken slug lands on the slug field.
  await page.getByTestId('save-button').click();
  await expect(page.locator('.modal .stepper-step.active')).toContainText('App');
  await expect(fieldOf(page, '#apps-slug').locator('.field-error')).toContainText('Slugs are unique across the cluster');
  await page.locator('#apps-slug').fill('docs-desk');

  // The sign-in step shows the link the app will have and who can sign in.
  await step(page, 'Sign-in and link');
  await page.locator('#apps-authMode').selectOption('TenantUsers');
  await expect(page.locator('.modal').getByTestId('app-url')).toContainText('/apps/docs-desk/');
  await expect(page.locator('.modal').getByTestId('app-sign-in')).toHaveText('Any active user of this tenant can sign in.');

  await page.getByTestId('save-button').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(bodies[2]).toMatchObject({ slug: 'docs-desk', authMode: 'TenantUsers' });
});

test('shows delegation drift and writes drafts, reporting a draft conflict', async ({ page }) => {
  let posted = 0;
  page.on('request', (r) => {
    if (r.url().endsWith('/apps/app_0001/delegation') && r.method() === 'POST') posted += 1;
  });
  await login(page);
  await page.goto(APPS);
  await openMenu(page, 'research');
  await (await menuItem(page, 'Delegation')).click();
  const table = page.getByTestId('app-delegation');
  await expect(table.locator('tbody tr')).toHaveCount(3);
  await expect(page.getByTestId('app-delegation-summary')).toContainText('2 members');
  await expect(table.locator('[data-member="echo-agent"]')).toContainText('In sync');
  const writer = table.locator('[data-member="agent-2"]');
  await expect(writer).toHaveAttribute('data-drift', 'true');
  await expect(writer).toContainText('agent-3');
  await expect(writer).toContainText('Allow list');
  await expect(writer).toContainText('No delegation');
  await page.getByTestId('app-delegation-apply').click();
  await expect(writer).toContainText('Draft 3');
  await expect(table.locator('[data-member="agent-3"]')).toContainText('Draft conflict');
  await expect(table.locator('[data-member="agent-3"] .pill-danger')).toHaveAttribute('data-tip', /left alone/);
  await expect(page.getByTestId('app-delegation-summary')).toContainText('Wrote 1 draft revisions');
  expect(posted).toBe(1);
});

test('takes and publishes a revision, and shows NoTargetDeployments naming the member', async ({ page }) => {
  const posts = [];
  page.on('request', (r) => {
    if (r.method() === 'POST' && /\/apps\/app_0001\//.test(r.url())) posts.push(`${new URL(r.url()).pathname.replace(/^.*\/apps\/app_0001/, '')} ${r.postData() || ''}`.trim());
  });
  await page.route(/\/apps\/app_0001\/promote$/, (route) =>
    route.fulfill(json(409, { error: 'Conflict', code: 'NoTargetDeployments', message: 'Member agent-3 has no deployment in environment staging. Create one there first; nothing was promoted.' }))
  );
  await login(page);
  await page.goto(APPS);
  await openMenu(page, 'research');
  await (await menuItem(page, 'Revisions and promotion')).click();
  const table = page.getByTestId('app-revisions');
  await expect(table.locator('tbody tr')).toHaveCount(2);
  await expect(table.locator('[data-revision="1"]')).toContainText('Latest');
  await expect(table.locator('[data-revision="1"]')).toContainText('agent-3, revision 1');
  await expect(table.locator('[data-revision="2"]')).toHaveAttribute('data-state', 'Draft');

  await page.locator('#app-revision-note').fill('Writer added');
  await page.getByTestId('app-revision-take').click();
  await expect(page.locator('.toast', { hasText: 'Took app revision 3.' })).toBeVisible();

  await table.locator('[data-revision="2"]').getByTestId('app-revision-publish').click();
  await page.locator('.modal').last().getByRole('button', { name: 'Publish', exact: true }).click();
  await expect(page.locator('.toast', { hasText: 'Published app revision 2.' })).toBeVisible();

  await page.getByTestId('app-promote').click();
  await expect(page.locator('#app-promote-source')).toHaveValue('dev');
  await expect(page.locator('#app-promote-target option').first()).toHaveText('Next environment (staging)');
  await page.getByTestId('app-promote-submit').click();
  await expect(page.getByTestId('app-promote-error')).toContainText('Member agent-3 has no deployment in environment staging');
  await expect(page.getByTestId('app-promote-error')).toContainText('Nothing was promoted');
  expect(posts).toEqual(['/revisions {"changeNote":"Writer added"}', '/revisions/2/publish', '/promote {"sourceEnvironment":"dev","targetEnvironment":"staging"}']);
});

test('deletes an app after confirming', async ({ page }) => {
  const deleted = [];
  page.on('request', (r) => r.method() === 'DELETE' && deleted.push(new URL(r.url()).pathname));
  await login(page);
  await page.goto(APPS);
  await openMenu(page, 'support');
  await (await menuItem(page, 'Delete')).click();
  await expect(page.locator('.modal')).toContainText('support');
  expect(deleted).toEqual([]);
  await page.locator('.modal').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(deleted).toEqual(['/v1.0/api/tenants/default/apps/app_0002']);
});

test('disables create, edit, delete, delegation, publish, and promote for a caller who may only read apps', async ({ page }) => {
  await page.route(/\/v1\.0\/token\/details$/, (route) => route.fulfill(json(200, { ...PRINCIPAL, isAdmin: false, isTenantAdmin: false })));
  await page.route(/\/users\/usr_admin\/permissions$/, (route) =>
    route.fulfill(
      json(200, {
        principalType: 'User',
        principalId: 'usr_admin',
        tenantId: 'default',
        isAdmin: false,
        isTenantAdmin: false,
        grants: [{ source: 'Viewer', permissionType: 'Permit', resourceTypes: ['AgenticApp', 'Agent'], operations: ['Read'], scope: 'Tenant', inheritsToChildren: true }],
        hasPermission: []
      })
    )
  );
  let changed = 0;
  page.on('request', (r) => {
    if (/\/apps/.test(r.url()) && r.method() !== 'GET') changed += 1;
  });
  await login(page);
  await page.goto(APPS);
  const add = page.getByTestId('add-button');
  await expect(add).toHaveAttribute('aria-disabled', 'true');
  await expect(add).toHaveAttribute('data-tip', 'You need Create permission on Agentic app for this. Ask an administrator for a role that grants it.');
  await add.click({ force: true });
  await expect(page.locator('.modal')).toHaveCount(0);

  await openMenu(page, 'research');
  await expect(await menuItem(page, 'Edit')).toHaveAttribute('aria-disabled', 'true');
  await expect(await menuItem(page, 'Edit')).toHaveAttribute('data-tip', /Update permission/);
  await expect(await menuItem(page, 'Delete')).toHaveAttribute('aria-disabled', 'true');
  await expect(await menuItem(page, 'Duplicate')).toHaveCount(0);
  await (await menuItem(page, 'Delegation')).click();
  await expect(page.getByTestId('app-delegation-apply')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByTestId('app-delegation-apply')).toHaveAttribute('data-tip', /Update permission/);
  await page.getByTestId('app-delegation-apply').click({ force: true });
  await page.keyboard.press('Escape');
  await expect(page.locator('.modal')).toHaveCount(0);

  await openMenu(page, 'research');
  await (await menuItem(page, 'Revisions and promotion')).click();
  await expect(page.getByTestId('app-revision-take')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByTestId('app-revision-publish')).toHaveAttribute('data-tip', /Execute permission on Agentic app/);
  await expect(page.getByTestId('app-promote')).toHaveAttribute('data-tip', /Execute permission on Promotion/);
  await page.getByTestId('app-promote').click({ force: true });
  await expect(page.getByTestId('app-promote-submit')).toHaveCount(0);
  await page.keyboard.press('Escape');

  // A row click opens the read-only view; its Edit button stays disabled with the reason.
  await row(page, 'research').locator('td').nth(2).click();
  await expect(page.getByTestId('view-edit-button')).toHaveAttribute('aria-disabled', 'true');
  expect(changed).toBe(0);
});
