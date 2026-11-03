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

test('configuration splits into two hubs, preserves old links and provides mobile selection and shared import/export', async ({ page }, testInfo) => {
  await login(page);
  await page.goto('/dashboard/configuration');
  await expect(page.getByRole('heading', { name: 'Agent Resources', exact: true })).toBeVisible();
  await expect(page.locator('.hub-tab-strip [role="tab"]')).toHaveCount(4);
  await expect(page.getByRole('link', { name: 'Import / Export', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('agent-resources-navigation.png'), fullPage: true });
  await page.goto('/dashboard/configuration?tab=secrets');
  await expect(page).toHaveURL('/dashboard/platform-configuration');
  await expect(page.getByRole('heading', { name: 'Platform Configuration', exact: true })).toBeVisible();
  await expect(page.locator('.hub-tab-strip [role="tab"]')).toHaveCount(6);
  await page.screenshot({ path: testInfo.outputPath('platform-configuration-navigation.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.dashboard-sidebar')).not.toBeInViewport();
  await expect(page.locator('.hub-tab-select')).toBeVisible();
  await expect(page.locator('.hub-tab-strip')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.screenshot({ path: testInfo.outputPath('platform-configuration-mobile.png'), fullPage: true });
  await page.locator('.hub-tab-select').selectOption('model-prices');
  await expect(page).toHaveURL(/platform-configuration\?tab=model-prices$/);
  await page.goto('/dashboard/configuration?tab=notifications&search=alert#history');
  await expect(page).toHaveURL('/dashboard/platform-configuration?tab=notifications&search=alert#history');
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
    await page.goto('/dashboard/configuration');
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
    if (auth === 'BearerToken') await page.locator('.modal').screenshot({ path: testInfo.outputPath('central-ollama-connection.png') });
    await page.getByTestId('save-button').click();
    await expect(page.locator('.modal')).toHaveCount(0);
    expect(bodies[0].runtimeConfiguration.model).toBe('cloud-model');
    expect(bodies[0].runtimeConfiguration.inferenceEndpoint.authenticationType).toBe(auth);
    expect(bodies[0].runtimeConfiguration.inferenceEndpoint.protocol).toBe('Ollama');
  });
}
