// The board (AA10.4, AA10.6, AA10.7, AA10.8) against mocked APIs: the Board tab picks an organization and the
// organization page links to its board; one GET /organizations/{id}/board renders every panel populated (chart with
// health, attention, proposals with evidence, spend, brief, brakes, direction, the CEO conversation) and empty; a
// proposal's diff loads on expand and the proposal is approved from the board; the brakes confirm before freezing a
// unit or the organization and before rolling back; direction is published; a message to the CEO streams its reply and
// the next message continues the conversation; the tour stops at Autonomy and the board; the setup wizard creates a
// first keeper on the fake harness deployment. The board passes an automated accessibility scan and lays out without
// horizontal page scroll at 1280 and 390 pixels in both themes.

import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { installMocks, installControlledStream, pushRunEvent, pushRunFrame, board, mockRun, orgProposal } from './mocks.js';

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

/** Record request bodies for a URL pattern while the shared mocks still answer. */
async function record(page, pattern) {
  const bodies = [];
  page.on('request', (req) => {
    if (pattern.test(req.url()) && req.method() !== 'GET') bodies.push({ method: req.method(), url: req.url(), body: req.postDataJSON?.() ?? null });
  });
  return bodies;
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('picks an organization from the Board tab and opens the board from the organization page', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/autonomy?tab=board');
  await expect(page.getByTestId('board-picker')).toBeVisible();
  await page.getByTestId('board-picker-select').selectOption('org_0001');
  await page.getByTestId('board-picker-open').click();
  await expect(page).toHaveURL(/\/dashboard\/board\/org_0001$/);
  await expect(page.getByTestId('board')).toContainText('Board of Refund operations');

  await page.goto('/dashboard/organizations/org_0001');
  await page.getByTestId('org-open-board').click();
  await expect(page).toHaveURL(/\/dashboard\/board\/org_0001$/);
});

test('renders every panel of a populated board from one call', async ({ page }) => {
  let calls = 0;
  page.on('request', (req) => {
    if (/\/organizations\/org_0001\/board(\?|$)/.test(req.url())) calls += 1;
  });
  await login(page);
  await page.goto('/dashboard/board/org_0001');
  const b = page.getByTestId('board');
  await expect(b).toContainText('Pay every valid refund within a day.');

  const chart = page.getByTestId('board-chart');
  await expect(chart.getByTestId('org-unit')).toHaveCount(3);
  await expect(chart.locator('[data-unit="Billing"]')).toContainText('Degraded');
  await expect(chart.locator('[data-unit-health="oun_0003"]')).toContainText('Frozen');
  await expect(chart.locator('[data-unit-health="oun_0002"]')).toContainText('Over budget');

  const attention = page.getByTestId('board-attention');
  await expect(attention).toContainText('Needs attention (5)');
  await expect(attention.getByTestId('board-escalations').locator('li')).toHaveCount(2);
  await expect(attention.getByTestId('board-escalations')).toContainText('Refund order 4411 for $1,250?');
  await expect(attention.getByTestId('board-unhealthy-reports').locator('li')).toHaveCount(2);
  await expect(attention.getByTestId('board-cap-hits')).toContainText('Billing');

  const proposals = page.getByTestId('board-proposals');
  await expect(proposals.locator('[data-proposal]')).toHaveCount(1);
  await expect(proposals.getByTestId('proposal-evidence-evals').locator('li')).toHaveCount(2);
  await expect(proposals.locator('[data-eval-run="evr_0001"]')).toContainText('refund-regressions v2');
  await expect(proposals.locator('[data-eval-run="evr_0002"]')).toContainText('Before the last change');
  await expect(proposals.locator('[data-shadow-trial="shd_0001"]')).toContainText('37 of 40 agreed');
  await expect(proposals.locator('[data-canary="cnr_0001"]')).toContainText('Step 2 of 3');

  await expect(page.getByTestId('board-spend').getByTestId('board-spend-bar')).toHaveCount(3);
  await expect(page.getByTestId('board-latest-brief')).toContainText('Weekly brief: refunds on track');
  await expect(page.getByTestId('board-ceo')).toContainText('Briefs every 24 hours.');
  await expect(page.getByTestId('board-freezes')).toContainText('Support replies are under review.');
  await expect(page.getByTestId('kill-switch')).toBeVisible();
  await expect(page.getByTestId('board-direction-submit')).toBeEnabled();
  await expect(page.locator('#board-ceo-conversation option')).toHaveCount(3);
  expect(calls).toBe(1);
});

test('renders the empty state of every panel and blocks direction and the CEO conversation without a CEO', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/board/org_0002');
  await expect(page.getByTestId('board')).toContainText('Board of Growth lab');
  for (const id of ['board-chart-empty', 'board-attention-empty', 'board-proposals-empty', 'board-spend-empty', 'board-brief-empty', 'board-freezes-empty', 'board-no-ceo']) {
    await expect(page.getByTestId(id), id).toBeVisible();
  }
  await expect(page.getByTestId('board-direction-blocked')).toContainText('no CEO');
  await expect(page.getByTestId('board-direction-submit')).toBeDisabled();
  await expect(page.getByTestId('board-ceo-blocked')).toBeVisible();
  await expect(page.getByTestId('board-ceo-message')).toBeDisabled();
  await expect(page.getByTestId('board-rollback')).toHaveAttribute('aria-disabled', 'true');
});

test('expands a proposal to load its diff and approves it from the board (AA10.4)', async ({ page }) => {
  let decided = false;
  await page.route(/\/organizations\/org_0001\/board(\?|$)/, (route) => route.fulfill(json(200, decided ? { ...board(1), proposals: [] } : board(1))));
  const bodies = await record(page, /\/proposals\/[^/]+\/decide$/);
  await page.route(/\/proposals\/sdr_0102\/decide$/, (route) => {
    decided = true;
    return route.fulfill(json(200, { ...orgProposal(2), status: 'Applied', approvalStatus: 'Approved', decisionSource: 'User', decidedBy: 'admin@garrison' }));
  });
  await login(page);
  await page.goto('/dashboard/board/org_0001');
  const card = page.locator('[data-proposal="sdr_0102"]');
  await expect(card).toContainText('Move Billing to a cheaper model');
  const toggle = card.getByTestId('board-proposal-toggle-sdr_0102');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  const diff = card.getByTestId('board-proposal-diff');
  await expect(diff.getByTestId('org-proposal-changes').locator('tbody tr')).toHaveCount(2);
  await expect(diff.getByTestId('org-proposal-refusals')).toContainText('An executive cannot change secrets.');
  await expect(diff).toContainText('Rule routine-wake-tuning');

  await card.getByTestId('board-proposal-reason').fill('Evals and the shadow trial agree.');
  await card.getByTestId('board-proposal-approve').click();
  await expect(page.locator('.toast').filter({ hasText: 'Approved Move Billing to a cheaper model' })).toBeVisible();
  expect(bodies).toHaveLength(1);
  expect(bodies[0].body).toEqual({ allow: true, reason: 'Evals and the shadow trial agree.' });
  await expect(page.getByTestId('board-proposals-empty')).toBeVisible();
});

test('the brakes confirm before freezing a unit or the organization and before rolling back', async ({ page }) => {
  const bodies = await record(page, /\/(freezes|rollback)(\?|$)/);
  await login(page);
  await page.goto('/dashboard/board/org_0001');

  await page.getByTestId('board-freeze-unit').selectOption('oun_0002');
  await page.getByTestId('board-freeze-unit-submit').click();
  await expect(page.getByTestId('freeze-form')).toBeVisible();
  expect(bodies).toHaveLength(0);
  await page.getByTestId('freeze-reason').fill('Billing is over budget.');
  await page.getByTestId('confirm-button').click();
  await expect(page.getByTestId('freeze-form')).toBeHidden();
  expect(bodies[0].body).toMatchObject({ targetKind: 'OrgUnit', targetId: 'oun_0002', reason: 'Billing is over budget.' });

  await page.getByTestId('board-freeze-org').click();
  await expect(page.getByTestId('freeze-form')).toBeVisible();
  await page.getByTestId('confirm-button').click();
  await expect(page.getByTestId('freeze-form')).toBeHidden();
  expect(bodies[1].body).toMatchObject({ targetKind: 'Organization', targetId: 'org_0001' });

  await page.getByTestId('board-lift-mfz_0010').click();
  await expect(page.getByTestId('lift-form')).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByTestId('board-rollback').click();
  await expect(page.getByRole('dialog')).toContainText('Roll back the chart');
  expect(bodies).toHaveLength(2);
  await page.getByTestId('confirm-button').click();
  await expect(page.locator('.toast').filter({ hasText: 'Rolled back. Revision 4 is live.' })).toBeVisible();
  expect(bodies[2].url).toMatch(/\/organizations\/org_0001\/rollback$/);

  await page.getByTestId('kill-switch-toggle').click();
  await expect(page.getByTestId('kill-switch-reason')).toBeVisible();
});

test('publishes direction for the CEO', async ({ page }) => {
  const bodies = await record(page, /\/organizations\/org_0001\/direction$/);
  await login(page);
  await page.goto('/dashboard/board/org_0001');
  await page.getByTestId('board-direction-submit').click();
  await expect(page.getByTestId('board-direction')).toContainText('Write the direction for the CEO.');
  expect(bodies).toHaveLength(0);
  await page.getByTestId('board-direction-text').fill('Hold refunds over $500 for a person.');
  await page.getByTestId('board-direction-note').fill('Audit week');
  await page.getByTestId('board-direction-submit').click();
  await expect(page.locator('.toast').filter({ hasText: 'Direction published as revision 4 of inbox-keeper.' })).toBeVisible();
  expect(bodies[0].body).toEqual({ direction: 'Hold refunds over $500 for a person.', changeNote: 'Audit week' });
  await expect(page.getByTestId('board-direction-text')).toHaveValue('');
});

test('sends a message to the CEO, streams the reply, and continues the conversation (AA10.6)', async ({ page }) => {
  await installControlledStream(page);
  const bodies = await record(page, /\/board\/messages$/);
  const first = mockRun('run_board_0001', { status: 'Running', outcome: 'None', conversationId: 'cnv_board_0003', inputText: 'How is the quarter going?', agentName: 'echo-agent' });
  const second = mockRun('run_board_0002', { status: 'Running', outcome: 'None', conversationId: 'cnv_board_0003', inputText: 'And Billing?', agentName: 'echo-agent' });
  const turns = [];
  await page.route(/\/board\/messages$/, (route) => {
    const run = turns.length === 0 ? first : second;
    turns.push(run);
    return route.fulfill(json(202, run));
  });
  await page.route(/\/conversations\/cnv_board_0003\/runs/, (route) => route.fulfill(json(200, { objects: turns, totalRecords: turns.length, skip: 0, maxResults: 1000, endOfResults: true })));
  await page.route(/\/runs\/run_board_000[12]$/, (route) => route.fulfill(json(200, turns.find((r) => route.request().url().endsWith(r.id)))));
  await login(page);
  await page.goto('/dashboard/board/org_0001');
  await expect(page.getByTestId('board-ceo-chat')).toContainText('You are talking to echo-agent as the board.');

  await page.getByTestId('board-ceo-message').fill('How is the quarter going?');
  await page.getByTestId('board-ceo-send').click();
  await expect(page.getByTestId('board-ceo-turns')).toContainText('How is the quarter going?');
  await expect.poll(() => page.evaluate(() => window.__sse.opened)).toContain('run_board_0001');
  await pushRunEvent(page, 'run_board_0001', { sequence: 1, eventType: 'AssistantText', text: 'Refunds are on track; ' });
  await expect(page.getByTestId('board-ceo-turns')).toContainText('Refunds are on track;');
  await pushRunEvent(page, 'run_board_0001', { sequence: 2, eventType: 'AssistantText', text: 'Billing needs a bigger budget.' });
  Object.assign(first, { status: 'Succeeded', outcome: 'Succeeded', resultText: 'Refunds are on track; Billing needs a bigger budget.' });
  await pushRunFrame(page, 'run_board_0001', 'run.completed', first);
  await expect(page.getByTestId('board-ceo-turns')).toContainText('Billing needs a bigger budget.');
  await expect(page.locator('#board-ceo-conversation')).toHaveValue('cnv_board_0003');
  expect(bodies[0].body).toEqual({ input: 'How is the quarter going?' });

  await page.getByTestId('board-ceo-message').fill('And Billing?');
  await page.getByTestId('board-ceo-message').press('Enter');
  await expect(page.getByTestId('board-ceo-turns')).toContainText('And Billing?');
  expect(bodies[1].body).toEqual({ input: 'And Billing?', conversationId: 'cnv_board_0003' });
});

test('the guided tour stops at Autonomy and the board (AA10.8)', async ({ page }) => {
  await login(page);
  await page.locator('.sidebar-utility').nth(1).click();
  const card = page.locator('.tour-card');
  await expect(card).toBeVisible();
  const titles = [];
  for (let i = 0; i < 8; i++) {
    titles.push(await card.locator('h3').textContent());
    await card.getByRole('button', { name: /^(Next|Done)$/ }).click();
  }
  expect(titles).toContain('Autonomy');
  expect(titles).toContain('The board');
  await expect(card).toBeHidden();
});

test('the setup wizard creates a first keeper on the fake harness deployment (AA10.8)', async ({ page }) => {
  const bodies = await record(page, /\/mandates$/);
  await login(page);
  await page.locator('.sidebar-utility').first().click();
  await expect(page.locator('.wizard-steps li')).toHaveText(['Welcome', 'Credential', 'Agent Studio', 'Sample agent', 'First keeper', 'Test run']);
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Skip this step' }).click();
  await page.getByTestId('wizard-skip-studio').click();
  await page.locator('.modal-footer').getByRole('button', { name: 'Apply' }).click();
  await expect(page.locator('.wizard-steps li.active')).toHaveText('First keeper');
  await page.locator('#wiz-keeper-name').fill('');
  await page.getByTestId('wizard-create-keeper').click();
  await expect(page.getByTestId('wizard-keeper')).toContainText(/name/i);
  expect(bodies).toHaveLength(0);
  await page.locator('#wiz-keeper-name').fill('first-keeper');
  await page.getByTestId('wizard-create-keeper').click();
  await expect(page.locator('.wizard-steps li.active')).toHaveText('Test run');
  expect(bodies).toHaveLength(1);
  expect(bodies[0].body).toMatchObject({ name: 'first-keeper', agentId: 'agt_0001', currentRevision: { objective: 'Check in once in a while and report that everything is quiet.' } });
  expect(bodies[0].body.deploymentId).toBeTruthy();
});

test('passes an accessibility scan and lays out the board at desktop and phone widths', async ({ page }, testInfo) => {
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
      for (const id of ['org_0001', 'org_0002']) {
        const label = `${mode} ${name} ${id}`;
        await page.goto(`/dashboard/board/${id}`);
        await expect(page.getByTestId('board-chart')).toBeVisible();
        await theme(mode);
        if (id === 'org_0001') {
          await page.getByTestId('board-proposal-toggle-sdr_0102').click();
          await expect(page.getByTestId('board-proposal-diff').getByTestId('org-proposal-changes')).toBeVisible();
        }
        await scan(label);
        expect(await overflow(), label).toBeLessThanOrEqual(1);
        await page.screenshot({ path: testInfo.outputPath(`board-${id}-${mode}-${name}.png`), fullPage: true });
      }
      await page.goto('/dashboard/autonomy?tab=board');
      await expect(page.getByTestId('board-picker')).toBeVisible();
      await theme(mode);
      await scan(`${mode} ${name} picker`);
      expect(await overflow()).toBeLessThanOrEqual(1);
    }
  }
});
