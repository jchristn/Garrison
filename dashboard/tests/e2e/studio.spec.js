// Agent studio (AD7.10, AD7.16, AD9.2, AD9.3) against mocked APIs: the Studio tab under Agents (mine and all, search,
// status chips, a new draft), an item edit refused with 409 DraftVersionConflict and the notice naming what changed,
// diff and validate, request apply with the approval allowed inline (and a 409 DraftStale shown translated), a live
// update over the mocked studio-draft socket, the architect chat (first message carries the draft), the New architect
// dialog, a two-turn playground conversation with its transcript download, the compile preview, and the architect
// prompt panel (clone a built-in, edit and save the clone, select it, the disabled built-in edit, and a delete refused
// with PromptTemplateInUse). AD9.5, AD9.6, AD9.9, AD12.11: the setup wizard's Agent Studio step (create the architect
// with a chosen or the default prompt, or skip it), and the whole flow on a stateful mock (studioFlowMocks.js): the
// wizard creates the architect, the architect builds a two-agent app in a draft over two turns, the DraftApply is
// allowed inline, the app is live in dev with its URL, it is promoted to staging and rolled back; and the Release tab
// and Apps tab Environments dialog for a caller without Execute on Promotion.

import fs from 'fs';
import { test, expect } from '@playwright/test';
import { installMocks, studioDraft, studioDiff, ARCHITECT, ARCHITECT_DEPLOYMENT, ARCHITECT_AGENT, studioRun, respond, PRINCIPAL } from './mocks.js';
import { installStudioFlow, FLOW_DRAFT_ID } from './studioFlowMocks.js';

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
const STUDIO = '/dashboard/agents?tab=studio';
const DRAFT = '/dashboard/studio/drf_0001';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

/** Add the architect to the architect list and its deployment to the deployment list. */
async function withArchitect(page) {
  await page.route(/\/tenants\/[^/]+\/studio\/architects(\?.*)?$/, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill(json(200, { objects: [ARCHITECT], totalRecords: 1, skip: 0, maxResults: 1000, endOfResults: true }));
  });
  await page.route(/\/tenants\/[^/]+\/deployments(\?.*)?$/, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    const base = respond('GET', new URL(route.request().url()));
    return route.fulfill(json(200, { ...base, objects: [...base.objects, ARCHITECT_DEPLOYMENT], totalRecords: base.totalRecords + 1 }));
  });
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('lists drafts with mine and all, search, and status chips, and creates a draft', async ({ page }) => {
  const queries = [];
  const created = [];
  page.on('request', (r) => {
    const url = new URL(r.url());
    if (url.pathname.endsWith('/studio/drafts') && r.method() === 'GET') queries.push({ mine: url.searchParams.get('mine'), search: url.searchParams.get('search') });
    if (url.pathname.endsWith('/studio/drafts') && r.method() === 'POST') created.push(r.postDataJSON());
  });
  await login(page);
  await page.goto(STUDIO);
  await expect(page.getByRole('tab', { name: 'Studio' })).toHaveAttribute('aria-selected', 'true');
  const rows = page.locator('[data-testid="studio-drafts"] tbody tr');
  await expect(rows).toHaveCount(3);
  expect(queries[0].mine).toBe('true');
  await expect(page.locator('tr[data-draft="drf_0001"]')).toContainText('Open');
  await expect(page.locator('tr[data-draft="drf_0003"]')).toContainText('Applied');

  await page.getByTestId('studio-scope-all').click();
  await expect(rows).toHaveCount(4);
  await expect(page.locator('tr[data-draft="drf_0002"]')).toContainText('Pending approval');
  expect(queries[queries.length - 1].mine).toBeNull();

  await page.getByTestId('studio-status-PendingApproval').check();
  await expect(rows).toHaveCount(1);
  await page.getByTestId('studio-status-PendingApproval').uncheck();
  await page.getByTestId('studio-search').fill('triage');
  await expect(rows).toHaveCount(1);
  expect(queries[queries.length - 1].search).toBe('triage');
  await page.getByTestId('studio-search').fill('');

  await page.getByTestId('add-button').click();
  await page.getByTestId('studio-draft-title').fill('Docs app');
  await page.getByTestId('studio-draft-from-app').selectOption('research');
  await page.getByTestId('studio-new-draft-create').click();
  await expect(page).toHaveURL(/\/dashboard\/studio\/drf_0099$/);
  expect(created).toEqual([{ title: 'Docs app', fromApp: 'research' }]);
  await expect(page.getByTestId('studio-draft')).toBeVisible();
});

test('an item save refused with DraftVersionConflict reads the draft again and names what changed', async ({ page }) => {
  const puts = [];
  let reads = 0;
  await page.route(/\/studio\/drafts\/drf_0001\/items\/Agent\/writer$/, (route) => {
    puts.push(route.request().postDataJSON());
    return route.fulfill(json(409, { error: 'Conflict', code: 'DraftVersionConflict', message: 'Draft Research app changed since version you read; read it again (it is at a newer version) and retry.' }));
  });
  await page.route(/\/studio\/drafts\/drf_0001$/, (route) => {
    reads += 1;
    const base = studioDraft(1);
    if (reads < 2) return route.fulfill(json(200, base));
    // Someone else edited the writer and added a reviewer while this person edited.
    const items = base.items.map((i) => (i.name === 'writer' ? { ...i, document: `${i.document}  # tuned\n` } : i));
    return route.fulfill(json(200, { ...base, version: 5, items: [...items, { kind: 'Agent', name: 'reviewer', operation: 'Upsert', document: 'kind: Agent\n', lastUpdateUtc: new Date().toISOString() }] }));
  });
  await login(page);
  await page.goto(`${DRAFT}?tab=items`);
  const table = page.getByTestId('studio-items-table');
  await expect(table.locator('tbody tr')).toHaveCount(3);
  // The app item is stale against live configuration (from the diff).
  await expect(table.locator('tr[data-item="AgenticApp/research"]')).toContainText('Stale');
  await page.getByTestId('studio-item-edit-Agent/writer').click();
  await page.getByTestId('studio-item-document').fill('kind: Agent\nmetadata:\n  name: writer\nspec:\n  description: Mine\n');
  await page.getByTestId('studio-item-save').click();

  const notice = page.getByTestId('studio-conflict');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('version 3 is now 5');
  await expect(notice).toContainText('Added: Agent/reviewer');
  await expect(notice).toContainText('Edited: Agent/writer');
  await expect(notice).toContainText('The item you are editing changed too');
  // The person's text is kept and the list shows the new item.
  await expect(page.getByTestId('studio-item-document')).toHaveValue(/description: Mine/);
  await expect(table.locator('tbody tr')).toHaveCount(4);
  await expect(page.getByTestId('studio-draft-version')).toHaveText('Version 5');
  expect(puts[0]).toMatchObject({ version: 3, operation: 'Upsert' });
});

test('shows the diff, validates, requests apply, and allows the approval inline', async ({ page }) => {
  const decided = [];
  let requested = false;
  await page.route(/\/studio\/drafts\/drf_0001\/validate$/, (route) => route.fulfill(json(200, studioDiff('drf_0001', 3, true))));
  await page.route(/\/studio\/drafts\/drf_0001\/request-apply$/, (route) => {
    requested = route.request().postDataJSON();
    return route.fulfill(json(201, { ...respond('GET', new URL('http://127.0.0.1/v1.0/api/tenants/default/approvals/apr_draft_0001')), draftId: 'drf_0001' }));
  });
  await page.route(/\/approvals\/apr_draft_0001\/decide$/, (route) => {
    decided.push(route.request().postDataJSON());
    return route.fallback();
  });
  await login(page);
  await page.goto(`${DRAFT}?tab=apply`);
  const table = page.getByTestId('studio-diff-table');
  await expect(table.locator('tr[data-diff="AgenticApp/research"]')).toContainText('Update');
  await expect(table.locator('tr[data-diff="AgenticApp/research"]')).toContainText('Stale');
  await expect(table.locator('tr[data-diff="AgenticApp/research"]')).toContainText('edges');
  await expect(table.locator('tr[data-diff="Deployment/writer-dev"]')).toContainText('Failed');
  await expect(table.locator('tr[data-diff="Deployment/writer-dev"]')).toContainText('Harness profile claude-code does not exist.');
  await expect(page.getByTestId('studio-diff-summary')).toContainText('Not valid');

  await page.getByTestId('studio-validate').click();
  await expect(page.getByTestId('studio-diff-summary')).toContainText('Valid: 2 to create, 1 to update');
  await expect(table.locator('tr[data-diff="Deployment/writer-dev"]')).toContainText('Create');

  await page.getByTestId('studio-request-apply').click();
  await expect(page.getByTestId('studio-approval')).toContainText('Pending');
  await expect(page.getByTestId('studio-approval-summary')).toContainText('Apply draft Research app');
  expect(requested).toEqual({ version: 3 });
  await page.locator('#studio-decide-reason').fill('Looks right');
  await page.getByTestId('studio-approval-allow').click();
  await expect(page.getByTestId('studio-approval')).toContainText('Approved');
  expect(decided).toEqual([{ decision: 'Allow', reason: 'Looks right' }]);
});

test('a decision refused with DraftStale or ApproverLacksPermission shows a translated message', async ({ page }) => {
  let attempt = 0;
  await page.route(/\/approvals\/apr_draft_0002\/decide$/, (route) => {
    attempt += 1;
    if (attempt === 1) return route.fulfill(json(403, { error: 'Forbidden', code: 'ApproverLacksPermission', message: 'Allowing this draft needs Delete on Agent.' }));
    return route.fulfill(json(409, { error: 'Conflict', code: 'DraftStale', message: 'Live configuration moved since the request; the draft is open again.' }));
  });
  await login(page);
  await page.goto('/dashboard/studio/drf_0002?tab=apply');
  await expect(page.getByTestId('studio-not-open')).toContainText('waits for a decision');
  await expect(page.getByTestId('studio-request-apply')).toHaveAttribute('data-tip', /only an open draft can change/);
  await page.getByTestId('studio-approval-allow').click();
  await expect(page.getByTestId('studio-approval-error')).toHaveText('You may not allow this draft: allowing it needs Create on Manifest and Delete on each kind the draft deletes.');
  await page.getByTestId('studio-approval-allow').click();
  await expect(page.getByTestId('studio-approval-error')).toHaveText(/Live configuration changed after the draft was based on it/);
});

test('a change pushed on the studio-draft channel refreshes the items, graph, and version', async ({ page }) => {
  let socket = null;
  let version = 3;
  await page.routeWebSocket(/\/v1\.0\/ws/, (ws) => {
    ws.onMessage((message) => {
      const data = JSON.parse(String(message));
      if (data.type === 'subscribe' && data.channel === 'studio-draft:drf_0001') {
        socket = ws;
        ws.send(JSON.stringify({ type: 'subscribed', channel: data.channel }));
      }
    });
  });
  await page.route(/\/studio\/drafts\/drf_0001$/, (route) => {
    const base = studioDraft(1);
    const items = version > 3 ? [...base.items, { kind: 'Agent', name: 'editor', operation: 'Upsert', document: 'kind: Agent\n', lastUpdateUtc: new Date().toISOString() }] : base.items;
    return route.fulfill(json(200, { ...base, version, items }));
  });
  await login(page);
  await page.goto(`${DRAFT}?tab=graph`);
  await expect(page.getByTestId('studio-live')).toHaveText('Live');
  const graph = page.getByTestId('studio-canvas-research');
  await expect(graph.locator('.react-flow__node')).toHaveCount(3);
  await expect(graph.locator('.react-flow__node[data-id="planner"] .studio-canvas-node')).toHaveClass(/is-entry/);
  await expect(page.locator('[data-call="planner>writer"]')).toHaveText('planner calls writer, one call at a time, delegation depth 1.');
  await expect(graph.locator('.react-flow__edge[data-edge="planner>writer"]')).toHaveClass(/is-single/);
  await expect(graph.locator('[data-node-note="writer"]')).toHaveText('pandoc');

  version = 4;
  const pushed = {
    draftId: 'drf_0001',
    version: 4,
    nodes: [
      { key: 'AgenticApp/research', kind: 'AgenticApp', name: 'research', inDraft: true, deleted: false, entryOf: [], memberOf: [], capabilities: [] },
      { key: 'Agent/planner', kind: 'Agent', name: 'planner', inDraft: false, deleted: false, entryOf: ['research'], memberOf: ['research'], capabilities: [] },
      { key: 'Agent/writer', kind: 'Agent', name: 'writer', inDraft: true, deleted: false, entryOf: [], memberOf: ['research'], capabilities: ['pandoc'] },
      { key: 'Agent/editor', kind: 'Agent', name: 'editor', inDraft: true, deleted: false, entryOf: [], memberOf: ['research'], capabilities: [] }
    ],
    edges: [
      { app: 'research', from: 'planner', to: 'writer', fanOut: false, depth: 2 },
      { app: 'research', from: 'writer', to: 'editor', fanOut: true, depth: 1 }
    ]
  };
  socket.send(JSON.stringify({ type: 'studio-draft.changed', draftId: 'drf_0001', version: 4, status: 'Open', changed: [{ kind: 'Agent', name: 'editor', operation: 'Upsert', removed: false }], graph: pushed }));

  await expect(page.getByTestId('studio-live-notice')).toContainText('version 4');
  await expect(page.getByTestId('studio-live-notice')).toContainText('Agent/editor');
  await expect(page.getByTestId('studio-draft-version')).toHaveText('Version 4');
  await expect(graph.locator('.react-flow__node[data-id="editor"]')).toBeVisible();
  await expect(page.locator('[data-call="planner>writer"]')).toContainText('delegation depth 2');
  await page.getByRole('tab', { name: 'Items' }).click();
  await expect(page.locator('tr[data-item="Agent/editor"]')).toBeVisible();
});

test('the architect chat starts a conversation that names the draft and shows the reply', async ({ page }) => {
  const invokes = [];
  let finished = false;
  await withArchitect(page);
  await page.route(/\/agents\/agt_arch\/invoke(\?.*)?$/, (route) => {
    invokes.push(route.request().postDataJSON());
    return route.fulfill(json(200, studioRun('run_arch_1', { kind: 'Invoke', conversationId: 'cnv_arch', inputText: invokes[0].input })));
  });
  await page.route(/\/runs\/run_arch_1$/, (route) => {
    finished = true;
    return route.fulfill(json(200, studioRun('run_arch_1', { kind: 'Invoke', status: 'Succeeded', outcome: 'Succeeded', conversationId: 'cnv_arch', resultText: 'I added a **writer** to the draft.' })));
  });
  await page.route(/\/conversations\/cnv_arch\/runs(\?.*)?$/, (route) =>
    route.fulfill(json(200, { objects: [studioRun('run_arch_1', { kind: 'Invoke', status: finished ? 'Succeeded' : 'Running', conversationId: 'cnv_arch', inputText: invokes[0]?.input, resultText: finished ? 'I added a **writer** to the draft.' : undefined })], totalRecords: 1 }))
  );
  await login(page);
  await page.goto(DRAFT);
  await expect(page.getByTestId('studio-architect')).toHaveValue('dep_arch');
  await page.getByTestId('studio-chat-message').fill('Add a writer that turns notes into a report.');
  await page.getByTestId('studio-chat-send').click();
  await expect(page.getByTestId('studio-chat-answer')).toContainText('I added a writer to the draft.');
  expect(invokes[0]).toEqual({ input: 'Add a writer that turns notes into a report.', deploymentId: 'dep_arch', startConversation: true, studioDraftId: 'drf_0001' });
  // The prefix is not shown back to the person.
  await expect(page.locator('.studio-turn-text').first()).toHaveText('Add a writer that turns notes into a report.');
  await expect(page.getByTestId('studio-chat-conversation')).toHaveAttribute('href', '/dashboard/conversations/cnv_arch');
});

test('New architect creates an architect with the chosen architect prompt', async ({ page }) => {
  const bodies = [];
  await page.route(/\/tenants\/[^/]+\/agents(\?.*)?$/, (route) => {
    // Only the dialog's lookup by name; the full list stays as mocked, so the tenant is not empty and the wizard stays shut.
    if (route.request().method() !== 'GET' || !new URL(route.request().url()).searchParams.get('search')) return route.fallback();
    return route.fulfill(json(200, { objects: [ARCHITECT_AGENT], totalRecords: 1 }));
  });
  await page.route(/\/tenants\/[^/]+\/studio\/architects$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    bodies.push(route.request().postDataJSON());
    return route.fulfill(json(201, { ...ARCHITECT, id: 'dep_arch_2', name: 'architect-2' }));
  });
  await login(page);
  await page.goto(DRAFT);
  await expect(page.getByTestId('studio-no-architect')).toBeVisible();
  await page.getByTestId('studio-new-architect').click();
  const dialog = page.getByTestId('new-architect');
  // Built-ins come first and the default is preselected; its rendered text shows.
  await expect(page.getByTestId('architect-prompt')).toHaveValue('pt_builtin_agent_architect');
  await expect(page.getByTestId('architect-prompt').locator('option').first()).toHaveText('builtin/agent-architect (default)');
  await expect(dialog.locator('pre, code').first()).toContainText('You are echo-agent');
  await expect(page.getByTestId('architect-clone-link')).toHaveAttribute('href', '/dashboard/prompt-templates/pt_builtin_agent_architect');
  await page.getByTestId('architect-prompt').selectOption('pt_builtin_agent_architect_guided');
  await page.locator('#architect-name').fill('architect-2');
  await page.locator('#architect-model').fill('opus');
  await page.getByTestId('architect-create').click();
  await expect(page.locator('.modal')).toHaveCount(0);
  expect(bodies).toEqual([{ name: 'architect-2', harnessProfileId: 'hp_0001', model: 'opus', architectPromptTemplateId: 'pt_builtin_agent_architect_guided' }]);
});

test('runs a two-turn playground conversation and downloads the transcript', async ({ page }) => {
  const bodies = [];
  await page.route(/\/studio\/drafts\/drf_0001\/playground\/invoke$/, (route) => {
    bodies.push(route.request().postDataJSON());
    const n = bodies.length;
    return route.fulfill(json(200, studioRun(`run_play_${n}`, { conversationId: 'cnv_play', conversationTurn: n })));
  });
  await page.route(/\/runs\/run_play_(\d+)$/, (route) => {
    const n = route.request().url().match(/run_play_(\d+)$/)[1];
    return route.fulfill(json(200, studioRun(`run_play_${n}`, { status: 'Succeeded', outcome: 'Succeeded', conversationId: 'cnv_play', resultText: `Answer ${n}` })));
  });
  await login(page);
  await page.goto(`${DRAFT}?tab=playground`);
  await expect(page.getByTestId('studio-playground-agent').locator('option').first()).toHaveText('Entry agent (planner)');
  await page.getByTestId('studio-playground-input').fill('Summarize the README');
  await page.getByTestId('studio-playground-send').click();
  await expect(page.locator('[data-playground-turn="1"]')).toContainText('Answer 1');
  await page.getByTestId('studio-playground-agent').selectOption('writer');
  await page.getByTestId('studio-playground-input').fill('Now as a report');
  await page.getByTestId('studio-playground-send').click();
  await expect(page.locator('[data-playground-turn="2"]')).toContainText('Answer 2');
  expect(bodies).toEqual([
    { input: 'Summarize the README', wait: false },
    { input: 'Now as a report', wait: false, agent: 'writer', conversationId: 'cnv_play' }
  ]);
  await expect(page.locator('[data-playground-turn="2"]').getByTestId('studio-playground-run')).toHaveAttribute('href', '/dashboard/runs/run_play_2');

  const download = page.waitForEvent('download');
  await page.getByTestId('studio-playground-export').click();
  const d = await download;
  expect(d.suggestedFilename()).toBe('playground-drf_0001.md');
  const text = fs.readFileSync(await d.path(), 'utf8');
  expect(text).toContain('# Playground: Research app');
  expect(text).toContain('## Turn 2 (writer)');
  expect(text).toContain('Answer 2');
});

test('compile preview shows the command line, placed asset paths, and the file space mount', async ({ page }) => {
  const bodies = [];
  await page.route(/\/deployments\/dep_0001\/compile-preview$/, (route) => {
    bodies.push(route.request().postDataJSON());
    return route.fulfill(
      json(200, {
        commandLine: "claude -p --model sonnet --append-system-prompt '********'",
        deploymentId: 'dep_0002',
        agentRevisionId: 'arv_agt_0001_0003',
        templateVersions: [],
        spec: {
          executable: 'claude',
          arguments: ['-p'],
          assetFiles: [{ assetId: 'aas_0001', assetName: 'style-guide', kind: 'Skill', version: 2, path: '.claude/skills/style-guide/SKILL.md', mediaType: 'text/markdown', sizeBytes: 2048 }],
          fileSpace: { fileSpaceId: 'cfs_0001', mountPath: 'files', maxFileBytes: 33554432, maxFiles: 1000, files: [{ path: 'notes.md', version: 1, sizeBytes: 10 }] }
        }
      })
    );
  });
  await login(page);
  await page.goto(`${DRAFT}?tab=preview`);
  await page.getByTestId('studio-preview-deploymentId').selectOption('dep_0001');
  await page.getByTestId('studio-preview-agentRevisionId').selectOption({ index: 1 });
  await page.getByTestId('studio-preview-environment').selectOption('staging');
  await page.getByTestId('studio-preview-compile').click();
  await expect(page.getByTestId('studio-preview-command')).toContainText("claude -p --model sonnet --append-system-prompt '********'");
  await expect(page.getByTestId('studio-preview-assets')).toContainText('.claude/skills/style-guide/SKILL.md');
  await expect(page.getByTestId('studio-preview-file-space')).toContainText('Mounted at files with 1 files now');
  await expect(page.getByTestId('studio-preview-compiled')).toContainText('deployment-2');
  expect(bodies[0]).toMatchObject({ environment: 'staging', parameters: {} });
  expect(bodies[0].agentRevisionId).toBeTruthy();
});

test('architect prompt panel: clone a built-in, edit and select it; built-ins are locked; a prompt in use cannot be deleted', async ({ page }) => {
  const puts = [];
  const selections = [];
  await withArchitect(page);
  await page.route(/\/prompt-templates\/pt_builtin_agent_architect\/clone$/, (route) =>
    route.fulfill(json(201, { id: 'pt_0050', name: route.request().postDataJSON().name, description: 'Default architect prompt', kind: 'System', content: 'You design agents.', currentVersion: 1, isBuiltIn: false }))
  );
  await page.route(/\/prompt-templates\/pt_0050$/, (route) => {
    if (route.request().method() === 'PUT') {
      puts.push(route.request().postDataJSON());
      return route.fulfill(json(200, { id: 'pt_0050', ...puts[puts.length - 1], currentVersion: 2 }));
    }
    return route.fulfill(json(200, { id: 'pt_0050', name: 'agent-architect-custom', description: 'Default architect prompt', kind: 'System', content: 'You design agents.', currentVersion: puts.length + 1, isBuiltIn: false }));
  });
  await page.route(/\/studio\/architects\/dep_arch\/prompt$/, (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    selections.push(route.request().postDataJSON());
    return route.fulfill(json(200, { deploymentId: 'dep_arch', architectPromptTemplateId: 'pt_builtin_agent_architect_guided', architectPromptName: 'builtin/agent-architect-guided', currentVersion: 1 }));
  });
  await page.route(/\/prompt-templates\/pt_0042$/, (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback();
    return route.fulfill(json(409, { error: 'Conflict', code: 'PromptTemplateInUse', message: 'Prompt template agent-architect-team is bound by deployment(s) dep_arch (architect). Unbind it or switch those deployments to another template first.' }));
  });
  await login(page);
  await page.goto(`${DRAFT}?tab=prompts`);
  const panel = page.getByTestId('architect-prompts');
  await expect(page.getByTestId('architect-prompt-selection')).toContainText('architect uses agent-architect-team');
  await expect(panel.locator('tbody tr').first()).toHaveAttribute('data-prompt', 'builtin/agent-architect');

  // Built-ins keep Edit and Delete visible but disabled, with a tooltip that says to clone.
  const lockedEdit = page.getByTestId('architect-prompt-edit-builtin/agent-architect');
  await expect(lockedEdit).toHaveAttribute('aria-disabled', 'true');
  await expect(lockedEdit).toHaveAttribute('data-tip', /Clone this prompt and change the clone/);
  await lockedEdit.hover();
  await expect(page.locator('.tooltip')).toContainText('Clone this prompt');
  await expect(page.getByTestId('architect-prompt-delete-builtin/agent-architect')).toHaveAttribute('aria-disabled', 'true');

  await page.getByTestId('architect-prompt-clone-builtin/agent-architect').click();
  await expect(page.locator('#clone-name')).toHaveValue(/agent-architect-custom/);
  await page.locator('#clone-name').fill('agent-architect-custom');
  await page.getByTestId('clone-confirm').click();
  const editor = page.getByTestId('architect-prompt-editor');
  await expect(editor).toBeVisible();
  await expect(page.getByTestId('architect-prompt-body')).toHaveValue('You design agents.');
  await page.getByTestId('architect-prompt-body').fill('You design agents. Name every agent team-*.');
  await page.locator('#architect-prompt-note').fill('Team naming');
  await page.getByTestId('architect-prompt-save').click();
  await expect.poll(() => puts.length).toBe(1);
  expect(puts[0]).toMatchObject({ name: 'agent-architect-custom', kind: 'System', content: 'You design agents. Name every agent team-*.', changeNote: 'Team naming' });
  await expect(editor).toContainText('next turn');

  await page.getByTestId('architect-prompt-select-builtin/agent-architect-guided').click();
  await expect.poll(() => selections.length).toBe(1);
  expect(selections[0]).toEqual({ architectPromptTemplateId: 'pt_builtin_agent_architect_guided' });
  await expect(page.getByTestId('architect-prompt-selection')).toContainText('architect uses builtin/agent-architect-guided');

  await page.getByTestId('architect-prompt-delete-agent-architect-team').click();
  await page.locator('.modal').getByRole('button', { name: 'Confirm' }).click();
  await expect(page.getByTestId('architect-prompt-in-use')).toContainText('agent-architect-team cannot be deleted while deployments use it: architect');
});

test('the setup wizard creates the architect with the default prompt when the select is left alone', async ({ page }) => {
  const state = await installStudioFlow(page);
  await login(page);
  // A tenant whose only agent is the seeded architect counts as empty, so the wizard opens.
  await expect(page.locator('.wizard-steps')).toBeVisible();
  await expect(page.locator('.wizard-steps li')).toHaveText(['Welcome', 'Credential', 'Agent Studio', 'Sample agent', 'Test run']);
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Skip this step' }).click();
  await expect(page.locator('.wizard-steps li.active')).toHaveText('Agent Studio');
  await expect(page.getByTestId('architect-prompt')).toHaveValue('pt_builtin_agent_architect');
  await expect(page.getByTestId('architect-prompt').locator('option').first()).toHaveText('builtin/agent-architect (default)');
  await expect(page.getByTestId('wizard-studio').locator('pre, code').first()).toContainText('You are echo-agent');
  await expect(page.getByTestId('architect-clone-link')).toHaveAttribute('href', '/dashboard/prompt-templates/pt_builtin_agent_architect');
  await page.getByTestId('wizard-create-architect').click();
  await expect(page.locator('.wizard-steps li.active')).toHaveText('Sample agent');
  expect(state.architectBodies).toEqual([{ name: 'architect', harnessProfileId: 'hp_0001', architectPromptTemplateId: 'pt_builtin_agent_architect' }]);
  // Going back shows the architect as created; Continue does not create a second one.
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByTestId('wizard-architect-created')).toContainText('architect is ready');
  await page.getByTestId('wizard-create-architect').click();
  await expect(page.locator('.wizard-steps li.active')).toHaveText('Sample agent');
  expect(state.architectBodies).toHaveLength(1);
});

test('skipping the Agent Studio step leaves the wizard working as before', async ({ page }) => {
  const state = await installStudioFlow(page);
  await login(page);
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Skip this step' }).click();
  await expect(page.getByTestId('wizard-studio')).toBeVisible();
  await page.getByTestId('wizard-skip-studio').click();
  await expect(page.locator('.wizard-steps li.active')).toHaveText('Sample agent');
  await page.locator('.modal-footer').getByRole('button', { name: 'Apply' }).click();
  await expect(page.locator('.wizard-steps li.active')).toHaveText('Test run');
  expect(state.architectBodies).toEqual([]);
});

test('end to end: wizard architect, two-agent app built by the architect, apply, live in dev, promote to staging, roll back', async ({ page }) => {
  const state = await installStudioFlow(page);
  await login(page);

  // 1. The setup wizard creates the architect with the guided prompt.
  await expect(page.locator('.wizard-steps')).toBeVisible();
  await page.getByRole('button', { name: 'Start' }).click();
  await page.getByRole('button', { name: 'Skip this step' }).click();
  await page.getByTestId('architect-prompt').selectOption('pt_builtin_agent_architect_guided');
  await expect(page.getByTestId('wizard-studio')).toContainText('One question at a time for first-time builders');
  await page.getByTestId('architect-model').fill('opus');
  await page.getByTestId('wizard-create-architect').click();
  await expect(page.locator('.toast').filter({ hasText: 'Agent architect architect created.' })).toBeVisible();
  expect(state.architectBodies).toEqual([{ name: 'architect', harnessProfileId: 'hp_0001', model: 'opus', architectPromptTemplateId: 'pt_builtin_agent_architect_guided' }]);
  await page.getByRole('button', { name: 'Skip setup' }).click();
  await expect(page.locator('.modal')).toHaveCount(0);

  // 2. A new draft; the architect builds a two-agent app over two turns.
  await page.goto(STUDIO);
  await page.getByTestId('add-button').click();
  await page.getByTestId('studio-draft-title').fill('Docs app');
  await page.getByTestId('studio-new-draft-create').click();
  await expect(page).toHaveURL(new RegExp(`/dashboard/studio/${FLOW_DRAFT_ID}$`));
  await expect(page.getByTestId('studio-architect')).toHaveValue('dep_arch');
  await page.getByTestId('studio-chat-message').fill('Build an app with a planner that hands outlines to a writer.');
  await page.getByTestId('studio-chat-send').click();
  await expect(page.getByTestId('studio-chat-answer').first()).toContainText('I added a planner and a writer');
  await expect(page.getByTestId('studio-draft-version')).toHaveText('Version 2');
  await page.getByTestId('studio-chat-message').fill('Now put them in an app called docs.');
  await page.getByTestId('studio-chat-send').click();
  await expect(page.getByTestId('studio-chat-answer').nth(1)).toContainText('I added the docs app');
  await expect(page.getByTestId('studio-draft-version')).toHaveText('Version 3');
  expect(state.invokes).toEqual([
    { input: 'Build an app with a planner that hands outlines to a writer.', deploymentId: 'dep_arch', startConversation: true, studioDraftId: FLOW_DRAFT_ID },
    { input: 'Now put them in an app called docs.', conversationId: 'cnv_docs' }
  ]);
  await page.getByRole('tab', { name: 'Items' }).click();
  const items = page.getByTestId('studio-items-table');
  await expect(items.locator('tbody tr')).toHaveCount(7);
  await expect(items.locator('tr[data-item="AgenticApp/docs"]')).toBeVisible();
  await expect(items.locator('tr[data-item="Agent/planner"]')).toBeVisible();
  await expect(items.locator('tr[data-item="Agent/writer"]')).toBeVisible();

  // The Release tab says the app is not live before the draft is applied.
  await page.getByRole('tab', { name: 'Release' }).click();
  await expect(page.getByTestId('studio-release-not-live')).toContainText('docs is not live yet');

  // 3. Request apply and allow the DraftApply inline.
  await page.getByRole('tab', { name: 'Diff and apply' }).click();
  await expect(page.getByTestId('studio-diff-table').locator('tr[data-diff="AgenticApp/docs"]')).toContainText('Create');
  await page.getByTestId('studio-request-apply').click();
  await expect(page.getByTestId('studio-approval')).toContainText('Pending');
  expect(state.applyRequests).toEqual([{ version: 3 }]);
  await page.locator('#studio-decide-reason').fill('Ship it to dev');
  await page.getByTestId('studio-approval-allow').click();
  await expect(page.getByTestId('studio-approval')).toContainText('Approved');
  await expect(page.getByTestId('studio-applied')).toBeVisible();
  expect(state.decisions).toEqual([{ decision: 'Allow', reason: 'Ship it to dev' }]);

  // 4. The app is live in dev, with its URL.
  await page.getByRole('tab', { name: 'Release' }).click();
  const release = page.getByTestId('app-release');
  await expect(release).toHaveAttribute('data-app', 'docs');
  await expect(release.getByTestId('app-url')).toHaveAttribute('data-url', /\/apps\/docs\/$/);
  await expect(release.getByTestId('app-open-link')).toHaveAttribute('href', /\/apps\/docs\/$/);
  await expect(page.getByTestId('app-release-live')).toHaveText('Live in dev');
  const matrix = page.getByTestId('app-release-matrix');
  await expect(matrix.locator('tbody tr')).toHaveCount(2);
  const planner = matrix.locator('tr[data-member="planner"]');
  await expect(planner).toContainText('Entry');
  await expect(planner.locator('td[data-environment="dev"]')).toContainText('planner-dev');
  await expect(planner.locator('td[data-environment="dev"]')).toContainText('LOG_LEVEL=debug');
  await expect(planner.locator('td[data-environment="staging"] [data-pin]')).toHaveAttribute('data-pin', 'latest');
  await expect(planner.locator('td[data-cell="difference"]')).toHaveText('Overrides differ');
  await expect(page.getByTestId('app-release-history-empty')).toBeVisible();

  // 5. Promote dev to staging.
  await expect(page.getByTestId('app-release-promote')).toHaveText('Promote dev to staging');
  await page.getByTestId('app-release-promote').click();
  await page.locator('#app-promote-note').fill('First staging release');
  await page.getByTestId('app-promote-submit').click();
  await expect(page.getByTestId('app-promote-submit')).toHaveCount(0);
  expect(state.promotions).toEqual([{ sourceEnvironment: 'dev', targetEnvironment: 'staging', note: 'First staging release' }]);
  const history = page.getByTestId('app-release-history');
  await expect(history.locator('tbody tr')).toHaveCount(1);
  await expect(history.locator('tr[data-promotion="pro_0100"]')).toHaveAttribute('data-outcome', 'Applied');
  await expect(history.locator('tr[data-promotion="pro_0100"]')).toContainText('dev to staging');
  await expect(planner.locator('td[data-environment="staging"] [data-pin]')).toHaveAttribute('data-pin', '1');
  await expect(planner.locator('td[data-cell="difference"]')).toHaveText('Revisions and overrides differ');

  // ... and roll it back from the history.
  await history.locator('tr[data-promotion="pro_0100"]').getByTestId('app-release-rollback').click();
  await page.getByTestId('app-release-rollback-note').fill('Wrong prompt');
  await page.locator('.modal').getByRole('button', { name: 'Roll back' }).click();
  await expect(history.locator('tbody tr')).toHaveCount(2);
  await expect(history.locator('tr[data-promotion="pro_0100"]')).toHaveAttribute('data-outcome', 'RolledBack');
  await expect(history.locator('tr[data-promotion="pro_0101"]')).toHaveAttribute('data-kind', 'Rollback');
  await expect(history.locator('tr[data-promotion="pro_0100"]').getByTestId('app-release-rollback')).toHaveCount(0);
  await expect(planner.locator('td[data-environment="staging"] [data-pin]')).toHaveAttribute('data-pin', 'latest');
  expect(state.rollbacks).toEqual([{ note: 'Wrong prompt' }]);
});

test('promote and rollback stay visible but disabled, with the reason, without Execute on Promotion for the target', async ({ page }) => {
  await page.route(/\/v1\.0\/token\/details$/, (route) => route.fulfill(json(200, { ...PRINCIPAL, isAdmin: false, isTenantAdmin: false })));
  await page.route(/\/users\/usr_admin\/permissions$/, (route) =>
    route.fulfill(
      json(200, {
        principalType: 'User',
        principalId: 'usr_admin',
        tenantId: 'default',
        isAdmin: false,
        isTenantAdmin: false,
        grants: [
          { source: 'Builder', permissionType: 'Permit', resourceTypes: ['AgenticApp', 'Agent', 'Deployment', 'StudioDraft'], operations: ['Read'], scope: 'Tenant', inheritsToChildren: true },
          { source: 'Releaser', permissionType: 'Permit', resourceTypes: ['Promotion'], operations: ['Execute'], scope: 'Resource', resourceId: 'prod', inheritsToChildren: false }
        ],
        hasPermission: []
      })
    )
  );
  let changed = 0;
  page.on('request', (r) => {
    if (/\/(promote|rollback)$/.test(new URL(r.url()).pathname)) changed += 1;
  });
  await login(page);

  // Agents > Apps, row action Environments.
  await page.goto('/dashboard/agents?tab=apps');
  await page.locator('.data-table tbody tr', { has: page.locator('strong', { hasText: /^research$/ }) }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: /^Environments$/ }).click();
  const promote = page.getByTestId('app-release-promote');
  await expect(promote).toHaveText('Promote dev to staging');
  await expect(promote).toHaveAttribute('aria-disabled', 'true');
  await expect(promote).toHaveAttribute('data-tip', 'You need Execute permission on Promotion for staging to do this. Ask an administrator for the Releaser role.');
  await promote.hover();
  await expect(page.locator('.tooltip')).toContainText('Execute permission on Promotion for staging');
  await promote.click({ force: true });
  await expect(page.getByTestId('app-promote-submit')).toHaveCount(0);
  // The per-environment difference: agent-2 has no staging deployment, so a promotion would move nothing.
  await expect(page.locator('tr[data-member="agent-2"] td[data-cell="difference"]')).toHaveText('No deployment in staging');
  await expect(page.getByTestId('app-release-missing')).toContainText('agent-2');
  const rollback = page.locator('tr[data-promotion="pro_0010"]').getByTestId('app-release-rollback');
  await expect(rollback).toHaveAttribute('aria-disabled', 'true');
  await expect(rollback).toHaveAttribute('data-tip', /Execute permission on Promotion for staging/);
  await rollback.click({ force: true });
  await expect(page.getByTestId('app-release-rollback-note')).toHaveCount(0);
  // Promoting to prod is allowed: choosing staging to prod enables the action.
  await page.getByTestId('app-release-source').selectOption('staging');
  await expect(promote).toHaveText('Promote staging to prod');
  await expect(promote).not.toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');

  // The studio's Release tab for the research draft says the same.
  await page.goto(`${DRAFT}?tab=release`);
  await expect(page.getByTestId('app-release')).toHaveAttribute('data-app', 'research');
  await expect(page.getByTestId('app-release-promote')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.getByTestId('app-release-promote')).toHaveAttribute('data-tip', /Execute permission on Promotion for staging/);
  expect(changed).toBe(0);
});
