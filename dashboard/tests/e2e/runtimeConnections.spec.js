import { test, expect } from '@playwright/test';
import { installMocks } from './mocks.js';
const json = (body, status = 200) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}
test.beforeEach(async ({ page }) => { await installMocks(page); });

test('Connections is one page and Configuration uses a section menu with working legacy links', async ({ page }, testInfo) => {
  await login(page);
  await page.goto('/dashboard/connections');
  await expect(page.getByRole('heading', { level: 1, name: 'Connections', exact: true })).toBeVisible();
  await expect(page.locator('[role="tablist"]')).toHaveCount(0);
  await expect(page.getByText('Saved connections', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Advanced harness templates', { exact: true })).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('connections-navigation.png'), fullPage: true });
  await page.goto('/dashboard/configuration?tab=harness-profiles');
  await expect(page).toHaveURL('/dashboard/connections');
  await page.goto('/dashboard/harness-profiles');
  await expect(page).toHaveURL('/dashboard/connections');
  await page.goto('/dashboard/platform-configuration');
  await expect(page).toHaveURL('/dashboard/configuration');
  await expect(page.getByRole('heading', { name: 'Configuration', exact: true })).toBeVisible();
  await expect(page.locator('[role="tablist"]')).toHaveCount(0);
  await expect(page.locator('.configuration-sections a')).toHaveCount(10);
  await page.screenshot({ path: testInfo.outputPath('configuration-menu.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.dashboard-sidebar')).not.toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.locator('.configuration-section-select').selectOption('model-prices');
  await expect(page).toHaveURL(/configuration\?tab=model-prices$/);
  await page.screenshot({ path: testInfo.outputPath('configuration-mobile.png'), fullPage: true });
  await page.goto('/dashboard/platform-configuration?tab=notifications&search=alert#history');
  await expect(page).toHaveURL('/dashboard/configuration?tab=notifications&search=alert#history');
});

for (const auth of ['None', 'BearerToken', 'ApiKey', 'Headers', 'QueryString', 'Basic']) {
  test(`saved native Ollama connection owns ${auth} settings centrally`, async ({ page }, testInfo) => {
    const template = { id: 'hrn_builtin_provider_api', name: 'builtin/provider-api', harnessType: 'ProviderApi', executable: 'garrison-provider-api', active: true, isBuiltIn: true, arguments: [], files: [], environment: [], successExitCodes: [0] };
    await page.route(/\/secrets(\?.*)?$/, (route) => route.fulfill(json({ objects: [{ id: 'sec_0001', name: 'Saved Ollama token', kind: 'BearerToken', active: true }], totalRecords: 1, endOfResults: true })));
    const profiles = [template];
    const bodies = [];
    await page.route(/\/harness-profiles(\?.*)?$/, (route) => {
      if (route.request().method() === 'POST') { const body = route.request().postDataJSON(); bodies.push(body); profiles.push({ ...body, id: 'hp_saved' }); return route.fulfill(json(profiles.at(-1), 201)); }
      return route.fulfill(json({ objects: profiles, totalRecords: profiles.length, endOfResults: true }));
    });
    await login(page);
    await page.goto('/dashboard/connections');
    await page.getByTestId('add-button').click();
    await page.locator('#harnessProfiles-name').fill('Ollama Cloud');
    await page.locator('#runtime-template').selectOption(template.id);
    await page.locator('#runtime-model').fill('cloud-model');
    await page.locator('#runtime-inference-protocol').selectOption('Ollama');
    await page.locator('#runtime-inference-base-url').fill('https://ollama.com');
    await page.locator('#runtime-inference-authentication').selectOption({ value: auth });
    if (['ApiKey', 'Headers', 'QueryString'].includes(auth)) await page.locator('#runtime-inference-name-0').fill('token');
    if (auth === 'ApiKey') await page.locator('#runtime-inference-location-0').selectOption('QueryString');
    if (auth !== 'None') await page.locator('#runtime-inference-secret-0').selectOption('sec_0001');
    if (auth === 'Basic') await page.locator('#runtime-inference-secret-1').selectOption('sec_0001');
    if (auth === 'BearerToken') {
      const model = await page.locator('#runtime-model').boundingBox();
      const endpoint = await page.getByTestId('runtime-inference-endpoint').boundingBox();
      expect(endpoint.y - model.y - model.height).toBeGreaterThanOrEqual(12);
      await page.locator('.modal').screenshot({ path: testInfo.outputPath('central-ollama-connection.png') });
    }
    await page.getByTestId('save-button').click();
    await expect(page.locator('.modal')).toHaveCount(0);
    expect(bodies[0].runtimeConfiguration.model).toBe('cloud-model');
    expect(bodies[0].runtimeConfiguration.inferenceEndpoint.authenticationType).toBe(auth);
    expect(bodies[0].runtimeConfiguration.inferenceEndpoint.protocol).toBe('Ollama');
  });
}

test('custom harness launch settings belong to the same connection editor', async ({ page }) => {
  const bodies = [];
  await page.route(/\/harness-profiles(\?.*)?$/, (route) => {
    if (route.request().method() === 'POST') { bodies.push(route.request().postDataJSON()); return route.fulfill(json({ ...bodies[0], id: 'hp_custom' }, 201)); }
    return route.fulfill(json({ objects: [], endOfResults: true }));
  });
  await login(page);
  await page.goto('/dashboard/connections');
  await page.getByTestId('add-button').click();
  await page.locator('#harnessProfiles-name').fill('Local custom harness');
  await page.locator('#runtime-template').selectOption('custom');
  await expect(page.locator('#connection-advanced-executable')).toBeVisible();
  await page.locator('#connection-advanced-executable').fill('my-agent-cli');
  await page.getByTestId('save-button').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(bodies[0].executable).toBe('my-agent-cli');
  expect(bodies[0].runtimeConfiguration).toEqual({});
});

test('changing a connection type retains its ID and updates the referenced connection', async ({ page }) => {
  const saved = { id: 'hp_existing', name: 'Existing connection', harnessType: 'Generic', executable: 'old-cli', runtimeConfiguration: { model: 'old-model' }, active: true, isBuiltIn: false };
  const api = { id: 'hp_api', name: 'builtin/provider-api', harnessType: 'ProviderApi', executable: 'garrison-provider-api', isBuiltIn: true, active: true };
  let updated;
  await page.route(/\/harness-profiles(\?.*)?$/, (route) => route.fulfill(json({ objects: [saved, api], endOfResults: true })));
  await page.route(/\/harness-profiles\/hp_existing$/, (route) => {
    if (route.request().method() !== 'PUT') return route.fulfill(json(saved));
    updated = route.request().postDataJSON();
    return route.fulfill(json({ ...updated, id: saved.id }));
  });
  await login(page);
  await page.goto('/dashboard/connections');
  await page.locator('.data-table tbody tr', { hasText: saved.name }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]').filter({ hasText: /^Edit$/ }).click();
  await page.locator('#runtime-template').selectOption(api.id);
  await page.locator('#runtime-model').fill('new-model');
  await page.locator('#runtime-inference-base-url').fill('https://compatible.example/v1');
  await page.locator('#runtime-inference-authentication').selectOption({ value: 'None' });
  await page.getByTestId('save-button').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(updated.id).toBe(saved.id);
  expect(updated.runtimeConfiguration.model).toBe('new-model');
});

test('other hub tab bars switch to a picker when space runs out instead of adding a second row', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/agents');
  await page.locator('.hub').evaluate((el) => { el.style.width = '430px'; });
  await expect(page.locator('.hub-tab-select')).toBeVisible();
  await expect(page.locator('.hub-tab-overflow')).toBeHidden();
  await page.locator('.hub-tab-select').selectOption('architects');
  await expect(page).toHaveURL(/agents\?tab=architects$/);
});

test('existing custom API launch configurations can be edited without re-entering endpoint settings', async ({ page }) => {
  const legacy = { id: 'hp_legacy_api', name: 'Existing API connection', isBuiltIn: false, active: true, harnessType: 'ProviderApi', executable: 'garrison-provider-api', runtimeConfiguration: null, files: [{ pathTemplate: 'provider-api.json', contentTemplate: '{"provider":"Ollama","endpoint":"https://ollama.com","model":"cloud-model"}' }] };
  let body;
  await page.route(/\/harness-profiles(\?.*)?$/, (route) => route.fulfill(json({ objects: [legacy], endOfResults: true })));
  await page.route(/\/harness-profiles\/hp_legacy_api$/, (route) => { body = route.request().postDataJSON(); return route.fulfill(json({ ...legacy, ...body })); });
  await login(page);
  await page.goto('/dashboard/connections');
  await page.locator('.data-table tbody tr', { hasText: legacy.name }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]').filter({ hasText: /^Edit$/ }).click();
  await expect(page.locator('#runtime-model')).toHaveCount(0);
  await expect(page.locator('#runtime-inference-base-url')).toHaveCount(0);
  await page.locator('#harnessProfiles-name').fill('Renamed API connection');
  await page.getByTestId('save-button').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(body.runtimeConfiguration).toBeNull();
  expect(body.files[0].contentTemplate).toBe(legacy.files[0].contentTemplate);
});
