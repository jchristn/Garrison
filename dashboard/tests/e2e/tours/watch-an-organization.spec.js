// The Watch an organization tour (LP4.7, LP4.10) against mocked APIs: start it, walk every step to Done with each step's target
// visible, and check it is listed as finished.
// Not run by default (targeted-test rule). Run it with: npx playwright test tests/e2e/tours/watch-an-organization.spec.js

import { test, expect } from '@playwright/test';
import { installMocks } from '../mocks.js';
import { expectFinished, login, refuseDialogs, startFromLearn, walkTour } from './tourHelpers.js';

test.beforeEach(async ({ page }) => {
  refuseDialogs(page);
  await installMocks(page);
});

test('walks the Watch an organization tour to the end on a populated tenant', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page);
  await startFromLearn(page, 'watch-an-organization');
  await walkTour(page, 'watch-an-organization');
  await expect(page.getByTestId('tour-sample')).toHaveCount(0);
  await expectFinished(page, 'watch-an-organization');
});
