// The Follow a request tour (LP4.7, LP4.10) against mocked APIs: start it, walk every step to Done with each step's target
// visible, and check it is listed as finished. The trail route answers with the LP1.5 fixture.
// Not run by default (targeted-test rule). Run it with: npx playwright test tests/e2e/tours/follow-a-request.spec.js

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { installMocks } from '../mocks.js';
import { expectFinished, login, refuseDialogs, walkTour } from './tourHelpers.js';

test.beforeEach(async ({ page }) => {
  refuseDialogs(page);
  await installMocks(page);
  // The trail of whichever run the tour opens: the LP1.5 fixture, with its focus run renamed to that run, so the
  // drawer step (?step=<run>) has a step to open.
  const here = path.dirname(fileURLToPath(import.meta.url));
  const fixture = fs.readFileSync(path.resolve(here, '../../../src/tests/fixtures/runTrail.json'), 'utf8');
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/runs\/([^/]+)\/trail(\?.*)?$/, (route) => {
    const id = /\/runs\/([^/]+)\/trail/.exec(new URL(route.request().url()).pathname)[1];
    return route.fulfill({ status: 200, contentType: 'application/json', body: fixture.split('"run_b2"').join(JSON.stringify(id)) });
  });
});

test('walks the Follow a request tour to the end on a populated tenant', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await login(page);
  await page.goto('/dashboard/runs');
  await page.getByTestId('hub-tour').click();
  await walkTour(page, 'follow-a-request');
  await expect(page.getByTestId('tour-sample')).toHaveCount(0);
  await expectFinished(page, 'follow-a-request');
});
