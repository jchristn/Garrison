// Agent assets (AD2.8): the helpers, the API client routes (201 and 200 uploads, file bytes), the Assets page
// configuration (columns, form, body), the upload panel (file input, edited paths, created and unchanged results, 413
// and 400 refusals), the version dialog (history, files, preview), the asset pins editor and the pins on the Revisions
// panel, and the labels for the AssetIntegrityFailed outcome.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import { en, TRANSLATIONS } from '../i18n/resources';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import AssetUploadPanel from '../components/AssetUploadPanel';
import AgentAssetVersionsModal from '../components/AgentAssetVersionsModal';
import AgentAssetPinsModal from '../components/AgentAssetPinsModal';
import AgentRevisionsPanel from '../components/AgentRevisionsPanel';
import { agentAssetsConfig } from '../views/resourceConfigs';
import { findPage, pathFor } from '../config/navConfig';
import ApiClient, { ApiError } from '../utils/api';
import { ENUMS } from '../utils/constants';
import { errorMessage } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import {
  ASSET_KINDS,
  assetNames,
  blobText,
  cleanPins,
  dataUrlBase64,
  draftBody,
  fileName,
  isPreviewable,
  limitSetting,
  pinLabel,
  readUploadFile,
  revisionPins,
  samePins,
  shortSha,
  uploadBody,
  uploadFieldErrors,
  uploadFileErrors
} from '../utils/assets';
import { agentAsset, agentAssetVersion, agentAssetVersions, agentRevision, agentRevisions, revisionDiff, revisionId, ASSET_FILE_TEXT } from '../../tests/e2e/mocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
const page = (objects) => ({ items: objects, totalCount: objects.length, pageNumber: 1, pageSize: 1000 });
const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const ASSETS = [1, 2, 3, 4].map(agentAsset);

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
});

function mount(element, { apiClient = {}, addToast = vi.fn() } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
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
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
}

function click(el) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

/** Put files on a file input and fire change, as a person picking them would. */
async function pickFiles(input, files) {
  Object.defineProperty(input, 'files', { value: files, configurable: true });
  await act(async () => {
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await flush();
  await flush();
}

describe('asset helpers', () => {
  it('shortens digests, names files, and decides which files preview as text', () => {
    expect(shortSha('a'.repeat(64))).toBe('aaaaaaaaaaaa...');
    expect(shortSha('abc')).toBe('abc');
    expect(fileName('docs/guide.md')).toBe('guide.md');
    expect(isPreviewable({ path: 'a.md', mediaType: 'text/markdown' })).toBe(true);
    expect(isPreviewable({ path: 'a.json', mediaType: 'application/json' })).toBe(true);
    expect(isPreviewable({ path: 'a.yaml', mediaType: 'application/yaml' })).toBe(true);
    expect(isPreviewable({ path: 'a.yml', mediaType: '' })).toBe(true);
    expect(isPreviewable({ path: 'logo.png', mediaType: 'image/png' })).toBe(false);
    expect(isPreviewable({ path: 'template.docx', mediaType: 'application/octet-stream' })).toBe(false);
    expect(dataUrlBase64('data:text/plain;base64,aGk=')).toBe('aGk=');
  });

  it('builds the upload body and checks paths before sending', () => {
    expect(uploadBody([{ path: ' docs/a.md ', mediaType: 'text/markdown', contentBase64: 'aGk=' }, { path: 'b.bin', mediaType: '', contentBase64: 'eA==' }], '  note ')).toEqual({
      files: [
        { path: 'docs/a.md', mediaType: 'text/markdown', contentBase64: 'aGk=' },
        { path: 'b.bin', contentBase64: 'eA==' }
      ],
      changeNote: 'note'
    });
    expect(uploadBody([], '')).toEqual({ files: [] });
    const errors = uploadFileErrors([{ path: 'a.md' }, { path: ' ' }, { path: 'a.md' }], t);
    expect(Object.keys(errors)).toEqual(['1', '2']);
    expect(errors[2]).toMatch(/same path/);
  });

  it('names the setting behind a 413 and maps 400 field codes to files', () => {
    expect(limitSetting(new ApiError(413, { code: 'AssetVersionTooLarge', message: 'x' }))).toBe('Assets.MaxVersionBytes');
    expect(limitSetting(new ApiError(413, { code: 'Custom', setting: 'Assets.Other', message: 'x' }))).toBe('Assets.Other');
    expect(limitSetting(new ApiError(413, { code: 'PayloadTooLarge', message: 'Too big (Assets.MaxFileBytes).' }))).toBe('Assets.MaxFileBytes');
    expect(limitSetting(new ApiError(400, { code: 'AssetFileTooLarge' }))).toBe('');
    const err = new ApiError(400, { code: 'ValidationFailed', message: 'The asset files are invalid.', fields: { 'files[1].path': 'bad', 'files[2].path': 'macro' }, fieldCodes: { 'files[1].path': 'InvalidAssetPath', 'files[2].path': 'MacroFormatRefused' } });
    const byFile = uploadFieldErrors(t, err);
    expect(byFile[1]).toMatch(/relative path with forward slashes/);
    expect(byFile[2]).toMatch(/Assets.AllowMacroFormats/);
  });

  it('reads a browser file as base64 with its name as the path', async () => {
    const file = new File(['hello'], 'notes.md', { type: 'text/markdown' });
    expect(await readUploadFile(file)).toEqual({ path: 'notes.md', mediaType: 'text/markdown', sizeBytes: 5, contentBase64: btoa('hello') });
  });

  it('normalizes pins and builds the draft body with only assetPins changed', () => {
    const draft = agentRevision('agt_0001', 3);
    expect(revisionPins(draft)).toEqual([
      { assetId: 'aas_0002', version: null },
      { assetId: 'aas_0001', version: 2 }
    ]);
    expect(cleanPins([{ assetId: 'aas_1', version: '2' }, { assetId: '' }, { assetId: 'aas_1', version: 3 }])).toEqual([{ assetId: 'aas_1', version: 2 }]);
    expect(samePins([{ assetId: 'a', version: 1 }, { assetId: 'b' }], [{ assetId: 'b', version: null }, { assetId: 'a', version: 1 }])).toBe(true);
    expect(samePins([{ assetId: 'a', version: 1 }], [{ assetId: 'a', version: null }])).toBe(false);
    const body = draftBody(draft, [{ assetId: 'aas_0004', version: 1 }]);
    expect(body.assetPins).toEqual([{ assetId: 'aas_0004', version: 1 }]);
    expect(body.description).toBe(draft.description);
    expect(body.promptPins).toEqual(draft.promptPins);
    for (const key of ['id', 'tenantId', 'agentId', 'number', 'state', 'contentHash', 'authorName', 'createdUtc', 'lastUpdateUtc']) expect(body).not.toHaveProperty(key);
    // From a published revision the change note and publish fields are dropped.
    const fromPublished = draftBody(agentRevision('agt_0001', 2), []);
    expect(fromPublished).not.toHaveProperty('changeNote');
    expect(fromPublished).not.toHaveProperty('publishedUtc');
    expect(fromPublished.assetPins).toEqual([]);
  });

  it('labels pins with the asset name and version or current', () => {
    const names = assetNames(ASSETS);
    expect(pinLabel(t, { assetId: 'aas_0001', version: 2 }, names)).toBe('style-guide v2');
    expect(pinLabel(t, { assetId: 'aas_0002', version: null }, names)).toBe('review-skill (current)');
    expect(pinLabel(t, { assetId: 'aas_9999', version: null }, names)).toBe('aas_9999 (current)');
  });
});

describe('API client', () => {
  it('uses the documented asset routes and reports whether an upload created a version', async () => {
    const calls = [];
    const original = globalThis.fetch;
    let uploadStatus = 201;
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url: String(url), method: init.method, body: init.body, headers: init.headers });
      if (String(url).includes('/files?')) return new Response('# Guide', { status: 200, headers: { 'content-type': 'text/markdown' } });
      if (init.method === 'DELETE') return new Response(null, { status: 204 });
      if (init.method === 'POST' && String(url).endsWith('/versions')) return new Response(JSON.stringify({ number: 3 }), { status: uploadStatus });
      return new Response(JSON.stringify({ objects: [], totalRecords: 0 }), { status: 200 });
    });
    try {
      const client = new ApiClient('http://127.0.0.1:8700', 'tok');
      await client.listAgentAssets('default', { kind: 'Skill', search: 'rev', pageNumber: 1, pageSize: 25 });
      await client.getAgentAsset('default', 'style-guide');
      await client.createAgentAsset('default', { name: 'a', kind: 'Skill' });
      await client.updateAgentAsset('default', 'aas_1', { name: 'a' });
      await client.deleteAgentAsset('default', 'aas_1');
      await client.listAgentAssetVersions('default', 'aas_1');
      await client.getAgentAssetVersion('default', 'aas_1', 2);
      expect(await client.uploadAgentAssetVersion('default', 'aas_1', { files: [] })).toEqual({ created: true, version: { number: 3 } });
      uploadStatus = 200;
      expect(await client.uploadAgentAssetVersion('default', 'aas_1', { files: [] })).toEqual({ created: false, version: { number: 3 } });
      const blob = await client.getAgentAssetFile('default', 'aas_1', 2, 'docs/guide.md');
      expect(await blobText(blob)).toBe('# Guide');
      expect(calls.map((c) => `${c.method} ${c.url.replace('http://127.0.0.1:8700/v1.0/api/tenants/default/', '')}`)).toEqual([
        'GET agent-assets?kind=Skill&search=rev&maxResults=25&skip=0',
        'GET agent-assets/style-guide',
        'POST agent-assets',
        'PUT agent-assets/aas_1',
        'DELETE agent-assets/aas_1',
        'GET agent-assets/aas_1/versions',
        'GET agent-assets/aas_1/versions/2',
        'POST agent-assets/aas_1/versions',
        'POST agent-assets/aas_1/versions',
        'GET agent-assets/aas_1/versions/2/files?path=docs%2Fguide.md'
      ]);
      expect(calls[9].headers.Authorization).toBe('Bearer tok');
    } finally {
      globalThis.fetch = original;
    }
  });

  it('throws ApiError with the parsed body when a file cannot be read', async () => {
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async () => new Response(JSON.stringify({ code: 'NotFound', message: 'File x.md is not in version 2.' }), { status: 404 }));
    try {
      const client = new ApiClient('http://127.0.0.1:8700', 'tok');
      await expect(client.getAgentAssetFile('default', 'aas_1', 2, 'x.md')).rejects.toMatchObject({ status: 404, code: 'NotFound' });
    } finally {
      globalThis.fetch = original;
    }
  });
});

describe('Assets page configuration', () => {
  const ctx = { t, i18n, lookups: { stores: { as_0001: 'artifact-stores-1' } } };

  it('is a Configuration tab with labels and tips', () => {
    expect(findPage('agentAssets')).toMatchObject({ hub: 'configuration', tab: 'agent-assets' });
    expect(pathFor('agentAssets')).toBe('/dashboard/configuration?tab=agent-assets');
    expect(ASSET_KINDS).toEqual(ENUMS.agentAssetKind);
    for (const key of ['name', 'kind', 'currentVersion', 'description', 'tags', 'artifactStoreId', 'promptTemplateId', 'add', 'kindFilter', 'actions.versions']) {
      expect(t(`tips.resources.agentAssets.${key}`).length, key).toBeGreaterThanOrEqual(25);
    }
  });

  it('shows the current version and the store, and the template field only for system prompts', () => {
    const columns = agentAssetsConfig.columns(ctx);
    expect(columns.map((c) => c.key)).toEqual(['name', 'kind', 'currentVersion', 'description', 'tags', 'artifactStoreId', 'id', 'createdUtc']);
    const fields = (d, mode = 'create') => agentAssetsConfig.fields(d, { t, mode, options: { templates: [{ id: 'pt_1', name: 'voice' }], stores: [{ id: 'as_0001', name: 'bucket' }] } });
    const visible = (d, mode) => fields(d, mode).filter((f) => !f.showIf || f.showIf(d)).map((f) => f.name);
    expect(visible({ kind: 'ReferenceFile' })).toEqual(['name', 'kind', 'artifactStoreId', 'description', 'tags']);
    expect(visible({ kind: 'SystemPrompt' })).toEqual(['name', 'kind', 'promptTemplateId', 'description', 'tags']);
    // The kind and the store are fixed after creation.
    const edit = fields({ kind: 'Skill' }, 'edit');
    expect(edit.find((f) => f.name === 'kind').readOnly).toBe(true);
    expect(edit.find((f) => f.name === 'artifactStoreId').readOnly).toBe(true);
    expect(fields({ kind: 'Skill' }).find((f) => f.name === 'kind').options.map((o) => o.label)).toEqual(['System prompt', 'Skill', 'Reference file', 'Document template']);
  });

  it('validates and builds the body', () => {
    expect(agentAssetsConfig.validate({ name: '', kind: 'Skill' }, t)).toHaveProperty('name');
    expect(agentAssetsConfig.validate({ name: 'x', kind: 'SystemPrompt' }, t).promptTemplateId).toMatch(/prompt template/);
    expect(agentAssetsConfig.validate({ name: 'x', kind: 'Skill' }, t)).toEqual({});
    expect(agentAssetsConfig.toBody({ name: ' voice ', kind: 'SystemPrompt', promptTemplateId: 'pt_1', artifactStoreId: 'as_1', description: ' ', tags: [' a ', ''] })).toEqual({
      name: 'voice',
      kind: 'SystemPrompt',
      description: null,
      promptTemplateId: 'pt_1',
      artifactStoreId: null,
      tags: ['a']
    });
    expect(agentAssetsConfig.toBody({ name: 'notes', kind: 'ReferenceFile', promptTemplateId: 'pt_1', artifactStoreId: '', description: 'd', tags: [] })).toMatchObject({ promptTemplateId: null, artifactStoreId: null });
  });

  it('translates the AssetInUse refusal with the agents it names', () => {
    const err = new ApiError(409, { code: 'AssetInUse', message: 'Asset style-guide is pinned by revisions of echo-agent, agent-2. Remove it from those revisions first.' });
    expect(errorMessage(t, err)).toBe('Asset style-guide is pinned by revisions of these agents: echo-agent, agent-2. Remove it from those revisions first.');
    expect(errorMessage(t, new ApiError(409, { code: 'AssetInUse' }))).toMatch(/still pin this asset/);
    expect(errorMessage(t, new ApiError(409, { code: 'AssetKindImmutable' }))).toMatch(/cannot change/);
  });
});

describe('upload panel', () => {
  const asset = agentAsset(1);

  it('reads picked files, lets the path be edited, and reports a new version', async () => {
    const uploadAgentAssetVersion = vi.fn().mockResolvedValue({ created: true, version: { number: 3 } });
    const onUploaded = vi.fn();
    mount(<AssetUploadPanel asset={asset} onUploaded={onUploaded} />, { apiClient: { uploadAgentAssetVersion } });
    expect(q('[data-testid="asset-upload-submit"]').disabled).toBe(true);
    await pickFiles(q('[data-testid="asset-upload-input"]'), [new File(['hello'], 'notes.md', { type: 'text/markdown' })]);
    expect(q('[data-testid="asset-upload-path"]').value).toBe('notes.md');
    choose(q('[data-testid="asset-upload-path"]'), 'docs/notes.md');
    choose(q('[data-testid="asset-upload-note"]'), 'First notes');
    click(q('[data-testid="asset-upload-submit"]'));
    await flush();
    expect(uploadAgentAssetVersion).toHaveBeenCalledWith('default', 'aas_0001', { files: [{ path: 'docs/notes.md', mediaType: 'text/markdown', contentBase64: btoa('hello') }], changeNote: 'First notes' });
    expect(q('[data-testid="asset-upload-result"]').textContent).toBe('Created version 3.');
    expect(onUploaded).toHaveBeenCalledWith({ created: true, version: { number: 3 } });
    expect(q('[data-testid="asset-upload-path"]')).toBeNull();
  });

  it('says when identical files returned the current version', async () => {
    const uploadAgentAssetVersion = vi.fn().mockResolvedValue({ created: false, version: { number: 2 } });
    mount(<AssetUploadPanel asset={asset} />, { apiClient: { uploadAgentAssetVersion } });
    await pickFiles(q('[data-testid="asset-upload-input"]'), [new File(['x'], 'guide.md', { type: 'text/markdown' })]);
    click(q('[data-testid="asset-upload-submit"]'));
    await flush();
    expect(q('[data-testid="asset-upload-result"]').getAttribute('data-created')).toBe('false');
    expect(q('[data-testid="asset-upload-result"]').textContent).toMatch(/current version 2, so no new version was created/);
  });

  it('names the setting on a 413 and the file on a 400', async () => {
    const uploadAgentAssetVersion = vi
      .fn()
      .mockRejectedValueOnce(new ApiError(413, { code: 'AssetTooManyFiles', message: 'A version holds at most 1 files (Assets.MaxFilesPerVersion); this upload has 2.' }))
      .mockRejectedValueOnce(new ApiError(400, { code: 'ValidationFailed', message: 'The asset files are invalid.', fields: { 'files[1].path': 'Macro' }, fieldCodes: { 'files[1].path': 'MacroFormatRefused' } }));
    mount(<AssetUploadPanel asset={asset} />, { apiClient: { uploadAgentAssetVersion } });
    await pickFiles(q('[data-testid="asset-upload-input"]'), [new File(['a'], 'a.md'), new File(['b'], 'b.docm')]);
    click(q('[data-testid="asset-upload-submit"]'));
    await flush();
    expect(q('[data-testid="asset-upload-error"]').textContent).toContain('A version holds at most 1 files (Assets.MaxFilesPerVersion); this upload has 2.');
    expect(q('[data-testid="asset-upload-error"]').textContent).toContain('The limit is set by the Assets.MaxFilesPerVersion server setting.');
    click(q('[data-testid="asset-upload-submit"]'));
    await flush();
    const rows = qa('[data-testid="asset-upload-files"] tbody tr');
    expect(rows[0].querySelector('[data-testid="asset-upload-file-error"]')).toBeNull();
    expect(rows[1].querySelector('[data-testid="asset-upload-file-error"]').textContent).toMatch(/Macro-enabled Office files are refused/);
  });

  it('removes a file before upload', async () => {
    mount(<AssetUploadPanel asset={asset} />, { apiClient: {} });
    await pickFiles(q('[data-testid="asset-upload-input"]'), [new File(['a'], 'a.md'), new File(['b'], 'b.md')]);
    click(qa('[data-testid="asset-upload-remove"]')[0]);
    expect(qa('[data-testid="asset-upload-path"]').map((i) => i.value)).toEqual(['b.md']);
  });
});

describe('version dialog', () => {
  it('lists versions newest first with files, a shortened digest, and a text preview', async () => {
    const getAgentAssetFile = vi.fn().mockResolvedValue(new Blob([ASSET_FILE_TEXT], { type: 'text/markdown' }));
    const apiClient = { listAgentAssetVersions: vi.fn().mockResolvedValue([...agentAssetVersions('aas_0001')].reverse()), getAgentAssetFile };
    mount(<AgentAssetVersionsModal asset={agentAsset(1)} onClose={() => {}} />, { apiClient });
    await flush();
    expect(qa('[data-testid="asset-version-list"] tbody tr').map((r) => r.getAttribute('data-version'))).toEqual(['2', '1']);
    expect(q('[data-version="2"]').textContent).toContain('Current');
    expect(q('[data-file="guide.md"]').textContent).toContain('bbbbbbbbbbbb...');
    expect(q('[data-file="images/logo.png"] [data-testid="asset-file-preview-button"]')).toBeNull();
    click(q('[data-file="guide.md"] [data-testid="asset-file-preview-button"]'));
    await flush();
    await flush();
    expect(getAgentAssetFile).toHaveBeenCalledWith('default', 'aas_0001', 2, 'guide.md');
    expect(q('[data-testid="asset-file-preview-text"]').textContent).toBe(ASSET_FILE_TEXT);
    click(q('[data-version="1"] [data-testid="asset-version-files"]'));
    expect(q('[data-testid="asset-version-detail"]').getAttribute('data-version')).toBe('1');
    expect(q('[data-testid="asset-file-preview"]')).toBeNull();
  });

  it('points system prompt assets at their template and offers no upload', async () => {
    mount(<AgentAssetVersionsModal asset={agentAsset(3)} onClose={() => {}} />, { apiClient: { listAgentAssetVersions: vi.fn().mockResolvedValue([]) } });
    await flush();
    expect(q('[data-testid="asset-system-prompt"]')).not.toBeNull();
    expect(q('[data-testid="asset-upload"]')).toBeNull();
    expect(q('[data-testid="asset-versions-empty"]')).not.toBeNull();
  });
});

describe('asset pins', () => {
  const AGENT = { id: 'agt_0001', name: 'echo-agent', latestPublishedRevisionId: revisionId('agt_0001', 2), draftRevisionId: revisionId('agt_0001', 3) };
  const client = (extra = {}) => ({
    listAgentRevisions: vi.fn().mockResolvedValue(page(agentRevisions('agt_0001'))),
    diffAgentRevisions: vi.fn((_t, agentId, from, to) => Promise.resolve(revisionDiff(agentId, from, to))),
    listAgentAssets: vi.fn().mockResolvedValue(page(ASSETS)),
    listAgentAssetVersions: vi.fn((_t, id) => Promise.resolve(agentAssetVersions(id))),
    ...extra
  });

  it('shows each revision pins on the Revisions panel', async () => {
    mount(<AgentRevisionsPanel agent={AGENT} />, { apiClient: client() });
    await flush();
    await flush();
    expect(q('[data-revision="3"] [data-cell="assetPins"]').textContent).toBe('review-skill (current)style-guide v2');
    expect(q('[data-revision="2"] [data-cell="assetPins"]').textContent).toBe('review-skill (current)');
    expect(q('[data-revision="1"] [data-cell="assetPins"]').textContent).toBe('-');
    expect(q('[data-revision="3"] [data-testid="revision-assets"]')).not.toBeNull();
    expect(q('[data-testid="revision-assets-new"]')).toBeNull();
    expect(qa('[data-testid="revision-diff"] [data-field="assetPins"]').map((r) => r.getAttribute('data-change'))).toEqual(['Added']);
  });

  it('edits the draft pins and saves the complete draft', async () => {
    const saveAgentDraft = vi.fn().mockResolvedValue({ number: 3, state: 'Draft' });
    const onSaved = vi.fn();
    const { addToast } = mount(<AgentAssetPinsModal agent={AGENT} revision={agentRevision('agt_0001', 3)} onClose={() => {}} onSaved={onSaved} />, { apiClient: client({ saveAgentDraft }) });
    await flush();
    await flush();
    expect(q('[data-testid="asset-pins-save"]').disabled).toBe(true);
    // Each asset can be chosen once: the second row does not offer review-skill.
    const second = qa('[data-testid="asset-pin-asset"]')[1];
    expect([...second.options].map((o) => o.value)).not.toContain('aas_0002');
    expect([...qa('[data-testid="asset-pin-version"]')[1].options].map((o) => o.value)).toEqual(['', '2', '1']);
    click(qa('[data-testid="asset-pin-remove"]')[0]);
    click(q('[data-testid="asset-pin-add"]'));
    expect(q('[data-testid="asset-pins-save"]').disabled).toBe(true);
    choose(qa('[data-testid="asset-pin-asset"]')[1], 'aas_0004');
    await flush();
    choose(qa('[data-testid="asset-pin-version"]')[1], '1');
    click(q('[data-testid="asset-pins-save"]'));
    await flush();
    const [, agentId, body] = saveAgentDraft.mock.calls[0];
    expect(agentId).toBe('agt_0001');
    expect(body.assetPins).toEqual([
      { assetId: 'aas_0001', version: 2 },
      { assetId: 'aas_0004', version: 1 }
    ]);
    expect(body.description).toBe('Sample agent that also summarizes');
    expect(body).not.toHaveProperty('id');
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Saved the asset pins on draft revision 3.' });
    expect(onSaved).toHaveBeenCalled();
  });

  it('offers a new draft from the latest published revision when there is none', async () => {
    const published = agentRevisions('agt_0002');
    mount(<AgentRevisionsPanel agent={{ id: 'agt_0002', name: 'agent-2', latestPublishedRevisionId: revisionId('agt_0002', 2) }} />, { apiClient: client({ listAgentRevisions: vi.fn().mockResolvedValue(page(published)) }) });
    await flush();
    click(q('[data-testid="revision-assets-new"]'));
    await flush();
    expect(q('[data-testid="asset-pins-source"]').textContent).toContain('new draft from published revision 2');
  });

  it('shows the save refusal in the dialog', async () => {
    const saveAgentDraft = vi.fn().mockRejectedValue(new ApiError(404, { code: 'NotFound', message: 'Agent asset missing-asset was not found.' }));
    mount(<AgentAssetPinsModal agent={AGENT} revision={agentRevision('agt_0001', 3)} onClose={() => {}} />, { apiClient: client({ saveAgentDraft }) });
    await flush();
    click(qa('[data-testid="asset-pin-remove"]')[0]);
    click(q('[data-testid="asset-pins-save"]'));
    await flush();
    expect(q('.modal').textContent).toContain('Agent asset missing-asset was not found.');
  });
});

describe('labels', () => {
  it('labels the AssetIntegrityFailed outcome, the AgentAsset resource, and asset kinds in every locale', () => {
    expect(ENUMS.runOutcome).toContain('AssetIntegrityFailed');
    expect(ENUMS.resourceType).toContain('AgentAsset');
    expect(enumLabel(t, 'runOutcome', 'AssetIntegrityFailed')).toBe('Asset integrity failed');
    expect(t('tips.enums.runOutcome.AssetIntegrityFailed')).toMatch(/SHA-256/);
    for (const [code, catalog] of Object.entries(TRANSLATIONS)) {
      expect(catalog.enums.runOutcome.AssetIntegrityFailed, code).toBeTruthy();
      expect(catalog.enums.runOutcome.AssetIntegrityFailed, code).not.toBe(en.enums.runOutcome.AssetIntegrityFailed);
      expect(catalog.tips.enums.runOutcome.AssetIntegrityFailed, code).toBeTruthy();
      for (const kind of ENUMS.agentAssetKind) expect(catalog.enums.agentAssetKind[kind], `${code} ${kind}`).toBeTruthy();
    }
  });

  it('keeps the mock version shape the dialogs read', () => {
    const v = agentAssetVersion('aas_0001', 2);
    expect(v).toMatchObject({ assetId: 'aas_0001', number: 2, totalBytes: 2088 });
    expect(v.files.map((f) => f.path)).toEqual(['guide.md', 'images/logo.png']);
  });
});
