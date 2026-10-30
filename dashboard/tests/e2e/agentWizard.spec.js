// The agent wizard (Agents > Agents > Agent wizard) on the stateful studio mock (studioFlowMocks.js): the Agents page
// opens it; the goal creates a draft; model access adds a credential inline and sets up the wizard's architect with
// the guided prompt and that credential; the architect builds a two-agent app over two turns; review validates; one
// click approves and applies the draft and binds the credential to each agent's dev deployment; and the new entry
// agent answers in dev. Also: the studio tab is gone from Agents, and a draft that could not be applied offers to send
// the problem back to the architect.

import { test, expect } from '@playwright/test';
import { installMocks, studioRun } from './mocks.js';
import { installStudioFlow, FLOW_DRAFT_ID } from './studioFlowMocks.js';

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
const PLANNER = { id: 'agt_0011', tenantId: 'default', name: 'planner', active: true, isProtected: false };
const WRITER = { id: 'agt_0012', tenantId: 'default', name: 'writer', active: true, isProtected: false };
const PROFILE = { id: 'hp_0001', tenantId: null, name: 'builtin/claude-code', harnessType: 'ClaudeCode', active: true };

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

/** The flow mock's tenant has no agents, so the setup wizard opens on its own; close it. */
async function skipSetup(page) {
  await page.getByRole('button', { name: 'Skip setup' }).click();
  await expect(page.locator('.modal')).toHaveCount(0);
}

/** Profiles, secrets, the applied agents by name, their dev deployments, and the entry agent's test conversation. */
async function installWizardRoutes(page) {
  const wizard = { secrets: [], secretBodies: [], deploymentUpdates: [], testInvokes: [] };
  const page1 = (rows) => json(200, { objects: rows, totalRecords: rows.length, skip: 0, maxResults: 1000, endOfResults: true });
  await page.route(/\/tenants\/[^/]+\/harness-profiles(\?.*)?$/, (route) => (route.request().method() === 'GET' ? route.fulfill(page1([PROFILE])) : route.fallback()));
  await page.route(/\/tenants\/[^/]+\/harness-profiles\/hp_0001$/, (route) => route.fulfill(json(200, PROFILE)));
  await page.route(/\/tenants\/[^/]+\/secrets(\?.*)?$/, (route) => {
    if (route.request().method() === 'POST') {
      const body = route.request().postDataJSON();
      wizard.secretBodies.push(body);
      const created = { id: 'sec_0100', tenantId: 'default', name: body.name, kind: body.kind, active: true, status: 'Ok' };
      wizard.secrets.push(created);
      return route.fulfill(json(201, created));
    }
    return route.fulfill(page1(wizard.secrets));
  });
  await page.route(/\/tenants\/[^/]+\/agents\/(planner|writer|agt_0011|agt_0012)$/, (route) => {
    const key = route.request().url().split('/').pop();
    return route.fulfill(json(200, key === 'planner' || key === 'agt_0011' ? PLANNER : WRITER));
  });
  await page.route(/\/tenants\/[^/]+\/deployments\/dep_(planner|writer)_dev$/, (route) => {
    const id = route.request().url().split('/').pop();
    const agent = id.includes('planner') ? PLANNER : WRITER;
    if (route.request().method() === 'PUT') {
      const body = route.request().postDataJSON();
      wizard.deploymentUpdates.push(body);
      return route.fulfill(json(200, body));
    }
    return route.fulfill(json(200, { id, tenantId: 'default', name: `${agent.name}-dev`, agentId: agent.id, harnessProfileId: 'hp_0001', environment: 'dev', active: true, resourceBindings: [] }));
  });
  await page.route(/\/agents\/agt_0011\/invoke(\?.*)?$/, (route) => {
    wizard.testInvokes.push(route.request().postDataJSON());
    return route.fulfill(json(200, studioRun('run_try_1', { kind: 'Invoke', agentId: PLANNER.id, conversationId: 'cnv_try', inputText: wizard.testInvokes[0].input })));
  });
  const done = () => studioRun('run_try_1', { kind: 'Invoke', agentId: PLANNER.id, status: 'Succeeded', outcome: 'Succeeded', conversationId: 'cnv_try', inputText: 'Plan a page about tides.', resultText: 'Here is an outline about tides.' });
  await page.route(/\/runs\/run_try_1$/, (route) => route.fulfill(json(200, done())));
  await page.route(/\/conversations\/cnv_try\/runs(\?.*)?$/, (route) => route.fulfill(json(200, { objects: wizard.testInvokes.length ? [done()] : [], totalRecords: wizard.testInvokes.length })));
  return wizard;
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('the Agents page opens the wizard, and Studio is no longer a tab', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/agents');
  await expect(page.getByRole('tab', { name: 'Agents', exact: true })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Studio' })).toHaveCount(0);
  await page.getByTestId('open-agent-wizard').click();
  await expect(page).toHaveURL(/\/dashboard\/agent-wizard\/new$/);
  await expect(page.getByTestId('wizard-panel-goal')).toBeVisible();
  await expect(page.getByTestId('wizard-step-access')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByTestId('wizard-resume')).toBeVisible();
});

test('end to end: goal, credential, architect, design, review, approve with dev deployments, and a first conversation', async ({ page }) => {
  const flow = await installStudioFlow(page);
  const wizard = await installWizardRoutes(page);
  await login(page);
  await skipSetup(page);
  await page.goto('/dashboard/agent-wizard/new');

  // 1. Goal: creates the draft and moves to model access.
  await page.locator('#wizard-title').fill('Docs app');
  await page.locator('#wizard-goal').fill('Plan and write short documents.');
  await page.getByTestId('wizard-next').click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/agent-wizard/${FLOW_DRAFT_ID}\\?step=access$`));

  // 2. Model access: no fitting secret yet, so add one here with its instructions, then set up the architect.
  await expect(page.getByTestId('wizard-credential')).toContainText('You have no saved secret');
  await page.getByTestId('wizard-next').click({ force: true });
  await expect(page).toHaveURL(/step=access$/);
  await page.getByTestId('wizard-add-secret').click();
  await expect(page.getByTestId('wizard-new-secret')).toContainText('Anthropic Console');
  await page.locator('#wizard-secret-value').fill('sk-ant-test');
  await page.getByTestId('wizard-save-secret').click();
  await expect(page.getByTestId('wizard-secret-claude-code-key')).toBeChecked();
  expect(wizard.secretBodies).toEqual([{ name: 'claude-code-key', kind: 'AnthropicApiKey', value: 'sk-ant-test', active: true }]);
  await page.locator('#wizard-model').fill('opus');
  await page.getByTestId('wizard-next').click();
  await expect(page).toHaveURL(/step=design$/);
  expect(flow.architectBodies).toHaveLength(1);
  expect(flow.architectBodies[0]).toMatchObject({ name: 'architect-claude-code', harnessProfileId: 'hp_0001', model: 'opus', credentialSecretId: 'sec_0100', architectPromptTemplateId: 'builtin/agent-architect-guided' });

  // 3. Design: the composer starts with the goal; two turns build the agents and the app.
  await expect(page.getByTestId('studio-architect')).toHaveCount(0);
  await expect(page.getByTestId('studio-chat-message')).toHaveValue(/Plan and write short documents\./);
  await expect(page.getByTestId('wizard-contents')).toContainText('Nothing yet');
  await page.getByTestId('studio-chat-send').click();
  await expect(page.getByTestId('studio-chat-answer').first()).toContainText('I added a planner and a writer');
  await expect(page.getByTestId('wizard-contents')).toContainText('planner');
  expect(flow.invokes[0]).toMatchObject({ deploymentId: 'dep_arch', startConversation: true, studioDraftId: FLOW_DRAFT_ID });
  await page.getByTestId('studio-chat-message').fill('Now put them in an app called docs.');
  await page.getByTestId('studio-chat-send').click();
  await expect(page.getByTestId('studio-chat-answer').nth(1)).toContainText('I added the docs app');
  await page.getByTestId('wizard-next').click();

  // 4. Review: valid, so approval opens.
  await expect(page.getByTestId('wizard-valid')).toBeVisible();
  await expect(page.getByTestId('wizard-review').locator('tbody tr')).toHaveCount(7);
  await page.getByTestId('wizard-next').click();

  // 5. Approve: request apply, allow, apply, and bind the credential to both dev deployments.
  await page.getByTestId('wizard-approve-button').click();
  await expect(page.getByTestId('wizard-approved')).toContainText('Approved and published');
  expect(flow.applyRequests).toEqual([{ version: 3 }]);
  expect(flow.decisions[0]).toMatchObject({ decision: 'Allow' });
  expect(wizard.deploymentUpdates.map((d) => [d.name, d.resourceBindings])).toEqual([
    ['planner-dev', [{ kind: 'Secret', alias: 'credential', resourceId: 'sec_0100' }]],
    ['writer-dev', [{ kind: 'Secret', alias: 'credential', resourceId: 'sec_0100' }]]
  ]);
  await expect(page.getByTestId('wizard-approved').locator('tbody tr')).toHaveCount(2);
  await page.getByTestId('wizard-next').click();

  // 6. Try it: the app's entry agent answers on its dev deployment.
  await expect(page.getByTestId('wizard-panel-test')).toContainText('Talking to planner.');
  await page.getByTestId('wizard-test-message').fill('Plan a page about tides.');
  await page.keyboard.press('Enter');
  await expect(page.getByTestId('wizard-test-turns')).toContainText('Here is an outline about tides.');
  expect(wizard.testInvokes[0]).toMatchObject({ input: 'Plan a page about tides.', deploymentId: 'dep_planner_dev', startConversation: true });
  await expect(page.getByTestId('wizard-open-agent')).toHaveAttribute('href', '/dashboard/agents/agt_0011');

  // Every step stays reachable afterwards, and Advanced opens the studio workspace.
  await expect(page.getByTestId('wizard-step-goal')).not.toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByTestId('wizard-advanced')).toHaveAttribute('href', `/dashboard/studio/${FLOW_DRAFT_ID}`);
});

test('a draft that could not be applied says why and sends the problem back to the architect', async ({ page }) => {
  const flow = await installStudioFlow(page);
  await installWizardRoutes(page);
  await page.route(/\/approvals\/apr_draft_0100\/decide$/, (route) =>
    route.fulfill(json(409, { error: 'Conflict', code: 'DraftInvalid', message: 'Applying the draft failed, and nothing was changed: Deployment planner-dev: Artifact globs require an artifact store.' }))
  );
  await login(page);
  await skipSetup(page);
  await page.goto('/dashboard/agent-wizard/new');
  await page.locator('#wizard-title').fill('Docs app');
  await page.locator('#wizard-goal').fill('Plan and write short documents.');
  await page.getByTestId('wizard-next').click();
  await page.getByTestId('wizard-add-secret').click();
  await page.locator('#wizard-secret-value').fill('sk-ant-test');
  await page.getByTestId('wizard-save-secret').click();
  await page.getByTestId('wizard-next').click();
  await page.getByTestId('studio-chat-send').click();
  await expect(page.getByTestId('wizard-contents')).toContainText('planner');
  await page.getByTestId('wizard-next').click();
  await expect(page.getByTestId('wizard-valid')).toBeVisible();
  await page.getByTestId('wizard-next').click();
  await page.getByTestId('wizard-approve-button').click();
  await expect(page.getByTestId('wizard-approve-error')).toContainText('Artifact globs require an artifact store.');
  await expect(page.getByTestId('wizard-approve-error')).not.toContainText('someone else');
  expect(flow.decisions).toEqual([]);
  await page.getByTestId('wizard-ask-fix').click();
  await expect(page).toHaveURL(/step=design$/);
  await expect(page.getByTestId('studio-chat-message')).toHaveValue(/Artifact globs require an artifact store\./);
});
