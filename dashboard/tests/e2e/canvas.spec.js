// Studio canvas (AD8.2 to AD8.6) against a stateful mock of drf_0001 (tests/e2e/canvasMocks.js): two agents and a
// call added by keyboard alone, positions that survive a reload (keyboard and mouse moves), a property edit that shows
// in the diff, the server's field error on an invalid schema, a staging timeout edit that changes only the staging
// deployment, a live deployment brought into the draft, live updates over the studio-draft channel and by polling, and
// stale edits that show the conflict notice and keep the person's edit.

import { test, expect } from '@playwright/test';
import { installMocks } from './mocks.js';
import { graphOf, installCanvasMocks } from './canvasMocks.js';

const GRAPH = '/dashboard/studio/drf_0001?tab=graph';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

/** Press Tab until the element is focused (keyboard only). */
async function tabTo(page, locator, max = 15) {
  for (let i = 0; i < max; i++) {
    if (await locator.evaluate((el) => el === document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  await expect(locator).toBeFocused();
}

const node = (page, name) => page.locator(`.react-flow__node[data-id="${name}"]`);

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('adds two agents and a call by keyboard alone', async ({ page }) => {
  const { state } = await installCanvasMocks(page);
  await login(page);
  await page.goto(GRAPH);
  await expect(node(page, 'planner')).toBeVisible();
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  await expect(page.getByTestId('studio-canvas-summary')).toHaveText('App research has 3 agents. There are 2 calls between them. The entry agent is planner.');

  // From the Graph tab, the keyboard only.
  await page.getByRole('tab', { name: 'Graph' }).focus();
  await tabTo(page, page.getByTestId('studio-canvas-add-agent'));
  await page.keyboard.type('editor');
  await page.keyboard.press('Enter');
  await expect(node(page, 'editor')).toBeFocused();
  await page.keyboard.press('n');
  await expect(page.getByTestId('studio-canvas-add-agent')).toBeFocused();
  await page.keyboard.type('reviewer');
  await page.keyboard.press('Enter');
  await expect(node(page, 'reviewer')).toBeFocused();
  // Back to the editor, start a call with C, move to the reviewer, and finish it with Enter.
  await page.keyboard.press('Shift+Tab');
  await expect(node(page, 'editor')).toBeFocused();
  await page.keyboard.press('c');
  await expect(page.getByTestId('studio-canvas-connect-bar')).toContainText('Connecting from editor');
  await page.keyboard.press('Tab');
  await expect(node(page, 'reviewer')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-call="editor>reviewer"]')).toHaveText('editor calls reviewer, parallel calls allowed, delegation depth 1.');
  await expect(page.getByTestId('studio-canvas-connect-bar')).toHaveCount(0);
  await expect(page.locator('.react-flow__edge[data-edge="editor>reviewer"]')).toHaveCount(1);
  await expect(page.getByTestId('studio-canvas-summary')).toContainText('App research has 5 agents. There are 3 calls between them.');
  await expect(page.getByTestId('studio-edge-panel')).toContainText('Call from editor to reviewer');

  expect(state.operations.map(({ operation, agent, from, to, version }) => ({ operation, agent, from, to, version }))).toEqual([
    { operation: 'AddMember', agent: 'editor', from: undefined, to: undefined, version: 3 },
    { operation: 'AddMember', agent: 'reviewer', from: undefined, to: undefined, version: 4 },
    { operation: 'Connect', agent: undefined, from: 'editor', to: 'reviewer', version: 5 }
  ]);
  expect(state.operations.every((o) => o.app === 'research')).toBe(true);
  await expect(page.getByTestId('studio-draft-version')).toHaveText('Version 6');

  // E makes the focused agent the entry agent; the call list reaches calls by keyboard and F switches fan-out.
  await page.locator('[data-call="editor>reviewer"]').focus();
  await page.keyboard.press('f');
  await expect(page.locator('[data-call="editor>reviewer"]')).toHaveText('editor calls reviewer, one call at a time, delegation depth 1.');
  await expect(page.locator('.react-flow__edge[data-edge="editor>reviewer"]')).toHaveClass(/is-single/);
  expect(state.operations[state.operations.length - 1]).toMatchObject({ operation: 'Connect', from: 'editor', to: 'reviewer', fanOut: false });
});

test('positions survive a reload after keyboard and mouse moves', async ({ page }) => {
  const { state } = await installCanvasMocks(page);
  await login(page);
  await page.goto(GRAPH);
  const planner = node(page, 'planner');
  await expect(planner).toHaveAttribute('style', /translate\(24px, ?24px\)/);

  // Keyboard: select the planner, then Shift+Arrow moves it 20 pixels per press.
  await planner.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Shift+ArrowDown');
  await expect.poll(() => state.layout.find((n) => n.nodeKey === 'Agent/planner')).toEqual({ nodeKey: 'Agent/planner', x: 64, y: 44 });
  // One MoveNode after the pause, not one per key press.
  expect(state.operations.filter((o) => o.operation === 'MoveNode')).toHaveLength(1);

  // Mouse: drag the writer down.
  const writer = node(page, 'writer');
  await page.getByTestId('studio-canvas-research').scrollIntoViewIfNeeded();
  const box = await writer.boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 10, box.y + box.height / 2 + 60, { steps: 8 });
  await page.mouse.up();
  await expect.poll(() => state.layout.some((n) => n.nodeKey === 'Agent/writer')).toBe(true);
  const saved = state.layout.find((n) => n.nodeKey === 'Agent/writer');
  expect(saved.y).toBeGreaterThan(144);

  await page.reload();
  await expect(node(page, 'planner')).toHaveAttribute('style', /translate\(64px, ?44px\)/);
  await expect(node(page, 'writer')).toHaveAttribute('style', new RegExp(`translate\\(${saved.x}px, ?${saved.y}px\\)`));
  expect(graphOf(state).nodes.find((n) => n.name === 'planner')).toMatchObject({ x: 64, y: 44 });
});

test('an agent property edit shows in the diff, and an invalid schema shows the server field error', async ({ page }) => {
  const { state } = await installCanvasMocks(page);
  await login(page);
  await page.goto(GRAPH);
  await node(page, 'writer').click();
  const panel = page.getByTestId('studio-agent-panel');
  await expect(panel).toContainText('Agent writer');
  await expect(page.getByTestId('studio-agent-description')).toHaveValue('Writes the report');
  await expect(page.getByTestId('studio-agent-capabilities')).toHaveValue('pandoc');
  await expect(page.getByTestId('studio-agent-prompts')).toContainText('staging: writer-staging uses writer-system@2');

  await page.getByTestId('studio-agent-description').fill('Writes the final report in Markdown');
  await page.getByTestId('studio-agent-save').click();
  await expect(page.getByTestId('studio-agent-saved')).toContainText('Saved Agent/writer');
  expect(state.puts).toHaveLength(1);
  expect(state.puts[0]).toMatchObject({ kind: 'Agent', name: 'writer', version: 3, operation: 'Upsert' });
  expect(state.puts[0].document).toContain('description: Writes the final report in Markdown');
  expect(state.puts[0].document).toContain('- pandoc');

  // Not JSON: refused in the browser, nothing is sent.
  await page.getByTestId('studio-agent-inputSchema').fill('{type');
  await page.getByTestId('studio-agent-save').click();
  await expect(panel.locator('[data-field-error="studio-agent-inputSchema"]')).toHaveText('This is not valid JSON.');
  expect(state.puts).toHaveLength(1);
  // JSON, but not a valid JSON Schema: the server's check (InvalidJsonSchema) shows on the field.
  await page.getByTestId('studio-agent-inputSchema').fill('{"type": 5}');
  await page.getByTestId('studio-agent-save').click();
  await expect(panel.locator('[data-field-error="studio-agent-inputSchema"]')).toContainText('This is not a valid JSON Schema.');
  await expect(panel.locator('[data-field-error="studio-agent-inputSchema"]')).toContainText('type must be a string');

  await page.getByRole('tab', { name: 'Diff and apply' }).click();
  const row = page.locator('tr[data-diff="Agent/writer"]');
  await expect(row).toContainText('Failed');
  await page.getByRole('tab', { name: 'Graph' }).click();
  await node(page, 'writer').click();
  await page.getByTestId('studio-agent-inputSchema').fill('');
  await page.getByTestId('studio-agent-save').click();
  await expect(page.getByTestId('studio-agent-saved')).toBeVisible();
  await page.getByRole('tab', { name: 'Diff and apply' }).click();
  await expect(row).toContainText('Update');
  await expect(row).toContainText('description');
  await expect(row).toContainText('Writes the final report in Markdown');
});

test('the app panel and edge panel edit the app item and the call', async ({ page }) => {
  const { state } = await installCanvasMocks(page);
  await login(page);
  await page.goto(GRAPH);
  const app = page.getByTestId('studio-app-panel');
  await expect(app).toContainText('App research');
  await expect(page.getByTestId('studio-app-entry')).toHaveValue('planner');
  await page.getByTestId('studio-app-primaryColor').fill('blue');
  await page.getByTestId('studio-app-save').click();
  await expect(app.locator('[data-field-error="studio-app-primaryColor"]')).toHaveText('Use a hex color such as #1F6FEB.');
  await page.getByTestId('studio-app-primaryColor').fill('#1F6FEB');
  await page.getByTestId('studio-app-displayName').fill('Research Desk');
  await page.getByTestId('studio-app-auth').selectOption('Anonymous');
  await page.getByTestId('studio-app-save').click();
  await expect(page.getByTestId('studio-app-saved')).toBeVisible();
  const doc = state.items.find((i) => i.kind === 'AgenticApp').document;
  expect(doc).toContain('authMode: Anonymous');
  expect(doc).toContain('displayName: Research Desk');
  expect(doc).toContain('- agent: writer');

  await page.getByTestId('studio-app-entry').selectOption('researcher');
  await expect(page.getByTestId('studio-canvas-summary')).toContainText('The entry agent is researcher.');
  expect(state.operations[state.operations.length - 1]).toMatchObject({ operation: 'SetEntry', agent: 'researcher' });

  await page.locator('[data-call="planner>writer"]').click();
  const edge = page.getByTestId('studio-edge-panel');
  await expect(page.getByTestId('studio-edge-depth')).toHaveText('1');
  await expect(page.getByTestId('studio-edge-fanout')).not.toBeChecked();
  await page.getByTestId('studio-edge-fanout').check();
  await expect(edge).toContainText('planner may start several calls to writer at once.');
  await page.getByTestId('studio-edge-disconnect').click();
  await expect(page.locator('[data-call="planner>writer"]')).toHaveCount(0);
  expect(state.operations.slice(-2).map((o) => o.operation)).toEqual(['Connect', 'Disconnect']);
});

test('a staging timeout edit changes only the staging deployment item, and a live deployment can be brought in', async ({ page }) => {
  const { state } = await installCanvasMocks(page);
  const devBefore = state.items.find((i) => i.name === 'writer-dev').document;
  await login(page);
  await page.goto(GRAPH);
  await node(page, 'writer').click();
  await page.getByRole('tab', { name: 'Runtime' }).click();
  const runtime = page.getByTestId('studio-runtime-panel');
  await expect(page.getByTestId('studio-runtime-deployment')).toHaveValue('writer-dev');
  await page.getByTestId('studio-runtime-deployment').selectOption('writer-staging');
  await expect(page.getByTestId('studio-runtime-form')).toHaveAttribute('data-deployment', 'writer-staging');
  await expect(page.getByTestId('studio-runtime-system')).toHaveValue('writer-system');
  await expect(page.getByTestId('studio-runtime-system-version')).toHaveValue('2');
  await page.getByTestId('studio-runtime-timeoutSeconds').fill('0');
  await page.getByTestId('studio-runtime-save').click();
  await expect(runtime.locator('[data-field-error="studio-runtime-timeoutSeconds"]')).toHaveText('Use a whole number of 1 or more.');
  await page.getByTestId('studio-runtime-timeoutSeconds').fill('600');
  await page.getByTestId('studio-runtime-save').click();
  await expect(page.getByTestId('studio-runtime-saved')).toContainText('Deployment/writer-staging');

  expect(state.puts).toHaveLength(1);
  expect(state.puts[0]).toMatchObject({ kind: 'Deployment', name: 'writer-staging' });
  expect(state.puts[0].document).toContain('timeoutSeconds: 600');
  expect(state.puts[0].document).toContain('System: writer-system@2');
  expect(state.items.find((i) => i.name === 'writer-dev').document).toBe(devBefore);
  await page.getByRole('tab', { name: 'Diff and apply' }).click();
  await expect(page.locator('tr[data-diff="Deployment/writer-staging"]')).toContainText('timeoutSeconds');
  await expect(page.locator('tr[data-diff="Deployment/writer-dev"]')).toContainText('Unchanged');

  await page.getByRole('tab', { name: 'Graph' }).click();
  await node(page, 'writer').click();
  await page.getByRole('tab', { name: 'Runtime' }).click();
  await expect(page.locator('[data-live-deployment="writer-prod"]')).toContainText('prod: writer-prod');
  await page.getByTestId('studio-runtime-bring-writer-prod').click();
  await expect(page.getByTestId('studio-runtime-deployment')).toHaveValue('writer-prod');
  expect(state.exports).toContainEqual(['Deployment/writer-prod']);
  expect(state.items.find((i) => i.name === 'writer-prod').document).toContain('timeoutSeconds: 900');
  await expect(page.locator('[data-live-deployment="writer-prod"]')).toHaveCount(0);
});

test('a change pushed on the studio-draft channel updates the canvas without a reload', async ({ page }) => {
  let socket = null;
  await page.routeWebSocket(/\/v1\.0\/ws/, (ws) => {
    ws.onMessage((message) => {
      const data = JSON.parse(String(message));
      if (data.type === 'subscribe' && data.channel === 'studio-draft:drf_0001') {
        socket = ws;
        ws.send(JSON.stringify({ type: 'subscribed', channel: data.channel }));
      }
    });
  });
  const { edit, state } = await installCanvasMocks(page);
  await login(page);
  await page.goto(GRAPH);
  await expect(page.getByTestId('studio-live')).toHaveText('Live');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);

  // The architect adds an editor that the writer calls, through its graph tools.
  edit((s) => {
    const app = s.items.find((i) => i.kind === 'AgenticApp');
    app.document = app.document.replace('    - agent: writer\n', '    - agent: writer\n    - agent: editor\n').replace('  authMode:', '    - from: writer\n      to: editor\n  authMode:');
  });
  socket.send(JSON.stringify({ type: 'studio-draft.changed', draftId: 'drf_0001', version: state.version, status: 'Open', changed: [{ kind: 'AgenticApp', name: 'research', operation: 'Upsert', removed: false }], graph: graphOf(state) }));
  await expect(node(page, 'editor')).toBeVisible();
  await expect(page.locator('[data-call="writer>editor"]')).toHaveText('writer calls editor, parallel calls allowed, delegation depth 1.');
  await expect(page.locator('[data-call="planner>writer"]')).toContainText('delegation depth 2');
  await expect(page.getByTestId('studio-live-notice')).toContainText('AgenticApp/research');
  await expect(page.getByTestId('studio-draft-version')).toHaveText('Version 4');
});

test('without the live channel, polling brings someone else’s change to the canvas', async ({ page }) => {
  const { edit } = await installCanvasMocks(page);
  await login(page);
  await page.goto(GRAPH);
  await expect(page.getByTestId('studio-live')).toHaveText('Polling');
  await expect(page.locator('.react-flow__node')).toHaveCount(3);
  edit((s) => {
    const app = s.items.find((i) => i.kind === 'AgenticApp');
    app.document = app.document.replace('    - agent: writer\n', '    - agent: writer\n    - agent: reviewer\n');
  });
  await expect(node(page, 'reviewer')).toBeVisible({ timeout: 12000 });
  await expect(page.getByTestId('studio-canvas-summary')).toContainText('App research has 4 agents.');
});

test('a stale edit shows the conflict notice naming what changed and keeps the pending edit', async ({ page }) => {
  const { state, edit } = await installCanvasMocks(page);
  await login(page);
  await page.goto(GRAPH);
  await node(page, 'writer').click();
  await page.getByTestId('studio-agent-description').fill('Mine');
  // Someone else edits the writer and adds a reviewer while this person types.
  edit((s) => {
    const writer = s.items.find((i) => i.name === 'writer');
    writer.document = writer.document.replace('Writes the report', 'Theirs');
    s.items.push({ kind: 'Agent', name: 'reviewer', operation: 'Upsert', document: 'apiVersion: garrison/v1\nkind: Agent\nmetadata:\n  name: reviewer\nspec: {}\n', lastUpdateUtc: new Date().toISOString() });
  });
  await page.getByTestId('studio-agent-save').click();
  const notice = page.getByTestId('studio-conflict');
  await expect(notice).toBeVisible();
  await expect(notice).toContainText('version 3 is now 4');
  await expect(notice).toContainText('Added: Agent/reviewer');
  await expect(notice).toContainText('Edited: Agent/writer');
  await expect(notice).toContainText('Agent/writer changed too');
  await expect(page.getByTestId('studio-agent-description')).toHaveValue('Mine');
  await expect(page.getByTestId('studio-draft-version')).toHaveText('Version 4');
  expect(state.puts[0].version).toBe(3);

  // Saving again applies the kept edit to the new version.
  await page.getByTestId('studio-agent-save').click();
  await expect(page.getByTestId('studio-agent-saved')).toBeVisible();
  await expect(notice).toHaveCount(0);
  expect(state.puts[1].version).toBe(4);
  expect(state.items.find((i) => i.name === 'writer').document).toContain('description: Mine');

  // A graph operation on a stale version: the notice offers to try again on the new version.
  edit((s) => {
    const app = s.items.find((i) => i.kind === 'AgenticApp');
    app.document = app.document.replace('  authMode: AppUsers', '  authMode: TenantUsers');
  });
  await page.locator('[data-call="planner>researcher"]').click();
  await page.getByTestId('studio-canvas-disconnect').click();
  await expect(notice).toContainText('Edited: AgenticApp/research');
  await expect(notice).toContainText('Disconnecting was not applied');
  await expect(page.locator('[data-call="planner>researcher"]')).toHaveCount(1);
  await page.getByTestId('studio-conflict-retry').click();
  await expect(page.locator('[data-call="planner>researcher"]')).toHaveCount(0);
  await expect(notice).toHaveCount(0);
  const disconnects = state.operations.filter((o) => o.operation === 'Disconnect');
  expect(disconnects.map((o) => o.version)).toEqual([5, 6]);
});

test('a refused operation shows the translated field error', async ({ page }) => {
  await installCanvasMocks(page);
  await page.route(/\/studio\/drafts\/drf_0001\/graph-operations$/, (route) =>
    route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ error: 'BadRequest', code: 'ValidationFailed', message: 'ghost is not a member of app research.', fields: { agent: 'ghost is not a member of app research.' }, fieldCodes: { agent: 'NotAMember' } }) })
  );
  await login(page);
  await page.goto(GRAPH);
  await node(page, 'researcher').click();
  await page.getByTestId('studio-canvas-set-entry').click();
  const error = page.getByTestId('studio-canvas-error');
  await expect(error).toContainText('Setting the entry agent was refused.');
  await expect(error.locator('[data-field-error="agent"]')).toContainText('That agent is not a member of the app.');
});
