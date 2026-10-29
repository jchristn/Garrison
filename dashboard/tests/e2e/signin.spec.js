// Which server the production build signs in to (mocked APIs, no backend). By default there is no Server URL field
// and the console uses the page origin; a stale remembered URL is ignored; with allowCustomServer in /config.js,
// "Use a different server" reveals the field and the typed server is used; System > About shows the server in use.

import { test, expect } from '@playwright/test';
import { installMocks, PRINCIPAL } from './mocks.js';

const OTHER = 'http://127.0.0.1:9700';
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, content-type, accept-language',
  'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS'
};

/** Serve /config.js the way the image's entrypoint writes it. */
async function serveConfig(page, allowCustomServer) {
  await page.route(/\/config\.js$/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/javascript', body: `window.GARRISON_CONFIG = { apiUrl: "", allowCustomServer: ${allowCustomServer} };` })
  );
}

/** Answer sign-in and token details on the second server, recording each request. */
async function mockOtherServer(page) {
  const seen = [];
  await page.route(`${OTHER}/**`, (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS, body: '' });
    seen.push(`${req.method()} ${new URL(req.url()).pathname}`);
    const path = new URL(req.url()).pathname;
    const body = path === '/v1.0/token' ? { token: 'tok_other' } : path === '/v1.0/token/details' ? PRINCIPAL : {};
    return route.fulfill({ status: 200, headers: { ...CORS, 'content-type': 'application/json' }, body: JSON.stringify(body) });
  });
  return seen;
}

async function fillPassword(page) {
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
}

test.beforeEach(async ({ page }) => {
  await installMocks(page);
});

test('no server field by default; sign-in uses the page origin', async ({ page, baseURL }) => {
  await serveConfig(page, false);
  const tokenRequests = [];
  page.on('request', (r) => {
    if (new URL(r.url()).pathname === '/v1.0/token') tokenRequests.push(r.url());
  });
  await page.goto('/');
  await expect(page.getByTestId('login-submit')).toBeVisible();
  await expect(page.locator('#serverUrl')).toHaveCount(0);
  await expect(page.getByTestId('login-use-different-server')).toHaveCount(0);
  const origin = new URL(baseURL).origin;
  await expect(page.getByTestId('login-server')).toContainText(origin);
  await fillPassword(page);
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
  expect(tokenRequests).toEqual([`${origin}/v1.0/token`]);
});

test('a stale remembered server URL is ignored and removed', async ({ page, baseURL }) => {
  await serveConfig(page, false);
  const seen = await mockOtherServer(page);
  await page.addInitScript((url) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('garrison_server_url', url);
      sessionStorage.setItem('seeded', '1');
    }
  }, OTHER);
  await page.goto('/');
  await expect(page.getByTestId('login-submit')).toBeVisible();
  await expect(page.locator('#serverUrl')).toHaveCount(0);
  await expect(page.getByTestId('login-server')).toContainText(new URL(baseURL).origin);
  expect(await page.evaluate(() => localStorage.getItem('garrison_server_url'))).toBeNull();
  await fillPassword(page);
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
  expect(seen).toEqual([]);
});

test('with allowCustomServer, the link reveals the field and the typed server is used', async ({ page }) => {
  await serveConfig(page, true);
  const seen = await mockOtherServer(page);
  await page.goto('/');
  await expect(page.locator('#serverUrl')).toHaveCount(0);
  await page.getByTestId('login-use-different-server').click();
  await expect(page.locator('#serverUrl')).toBeVisible();
  await page.locator('#serverUrl').fill(OTHER);
  await expect(page.getByTestId('login-server')).toContainText(OTHER);
  await fillPassword(page);
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
  expect(seen.slice(0, 2)).toEqual(['POST /v1.0/token', 'GET /v1.0/token/details']);
  expect(await page.evaluate(() => localStorage.getItem('garrison_server_url'))).toBe(OTHER);
  await expect(page.locator('.topbar-server code')).toHaveText(OTHER);
});

test('System > About shows the server in use', async ({ page, baseURL }) => {
  await serveConfig(page, false);
  await page.goto('/');
  await fillPassword(page);
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
  await page.goto('/dashboard/system?tab=server-info');
  await expect(page.getByTestId('about-server-in-use')).toHaveText(new URL(baseURL).origin);
});
