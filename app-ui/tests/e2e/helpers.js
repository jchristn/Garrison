// Shared steps for the browser tests. MOCK is the mock gateway's control origin (see mockGateway.mjs).
import { expect } from '@playwright/test';

export const MOCK = 'http://127.0.0.1:4791';

/** Reset the mock gateway with optional branding and a turn script. */
export async function resetMock(request, body = {}) {
  const res = await request.post(`${MOCK}/__mock/reset`, { data: body });
  expect(res.ok()).toBe(true);
}

export async function mockLog(request) {
  return (await request.get(`${MOCK}/__mock/log`)).json();
}

/** Open the demo app and continue without signing in. */
export async function openAnonymously(page, path = '/apps/demo/') {
  await page.goto(path);
  await page.getByTestId('signin-anonymous').click();
  await expect(page.getByTestId('composer-input')).toBeVisible();
}

/** Send a message and wait for the server to accept it. */
export async function send(page, text) {
  await page.getByTestId('composer-input').fill(text);
  await page.getByTestId('send-button').click();
}
