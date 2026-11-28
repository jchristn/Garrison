// The First look tour (LP4.7, LP4.10) against mocked APIs: start it, walk every step to Done with each step's target
// visible, and check it is listed as finished.
// Not run by default (targeted-test rule). Run it with: npx playwright test tests/e2e/tours/first-look.spec.js

import { test, expect } from '@playwright/test';
import { installMocks } from '../mocks.js';
import { expectFinished, login, refuseDialogs, walkTour } from './tourHelpers.js';

test.beforeEach(async ({ page }) => {
  refuseDialogs(page);
  await installMocks(page);
});

test('walks the First look tour to the end on a populated tenant', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page);
  await page.goto('/dashboard/home');
  await page.getByTestId('hub-tour').click();
  await walkTour(page, 'first-look');
  await expect(page.getByTestId('tour-sample')).toHaveCount(0);
  await expectFinished(page, 'first-look');
});

test('keeps the card inside a 390px viewport in right-to-left layout, and Escape returns focus', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await page.goto('/dashboard/home');
  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  const help = page.getByTestId('hub-tour');
  await help.focus();
  await help.click();
  const card = page.getByTestId('tour-card');
  await expect(card).toBeVisible({ timeout: 10000 });
  await expect(card).toHaveAttribute('data-tour-phase', 'showing', { timeout: 10000 });
  const box = await card.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);
  expect(box.y + box.height).toBeLessThanOrEqual(844);
  await page.keyboard.press('Escape');
  await expect(card).toHaveCount(0);
  await expect(help).toBeFocused();
});
