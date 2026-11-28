// The Keep it safe tour (LP4.7, LP4.10) against mocked APIs: start it, walk every step to Done with each step's target
// visible, and check it is listed as finished.
// Not run by default (targeted-test rule). Run it with: npx playwright test tests/e2e/tours/keep-it-safe.spec.js

import { test, expect } from '@playwright/test';
import { installMocks } from '../mocks.js';
import { expectFinished, login, refuseDialogs, walkTour } from './tourHelpers.js';

test.beforeEach(async ({ page }) => {
  refuseDialogs(page);
  await installMocks(page);
});

test('walks the Keep it safe tour to the end on a populated tenant', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page);
  await page.goto('/dashboard/approvals');
  await page.getByTestId('hub-tour').click();
  await walkTour(page, 'keep-it-safe');
  await expect(page.getByTestId('tour-sample')).toHaveCount(0);
  await expectFinished(page, 'keep-it-safe');
});

test('offers the gerbil example on a tenant with no keepers, with a custom confirm modal', async ({ page }) => {
  // Registered after installMocks, so an empty keeper list wins.
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/mandates(\?.*)?$/, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], totalCount: 0, pageNumber: 1, pageSize: 1, endOfResults: true }) })
  );
  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page);
  await page.goto('/dashboard/approvals');
  await page.getByTestId('hub-tour').click();
  const offer = page.getByTestId('tour-sample');
  await expect(offer).toBeVisible();
  await expect(offer).toHaveAttribute('data-example', 'gerbil');
  await expect(page.locator('[data-sample-item="Mandate/gerbil-keeper"]')).toBeVisible();
  await page.getByTestId('tour-sample-continue').click();
  await expect(page.getByTestId('tour-card')).toBeVisible();
});
