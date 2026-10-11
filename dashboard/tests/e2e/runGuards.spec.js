// Bounded, self-stopping runs (P3.15): Invoke cancels its run on a new Send and when the page is left (unless the
// "Stop the run when I leave" setting is off), Cancel shows "Cancelling..." until the run reports Cancelled, a
// per-run time limit is offered when the deployment allows it, and guard stops are explained in Invoke, Runs, and
// Run detail. The deployment form and Settings show the run guard limits.

import { test, expect } from '@playwright/test';
import { installMocks, installControlledStream, pushRunEvent, pushRunFrame, mockRun, guardRun, GUARD_MESSAGES } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const RUNNING = { status: 'Running', outcome: 'None', resultText: undefined, errorMessage: undefined, harnessType: 'Mux' };

/**
 * Serve invoke, GET run, and cancel for test-controlled run IDs (run_g...). Returns the list of invoke bodies and
 * cancel requests seen, in order, as { kind, id, keepalive }.
 */
async function routeRuns(page, runs, invokeQueue) {
  const log = [];
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/agents\/[^/]+\/invoke/, (route) => {
    const id = invokeQueue.shift();
    log.push({ kind: 'invoke', id, body: route.request().postDataJSON() });
    return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify(runs[id]) });
  });
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/runs\/(run_g[^/?]+)\/cancel/, (route) => {
    const id = /runs\/(run_g[^/?]+)\/cancel/.exec(route.request().url())[1];
    log.push({ kind: 'cancel', id, method: route.request().method(), auth: route.request().headers().authorization || null });
    runs[id] = { ...runs[id], status: 'Cancelling', cancelRequested: true };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(runs[id]) });
  });
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/runs\/(run_g[^/?]+)(\?.*)?$/, (route) => {
    const id = /runs\/(run_g[^/?]+)/.exec(route.request().url())[1];
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(runs[id]) });
  });
  return log;
}

async function send(page, text) {
  await page.locator('#invoke-message').fill(text);
  await page.getByTestId('invoke-send').click();
}

const cancels = (log) => log.filter((e) => e.kind === 'cancel').map((e) => e.id);

test.use({ actionTimeout: 15000 });

test.beforeEach(async ({ page }) => {
  await installMocks(page);
});

test('a new Send cancels the run in progress first, and keeps it when the setting is off', async ({ page }) => {
  await installControlledStream(page);
  const runs = { run_g1: mockRun('run_g1', RUNNING), run_g2: mockRun('run_g2', RUNNING), run_g3: mockRun('run_g3', RUNNING) };
  const log = await routeRuns(page, runs, ['run_g1', 'run_g2', 'run_g3']);
  await login(page);
  await page.goto('/dashboard/invoke');

  const toggle = page.getByTestId('invoke-stop-on-leave');
  await expect(toggle).toBeChecked();
  await send(page, 'loop forever');
  await expect(page.locator('.invoke-run-head')).toContainText('run_g1');
  // Send stays available while a run is in progress, and its tooltip says it replaces the run.
  await expect(page.getByTestId('invoke-send')).toBeEnabled();
  await expect(page.getByTestId('invoke-send')).toHaveAttribute('data-tip', /Cancel the run in progress/);

  await send(page, 'try again');
  await expect(page.locator('.invoke-run-head')).toContainText('run_g2');
  expect(log.map((e) => `${e.kind}:${e.id}`)).toEqual(['invoke:run_g1', 'cancel:run_g1', 'invoke:run_g2']);
  expect(log[1].auth).toBe('Bearer tok_e2e');

  // With the setting off, the next Send leaves run_g2 running.
  await toggle.uncheck();
  await expect(page.getByTestId('invoke-send')).toHaveAttribute('data-tip', /keeps going/);
  await send(page, 'one more');
  await expect(page.locator('.invoke-run-head')).toContainText('run_g3');
  expect(cancels(log)).toEqual(['run_g1']);
});

test('leaving Invoke cancels the run in progress with a keepalive request', async ({ page }) => {
  await installControlledStream(page);
  const runs = { run_g4: mockRun('run_g4', RUNNING), run_g5: mockRun('run_g5', RUNNING) };
  const log = await routeRuns(page, runs, ['run_g4', 'run_g5']);
  const keepalive = [];
  page.on('request', (r) => {
    if (/\/runs\/run_g\d\/cancel/.test(r.url())) keepalive.push(r.method());
  });
  await login(page);
  await page.goto('/dashboard/invoke');
  await send(page, 'write a long essay');
  await expect(page.locator('.invoke-run-head')).toContainText('run_g4');

  // A route change (Open run) unmounts Invoke: the run is cancelled.
  const cancelled = page.waitForRequest(/\/runs\/run_g4\/cancel/);
  await page.locator('.invoke-run-head button').click();
  const req = await cancelled;
  expect(req.method()).toBe('POST');
  expect(req.headers().authorization).toBe('Bearer tok_e2e');
  await expect.poll(() => cancels(log)).toEqual(['run_g4']);

  // Leaving the app (tab close or navigation) fires pagehide, which cancels too.
  await page.goto('/dashboard/invoke');
  await send(page, 'another long essay');
  await expect(page.locator('.invoke-run-head')).toContainText('run_g5');
  const cancelled2 = page.waitForRequest(/\/runs\/run_g5\/cancel/);
  await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: false })));
  await cancelled2;
  await expect.poll(() => cancels(log)).toEqual(['run_g4', 'run_g5']);
  expect(keepalive.every((m) => m === 'POST')).toBe(true);
});

test('with "Stop the run when I leave" off (remembered), leaving keeps the run going', async ({ page }) => {
  await installControlledStream(page);
  const runs = { run_g6: mockRun('run_g6', RUNNING) };
  const log = await routeRuns(page, runs, ['run_g6']);
  await login(page);
  await page.goto('/dashboard/invoke');
  await page.getByTestId('invoke-stop-on-leave').uncheck();
  expect(await page.evaluate(() => localStorage.getItem('garrison_invoke_stop_on_leave'))).toBe('false');
  await page.reload();
  await expect(page.getByTestId('invoke-stop-on-leave')).not.toBeChecked();
  await expect(page.locator('label[for="invoke-stop-on-leave"]')).toHaveAttribute('data-tip', /keep runs going/);

  await send(page, 'keep going');
  await expect(page.locator('.invoke-run-head')).toContainText('run_g6');
  await page.locator('.invoke-run-head button').click();
  await expect(page).toHaveURL(/run_g6/);
  await page.waitForTimeout(500);
  expect(cancels(log)).toEqual([]);
  await page.evaluate(() => localStorage.removeItem('garrison_invoke_stop_on_leave'));
});

test('Cancel is prominent while running and shows Cancelling... until the run reports Cancelled', async ({ page }) => {
  await installControlledStream(page);
  const runs = { run_g7: mockRun('run_g7', RUNNING) };
  const log = await routeRuns(page, runs, ['run_g7']);
  await login(page);
  await page.goto('/dashboard/invoke');
  await send(page, 'stop me');
  const cancel = page.getByTestId('invoke-cancel');
  await expect(cancel).toBeVisible();
  await expect(cancel).toHaveClass(/button-danger/);
  await expect(cancel).toHaveText(/Cancel run/);
  await cancel.click();
  await expect(cancel).toHaveText(/Cancelling\.\.\./);
  await expect(cancel).toBeDisabled();
  expect(cancels(log)).toEqual(['run_g7']);
  await expect.poll(() => page.evaluate(() => window.__sse.opened.includes('run_g7'))).toBe(true);
  runs.run_g7 = { ...runs.run_g7, status: 'Cancelled', outcome: 'Cancelled', completedUtc: new Date().toISOString() };
  await pushRunFrame(page, 'run_g7', 'run.completed', runs.run_g7);
  await expect(cancel).toHaveCount(0);
  await expect(page.locator('.invoke-run-head')).toContainText('Cancelled');
});

test('Invoke explains a guard stop in Preview and Response', async ({ page }) => {
  await installControlledStream(page);
  const runs = { run_g8: mockRun('run_g8', RUNNING) };
  await routeRuns(page, runs, ['run_g8']);
  await login(page);
  await page.goto('/dashboard/invoke');
  await send(page, 'list fruit');
  await expect.poll(() => page.evaluate(() => window.__sse.opened.includes('run_g8'))).toBe(true);
  await pushRunEvent(page, 'run_g8', { id: 'rev_g1', tenantId: 'default', sequence: 1, eventType: 'AssistantText', text: 'Here is the plan:\n\n* \n* \n* \n' });
  await pushRunEvent(page, 'run_g8', { id: 'rev_g2', tenantId: 'default', sequence: 2, eventType: 'Warning', code: 'RunGuardTriggered', text: GUARD_MESSAGES.RepetitionDetected });
  runs.run_g8 = guardRun('run_g8', 'RepetitionDetected', { status: 'Failed' });
  await pushRunFrame(page, 'run_g8', 'run.completed', runs.run_g8);

  const preview = page.getByTestId('stream-guard-notice');
  await expect(preview).toBeVisible();
  await expect(preview).toContainText('Stopped: the model was repeating itself');
  await expect(preview.getByTestId('run-guard-reason')).toContainText('contain no letters or digits');
  await expect(preview).toContainText('is kept as the run result');
  await page.getByRole('tab', { name: 'Response' }).click();
  const response = page.getByTestId('response-guard-notice');
  await expect(response).toBeVisible();
  await expect(page.getByTestId('invoke-outcome')).toContainText('Repetition detected');
  await expect(page.getByTestId('invoke-outcome')).toHaveAttribute('data-tip', /run guard stopped the run/);
  // The reason is shown once, in the notice, not again as a generic error banner.
  await expect(page.getByTestId('invoke-response').locator('.error-banner')).toHaveCount(0);
  await expect(page.getByTestId('invoke-result')).toContainText('Here is the plan:');
});

test('Runs and Run detail explain guard stops; the transcript labels the RunGuardTriggered event', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/runs');
  const row = page.locator('.data-table tbody tr', { hasText: 'run_0013' });
  const outcome = row.locator('td span[data-tip]', { hasText: 'Repetition detected' });
  await expect(outcome).toBeVisible();
  await expect(outcome).toHaveAttribute('data-tip', /repeated over and over/);

  await page.goto('/dashboard/runs/run_0013');
  const notice = page.getByTestId('run-guard-notice');
  await expect(notice).toBeVisible();
  await expect(notice).toHaveAttribute('data-outcome', 'RepetitionDetected');
  await expect(notice).toContainText('Stopped: the model was repeating itself');
  await expect(notice).toContainText('Placement and limits');
  await expect(notice).toContainText(/\(\d+ characters\) is kept/);
  await expect(page.locator('.run-summary')).toContainText('Repetition detected');
  const pill = page.locator('[data-event-code="RunGuardTriggered"]');
  await expect(pill).toHaveText('Run guard stopped the run');
  await expect(pill).toHaveAttribute('data-tip', /A run guard stopped this run/);
  await notice.getByTestId('run-guard-deployments').click();
  await expect(page).toHaveURL(/deployments/);

  // German: the outcome, the notice, the event label, and the guard message itself are translated.
  await page.goto('/dashboard/runs/run_0013?lang=de');
  await expect(page.getByTestId('run-guard-notice')).toContainText('Gestoppt: Das Modell hat sich wiederholt');
  await expect(page.getByTestId('run-guard-reason')).toContainText('Wiederholungswächter');
  await expect(page.locator('[data-event-code="RunGuardTriggered"]')).toHaveText('Laufwächter hat den Lauf gestoppt');
  await expect(page.locator('.timeline')).toContainText('enthalten keine Buchstaben oder Ziffern');
  await page.evaluate(() => localStorage.setItem('garrison.locale', 'en'));
});

test('a per-run time limit is offered when the deployment allows it, validated against the rule and the cluster cap', async ({ page }) => {
  await installControlledStream(page);
  const runs = { run_g9: mockRun('run_g9', RUNNING) };
  const log = await routeRuns(page, runs, ['run_g9']);
  await login(page);
  await page.goto('/dashboard/invoke?agentId=agt_0001');
  await expect(page.getByTestId('invoke-time-limit')).toHaveCount(0);
  await page.locator('#invoke-deployment').selectOption({ label: 'deployment-2' });
  const field = page.getByTestId('invoke-time-limit');
  await expect(field).toBeVisible();
  // Range 30 s to 30 min from the deployment, capped at 20 min by Runtime.MaxRunSeconds (1200).
  await expect(page.getByTestId('invoke-time-limit-hint')).toHaveText('Allowed: 30 s to 30 min. The cluster stops every run after 20 min.');
  await expect(field.locator('button[data-testid^="time-preset-"]')).toHaveText(['30 s', '1 min', '5 min', '15 min']);
  await page.locator('#invoke-message').fill('quick one');

  const input = page.locator('#invoke-time-limit');
  await input.fill('10');
  await expect(page.getByTestId('invoke-time-limit-error')).toHaveText('Enter a time limit from 30 s to 30 min.');
  await expect(page.getByTestId('invoke-send')).toBeDisabled();
  await input.fill('1500');
  await expect(page.getByTestId('invoke-time-limit-error')).toHaveText('The cluster allows at most 20 min per run.');
  await input.fill('');
  await expect(page.getByTestId('invoke-time-limit-error')).toHaveCount(0);

  await page.getByTestId('time-preset-300').click();
  await expect(input).toHaveValue('300');
  await expect(page.getByTestId('time-preset-300')).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('invoke-send').click();
  await expect(page.locator('.invoke-run-head')).toContainText('run_g9');
  expect(log[0].body.parameters).toEqual({ timeoutSeconds: '300' });
  expect(log[0].body.deploymentId).toBe('dep_0002');
});

test('the server refusing a time limit shows its field error under the field', async ({ page }) => {
  await page.route(/\/v1\.0\/api\/settings$/, (route) => route.fulfill({ status: 403, contentType: 'application/json', body: JSON.stringify({ code: 'AuthorizationDenied', message: 'Denied' }) }));
  await page.route(/\/agents\/[^/]+\/invoke/, (route) =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'ValidationFailed',
        message: 'Run parameter timeoutSeconds is not allowed for deployment deployment-2: Value must be between 30 and 1800.',
        fields: { 'parameters.timeoutSeconds': 'Value must be between 30 and 1800.' },
        fieldCodes: { 'parameters.timeoutSeconds': 'ParameterInvalid' }
      })
    })
  );
  await login(page);
  await page.goto('/dashboard/invoke?agentId=agt_0001&deploymentId=dep_0002');
  await expect(page.getByTestId('invoke-time-limit')).toBeVisible();
  // Settings are not readable here, so only the deployment's range is known.
  await expect(page.getByTestId('invoke-time-limit-hint')).toHaveText('Allowed: 30 s to 30 min.');
  await page.locator('#invoke-time-limit').fill('900');
  await send(page, 'hello');
  await expect(page.getByTestId('invoke-time-limit-error')).toHaveText('Enter a time limit from 30 s to 30 min.');
  await page.locator('#invoke-time-limit').fill('600');
  await expect(page.getByTestId('invoke-time-limit-error')).toHaveCount(0);
});

test('the deployment form shows run guards with cluster defaults, and Settings labels the Runtime limits', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/deployments');
  await page.locator('.data-table tbody tr', { hasText: 'deployment-2' }).getByText('deployment-2', { exact: true }).click();
  await expect(page.locator('.modal')).toBeVisible();
  await page.locator('.modal .stepper-step').nth(5).click();
  const modal = page.locator('.modal');
  await expect(modal).toContainText('Run guards');
  const guard = page.locator('#deployments-repetitionGuard');
  await expect(guard).toBeChecked();
  await expect(guard).toHaveAttribute('data-tip', /repeated over and over/);
  await expect(modal).toContainText('Set on this deployment. The cluster default (Runtime.RepetitionGuard) is on.');
  await expect(page.locator('#deployments-maxAssistantChars')).toHaveValue('50000');
  await expect(page.locator('#deployments-noProgressSeconds')).toHaveValue('120');
  await expect(modal).toContainText('Every run is capped at 1,200 seconds by the cluster setting Runtime.MaxRunSeconds.');
  // Back to the cluster default.
  await page.getByTestId('deployments-repetitionGuard-reset').click();
  await expect(guard).toHaveAttribute('data-own', 'false');
  await expect(modal).toContainText('Follows the cluster default, on, from Runtime.RepetitionGuard.');
  await page.locator('#deployments-maxAssistantChars').fill('');
  await expect(page.locator('#deployments-maxAssistantChars')).toHaveAttribute('placeholder', 'Cluster default (200,000)');
  await expect(modal).toContainText('Empty uses the cluster default, 300, from Runtime.NoProgressSeconds. 0 turns the guard off.');
  await modal.locator('.modal-header .icon-button').click();

  await page.goto('/dashboard/settings');
  for (const label of ['Maximum run time (seconds)', 'Repetition guard by default', 'Default maximum assistant characters', 'Default no-progress timeout (seconds)', 'Grace after a host pause (ms)']) {
    await expect(page.locator('.settings-label', { hasText: label })).toBeVisible();
  }
  await expect(page.locator('label[for="setting-Scheduling.PauseGraceMs"]')).toHaveAttribute('data-tip', /heartbeat window/);
  await expect(page.locator('label[for="setting-Runtime.MaxRunSeconds"]')).toHaveAttribute('data-tip', /longest any run may take/);
});
