// The Run an agent tour (LP4.7, LP4.10) against mocked APIs: start it, walk every step to Done with each step's target
// visible, and check it is listed as finished.
// Not run by default (targeted-test rule). Run it with: npx playwright test tests/e2e/tours/run-an-agent.spec.js

import { test, expect } from '@playwright/test';
import { installMocks } from '../mocks.js';
import { expectFinished, login, refuseDialogs, walkTour } from './tourHelpers.js';

test.beforeEach(async ({ page }) => {
  refuseDialogs(page);
  await installMocks(page);
});

test('walks the Run an agent tour to the end on a populated tenant', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page);
  await page.goto('/dashboard/invoke');
  await page.getByTestId('hub-tour').click();
  await walkTour(page, 'run-an-agent');
  await expect(page.getByTestId('tour-sample')).toHaveCount(0);
  await expectFinished(page, 'run-an-agent');
});
