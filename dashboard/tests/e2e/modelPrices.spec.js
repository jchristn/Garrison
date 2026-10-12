import { test, expect } from '@playwright/test';
import { installMocks } from './mocks.js';

async function openPrices(page) {
  await installMocks(page);
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
  await page.goto('/dashboard/configuration?tab=model-prices');
}

test('operators can configure fractional rates, free reasoning, and separate cache counts', async ({ page }) => {
  await openPrices(page);
  await expect(page.locator('.data-table')).toContainText('fixture-model-1');
  await page.getByRole('button', { name: 'Add model price' }).first().click();
  await page.locator('#modelPrices-name').fill('operator-price');
  await page.locator('#modelPrices-model').fill(' exact-served-model ');
  await page.locator('#modelPrices-harnessType').selectOption('ClaudeCode');
  await page.locator('#modelPrices-inputUsdPerMillion').fill('0.125');
  await page.locator('#modelPrices-outputUsdPerMillion').fill('0');
  await page.locator('#modelPrices-reasoningUsdPerMillion').fill('0');
  await page.locator('#modelPrices-inputIncludesCachedTokens').uncheck();
  const request = page.waitForRequest((r) => r.method() === 'POST' && r.url().endsWith('/model-prices'));
  await page.getByTestId('save-button').click();
  const body = (await request).postDataJSON();
  expect(body).toMatchObject({ model: 'exact-served-model', harnessType: 'ClaudeCode', inputUsdPerMillion: 0.125, outputUsdPerMillion: 0, cachedInputUsdPerMillion: null, reasoningUsdPerMillion: 0, inputIncludesCachedTokens: false });
  await expect(page.locator('.modal')).toHaveCount(0);
});

test('invalid rates stay in the form and explain the allowed range', async ({ page }) => {
  await openPrices(page);
  await page.getByRole('button', { name: 'Add model price' }).first().click();
  await page.locator('#modelPrices-name').fill('bad-rate');
  await page.locator('#modelPrices-model').fill('model');
  await page.locator('#modelPrices-inputUsdPerMillion').fill('-1');
  await page.getByTestId('save-button').click();
  await expect(page.locator('.modal')).toContainText('Enter a finite rate from 0 to 1,000,000,000');
});
