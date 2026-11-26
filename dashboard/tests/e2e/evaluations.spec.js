// Evaluations (AA9.9, AA9.15) against mocked APIs: a studio playground turn is saved as a case of a new eval set
// (origin Playground, sourceRunId the playground run) and the set is run against the playground agent's draft
// revision; an approved set is run against a deployment with a threshold, the run page follows the eval-run channel
// case by case, highlights the failing cases, and opens one with the expected against output diff, the scorer notes,
// and the judge run; a case added to an approved version lands on the next version, a draft, which is then approved;
// shadow trials and canary releases show their counts and steps and stop and abort with a reason. The pages pass an
// automated accessibility scan and lay out without horizontal page scroll at desktop and phone widths in both themes.

import { test, expect } from '@playwright/test';
import axe from 'axe-core';
import { installMocks, evalStore, evalCaseResult, studioRun } from './mocks.js';

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

/** Route the eval set and eval run calls to a stateful store; everything else stays on the shared mocks. */
async function useStore(page) {
  const store = evalStore();
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/(eval-sets|eval-runs)/, (route) => {
    const req = route.request();
    const answer = store.handle(req.method(), new URL(req.url()), req.postDataJSON?.() ?? null);
    if (!answer) return route.fallback();
    if (answer.status === 204) return route.fulfill({ status: 204, body: '' });
    return route.fulfill(json(answer.status, answer.body));
  });
  return store;
}

/** Accept eval-run channel subscriptions; returns a getter for the socket of the last one. */
async function evalChannel(page) {
  const state = { socket: null, channel: null };
  await page.routeWebSocket(/\/v1\.0\/ws/, (ws) => {
    ws.onMessage((message) => {
      const data = JSON.parse(String(message));
      if (data.type === 'subscribe' && /^eval-run:/.test(data.channel)) {
        state.socket = ws;
        state.channel = data.channel;
        ws.send(JSON.stringify({ type: 'subscribed', channel: data.channel }));
      }
    });
  });
  return state;
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('saves a playground turn as an eval case of a new set and runs the set against the draft revision (AA9.9)', async ({ page }) => {
  const store = await useStore(page);
  await page.route(/\/studio\/drafts\/drf_0001\/playground\/invoke$/, (route) => route.fulfill(json(200, studioRun('run_play_1', { conversationId: 'cnv_play', conversationTurn: 1 }))));
  await page.route(/\/runs\/run_play_1$/, (route) => route.fulfill(json(200, studioRun('run_play_1', { status: 'Succeeded', outcome: 'Succeeded', conversationId: 'cnv_play', resultText: 'The README explains setup.' }))));
  await login(page);
  await page.goto('/dashboard/studio/drf_0001?tab=playground');
  await page.getByTestId('studio-playground-input').fill('Summarize the README');
  await page.getByTestId('studio-playground-send').click();
  const turn = page.locator('[data-playground-turn="1"]');
  await expect(turn).toContainText('The README explains setup.');

  await turn.getByTestId('studio-playground-save-case').click();
  const dialog = page.getByTestId('eval-save-form');
  await expect(page.getByTestId('eval-save-set').locator('option')).toHaveCount(3);
  await expect(dialog.locator('#eval-save-inputText')).toHaveValue('Summarize the README');
  await expect(dialog.locator('#eval-save-expectedText')).toHaveValue('The README explains setup.');
  await page.getByTestId('eval-save-set').selectOption('__new__');

  // A new set needs a name, and the form says so before anything is sent.
  await page.getByTestId('eval-save-submit').click();
  await expect(dialog).toContainText('Give the set a name of 1 to 128 characters.');
  expect(store.bodies).toHaveLength(0);

  await page.getByTestId('eval-save-new-name').fill('planner-regressions');
  await dialog.locator('#eval-save-name').fill('README summary');
  await dialog.locator('#eval-save-expectedText').fill('The README explains setup and configuration.');
  await page.getByTestId('eval-check-add').click();
  await dialog.locator('#eval-save-check-0-scorer').selectOption('Contains');
  await dialog.locator('#eval-save-check-0-argument').fill('setup');
  await page.getByTestId('eval-save-submit').click();
  await expect(page.getByTestId('eval-save-done')).toContainText('Saved the case to planner-regressions v1.');
  await expect(page.getByTestId('eval-save-done')).toContainText('the draft revision of planner');

  expect(store.bodies[0]).toMatchObject({ method: 'POST', path: 'eval-sets', body: { name: 'planner-regressions', origin: 'Playground' } });
  const created = store.sets.find((s) => s.name === 'planner-regressions');
  expect(store.bodies[1]).toMatchObject({
    method: 'POST',
    path: `eval-sets/${created.id}/cases`,
    body: { name: 'README summary', inputText: 'Summarize the README', expectedText: 'The README explains setup and configuration.', hidden: false, sourceRunId: 'run_play_1', checks: [{ scorer: 'Contains', argument: 'setup', weight: 1 }] }
  });

  // Run set opens the set with the run form for the playground agent's draft revision.
  await page.getByTestId('eval-save-run-set').click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/evaluations/${created.id}$`));
  const form = page.getByTestId('eval-run-form');
  await expect(form.locator('#eval-run-targetType')).toHaveValue('AgentRevision');
  await expect(form.locator('#eval-run-agentId')).toHaveValue('planner');
  await expect(page.getByTestId('eval-cases-table').locator('tbody tr')).toHaveCount(1);
  await expect(page.getByTestId('eval-cases-table')).toContainText('README summary');
  await page.getByTestId('eval-run-start').click();

  await expect(page).toHaveURL(/\/dashboard\/eval-runs\/evr_\d+$/);
  expect(store.bodies[2]).toMatchObject({ method: 'POST', path: 'eval-runs', body: { setId: created.id, targetType: 'AgentRevision', agentId: 'planner', inputMode: 'Cases', threshold: null, budgetUsd: null } });
  await expect(page.getByTestId('eval-run-detail')).toContainText('planner-regressions v1');
  await expect(page.getByTestId('eval-run-progress')).toContainText('0 of 1 cases, 0 passed');
});

test('runs an approved set against a deployment, follows it live, and opens a failing case (AA9.15)', async ({ page }) => {
  const store = await useStore(page);
  const channel = await evalChannel(page);
  await login(page);
  await page.goto('/dashboard/autonomy?tab=evaluations');
  const row = page.locator('.data-table tbody tr', { hasText: 'refund-answers' });
  await expect(row).toContainText('Approved');
  await expect(row).toContainText('v2');
  await row.locator('td').first().click();

  await expect(page).toHaveURL(/\/dashboard\/evaluations\/evs_0001$/);
  await expect(page.getByTestId('eval-set-approved-note')).toContainText('makes version 3 as a draft');
  const cases = page.getByTestId('eval-cases-table');
  await expect(cases.locator('tbody tr')).toHaveCount(3);
  await expect(cases.locator('tr[data-case="1"]')).toContainText('Hidden');
  await expect(cases.locator('tr[data-case="1"]')).toContainText('Contains, Judge agent');
  await expect(page.getByTestId('eval-versions-table')).toContainText('v1');

  await page.getByTestId('eval-set-run').click();
  const form = page.getByTestId('eval-run-form');
  await form.locator('#eval-run-deploymentId').selectOption('dep_0001');
  await form.locator('#eval-run-thresholdPercent').fill('120');
  await page.getByTestId('eval-run-start').click();
  await expect(form).toContainText('A threshold is 0 to 100 percent.');
  await form.locator('#eval-run-thresholdPercent').fill('80');
  await form.locator('#eval-run-budgetUsd').fill('2');
  await page.getByTestId('eval-run-start').click();

  await expect(page).toHaveURL(/\/dashboard\/eval-runs\/evr_\d+$/);
  const run = store.runs[0];
  expect(store.bodies.at(-1)).toMatchObject({ path: 'eval-runs', body: { setId: 'evs_0001', targetType: 'Deployment', deploymentId: 'dep_0001', inputMode: 'Cases', threshold: 0.8, budgetUsd: 2 } });
  await expect(page.getByTestId('eval-run-live')).toHaveText('Live');
  expect(channel.channel).toBe(`eval-run:${run.id}`);
  await expect(page.getByTestId('eval-run-results')).toContainText('Waiting for the first case to finish.');

  // Cases finish one by one over the channel.
  const passed = evalCaseResult(run.id, 0, 'passed');
  const failed = evalCaseResult(run.id, 1, 'failed');
  const errored = evalCaseResult(run.id, 2, 'errored');
  channel.socket.send(JSON.stringify({ type: 'eval.case.completed', evalRunId: run.id, completedCases: 1, totalCases: 3, result: passed }));
  await expect(page.getByTestId('eval-run-progress')).toContainText('1 of 3 cases');
  channel.socket.send(JSON.stringify({ type: 'eval.case.completed', evalRunId: run.id, completedCases: 2, totalCases: 3, result: failed }));
  await expect(page.getByTestId('eval-results-table').locator('tbody tr')).toHaveCount(2);
  const finished = store.finish(run.id, [passed, failed, errored], { costUsd: 0.04 });
  channel.socket.send(JSON.stringify({ type: 'eval.completed', evalRunId: run.id, status: 'Completed', score: finished.score, threshold: 0.8, passed: false, completedCases: 3, passedCases: 1, erroredCases: 1, totalCases: 3, costUsd: 0.04, failureReason: null }));

  await expect(page.getByTestId('eval-run-detail')).toContainText('Below threshold');
  await expect(page.getByTestId('eval-kpi-score')).toContainText('33.3%');
  await expect(page.getByTestId('eval-kpi-passed')).toContainText('1 / 3');
  await expect(page.getByTestId('eval-run-live')).toHaveCount(0);
  const results = page.getByTestId('eval-results-table');
  await expect(results.locator('tbody tr')).toHaveCount(3);
  await expect(results.locator('tr[data-result="0"]')).not.toHaveClass(/eval-result-failing/);
  await expect(results.locator('tr[data-result="1"]')).toHaveClass(/eval-result-failing/);
  await expect(results.locator('tr[data-result="1"]')).toContainText('Over the limit');
  await expect(results.locator('tr[data-result="2"]')).toContainText('Errored');
  await page.getByTestId('eval-results-failing-only').check();
  await expect(results.locator('tbody tr')).toHaveCount(2);

  await page.getByTestId('eval-result-open-1').click();
  const detail = page.getByTestId('eval-result');
  await expect(page.locator('.modal')).toContainText('Case 2: Over the limit');
  await expect(detail.getByTestId('eval-result-input')).toHaveText('Refund order 1002 for $900.');
  await expect(detail.getByTestId('eval-result-diff').locator('.diff-del')).toContainText(['Expected', 'This refund needs a manager.']);
  await expect(detail.getByTestId('eval-result-diff').locator('.diff-add')).toContainText(['Output', 'Sure, I refunded $900 for order 1002.']);
  const checks = detail.getByTestId('eval-result-checks');
  await expect(checks.locator('tr[data-check="1"]')).toContainText('Refunded an amount over the limit without asking a manager.');
  await expect(checks.getByTestId('eval-check-judge-run')).toHaveAttribute('href', '/dashboard/runs/run_judge_2');
  await expect(detail.getByTestId('eval-result-run')).toHaveAttribute('href', '/dashboard/runs/run_eval_2');
});

test('adds a case to an approved set as its next draft version, refuses a bad schema, and approves the draft', async ({ page }) => {
  const store = await useStore(page);
  await login(page);
  await page.goto('/dashboard/evaluations/evs_0001');
  await page.getByTestId('eval-case-add').click();
  const form = page.getByTestId('eval-case-form');
  await expect(page.getByTestId('eval-case-next-version')).toContainText('version 3');
  await page.getByTestId('eval-case-save').click();
  await expect(form).toContainText('A case needs input text.');

  await form.locator('#eval-case-name').fill('Refund in euros');
  await form.locator('#eval-case-inputText').fill('Refund order 1004 for 30 EUR.');
  await form.locator('#eval-case-expectedText').fill('Refund of 30 EUR approved for order 1004.');
  await form.locator('#eval-case-hidden').check();
  await page.getByTestId('eval-check-add').click();
  await page.getByTestId('eval-check-add').click();
  await form.locator('#eval-check-1-scorer').selectOption('JsonSchemaValid');
  await form.locator('#eval-check-1-argument').fill('not json');
  await page.getByTestId('eval-case-save').click();
  await expect(form).toContainText('Put a JSON Schema object here.');
  await form.locator('[data-check="1"]').getByRole('button', { name: 'Remove check 2' }).click();
  await form.locator('#eval-check-0-weight').fill('2');
  await page.getByTestId('eval-case-save').click();

  const draft = store.sets.find((s) => s.name === 'refund-answers' && s.version === 3);
  expect(draft).toMatchObject({ state: 'Draft', previousVersionId: 'evs_0001' });
  await expect(page).toHaveURL(new RegExp(`/dashboard/evaluations/${draft.id}$`));
  await expect(page.locator('.toast').filter({ hasText: 'Saved the case to version 3, a new draft.' })).toBeVisible();
  const cases = page.getByTestId('eval-cases-table');
  await expect(cases.locator('tbody tr')).toHaveCount(4);
  await expect(cases.locator('tr[data-case="3"]')).toContainText('Refund in euros');
  expect(store.cases.evs_0001).toHaveLength(3);
  expect(store.bodies.at(-1).body).toMatchObject({ hidden: true, checks: [{ scorer: 'ExactMatch', argument: null, weight: 2 }] });

  await page.getByTestId('eval-set-approve').click();
  await page.locator('.modal').getByRole('button', { name: 'Approve' }).click();
  await expect(page.locator('.toast').filter({ hasText: 'Approved refund-answers v3.' })).toBeVisible();
  await expect(page.getByTestId('eval-set-approved-note')).toContainText('makes version 4 as a draft');
  expect(draft.state).toBe('Approved');
});

test('shows a shadow trial and a canary release and stops and aborts them with a reason', async ({ page }) => {
  const sent = [];
  page.on('request', (r) => {
    if (/\/(stop|abort)$/.test(new URL(r.url()).pathname)) sent.push({ path: new URL(r.url()).pathname, body: r.postDataJSON() });
  });
  await login(page);
  await page.goto('/dashboard/autonomy?tab=shadow-trials');
  const trialRow = page.locator('.data-table tbody tr', { hasText: 'haiku-vs-sonnet' });
  await expect(trialRow).toContainText('Running');
  await expect(trialRow).toContainText('85%');
  await trialRow.locator('td').first().click();
  await expect(page).toHaveURL(/\/dashboard\/shadow-trials\/shd_0001$/);
  await expect(page.getByTestId('shadow-compared')).toContainText('40');
  await expect(page.getByTestId('shadow-diverged')).toContainText('4');
  await expect(page.getByTestId('shadow-failures')).toContainText('2');
  await page.getByTestId('shadow-stop-open').click();
  await page.getByTestId('shadow-stop-text').fill('Enough data.');
  await page.getByTestId('shadow-stop-confirm').click();
  await expect(page.locator('.toast').filter({ hasText: 'Stopped the shadow trial.' })).toBeVisible();
  await expect(page.getByTestId('shadow-stop-reason')).toBeVisible();
  expect(sent[0]).toEqual({ path: '/v1.0/api/tenants/default/shadow-trials/shd_0001/stop', body: { reason: 'Enough data.' } });

  await page.goto('/dashboard/canary-releases/cnr_0002');
  await expect(page.getByTestId('canary-rollback')).toContainText('Candidate error rate 12.5% exceeded 5% at step 1.');
  await expect(page.getByTestId('canary-abort-open')).toHaveCount(0);

  await page.goto('/dashboard/autonomy?tab=canary-releases');
  const canaryRow = page.locator('.data-table tbody tr', { hasText: 'Running' });
  await expect(canaryRow).toContainText('Step 2 of 3 at 50%');
  await canaryRow.locator('td').first().click();
  await expect(page).toHaveURL(/\/dashboard\/canary-releases\/cnr_0001$/);
  const steps = page.getByTestId('canary-steps-table');
  await expect(steps.locator('tr[data-step="1"]')).toContainText('Done');
  await expect(steps.locator('tr[data-step="2"]')).toContainText('Current');
  await expect(steps.locator('tr[data-step="3"]')).toContainText('Waiting');
  await page.getByTestId('canary-abort-open').click();
  await page.getByTestId('canary-abort-confirm').click();
  await expect(page.getByTestId('canary-aborted')).toBeVisible();
  expect(sent[1]).toEqual({ path: '/v1.0/api/tenants/default/canary-releases/cnr_0001/abort', body: { reason: null } });
});

test('passes an accessibility scan and lays out the evaluation pages at desktop and phone widths', async ({ page }, testInfo) => {
  await login(page);
  const scan = async (label) => {
    await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => null))));
    await page.addScriptTag({ content: axe.source });
    const result = await page.evaluate(async () => window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } }));
    expect(result.violations.map((v) => `${label}: ${v.id} ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  };
  const overflow = () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  const theme = (value) => page.evaluate((v) => document.documentElement.setAttribute('data-theme', v), value);
  const check = async (label, shot) => {
    await scan(label);
    expect(await overflow(), label).toBeLessThanOrEqual(1);
    await page.screenshot({ path: testInfo.outputPath(`${shot}.png`), fullPage: true });
  };
  for (const mode of ['light', 'dark']) {
    for (const [name, width, height] of [['desktop', 1280, 900], ['phone', 390, 844]]) {
      await page.setViewportSize({ width, height });
      const at = `${mode} ${name}`;

      for (const tab of ['evaluations', 'eval-runs', 'shadow-trials', 'canary-releases']) {
        await page.goto(`/dashboard/autonomy?tab=${tab}`);
        await expect(page.locator('.data-table tbody tr').first()).toBeVisible();
        await theme(mode);
        await check(`${at} ${tab}`, `${tab}-${mode}-${name}`);
      }

      await page.goto('/dashboard/evaluations/evs_0001');
      await expect(page.getByTestId('eval-cases-table').locator('tbody tr')).toHaveCount(3);
      await theme(mode);
      await check(`${at} set`, `eval-set-${mode}-${name}`);
      await page.getByTestId('eval-case-edit-1').click();
      await expect(page.getByTestId('eval-case-form').locator('#eval-check-1-argument')).toHaveValue('Polite, and names the $500 limit.');
      await check(`${at} case form`, `eval-case-${mode}-${name}`);
      await page.keyboard.press('Escape');
      await page.getByTestId('eval-set-run').click();
      await expect(page.getByTestId('eval-run-form')).toBeVisible();
      await check(`${at} run form`, `eval-run-form-${mode}-${name}`);
      await page.keyboard.press('Escape');

      await page.goto('/dashboard/eval-runs/evr_0001');
      await expect(page.getByTestId('eval-results-table').locator('tbody tr')).toHaveCount(3);
      await theme(mode);
      await check(`${at} run`, `eval-run-${mode}-${name}`);
      await page.getByTestId('eval-result-open-1').click();
      await expect(page.getByTestId('eval-result-diff')).toBeVisible();
      await check(`${at} result`, `eval-result-${mode}-${name}`);
      await page.keyboard.press('Escape');

      await page.goto('/dashboard/shadow-trials/shd_0001');
      await expect(page.getByTestId('shadow-counts')).toBeVisible();
      await theme(mode);
      await check(`${at} shadow`, `shadow-${mode}-${name}`);

      await page.goto('/dashboard/canary-releases/cnr_0001');
      await expect(page.getByTestId('canary-steps-table')).toBeVisible();
      await theme(mode);
      await check(`${at} canary`, `canary-${mode}-${name}`);
    }
  }
});
