// Conversation file spaces (AD3.8): the helpers, the API client routes, the Files tab on Conversation detail (list,
// empty state, deleted files, delete, live refresh over the WebSocket channel and polling without it), the version
// dialog (writer, per-version download, text preview), the upload panel (base versions, conflicts, 413 and 400
// refusals), the deployment's file space folder, the run's file space, and the translated server messages.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import { en, TRANSLATIONS } from '../i18n/resources';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import ConversationFilesPanel from '../components/ConversationFilesPanel';
import ConversationFileUploadPanel from '../components/ConversationFileUploadPanel';
import ConversationFileVersionsModal from '../components/ConversationFileVersionsModal';
import ConversationDetailView from '../views/ConversationDetailView';
import { deploymentsConfig } from '../views/resourceConfigs';
import ApiClient, { ApiError } from '../utils/api';
import { errorMessage } from '../utils/errors';
import { translateServerText } from '../utils/serverText';
import { blobText } from '../utils/assets';
import {
  FILES_POLL_MS,
  FILE_SPACE_LIMIT_SETTINGS,
  baseVersionFor,
  fileLimitSetting,
  fileUploadBody,
  filesChannel,
  isFilesChanged,
  normalizeListing,
  uploadOutcome,
  versionWriter
} from '../utils/fileSpaces';
import { CONVERSATION_FILE_TEXT, conversationFile, conversationFileVersions, conversationFiles, respond } from '../../tests/e2e/mocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

let mounted = [];
afterEach(() => {
  for (const { root, container } of mounted) {
    act(() => root.unmount());
    container.remove();
  }
  mounted = [];
  vi.useRealTimers();
});

function mount(element, { apiClient = {}, addToast = vi.fn(), path = '/' } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <AuthContext.Provider value={{ apiClient, principal: { isAdmin: true } }}>
          <AppContext.Provider value={{ tenantId: 'default', setWizardOpen: () => {}, setTourOpen: () => {} }}>
            <ToastContext.Provider value={{ addToast }}>{element}</ToastContext.Provider>
          </AppContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  });
  mounted.push({ root, container });
  return { container, addToast };
}

function choose(el, value) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function click(el) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

async function pickFiles(input, files) {
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  await act(async () => {
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await flush();
  await flush();
}

/** An apiClient over the e2e mocks for cnv_0001. */
function filesClient(extra = {}) {
  return {
    listConversationFiles: vi.fn(async (_tenant, id, includeDeleted) => conversationFiles(id, includeDeleted)),
    listConversationFileVersions: vi.fn(async (_tenant, _id, path) => conversationFileVersions(path)),
    getConversationFileContent: vi.fn(async (_tenant, _id, path, version) => new Blob([CONVERSATION_FILE_TEXT[path]?.[version ?? conversationFile(path).currentVersion] ?? ''])),
    conversationFileDownloadUrl: vi.fn(async () => ({ url: 'http://127.0.0.1:8700/v1.0/file-download/cfs_0001?ticket=t', expiresUtc: '2026-10-28T00:05:00Z' })),
    deleteConversationFile: vi.fn().mockResolvedValue(null),
    uploadConversationFile: vi.fn(),
    ...extra
  };
}

describe('file space helpers', () => {
  it('normalizes the listing, sorted by path, and handles a conversation without a space', () => {
    const listing = normalizeListing(conversationFiles('cnv_0001', true));
    expect(listing.fileSpaceId).toBe('cfs_0001');
    expect(listing.fileCount).toBe(3);
    expect(listing.files.map((f) => f.path)).toEqual(['images/chart.png', 'notes/sources.md', 'old/draft.md', 'report.json']);
    expect(normalizeListing(null)).toEqual({ fileSpaceId: null, fileCount: 0, totalBytes: 0, files: [] });
    expect(normalizeListing(conversationFiles('cnv_0002')).files).toEqual([]);
  });

  it('sends the listed version as the base, and 0 for new or deleted paths', () => {
    const files = conversationFiles('cnv_0001', true).files;
    expect(baseVersionFor('notes/sources.md', files)).toBe(2);
    expect(baseVersionFor(' report.json ', files)).toBe(1);
    expect(baseVersionFor('old/draft.md', files)).toBe(0);
    expect(baseVersionFor('new.md', files)).toBe(0);
    expect(fileUploadBody({ path: ' a.md ', mediaType: 'text/markdown', contentBase64: 'aGk=' }, 2)).toEqual({ path: 'a.md', contentBase64: 'aGk=', baseVersion: 2, mediaType: 'text/markdown' });
    expect(fileUploadBody({ path: 'b.bin', mediaType: '', contentBase64: 'eA==' }, 0)).toEqual({ path: 'b.bin', contentBase64: 'eA==', baseVersion: 0 });
  });

  it('names limit settings, results, writers, and the live channel', () => {
    for (const [code, setting] of Object.entries(FILE_SPACE_LIMIT_SETTINGS)) expect(fileLimitSetting(new ApiError(413, { code }))).toBe(setting);
    expect(fileLimitSetting(new ApiError(413, { code: 'PayloadTooLarge', message: 'x (FileSpaces.MaxFiles).' }))).toBe('FileSpaces.MaxFiles');
    expect(fileLimitSetting(new ApiError(400, { code: 'FileTooLarge' }))).toBe('');
    expect(uploadOutcome({ path: 'a.md' }, { requestedPath: 'a.md', path: 'a.user-x1.md', version: 1, conflict: true })).toEqual({ requestedPath: 'a.md', path: 'a.user-x1.md', version: 1, conflict: true });
    expect(versionWriter({ runId: 'run_1', writtenBy: 'echo-agent' })).toBe('echo-agent');
    expect(versionWriter({ runId: 'run_1' })).toBe('run_1');
    expect(versionWriter({})).toBe('');
    expect(filesChannel('cnv_1')).toBe('conversation-files:cnv_1');
    expect(isFilesChanged({ type: 'files.changed', conversationId: 'cnv_1', changed: [] }, 'cnv_1')).toBe(true);
    expect(isFilesChanged({ type: 'files.changed', conversationId: 'cnv_2', changed: [] }, 'cnv_1')).toBe(false);
    expect(isFilesChanged({ type: 'run.status' }, 'cnv_1')).toBe(false);
  });

  it('translates the file space refusals in every locale', () => {
    const tooLarge = new ApiError(413, { code: 'FileTooLarge', message: 'File big.bin is 5000 bytes; the limit is 1024 bytes (FileSpaces.MaxFileBytes).' });
    // English server text equals its translation, so the code's message shows; other locales show the translated text.
    expect(errorMessage(t, tooLarge)).toBe('The file is larger than the FileSpaces.MaxFileBytes setting allows.');
    expect(translateServerText(t, tooLarge.body.message)).toBe('File big.bin is 5000 bytes; the limit is 1024 bytes (FileSpaces.MaxFileBytes).');
    expect(translateServerText(i18n.getFixedT('de'), tooLarge.body.message)).toBe('Die Datei big.bin hat 5000 Byte; das Limit liegt bei 1024 Byte (FileSpaces.MaxFileBytes).');
    expect(errorMessage(i18n.getFixedT('ja'), new ApiError(413, { code: 'FileSpaceFull', message: 'The file space would hold more than 268435456 bytes (FileSpaces.MaxTotalBytes).' }))).toBe('ファイルスペースが 268435456 バイトを超えてしまいます (FileSpaces.MaxTotalBytes)。');
    expect(errorMessage(t, new ApiError(413, { code: 'TooManyFiles' }))).toMatch(/FileSpaces\.MaxFiles/);
    expect(errorMessage(t, new ApiError(404, { code: 'NotFound', message: 'File notes/a.md not found.' }))).toBe('File notes/a.md was not found.');
    for (const catalog of [en, ...Object.values(TRANSLATIONS)]) {
      for (const code of ['InvalidFilePath', 'FileTooLarge', 'FileSpaceFull', 'TooManyFiles', 'StaleFileUpload']) expect(catalog.errorCodes[code], code).toBeTruthy();
      expect(catalog.common.fieldCodes.InvalidFilePath).toBeTruthy();
      expect(catalog.common.serverText.fileSpaceFileTooLarge).toContain('{{limit}}');
    }
  });
});

describe('API client', () => {
  it('uses the documented file space routes', async () => {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url: String(url), method: init.method, body: init.body });
      if (String(url).includes('/files/content')) return new Response('# Sources', { status: 200, headers: { 'content-type': 'text/markdown' } });
      if (init.method === 'DELETE') return new Response(null, { status: 204 });
      if (init.method === 'POST' && String(url).endsWith('/files')) return new Response(JSON.stringify({ requestedPath: 'a.md', path: 'a.md', version: 1, conflict: false }), { status: 201 });
      return new Response(JSON.stringify({ files: [] }), { status: 200 });
    });
    try {
      const client = new ApiClient('http://127.0.0.1:8700', 'tok');
      await client.listConversationFiles('default', 'cnv_1');
      await client.listConversationFiles('default', 'cnv_1', true);
      expect(await blobText(await client.getConversationFileContent('default', 'cnv_1', 'notes/a.md', 2))).toBe('# Sources');
      await client.getConversationFileContent('default', 'cnv_1', 'notes/a.md');
      await client.listConversationFileVersions('default', 'cnv_1', 'notes/a.md');
      expect(await client.uploadConversationFile('default', 'cnv_1', { path: 'a.md', contentBase64: 'aGk=', baseVersion: 0 })).toMatchObject({ version: 1, conflict: false });
      expect(await client.deleteConversationFile('default', 'cnv_1', 'a.md')).toBeNull();
      await client.conversationFileDownloadUrl('default', 'cnv_1', 'a.md', 3);
      expect(calls.map((c) => `${c.method} ${c.url.replace('http://127.0.0.1:8700/v1.0/api/tenants/default/', '')}`)).toEqual([
        'GET conversations/cnv_1/files?includeDeleted=false',
        'GET conversations/cnv_1/files?includeDeleted=true',
        'GET conversations/cnv_1/files/content?path=notes%2Fa.md&version=2',
        'GET conversations/cnv_1/files/content?path=notes%2Fa.md',
        'GET conversations/cnv_1/files/versions?path=notes%2Fa.md',
        'POST conversations/cnv_1/files',
        'DELETE conversations/cnv_1/files?path=a.md',
        'POST conversations/cnv_1/files/download-url?path=a.md&version=3'
      ]);
      expect(JSON.parse(calls[5].body)).toEqual({ path: 'a.md', contentBase64: 'aGk=', baseVersion: 0 });
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('Files tab', () => {
  it('lists the files, hides deleted ones until asked, and shows the space', async () => {
    const apiClient = filesClient();
    mount(<ConversationFilesPanel conversationId="cnv_0001" />, { apiClient });
    await flush();
    expect(qa('[data-testid="file-list"] tbody tr').map((r) => r.getAttribute('data-file'))).toEqual(['images/chart.png', 'notes/sources.md', 'report.json']);
    const row = q('[data-file="notes/sources.md"]');
    expect(row.textContent).toContain('v2');
    expect(row.textContent).toContain('text/markdown');
    expect(q('[data-testid="files-space-id"]').textContent).toContain('cfs_0001');
    expect(q('.conversation-files .section-title').textContent).toMatch(/Shared files: 3/);
    click(q('[data-testid="files-include-deleted"]'));
    await flush();
    expect(apiClient.listConversationFiles).toHaveBeenLastCalledWith('default', 'cnv_0001', true);
    const deleted = q('[data-file="old/draft.md"]');
    expect(deleted.getAttribute('data-deleted')).toBe('true');
    expect(deleted.textContent).toContain('Deleted');
    expect(deleted.querySelector('[data-testid="file-delete"]')).toBeNull();
  });

  it('shows an empty state when the conversation has no files', async () => {
    mount(<ConversationFilesPanel conversationId="cnv_0002" />, { apiClient: filesClient() });
    await flush();
    expect(q('[data-testid="files-empty"]').textContent).toContain('No files yet');
    expect(q('[data-testid="file-list"]')).toBeNull();
    expect(q('[data-testid="files-space-id"]')).toBeNull();
    expect(q('[data-testid="file-upload"]')).not.toBeNull();
  });

  it('deletes a file after confirmation and reloads', async () => {
    const apiClient = filesClient();
    const { addToast } = mount(<ConversationFilesPanel conversationId="cnv_0001" />, { apiClient });
    await flush();
    click(q('[data-file="report.json"] [data-testid="file-delete"]'));
    expect(q('.modal').textContent).toContain('Delete report.json from the shared files?');
    await act(async () => {
      [...q('.modal').querySelectorAll('button')].find((b) => b.textContent === 'Delete').click();
    });
    await flush();
    expect(apiClient.deleteConversationFile).toHaveBeenCalledWith('default', 'cnv_0001', 'report.json');
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Deleted report.json. Its versions are kept.' });
    expect(apiClient.listConversationFiles).toHaveBeenCalledTimes(2);
  });

  it('downloads the current version through a link and falls back to the content route', async () => {
    const clicked = [];
    const spy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function () {
      clicked.push({ href: this.href, download: this.download });
    });
    const createObjectURL = vi.fn(() => 'blob:1');
    const originalCreate = URL.createObjectURL;
    const originalRevoke = URL.revokeObjectURL;
    URL.createObjectURL = createObjectURL;
    URL.revokeObjectURL = vi.fn();
    try {
      const apiClient = filesClient();
      mount(<ConversationFilesPanel conversationId="cnv_0001" />, { apiClient });
      await flush();
      click(q('[data-file="notes/sources.md"] [data-testid="file-download"]'));
      await flush();
      expect(apiClient.conversationFileDownloadUrl).toHaveBeenCalledWith('default', 'cnv_0001', 'notes/sources.md', undefined);
      expect(clicked[0]).toEqual({ href: 'http://127.0.0.1:8700/v1.0/file-download/cfs_0001?ticket=t', download: 'sources.md' });
      apiClient.conversationFileDownloadUrl.mockRejectedValueOnce(new ApiError(500, { code: 'InternalError' }));
      click(q('[data-file="report.json"] [data-testid="file-download"]'));
      await flush();
      expect(apiClient.getConversationFileContent).toHaveBeenCalledWith('default', 'cnv_0001', 'report.json', undefined);
      expect(clicked[1]).toEqual({ href: 'blob:1', download: 'report.json' });
    } finally {
      spy.mockRestore();
      URL.createObjectURL = originalCreate;
      URL.revokeObjectURL = originalRevoke;
    }
  });

  it('refreshes on files.changed from the WebSocket channel and says it is live', async () => {
    const sockets = [];
    class FakeSocket {
      constructor(url) {
        this.url = url;
        this.sent = [];
        sockets.push(this);
      }
      send(data) {
        this.sent.push(JSON.parse(data));
      }
      close() {}
    }
    const original = globalThis.WebSocket;
    globalThis.WebSocket = FakeSocket;
    try {
      const apiClient = filesClient({ webSocketUrl: () => 'ws://127.0.0.1/v1.0/ws?token=x' });
      mount(<ConversationFilesPanel conversationId="cnv_0001" />, { apiClient });
      await flush();
      const ws = sockets[0];
      act(() => ws.onopen());
      expect(ws.sent).toEqual([{ type: 'subscribe', channel: 'conversation-files:cnv_0001' }]);
      expect(q('[data-testid="files-live"]').getAttribute('data-live')).toBe('false');
      act(() => ws.onmessage({ data: JSON.stringify({ type: 'subscribed', channel: 'conversation-files:cnv_0001' }) }));
      expect(q('[data-testid="files-live"]').getAttribute('data-live')).toBe('true');
      const before = apiClient.listConversationFiles.mock.calls.length;
      await act(async () => ws.onmessage({ data: JSON.stringify({ type: 'files.changed', conversationId: 'cnv_0001', fileSpaceId: 'cfs_0001', changed: [{ path: 'notes/sources.md', version: 3, deleted: false }] }) }));
      await flush();
      expect(apiClient.listConversationFiles.mock.calls.length).toBe(before + 1);
      await act(async () => ws.onmessage({ data: JSON.stringify({ type: 'files.changed', conversationId: 'cnv_9999', changed: [] }) }));
      expect(apiClient.listConversationFiles.mock.calls.length).toBe(before + 1);
    } finally {
      globalThis.WebSocket = original;
    }
  });

  it('polls while the live channel is not available', async () => {
    vi.useFakeTimers();
    const apiClient = filesClient();
    mount(<ConversationFilesPanel conversationId="cnv_0001" />, { apiClient });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(q('[data-testid="files-live"]').textContent).toBe('Polling');
    const before = apiClient.listConversationFiles.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(FILES_POLL_MS);
    });
    expect(apiClient.listConversationFiles.mock.calls.length).toBe(before + 1);
  });

  it('is a tab of Conversation detail, opened with ?tab=files', async () => {
    const apiClient = filesClient({
      getConversation: vi.fn().mockResolvedValue(respond('GET', new URL('http://127.0.0.1/v1.0/api/tenants/default/conversations/cnv_0001'))),
      listConversationRuns: vi.fn().mockResolvedValue({ items: [] }),
      getDeployment: vi.fn().mockResolvedValue({ name: 'echo-agent-default' })
    });
    mount(<ConversationDetailView recordId="cnv_0001" />, { apiClient });
    await flush();
    expect(qa('[role="tab"]').map((tab) => tab.textContent)).toEqual(['Turns', 'Files']);
    expect(q('[data-testid="conversation-files"]')).toBeNull();
    click(qa('[role="tab"]')[1]);
    await flush();
    expect(q('[data-testid="conversation-files"]')).not.toBeNull();
    expect(q('[data-testid="conversation-message"]')).toBeNull();

    for (const { root, container } of mounted) {
      act(() => root.unmount());
      container.remove();
    }
    mounted = [];
    mount(<ConversationDetailView recordId="cnv_0001" />, { apiClient, path: '/dashboard/conversations/cnv_0001?tab=files' });
    await flush();
    expect(q('[role="tab"][aria-selected="true"]').textContent).toBe('Files');
    expect(q('[data-testid="file-list"]')).not.toBeNull();
  });
});

describe('version dialog', () => {
  it('lists versions newest first with the writer, run, preview, and per-version download', async () => {
    const apiClient = filesClient();
    const download = vi.fn().mockResolvedValue(undefined);
    mount(<ConversationFileVersionsModal conversationId="cnv_0001" file={conversationFile('notes/sources.md')} download={download} onClose={() => {}} />, { apiClient });
    await flush();
    const rows = qa('[data-testid="file-version-list"] tbody tr');
    expect(rows.map((r) => r.getAttribute('data-version'))).toEqual(['2', '1']);
    expect(rows[0].textContent).toContain('Current');
    expect(rows[0].querySelector('[data-testid="file-version-writer"]').textContent).toContain('echo-agent');
    expect(rows[0].querySelector('[data-testid="file-version-run"]').textContent).toBe('run_0042');
    expect(rows[1].querySelector('[data-testid="file-version-writer"]').textContent).toBe('admin@garrison');
    click(rows[1].querySelector('[data-testid="file-version-preview-button"]'));
    await flush();
    expect(apiClient.getConversationFileContent).toHaveBeenCalledWith('default', 'cnv_0001', 'notes/sources.md', 1);
    expect(q('[data-testid="file-preview-text"]').textContent).toBe(CONVERSATION_FILE_TEXT['notes/sources.md'][1]);
    click(rows[1].querySelector('[data-testid="file-version-download"]'));
    await flush();
    expect(download).toHaveBeenCalledWith(expect.objectContaining({ path: 'notes/sources.md' }), 1);
  });

  it('offers no preview for binary files', async () => {
    mount(<ConversationFileVersionsModal conversationId="cnv_0001" file={conversationFile('images/chart.png')} download={vi.fn()} onClose={() => {}} />, { apiClient: filesClient() });
    await flush();
    expect(q('[data-testid="file-version-preview-button"]')).toBeNull();
    expect(q('[data-testid="file-version-download"]')).not.toBeNull();
  });
});

describe('upload panel', () => {
  const listed = conversationFiles('cnv_0001').files;

  it('sends the listed version as the base and reports new files and new versions', async () => {
    const uploadConversationFile = vi.fn(async (_tenant, _id, body) => ({ requestedPath: body.path, path: body.path, version: body.baseVersion + 1, conflict: false }));
    const onUploaded = vi.fn();
    mount(<ConversationFileUploadPanel conversationId="cnv_0001" files={listed} onUploaded={onUploaded} />, { apiClient: { uploadConversationFile } });
    expect(q('[data-testid="file-upload-submit"]').disabled).toBe(true);
    await pickFiles(q('[data-testid="file-upload-input"]'), [new File(['hello'], 'sources.md', { type: 'text/markdown' }), new File(['x'], 'new.txt', { type: 'text/plain' })]);
    expect(qa('[data-testid="file-upload-base"]').map((c) => c.getAttribute('data-base'))).toEqual(['0', '0']);
    choose(qa('[data-testid="file-upload-path"]')[0], 'notes/sources.md');
    expect(qa('[data-testid="file-upload-base"]')[0].textContent).toBe('Version 2');
    click(q('[data-testid="file-upload-submit"]'));
    await flush();
    await flush();
    expect(uploadConversationFile.mock.calls.map((c) => c[2])).toEqual([
      { path: 'notes/sources.md', contentBase64: btoa('hello'), baseVersion: 2, mediaType: 'text/markdown' },
      { path: 'new.txt', contentBase64: btoa('x'), baseVersion: 0, mediaType: 'text/plain' }
    ]);
    const result = q('[data-testid="file-upload-result"]').textContent;
    expect(result).toContain('Saved notes/sources.md as version 3.');
    expect(result).toContain('Added new.txt as version 1.');
    expect(q('[data-testid="file-upload-conflict"]')).toBeNull();
    expect(q('[data-testid="file-upload-path"]')).toBeNull();
    expect(onUploaded).toHaveBeenCalledTimes(1);
  });

  it('says where a conflicting upload was kept', async () => {
    const uploadConversationFile = vi.fn().mockResolvedValue({ requestedPath: 'notes/sources.md', path: 'notes/sources.user-mv3k2a1b.md', version: 1, conflict: true });
    mount(<ConversationFileUploadPanel conversationId="cnv_0001" files={listed} />, { apiClient: { uploadConversationFile } });
    await pickFiles(q('[data-testid="file-upload-input"]'), [new File(['mine'], 'sources.md')]);
    choose(q('[data-testid="file-upload-path"]'), 'notes/sources.md');
    click(q('[data-testid="file-upload-submit"]'));
    await flush();
    const conflict = q('[data-testid="file-upload-conflict"]');
    expect(conflict.textContent).toBe('notes/sources.md changed after the list loaded, so your upload was kept as notes/sources.user-mv3k2a1b.md. Compare the two files and delete the one you do not need.');
    expect(conflict.querySelector('[data-path]').getAttribute('data-path')).toBe('notes/sources.user-mv3k2a1b.md');
  });

  it('keeps refused files with the setting on a 413 and the path message on a 400', async () => {
    const uploadConversationFile = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(413, { code: 'FileTooLarge', setting: 'FileSpaces.MaxFileBytes', message: 'File big.bin is 5000 bytes; the limit is 1024 bytes (FileSpaces.MaxFileBytes).' }))
      .mockRejectedValueOnce(new ApiError(400, { code: 'InvalidFilePath', message: 'Invalid path.', fields: { path: 'Invalid path.' }, fieldCodes: { path: 'InvalidFilePath' } }))
      .mockResolvedValueOnce({ requestedPath: 'ok.md', path: 'ok.md', version: 1, conflict: false });
    mount(<ConversationFileUploadPanel conversationId="cnv_0001" files={listed} />, { apiClient: { uploadConversationFile } });
    await pickFiles(q('[data-testid="file-upload-input"]'), [new File(['a'], 'big.bin'), new File(['b'], 'bad.md'), new File(['c'], 'ok.md')]);
    choose(qa('[data-testid="file-upload-path"]')[1], '../bad.md');
    click(q('[data-testid="file-upload-submit"]'));
    await flush();
    await flush();
    const rows = qa('[data-testid="file-upload-files"] tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].querySelector('[data-testid="file-upload-error"]').textContent).toBe('File big.bin is 5000 bytes; the limit is 1024 bytes (FileSpaces.MaxFileBytes). The limit is set by the FileSpaces.MaxFileBytes server setting.');
    expect(rows[1].querySelector('[data-testid="file-upload-error"]').textContent).toMatch(/Use a relative path with forward slashes/);
    expect(q('[data-testid="file-upload-result"]').textContent).toContain('Added ok.md as version 1.');
  });

  it('checks for empty and duplicate paths before sending, and removes a file', async () => {
    const uploadConversationFile = vi.fn();
    mount(<ConversationFileUploadPanel conversationId="cnv_0001" files={listed} />, { apiClient: { uploadConversationFile } });
    await pickFiles(q('[data-testid="file-upload-input"]'), [new File(['a'], 'a.md'), new File(['b'], 'a.md'), new File(['c'], 'c.md')]);
    choose(qa('[data-testid="file-upload-path"]')[2], ' ');
    click(q('[data-testid="file-upload-submit"]'));
    await flush();
    expect(uploadConversationFile).not.toHaveBeenCalled();
    expect(qa('[data-testid="file-upload-error"]')).toHaveLength(2);
    click(qa('[data-testid="file-upload-remove"]')[2]);
    expect(qa('[data-testid="file-upload-path"]').map((i) => i.value)).toEqual(['a.md', 'a.md']);
  });
});

describe('deployment file space folder and run file space', () => {
  it('defaults to files, keeps the stored value, and is a form field with a tip', () => {
    expect(deploymentsConfig.blank().fileSpaceMountPath).toBe('files');
    expect(deploymentsConfig.toForm({ name: 'd', fileSpaceMountPath: 'shared/out' }).fileSpaceMountPath).toBe('shared/out');
    expect(deploymentsConfig.toForm({ name: 'd' }).fileSpaceMountPath).toBe('files');
    expect(deploymentsConfig.toBody({ ...deploymentsConfig.blank(), fileSpaceMountPath: ' work ' }).fileSpaceMountPath).toBe('work');
    expect(deploymentsConfig.toBody({ ...deploymentsConfig.blank(), fileSpaceMountPath: '' }).fileSpaceMountPath).toBe('files');
    const field = deploymentsConfig.fields(deploymentsConfig.blank(), { t, i18n, options: {} }).find((f) => f.name === 'fileSpaceMountPath');
    expect(field).toMatchObject({ type: 'text', required: true, label: 'File space folder' });
    expect(field.tip.length).toBeGreaterThan(25);
  });

  it('gives turns of a conversation the conversation file space in the mocks', () => {
    const run = respond('GET', new URL('http://127.0.0.1/v1.0/api/tenants/default/runs/run_0042'));
    expect(run.fileSpaceId).toBe('cfs_0001');
    expect(respond('GET', new URL('http://127.0.0.1/v1.0/api/tenants/default/runs/run_0001')).fileSpaceId).toBeNull();
  });
});
