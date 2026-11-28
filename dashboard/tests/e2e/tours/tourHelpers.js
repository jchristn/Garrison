// Shared steps for the tour specs (LP4.10). Each spec signs in against the mocked API (installMocks), starts one tour,
// and walks it to the end, asserting on every step that the card shows that step and that the step's data-tour target
// is visible. The steps come from src/config/tours.js, so a tour that changes and a page that loses its target both
// fail here. No native dialog is ever allowed.

import { expect } from '@playwright/test';
import { findTour } from '../../../src/config/tours.js';

export async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

export function refuseDialogs(page) {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
}

/** Start a tour from its Start tour button on the Learn page. */
export async function startFromLearn(page, tourId) {
  await page.goto('/dashboard/learn');
  await page.getByTestId(`learn-tour-${tourId}`).first().click();
}

/**
 * Walk the started tour from its first step to Done. Every step's card must show that step (none skipped on a
 * populated tenant) and its target must be visible. Focus sits in the card the whole way.
 */
export async function walkTour(page, tourId) {
  const tour = findTour(tourId);
  const card = page.getByTestId('tour-card');
  for (let i = 0; i < tour.steps.length; i++) {
    const step = tour.steps[i];
    await expect(card).toHaveAttribute('data-tour-step', step.id, { timeout: 10000 });
    await expect(page.locator(`[data-tour="${step.target}"]`).first()).toBeVisible();
    await expect(page.getByTestId('tour-note')).toHaveCount(0);
    await expect(card).toBeFocused();
    if (i < tour.steps.length - 1) await page.getByTestId('tour-next').click();
  }
  await page.getByTestId('tour-done').click();
  await expect(card).toHaveCount(0);
}

/** The tour is listed as finished in the sidebar's tour list. */
export async function expectFinished(page, tourId) {
  await page.locator('.sidebar-footer .sidebar-utility').nth(1).click();
  await expect(page.locator(`[data-tour-row="${tourId}"]`)).toContainText('Finished');
}
