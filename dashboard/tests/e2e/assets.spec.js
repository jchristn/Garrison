// Agent assets (AD2.8) against mocked APIs: the Assets page under Configuration (list, create, the SystemPrompt
// template field), the version dialog (history, files with shortened digests, a text preview), uploading a version from
// a file input (new version and identical upload, 413 and 400 refusals), pinning assets on an agent draft (and starting
// a draft from the latest published revision), and the AssetInUse refusal on delete.

import { test, expect } from '@playwright/test';
import { installMocks, agentAsset, agentAssetVersion, agentRevision, respond } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
const ASSETS = '/dashboard/configuration?tab=agent-assets';

async function openVersions(page, name) {
  await page.locator('.data-table tbody tr', { hasText: name }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Versions' }).click();
  await expect(page.getByTestId('asset-versions')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('lists assets and creates one, then opens its version dialog', async ({ page }) => {
  let body = null;
  await page.route(/\/agent-assets$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill(json(201, { ...agentAsset(9), ...body, id: 'aas_0009', currentVersion: 0 }));
  });
  await page.route(/\/agent-assets\/aas_0009\/versions$/, (route) => route.fulfill(json(200, [])));
  await login(page);
  await page.goto(ASSETS);
  const rows = page.locator('.data-table tbody tr');
  await expect(rows).toHaveCount(4);
  await expect(rows.filter({ hasText: 'style-guide' })).toContainText('Reference file');
  await expect(rows.filter({ hasText: 'style-guide' }).locator('[data-cell="currentVersion"]')).toHaveText('v2');
  await expect(rows.filter({ hasText: 'system-voice' }).locator('[data-cell="currentVersion"]')).toHaveText('No versions');
  await expect(rows.filter({ hasText: 'style-guide' })).toContainText('Garrison database');

  await page.getByTestId('add-button').click();
  const modal = page.locator('.modal');
  // A system prompt asset names its prompt template and has no artifact store.
  await modal.locator('#agentAssets-kind').selectOption('SystemPrompt');
  await expect(modal.locator('#agentAssets-promptTemplateId')).toBeVisible();
  await expect(modal.locator('#agentAssets-artifactStoreId')).toHaveCount(0);
  await modal.locator('#agentAssets-kind').selectOption('ReferenceFile');
  await expect(modal.locator('#agentAssets-promptTemplateId')).toHaveCount(0);
  await modal.locator('#agentAssets-name').fill('onboarding-notes');
  await modal.locator('#agentAssets-artifactStoreId').selectOption('as_0001');
  await modal.locator('#agentAssets-description').fill('What new agents should read first');
  await modal.getByTestId('save-button').click();
  await expect.poll(() => body).toEqual({ name: 'onboarding-notes', kind: 'ReferenceFile', description: 'What new agents should read first', promptTemplateId: null, artifactStoreId: 'as_0001', tags: [] });
  await expect(page.locator('.toast-success')).toBeVisible();
  // The new asset opens in its version dialog, ready for its first upload.
  await expect(page.getByTestId('asset-versions-empty')).toBeVisible();
  await expect(page.getByTestId('asset-upload')).toBeVisible();
});

test('shows version history, files, and a text preview', async ({ page }) => {
  await login(page);
  await page.goto(ASSETS);
  await openVersions(page, 'style-guide');
  const versions = page.locator('[data-testid="asset-version-list"] tbody tr');
  await expect(versions).toHaveCount(2);
  await expect(versions.nth(0)).toHaveAttribute('data-version', '2');
  await expect(versions.nth(0)).toContainText('Current');
  await expect(versions.nth(0)).toContainText('Adds the logo');
  await expect(versions.nth(0)).toContainText('admin@garrison');
  const files = page.getByTestId('asset-file-list');
  await expect(files.locator('tbody tr')).toHaveCount(2);
  await expect(files.locator('[data-file="guide.md"]')).toContainText('text/markdown');
  await expect(files.locator('[data-file="guide.md"]')).toContainText('bbbbbbbbbbbb...');
  // Binary files can be downloaded but not previewed.
  await expect(files.locator('[data-file="images/logo.png"]').getByTestId('asset-file-preview-button')).toHaveCount(0);
  await expect(files.locator('[data-file="images/logo.png"]').getByTestId('asset-file-download')).toBeVisible();

  let previewUrl = null;
  page.on('request', (r) => {
    if (r.url().includes('/versions/2/files')) previewUrl = r.url();
  });
  await files.locator('[data-file="guide.md"]').getByTestId('asset-file-preview-button').click();
  await expect(page.getByTestId('asset-file-preview')).toContainText('Write short sentences.');
  expect(new URL(previewUrl).searchParams.get('path')).toBe('guide.md');

  // Version 1 has its own files.
  await versions.nth(1).getByTestId('asset-version-files').click();
  await expect(page.getByTestId('asset-version-detail')).toHaveAttribute('data-version', '1');
  await expect(page.getByTestId('asset-file-list').locator('tbody tr')).toHaveCount(1);
  await expect(page.getByTestId('asset-file-preview')).toHaveCount(0);
});

test('uploads a version from a file input with an edited path, then an identical upload', async ({ page }) => {
  const bodies = [];
  let created = true;
  await page.route(/\/agent-assets\/aas_0001\/versions$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    bodies.push(route.request().postDataJSON());
    const status = created ? 201 : 200;
    const version = created ? { ...agentAssetVersion('aas_0001', 3), changeNote: 'Adds onboarding notes' } : agentAssetVersion('aas_0001', 2);
    created = false;
    return route.fulfill(json(status, version));
  });
  await login(page);
  await page.goto(ASSETS);
  await openVersions(page, 'style-guide');
  const content = '# Notes\n\nRead this first.\n';
  await page.getByTestId('asset-upload-input').setInputFiles([{ name: 'notes.md', mimeType: 'text/markdown', buffer: Buffer.from(content) }]);
  await expect(page.getByTestId('asset-upload-path')).toHaveValue('notes.md');
  await page.getByTestId('asset-upload-path').fill('docs/notes.md');
  await page.getByTestId('asset-upload-note').fill('Adds onboarding notes');
  await page.getByTestId('asset-upload-submit').click();
  await expect.poll(() => bodies.length).toBe(1);
  expect(bodies[0]).toEqual({ files: [{ path: 'docs/notes.md', mediaType: 'text/markdown', contentBase64: Buffer.from(content).toString('base64') }], changeNote: 'Adds onboarding notes' });
  await expect(page.getByTestId('asset-upload-result')).toHaveText('Created version 3.');
  await expect(page.getByTestId('asset-upload-result')).toHaveAttribute('data-created', 'true');
  // The form is cleared for the next upload.
  await expect(page.getByTestId('asset-upload-path')).toHaveCount(0);

  await page.getByTestId('asset-upload-input').setInputFiles([{ name: 'guide.md', mimeType: 'text/markdown', buffer: Buffer.from('# Style guide\n') }]);
  await page.getByTestId('asset-upload-submit').click();
  await expect(page.getByTestId('asset-upload-result')).toContainText('same as the current version 2, so no new version was created');
  await expect(page.getByTestId('asset-upload-result')).toHaveAttribute('data-created', 'false');
});

test('shows upload refusals with the limiting setting or the field', async ({ page }) => {
  const answers = [
    json(413, { error: 'PayloadTooLarge', code: 'AssetFileTooLarge', setting: 'Assets.MaxFileBytes', message: 'File big.bin is 99 bytes; the limit is 10 bytes (Assets.MaxFileBytes).' }),
    json(400, { error: 'ValidationFailed', code: 'ValidationFailed', message: 'The asset files are invalid.', fields: { 'files[0].path': 'Use a relative path.' }, fieldCodes: { 'files[0].path': 'InvalidAssetPath' } })
  ];
  await page.route(/\/agent-assets\/aas_0001\/versions$/, (route) => (route.request().method() === 'POST' ? route.fulfill(answers.shift()) : route.fallback()));
  await login(page);
  await page.goto(ASSETS);
  await openVersions(page, 'style-guide');
  await page.getByTestId('asset-upload-input').setInputFiles([{ name: 'big.bin', mimeType: 'application/octet-stream', buffer: Buffer.from('0123456789ABCDEF') }]);
  await page.getByTestId('asset-upload-submit').click();
  await expect(page.getByTestId('asset-upload-error')).toContainText('File big.bin is 99 bytes; the limit is 10 bytes (Assets.MaxFileBytes).');
  await expect(page.getByTestId('asset-upload-error')).toContainText('The limit is set by the Assets.MaxFileBytes server setting.');

  await page.getByTestId('asset-upload-path').fill('../escape.bin');
  await page.getByTestId('asset-upload-submit').click();
  await expect(page.getByTestId('asset-upload-file-error')).toContainText('Use a relative path with forward slashes');
  // Duplicate paths are caught before anything is sent.
  await page.getByTestId('asset-upload-input').setInputFiles([{ name: 'escape.bin', mimeType: 'application/octet-stream', buffer: Buffer.from('x') }]);
  await page.getByTestId('asset-upload-path').nth(1).fill('../escape.bin');
  await page.getByTestId('asset-upload-submit').click();
  await expect(page.locator('[data-upload-file="1"] [data-testid="asset-upload-file-error"]')).toContainText('same path');
  expect(answers).toHaveLength(0);
});

test('pins assets on the agent draft and saves the complete draft', async ({ page }) => {
  let body = null;
  await page.route(/\/agents\/agt_0001\/revisions$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill(json(201, { ...agentRevision('agt_0001', 3), assetPins: body.assetPins }));
  });
  await login(page);
  await page.goto('/dashboard/agents/agt_0001');
  await page.getByRole('tab', { name: 'Revisions' }).click();
  const draftPins = page.locator('[data-revision="3"] [data-cell="assetPins"]');
  await expect(draftPins).toContainText('review-skill (current)');
  await expect(draftPins).toContainText('style-guide v2');
  await expect(page.locator('[data-revision="1"] [data-cell="assetPins"]')).toHaveText('-');
  // The diff lists the pin the draft adds.
  await expect(page.locator('[data-testid="revision-diff"] [data-field="assetPins"]')).toContainText('aas_0001@2');

  await page.locator('[data-revision="3"]').getByTestId('revision-assets').click();
  const modal = page.locator('.modal');
  await expect(modal.getByTestId('asset-pins-source')).toContainText('draft revision 3');
  await expect(modal.getByTestId('asset-pin-asset')).toHaveCount(2);
  await expect(modal.getByTestId('asset-pins-save')).toBeDisabled();
  // Drop review-skill, move style-guide to follow its current version, and pin contract-template at version 1.
  await modal.getByTestId('asset-pin-remove').first().click();
  await modal.getByTestId('asset-pin-version').first().selectOption('');
  await modal.getByTestId('asset-pin-add').click();
  await modal.getByTestId('asset-pin-asset').last().selectOption('aas_0004');
  await expect(modal.getByTestId('asset-pin-version').last().locator('option[value="1"]')).toHaveCount(1);
  await modal.getByTestId('asset-pin-version').last().selectOption('1');
  await modal.getByTestId('asset-pins-save').click();
  await expect.poll(() => body).not.toBeNull();
  expect(body.assetPins).toEqual([
    { assetId: 'aas_0001', version: null },
    { assetId: 'aas_0004', version: 1 }
  ]);
  // The rest of the draft is sent unchanged, without server-owned fields.
  expect(body.description).toBe('Sample agent that also summarizes');
  expect(body.promptPins).toEqual(agentRevision('agt_0001', 3).promptPins);
  for (const key of ['id', 'state', 'number', 'contentHash', 'createdUtc']) expect(body).not.toHaveProperty(key);
  await expect(page.locator('.toast-success')).toContainText('Saved the asset pins on draft revision 3.');
  await expect(page.locator('.modal')).toHaveCount(0);
});

test('starts a new draft with asset pins from the latest published revision', async ({ page }) => {
  let body = null;
  await page.route(/\/agents\/agt_0002\/revisions$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill(json(201, { ...agentRevision('agt_0002', 3), state: 'Draft', assetPins: body.assetPins }));
  });
  await login(page);
  // agent-2 has published revisions 1 and 2 and no open draft.
  const agent2 = respond('GET', new URL('http://127.0.0.1/v1.0/api/tenants/default/agents?maxResults=25&skip=0')).objects.find((a) => a.id === 'agt_0002');
  expect(agent2.draftRevisionId).toBeUndefined();
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/agents\/agt_0002$/, (route) => (route.request().method() === 'GET' ? route.fulfill(json(200, agent2)) : route.fallback()));
  await page.goto('/dashboard/agents/agt_0002');
  await page.getByRole('tab', { name: 'Revisions' }).click();
  await page.getByTestId('revision-assets-new').click();
  const modal = page.locator('.modal');
  await expect(modal.getByTestId('asset-pins-source')).toContainText('new draft from published revision 2');
  await modal.getByTestId('asset-pin-add').click();
  await modal.getByTestId('asset-pin-asset').last().selectOption('aas_0001');
  await modal.getByTestId('asset-pin-version').last().selectOption('2');
  await modal.getByTestId('asset-pins-save').click();
  await expect.poll(() => body).not.toBeNull();
  expect(body.assetPins).toEqual([
    { assetId: 'aas_0002', version: null },
    { assetId: 'aas_0001', version: 2 }
  ]);
  expect(body.description).toBe(agentRevision('agt_0002', 2).description);
  expect(body).not.toHaveProperty('changeNote');
  expect(body).not.toHaveProperty('publishedUtc');
});

test('explains the AssetInUse refusal when deleting a pinned asset', async ({ page }) => {
  let deleted = 0;
  await page.route(/\/agent-assets\/aas_0001$/, (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback();
    deleted += 1;
    return route.fulfill(json(409, { error: 'Conflict', code: 'AssetInUse', message: 'Asset style-guide is pinned by revisions of echo-agent, agent-2. Remove it from those revisions first.' }));
  });
  await login(page);
  await page.goto(ASSETS);
  await page.locator('.data-table tbody tr', { hasText: 'style-guide' }).locator('.action-menu-trigger').click();
  await page.locator('.action-menu-dropdown [role="menuitem"]', { hasText: 'Delete' }).click();
  await page.locator('.modal').getByRole('button', { name: 'Delete' }).click();
  await expect.poll(() => deleted).toBe(1);
  await expect(page.locator('.toast-error')).toContainText('Asset style-guide is pinned by revisions of these agents: echo-agent, agent-2. Remove it from those revisions first.');
  await expect(page.locator('.data-table tbody tr', { hasText: 'style-guide' })).toHaveCount(1);
});
