// Change rules and proposals (AA8.12) against mocked APIs: the Change rules tab creates a rule with classes and a limit
// (a rule without a class is refused in the form first), an executive then proposes a change the rule covers, and the
// organization's Proposals tab lists it as applied by that rule next to a proposal that waits for a person, which the
// test reviews (covered and uncovered changes, hard-limit refusals) and approves. The pages pass an automated
// accessibility scan and lay out without horizontal page scroll at desktop and phone widths in both themes.

import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { installMocks, changeRuleStore } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

/** Route the change rule and proposal calls to a stateful store; everything else stays on the shared mocks. */
async function useStore(page) {
  const store = changeRuleStore();
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/(change-rules|organizations\/[^/]+\/proposals)/, (route) => {
    const req = route.request();
    const answer = store.handle(req.method(), new URL(req.url()), req.postDataJSON?.() ?? null);
    if (!answer) return route.fallback();
    if (answer.status === 204) return route.fulfill({ status: 204, body: '' });
    return route.fulfill({ status: answer.status, contentType: 'application/json', body: JSON.stringify(answer.body) });
  });
  return store;
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('creates a rule and sees a matching proposal applied by it', async ({ page }) => {
  const store = await useStore(page);
  await login(page);
  await page.goto('/dashboard/autonomy?tab=change-rules');
  await expect(page.getByText('No change rules yet')).toBeVisible();

  await page.getByTestId('add-button').click();
  const form = page.locator('.modal');
  await expect(form.locator('#changeRules-organizationId option[value="org_0001"]')).toHaveCount(1);
  await form.locator('#changeRules-organizationId').selectOption('org_0001');
  await form.locator('#changeRules-unitId').selectOption('oun_0001');
  await form.locator('#changeRules-name').fill('routine-wake-tuning');
  await form.locator('#changeRules-description').fill('Keepers may slow down within sane bounds.');

  // Without a class the form refuses to save.
  await form.getByTestId('save-button').click();
  await expect(form).toContainText('Pick at least one class of change.');

  await form.locator('.checkbox-chip', { hasText: 'Wake tuning' }).locator('input').check();
  await form.getByRole('button', { name: 'Add limit' }).click();
  await form.locator('#ol-0-class').selectOption('WakeTuning');
  await form.locator('#ol-0-name').selectOption('minIntervalSeconds');
  await form.locator('#ol-0-minimum').fill('60');
  await form.getByTestId('save-button').click();
  await expect(page.locator('.modal')).toHaveCount(0);

  expect(store.rules).toHaveLength(1);
  expect(store.rules[0]).toMatchObject({
    name: 'routine-wake-tuning',
    organizationId: 'org_0001',
    unitId: 'oun_0001',
    active: true,
    classes: [{ class: 'WakeTuning' }],
    limits: [{ class: 'WakeTuning', name: 'minIntervalSeconds', minimum: 60, maximum: null }]
  });
  const row = page.locator('.data-table tbody tr', { hasText: 'routine-wake-tuning' });
  await expect(row).toContainText('In force');
  await expect(row).toContainText('Leadership');
  await expect(row).toContainText('Wake tuning, Shortest wake interval (seconds): at least 60');

  // The executive of Leadership proposes slowing a keeper below it; the new rule covers it.
  const applied = store.propose({ title: 'Slow the billing keeper overnight', unitId: 'oun_0002', classes: ['WakeTuning'], values: { minIntervalSeconds: 900 } });
  expect(applied).toMatchObject({ status: 'Applied', decisionSource: 'Rule', ruleIds: [store.rules[0].id] });

  await page.goto('/dashboard/organizations/org_0001');
  await page.getByRole('tab', { name: 'Proposals (2)' }).click();
  const table = page.getByTestId('org-proposals-table');
  const appliedRow = table.locator(`tr[data-proposal="${applied.draftId}"]`);
  await expect(appliedRow).toContainText('Slow the billing keeper overnight');
  await expect(appliedRow).toContainText('Billing');
  await expect(appliedRow).toContainText('Applied by rule');
  await expect(appliedRow).toContainText('Rules: routine-wake-tuning');
  await page.getByTestId('org-proposals-view-applied').click();
  await expect(table.locator('tbody tr')).toHaveCount(1);

  // The proposal that changes a model is not covered, so it waits; approving it applies it.
  await page.getByTestId('org-proposals-view-needsApproval').click();
  const waiting = store.proposals.find((p) => p.status === 'PendingApproval');
  await expect(table.locator(`tr[data-proposal="${waiting.draftId}"]`)).toContainText('Needs approval');
  await page.getByTestId(`org-proposal-open-${waiting.draftId}`).click();
  const review = page.getByTestId('org-proposal');
  await expect(review.getByTestId('org-proposal-coverage')).toContainText('At least one change below is not covered');
  await expect(review.getByTestId('org-proposal-refusals')).toContainText('An executive cannot change secrets.');
  await expect(review.locator('tr[data-change="Agent/agent-2"]')).toContainText('Rule routine-wake-tuning');
  await expect(review.locator('tr[data-change="Deployment/agent-2-default"]')).toContainText('Needs a person: no change rule in force covers ModelChange.');
  await review.getByTestId('org-proposal-reason').fill('Haiku is enough for billing.');
  await page.getByTestId('org-proposal-approve').click();
  await expect(page.locator('.toast').filter({ hasText: 'Approved Move Billing to a cheaper model. It is live now.' })).toBeVisible();
  expect(waiting).toMatchObject({ status: 'Applied', decisionSource: 'User', reason: 'Haiku is enough for billing.' });
  await page.getByTestId('org-proposals-view-all').click();
  await expect(table.locator(`tr[data-proposal="${waiting.draftId}"]`)).toContainText('Approved');
});

test('passes an accessibility scan and lays out the rules, the rule form, and proposals at desktop and phone widths', async ({ page }, testInfo) => {
  await login(page);
  const scan = async (label) => {
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))));
    await page.addScriptTag({ content: axe.source });
    const result = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    expect(result.violations.map((v) => `${label}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  };
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const theme = (value) => page.evaluate((v) => document.documentElement.setAttribute('data-theme', v), value);
  for (const mode of ['light', 'dark']) {
    for (const [name, width, height] of [['desktop', 1280, 900], ['phone', 390, 844]]) {
      await page.setViewportSize({ width, height });
      await page.goto('/dashboard/autonomy?tab=change-rules');
      await expect(page.locator('.data-table tbody tr')).toHaveCount(2);
      await theme(mode);
      await scan(`${mode} ${name} rules`);
      expect(await overflow(), `${mode} ${name} rules`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: testInfo.outputPath(`change-rules-${mode}-${name}.png`), fullPage: true });

      await page.locator('.data-table tbody tr', { hasText: 'routine-wake-tuning' }).locator('td').first().click();
      await expect(page.locator('.modal #changeRules-name')).toHaveValue('routine-wake-tuning');
      await expect(page.locator('.modal #ol-1-name')).toHaveValue('count');
      await scan(`${mode} ${name} rule form`);
      expect(await overflow(), `${mode} ${name} rule form`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: testInfo.outputPath(`change-rule-form-${mode}-${name}.png`) });
      await page.locator('.modal').getByRole('button', { name: 'Cancel' }).click();

      await page.goto('/dashboard/organizations/org_0001');
      await page.getByRole('tab', { name: 'Proposals (3)' }).click();
      await expect(page.getByTestId('org-proposals-table').locator('tbody tr')).toHaveCount(3);
      await theme(mode);
      await scan(`${mode} ${name} proposals`);
      expect(await overflow(), `${mode} ${name} proposals`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: testInfo.outputPath(`org-proposals-${mode}-${name}.png`), fullPage: true });

      await page.getByTestId('org-proposal-open-sdr_0102').click();
      await expect(page.getByTestId('org-proposal-changes')).toBeVisible();
      await scan(`${mode} ${name} proposal review`);
      expect(await overflow(), `${mode} ${name} proposal review`).toBeLessThanOrEqual(1);
      await page.screenshot({ path: testInfo.outputPath(`org-proposal-${mode}-${name}.png`) });
      await page.keyboard.press('Escape');
    }
  }
});
