// The Agents on their own tour (LP4.11, UXP1-S009) against mocked APIs: start it from the Autonomy hub's "?" button,
// walk every step to Done with each step's target visible, check it is listed as finished, and check the Freezes tab
// keeps Keep it safe. On a tenant with no keeper it offers the gerbil example first.
// Not run by default (targeted-test rule). Run it with: npx playwright test tests/e2e/tours/agents-on-their-own.spec.js

import { test, expect } from '@playwright/test';
import { installMocks } from '../mocks.js';
import { expectFinished, login, refuseDialogs, startFromLearn, walkTour } from './tourHelpers.js';

test.beforeEach(async ({ page }) => {
  refuseDialogs(page);
  await installMocks(page);
});

test('walks the Agents on their own tour from the Autonomy "?" button on a populated tenant', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page);
  await page.goto('/dashboard/autonomy?tab=messages');
  await expect(page.getByTestId('hub-tour')).toHaveAttribute('data-hub-tour', 'agents-on-their-own');
  await page.getByTestId('hub-tour').click();
  await walkTour(page, 'agents-on-their-own');
  await expect(page.getByTestId('tour-sample')).toHaveCount(0);
  await expectFinished(page, 'agents-on-their-own');
});

test('starts from the Learn autonomy section at 390 px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await login(page);
  await startFromLearn(page, 'agents-on-their-own');
  await walkTour(page, 'agents-on-their-own');
});

test('keeps Keep it safe on the Freezes tab', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page);
  await page.goto('/dashboard/autonomy?tab=freezes');
  await expect(page.getByTestId('hub-tour')).toHaveAttribute('data-hub-tour', 'keep-it-safe');
});

test('offers the gerbil example on a tenant with no keepers, listed by dashboard names', async ({ page }) => {
  // Registered after installMocks, so an empty keeper list wins.
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/mandates(\?.*)?$/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], totalCount: 0, pageNumber: 1, pageSize: 1, endOfResults: true }) })
  );
  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page);
  await page.goto('/dashboard/autonomy?tab=keepers');
  await page.getByTestId('hub-tour').click();
  const offer = page.getByTestId('tour-sample');
  await expect(offer).toBeVisible();
  await expect(offer).toHaveAttribute('data-example', 'gerbil');
  await expect(page.locator('[data-sample-item="Mandate/gerbil-keeper"]')).toHaveText('Keeper gerbil-keeper');
  await page.getByTestId('tour-sample-continue').click();
  await expect(page.getByTestId('tour-card')).toBeVisible();
});
