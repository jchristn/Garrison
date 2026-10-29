// Conversation file spaces (AD3.8) against mocked APIs: the Files tab on Conversation detail (list, deep link, deleted
// files, empty state), the version dialog (writer, text preview, per-version download), uploads with base versions and
// a conflict, delete with confirmation, live refresh over the conversation-files WebSocket channel, the run's file
// space link, and the deployment's file space folder.

import { test, expect } from '@playwright/test';
import { installMocks, conversationFiles, conversationFile } from './mocks.js';

async function login(page) {
  await page.goto('/');
  await page.locator('#tenantId').fill('default');
  await page.locator('#email').fill('admin@garrison');
  await page.locator('#password').fill('password');
  await page.getByTestId('login-submit').click();
  await expect(page.locator('.dashboard')).toBeVisible();
}

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });
const FILES = '/dashboard/conversations/cnv_0001?tab=files';

test.use({ actionTimeout: 15000 });

test.beforeEach(async ({ page }) => {
  page.on('dialog', (dialog) => {
    throw new Error(`Native dialog used: ${dialog.message()}`);
  });
  await installMocks(page);
});

test('the Files tab lists the shared files, shows deleted ones on request, and has an empty state', async ({ page }) => {
  await login(page);
  await page.goto('/dashboard/conversations/cnv_0001');
  await expect(page.getByTestId('conversation-turns')).toBeVisible();
  await page.getByRole('tab', { name: 'Files' }).click();
  await expect(page).toHaveURL(/tab=files/);
  const rows = page.locator('[data-testid="file-list"] tbody tr');
  await expect(rows).toHaveCount(3);
  await expect(page.locator('[data-file="notes/sources.md"]')).toContainText('v2');
  await expect(page.locator('[data-file="notes/sources.md"]')).toContainText('text/markdown');
  await expect(page.getByTestId('files-space-id')).toContainText('cfs_0001');
  await expect(page.getByTestId('files-live')).toHaveText('Polling');

  await page.getByTestId('files-include-deleted').check();
  await expect(rows).toHaveCount(4);
  await expect(page.locator('[data-file="old/draft.md"]')).toHaveAttribute('data-deleted', 'true');
  await expect(page.locator('[data-file="old/draft.md"]').getByTestId('file-delete')).toHaveCount(0);

  // A conversation whose space was never created.
  await page.goto('/dashboard/conversations/cnv_0003?tab=files');
  await expect(page.getByTestId('files-empty')).toContainText('No files yet');
  await expect(page.getByTestId('file-upload')).toBeVisible();
});

test('the version dialog shows writers, previews text, and downloads a version through its link', async ({ page }) => {
  // The link the server issues points at /v1.0/file-download, which a browser download fetches outside page routing,
  // so this test answers with a data URL carrying the same bytes.
  const linkRequests = [];
  await page.route(/\/files\/download-url\?/, (route) => {
    linkRequests.push(new URL(route.request().url()));
    return route.fulfill(json(200, { url: `data:text/markdown;base64,${Buffer.from('# Sources').toString('base64')}`, expiresUtc: '2026-10-28T00:05:00Z' }));
  });
  await login(page);
  await page.goto(FILES);
  await page.locator('[data-file="notes/sources.md"]').getByTestId('file-versions-button').click();
  const dialog = page.getByTestId('file-versions');
  await expect(dialog).toBeVisible();
  const versions = dialog.locator('[data-testid="file-version-list"] tbody tr');
  await expect(versions).toHaveCount(2);
  await expect(versions.nth(0)).toContainText('Current');
  await expect(versions.nth(0).getByTestId('file-version-writer')).toContainText('echo-agent');
  await expect(versions.nth(0).getByTestId('file-version-run')).toHaveText('run_0042');
  await expect(versions.nth(1).getByTestId('file-version-writer')).toHaveText('admin@garrison');

  await versions.nth(1).getByTestId('file-version-preview-button').click();
  await expect(page.getByTestId('file-preview-text')).toHaveText('# Sources\n\n- https://example.com');

  const download = page.waitForEvent('download');
  await versions.nth(1).getByTestId('file-version-download').click();
  expect((await download).suggestedFilename()).toBe('sources.md');
  expect(linkRequests[0].searchParams.get('path')).toBe('notes/sources.md');
  expect(linkRequests[0].searchParams.get('version')).toBe('1');

  // The writing run opens Run detail.
  await versions.nth(0).getByTestId('file-version-run').click();
  await expect(page).toHaveURL(/\/dashboard\/runs\/run_0042/);
  await expect(page.getByTestId('run-file-space')).toContainText('cfs_0001');
  await page.getByTestId('run-file-space-link').click();
  await expect(page).toHaveURL(/\/dashboard\/conversations\/cnv_0001\?tab=files/);
  await expect(page.getByTestId('file-list')).toBeVisible();
});

test('uploads send the listed version as the base and report a conflict', async ({ page }) => {
  const bodies = [];
  await page.route(/\/conversations\/cnv_0001\/files$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    const body = route.request().postDataJSON();
    bodies.push(body);
    if (body.path === 'notes/sources.md') return route.fulfill(json(201, { requestedPath: body.path, path: 'notes/sources.user-mv3k2a1b.md', version: 1, conflict: true, sha256: 'a'.repeat(64) }));
    return route.fulfill(json(201, { requestedPath: body.path, path: body.path, version: 1, conflict: false, sha256: 'b'.repeat(64) }));
  });
  await login(page);
  await page.goto(FILES);
  await page.getByTestId('file-upload-input').setInputFiles([
    { name: 'sources.md', mimeType: 'text/markdown', buffer: Buffer.from('# Mine') },
    { name: 'todo.txt', mimeType: 'text/plain', buffer: Buffer.from('- ship it') }
  ]);
  const paths = page.getByTestId('file-upload-path');
  await expect(paths).toHaveCount(2);
  await paths.nth(0).fill('notes/sources.md');
  await expect(page.getByTestId('file-upload-base').nth(0)).toHaveText('Version 2');
  await expect(page.getByTestId('file-upload-base').nth(1)).toHaveText('New file');
  await page.getByTestId('file-upload-submit').click();

  await expect(page.getByTestId('file-upload-conflict')).toContainText('notes/sources.md changed after the list loaded, so your upload was kept as notes/sources.user-mv3k2a1b.md.');
  await expect(page.getByTestId('file-upload-result')).toContainText('Added todo.txt as version 1.');
  expect(bodies).toEqual([
    { path: 'notes/sources.md', contentBase64: Buffer.from('# Mine').toString('base64'), baseVersion: 2, mediaType: 'text/markdown' },
    { path: 'todo.txt', contentBase64: Buffer.from('- ship it').toString('base64'), baseVersion: 0, mediaType: 'text/plain' }
  ]);
  await expect(page.getByTestId('file-upload-path')).toHaveCount(0);
});

test('a refused upload stays in the list with the reason and the setting', async ({ page }) => {
  await page.route(/\/conversations\/cnv_0001\/files$/, (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    return route.fulfill(json(413, { code: 'FileSpaceFull', setting: 'FileSpaces.MaxTotalBytes', message: 'The file space would hold more than 1048576 bytes (FileSpaces.MaxTotalBytes).' }));
  });
  await login(page);
  await page.goto(FILES);
  await page.getByTestId('file-upload-input').setInputFiles([{ name: 'big.bin', mimeType: 'application/octet-stream', buffer: Buffer.alloc(16) }]);
  await page.getByTestId('file-upload-submit').click();
  await expect(page.getByTestId('file-upload-error')).toHaveText('The file space would hold more than 1048576 bytes (FileSpaces.MaxTotalBytes). The limit is set by the FileSpaces.MaxTotalBytes server setting.');
  await expect(page.getByTestId('file-upload-path')).toHaveValue('big.bin');
});

test('delete asks first and sends the path', async ({ page }) => {
  const deletes = [];
  page.on('request', (r) => {
    if (r.method() === 'DELETE' && r.url().includes('/files')) deletes.push(new URL(r.url()));
  });
  await login(page);
  await page.goto(FILES);
  await page.locator('[data-file="report.json"]').getByTestId('file-delete').click();
  const modal = page.locator('.modal');
  await expect(modal).toContainText('Delete report.json from the shared files?');
  await modal.getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('.toast-success')).toContainText('Deleted report.json. Its versions are kept.');
  expect(deletes[0].pathname).toMatch(/\/conversations\/cnv_0001\/files$/);
  expect(deletes[0].searchParams.get('path')).toBe('report.json');
});

test('the list refreshes when the conversation-files channel reports a change', async ({ page }) => {
  let added = false;
  let socket = null;
  await page.routeWebSocket(/\/v1\.0\/ws/, (ws) => {
    ws.onMessage((message) => {
      const data = JSON.parse(String(message));
      if (data.type === 'subscribe' && data.channel === 'conversation-files:cnv_0001') {
        socket = ws;
        ws.send(JSON.stringify({ type: 'subscribed', channel: data.channel }));
      }
    });
  });
  await page.route(/\/conversations\/cnv_0001\/files\?/, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    const listing = conversationFiles('cnv_0001');
    if (added) listing.files.push({ ...conversationFile('report.json'), id: 'cfl_0099', path: 'summary.md', mediaType: 'text/markdown', currentVersion: 1 });
    return route.fulfill(json(200, listing));
  });
  await login(page);
  await page.goto(FILES);
  await expect(page.getByTestId('files-live')).toHaveText('Live');
  await expect(page.locator('[data-testid="file-list"] tbody tr')).toHaveCount(3);
  added = true;
  socket.send(JSON.stringify({ type: 'files.changed', conversationId: 'cnv_0001', fileSpaceId: 'cfs_0001', changed: [{ path: 'summary.md', version: 1, deleted: false, sha256: 'c'.repeat(64), sizeBytes: 22 }] }));
  await expect(page.locator('[data-file="summary.md"]')).toBeVisible();
});

test('the deployment form edits the file space folder and sends it', async ({ page }) => {
  let body = null;
  await page.route(/\/v1\.0\/api\/tenants\/[^/]+\/deployments\/dep_0001$/, (route) => {
    if (route.request().method() !== 'PUT') return route.fallback();
    body = route.request().postDataJSON();
    return route.fulfill(json(200, { ...body, id: 'dep_0001' }));
  });
  await login(page);
  await page.goto('/dashboard/deployments');
  await page.locator('.data-table tbody tr', { hasText: 'deployment-1' }).getByText('deployment-1', { exact: true }).click();
  await expect(page.locator('.modal')).toBeVisible();
  await page.locator('.modal .stepper-step').nth(3).click();
  const field = page.locator('#deployments-fileSpaceMountPath');
  await expect(field).toHaveValue('files');
  await expect(field).toHaveAttribute('data-tip', /shared file space is synced/);
  await field.fill('shared');
  await page.getByTestId('save-button').click();
  await expect.poll(() => body?.fileSpaceMountPath).toBe('shared');
});
