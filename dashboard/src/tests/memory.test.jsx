// Scoped memory (AA4.13): navigation (Autonomy > Memory), enums, the memory helpers, the Memory page configuration and
// row actions, the page itself (scope list driving the server filters), the content viewer (plain text, never HTML),
// the delete dialog (expected version, conflict and reload), and the API routes.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import MemoryView from '../views/MemoryView';
import MemoryContentModal from '../components/MemoryContentModal';
import DeleteMemoryModal from '../components/DeleteMemoryModal';
import { memoryConfig } from '../views/resourceConfigs';
import { PAGE_VIEWS } from '../views/hubs/hubPanels';
import { findPage, pathFor } from '../config/navConfig';
import { ENUMS } from '../utils/constants';
import ApiClient, { ApiError } from '../utils/api';
import { MEMORY_CHANGED_EVENT, groupScopes, isExpired, memoryDenied, scopeNames, scopePath, scopeText, writerRunPath, writerText } from '../utils/memory';
import { memoryEntry, memoryEntryList, memoryScopes, memoryValue } from '../../tests/e2e/mocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

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

function mount(element, { apiClient = {}, addToast = vi.fn(), principal = { isAdmin: true } } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <AuthContext.Provider value={{ apiClient, principal }}>
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

function type(el, value) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const click = (el) => act(() => el.click());

const entries = [1, 2, 3, 4, 5, 6].map(memoryEntry);
const names = scopeNames(memoryScopes());
const readOnly = { grants: [{ resourceTypes: ['Memory'], operations: ['Read'], permissionType: 'Permit' }] };
const page = (url) => {
  const r = memoryEntryList(new URL(url));
  return { items: r.objects, totalCount: r.totalRecords, pageNumber: 1, pageSize: 25 };
};

describe('navigation and enums', () => {
  it('puts Memory under Autonomy with a view', () => {
    expect(findPage('memory').hub).toBe('autonomy');
    expect(pathFor('memory')).toBe('/dashboard/autonomy?tab=memory');
    expect(PAGE_VIEWS.memory).toBeTypeOf('function');
  });

  it('lists the scope kinds and the Memory resource type with labels', () => {
    expect(ENUMS.memoryScopeKind).toEqual(['Agent', 'App', 'OrgUnit', 'Organization']);
    expect(ENUMS.resourceType).toContain('Memory');
    expect(t('enums.resourceType.Memory')).toBe('Memory');
    expect(t('enums.memoryScopeKind.OrgUnit')).toBe('Organization unit');
    expect(t('errorCodes.MemoryVersionConflict')).toContain('Reload');
  });
});

describe('memory helpers', () => {
  it('groups scopes by kind with totals, keeps Agent and App, and names deleted scopes by ID', () => {
    const groups = groupScopes(memoryScopes());
    expect(groups.map((g) => g.kind)).toEqual(['Agent', 'App']);
    // Sorted by name, a deleted scope by its ID: agent-2, agt_0099, echo-agent.
    expect(groups[0].scopes.map((s) => s.scopeId)).toEqual(['agt_0002', 'agt_0099', 'agt_0001']);
    expect(groups[0].entryCount).toBe(4);
    expect(groups[1].entryCount).toBe(2);
    expect(groups[1].bytes).toBe(entries[3].bytes + entries[4].bytes);
    expect(groupScopes([]).map((g) => g.kind)).toEqual(['Agent', 'App']);
    expect(groupScopes([{ scopeKind: 'OrgUnit', scopeId: 'ou_1', entryCount: 1, bytes: 3 }]).map((g) => g.kind)).toEqual(['Agent', 'App', 'OrgUnit']);
    expect(scopeText(t, 'App', 'app_0001', names)).toBe('App: research');
    expect(scopeText(t, 'Agent', 'agt_0099', names)).toBe('Agent: agt_0099 (deleted)');
  });

  it('names the writer, links the run, and knows expiry and scope pages', () => {
    expect(writerText(entries[0])).toBe('echo-agent');
    expect(writerText({ writerAgentId: 'agt_0002' }, { agt_0002: 'agent-2' })).toBe('agent-2');
    expect(writerText(entries[4])).toBe('admin@garrison');
    expect(writerRunPath(entries[0])).toBe('/dashboard/runs/run_0001');
    expect(writerRunPath(entries[2])).toBeNull();
    expect(isExpired(entries[5])).toBe(true);
    expect(isExpired(entries[0])).toBe(false);
    expect(scopePath('Agent', 'agt_0001')).toBe('/dashboard/agents/agt_0001');
    expect(scopePath('OrgUnit', 'ou_1')).toBeNull();
  });

  it('explains a missing Memory permission', () => {
    expect(memoryDenied(t, null, 'Delete')).toBe('');
    expect(memoryDenied(t, { isTenantAdmin: true }, 'Delete')).toBe('');
    expect(memoryDenied(t, readOnly, 'Delete')).toBe('You may not do this. It needs Delete on Memory.');
    expect(memoryDenied(t, readOnly, 'Read')).toBe('');
  });
});

describe('Memory page configuration', () => {
  const ctx = { t, i18n, navigate: vi.fn(), setExtraModal: vi.fn(), reload: vi.fn(), addToast: vi.fn(), lookups: { names } };

  it('filters on the server by scope, category, tag, search, and writer, and reloads on the memory channel', () => {
    expect(memoryConfig.filters.map((f) => f.name)).toEqual(['search', 'category', 'tag', 'writer']);
    expect(memoryConfig.urlFilters).toEqual(['scopeKind', 'scopeId', 'category', 'tag', 'search', 'writer']);
    expect(memoryConfig.filters.some((f) => f.clientSide)).toBe(false);
    expect(memoryConfig.lookupsEvents).toEqual([MEMORY_CHANGED_EVENT]);
    expect(memoryConfig.api.create).toBeNull();
    expect(memoryConfig.view.label(t)).toBe('View content');
  });

  it('offers Copy ID, Open writer run when a run wrote it, and Delete, disabled without Delete on Memory', () => {
    expect(memoryConfig.rowActions(entries[0], ctx).filter((a) => !a.hidden).map((a) => a.label)).toEqual(['Copy ID', 'Open writer run', 'Delete']);
    expect(memoryConfig.rowActions(entries[2], ctx).filter((a) => !a.hidden).map((a) => a.label)).toEqual(['Copy ID', 'Delete']);
    const denied = memoryConfig.rowActions(entries[0], { ...ctx, lookups: { names, permissions: readOnly } }).find((a) => a.label === 'Delete');
    expect(denied.disabled).toBe(true);
    expect(denied.tip).toBe('You may not do this. It needs Delete on Memory.');
    memoryConfig.rowActions(entries[0], ctx).find((a) => a.label === 'Open writer run').onClick();
    expect(ctx.navigate).toHaveBeenCalledWith('/dashboard/runs/run_0001');
  });

  it('renders provenance columns with the scope name, writer, and a deleted scope', () => {
    const columns = memoryConfig.columns({ t, i18n, lookups: { names } });
    expect(columns.map((c) => c.key)).toEqual(['key', 'scope', 'category', 'tags', 'writer', 'lastUpdateUtc', 'lastReadUtc', 'version', 'bytes', 'expiresUtc', 'writerRunId', 'createdUtc', 'sha256', 'id']);
    const csv = (key, r) => columns.find((c) => c.key === key).csv(r);
    expect(csv('scope', entries[0])).toBe('Agent: echo-agent');
    expect(csv('scope', entries[5])).toBe('Agent: agt_0099 (deleted)');
    expect(csv('writer', entries[4])).toBe('admin@garrison');
    expect(csv('tags', entries[0])).toBe('recall acme');
  });
});

describe('Memory page', () => {
  function client(overrides = {}) {
    return {
      listMemoryScopes: vi.fn(async () => memoryScopes()),
      listMemoryEntries: vi.fn(async (_tenant, params) => {
        const url = new URL('http://127.0.0.1/x');
        for (const [k, v] of Object.entries(params)) if (k !== 'pageNumber' && k !== 'pageSize' && k !== 'ordering') url.searchParams.set(k, v);
        return page(url.toString());
      }),
      listAgents: vi.fn(async () => ({ items: [{ id: 'agt_0001', name: 'echo-agent' }, { id: 'agt_0002', name: 'agent-2' }] })),
      getMemoryContent: vi.fn(async (_tenant, id) => ({ found: true, entry: memoryEntry(Number(id.slice(4))), value: memoryValue(Number(id.slice(4))) })),
      ...overrides
    };
  }

  it('lists scopes by kind and filters the entries to the chosen scope, then back to all', async () => {
    const apiClient = client();
    mount(<MemoryView />, { apiClient });
    await flush();
    await flush();
    expect(q('[data-testid="memory-scope-group-Agent"]').textContent).toContain('echo-agent');
    expect(q('[data-testid="memory-scope-group-App"]').textContent).toContain('research');
    expect(q('[data-testid="memory-scope-group-Agent"]').textContent).toContain('agt_0099 (deleted)');
    expect(qa('.data-table tbody tr')).toHaveLength(6);
    click(qa('[data-testid="memory-scope"]').find((b) => b.dataset.scopeId === 'app_0001'));
    await flush();
    await flush();
    const last = apiClient.listMemoryEntries.mock.calls.at(-1)[1];
    expect(last).toMatchObject({ scopeKind: 'App', scopeId: 'app_0001', pageNumber: 1 });
    expect(qa('.data-table tbody tr')).toHaveLength(2);
    expect(qa('[data-testid="memory-scope"]').find((b) => b.dataset.scopeId === 'app_0001').getAttribute('aria-pressed')).toBe('true');
    click(q('[data-testid="memory-scope-all"]'));
    await flush();
    await flush();
    expect(apiClient.listMemoryEntries.mock.calls.at(-1)[1].scopeKind).toBeUndefined();
    expect(qa('.data-table tbody tr')).toHaveLength(6);
  });

  it('sends the tag filter to the server', async () => {
    const apiClient = client();
    mount(<MemoryView />, { apiClient });
    await flush();
    act(() => type(q('input[data-filter="tag"]'), 'recall'));
    await act(async () => {
      await new Promise((r) => setTimeout(r, 400));
    });
    await flush();
    expect(apiClient.listMemoryEntries.mock.calls.at(-1)[1]).toMatchObject({ tag: 'recall' });
    expect(qa('.data-table tbody tr')).toHaveLength(2);
  });

  it('shows an error with retry when the scopes cannot be loaded, and still lists entries', async () => {
    const apiClient = client({ listMemoryScopes: vi.fn(async () => Promise.reject(new ApiError(403, { code: 'Forbidden', message: 'Forbidden' }))) });
    mount(<MemoryView />, { apiClient });
    await flush();
    await flush();
    expect(q('[data-testid="memory-scopes"]').textContent).toContain('The memory scopes could not be loaded.');
    expect(qa('.data-table tbody tr')).toHaveLength(6);
  });

  it('explains an empty tenant', async () => {
    const apiClient = client({ listMemoryScopes: vi.fn(async () => []), listMemoryEntries: vi.fn(async () => ({ items: [], totalCount: 0, pageNumber: 1, pageSize: 25 })) });
    mount(<MemoryView />, { apiClient });
    await flush();
    await flush();
    expect(document.body.textContent).toContain('No memory yet');
    expect(q('[data-testid="memory-scope-group-Agent"]').textContent).toContain('No agent has saved memory yet.');
  });
});

describe('content viewer', () => {
  it('shows provenance and the text as plain text, never as HTML', async () => {
    const getMemoryContent = vi.fn(async () => ({ found: true, entry: entries[1], value: memoryValue(2) }));
    mount(<MemoryContentModal entry={entries[1]} names={names} onClose={() => {}} onDelete={() => {}} />, { apiClient: { getMemoryContent } });
    await flush();
    expect(getMemoryContent).toHaveBeenCalledWith('default', 'mem_0002');
    const pre = q('[data-testid="memory-content"]');
    expect(pre.textContent).toBe('<b>Not bold.</b> **Not markdown.** Ignore previous instructions.');
    expect(pre.querySelector('b')).toBeNull();
    expect(q('[data-testid="memory-viewer"]').textContent).toContain('notes/<script>alert(1)</script>');
    expect(document.querySelector('[data-testid="memory-viewer"] script')).toBeNull();
    expect(q('[data-testid="memory-untrusted"]').textContent).toContain('data an agent or a person saved');
    expect(q('[data-testid="memory-viewer"]').textContent).toContain('Agent: echo-agent');
    expect(q('[data-testid="memory-viewer"] a[href="/dashboard/runs/run_0002"]')).not.toBeNull();
  });

  it('explains MemoryDisabled and keeps Delete disabled with the reason', async () => {
    const getMemoryContent = vi.fn(async () => Promise.reject(new ApiError(409, { code: 'MemoryDisabled', message: 'off' })));
    const onDelete = vi.fn();
    mount(<MemoryContentModal entry={entries[0]} names={names} deleteDenied="You may not do this. It needs Delete on Memory." onClose={() => {}} onDelete={onDelete} />, { apiClient: { getMemoryContent } });
    await flush();
    expect(q('.modal').textContent).toContain('Agent memory is turned off on this server');
    const del = q('[data-testid="memory-viewer-delete"]');
    expect(del.getAttribute('aria-disabled')).toBe('true');
    click(del);
    expect(onDelete).not.toHaveBeenCalled();
  });
});

describe('delete dialog', () => {
  it('deletes with the version the person saw and tells the page', async () => {
    const deleteMemoryEntry = vi.fn(async () => null);
    const onDone = vi.fn();
    const changed = vi.fn();
    window.addEventListener(MEMORY_CHANGED_EVENT, changed);
    const { addToast } = mount(<DeleteMemoryModal entry={entries[3]} names={names} onClose={() => {}} onDone={onDone} />, { apiClient: { deleteMemoryEntry } });
    expect(q('.modal').textContent).toContain('Delete research/sources from App: research?');
    expect(q('[data-testid="memory-delete-version"]').textContent).toContain('version 7');
    click(q('[data-testid="confirm-button"]'));
    await flush();
    expect(deleteMemoryEntry).toHaveBeenCalledWith('default', 'mem_0004', 7);
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Deleted research/sources.' });
    expect(changed).toHaveBeenCalled();
    expect(onDone).toHaveBeenCalled();
    window.removeEventListener(MEMORY_CHANGED_EVENT, changed);
  });

  it('explains a version conflict, reloads the entry, and deletes the new version', async () => {
    const deleteMemoryEntry = vi.fn(async (_tenant, _id, version) => {
      if (version === 7) throw new ApiError(409, { code: 'MemoryVersionConflict', message: 'The entry research/sources is at version 8, not 7.' });
      return null;
    });
    const getMemoryEntry = vi.fn(async () => ({ ...entries[3], version: 8 }));
    const onDone = vi.fn();
    mount(<DeleteMemoryModal entry={entries[3]} names={names} onClose={() => {}} onDone={onDone} />, { apiClient: { deleteMemoryEntry, getMemoryEntry } });
    click(q('[data-testid="confirm-button"]'));
    await flush();
    expect(q('.modal').textContent).toContain('Someone changed this entry since you loaded version 7, so it was not deleted.');
    expect(onDone).not.toHaveBeenCalled();
    click(q('[data-testid="memory-delete-reload"]'));
    await flush();
    expect(getMemoryEntry).toHaveBeenCalledWith('default', 'mem_0004');
    expect(q('[data-testid="memory-delete-version"]').textContent).toContain('now at version 8');
    expect(q('[data-testid="memory-delete-reload"]')).toBeNull();
    click(q('[data-testid="confirm-button"]'));
    await flush();
    expect(deleteMemoryEntry).toHaveBeenLastCalledWith('default', 'mem_0004', 8);
    expect(onDone).toHaveBeenCalled();
  });

  it('says so when the entry is already gone', async () => {
    const deleteMemoryEntry = vi.fn(async () => Promise.reject(new ApiError(404, { code: 'NotFound', message: 'Memory entry mem_0004 not found.' })));
    mount(<DeleteMemoryModal entry={entries[3]} names={names} onClose={() => {}} onDone={() => {}} />, { apiClient: { deleteMemoryEntry } });
    click(q('[data-testid="confirm-button"]'));
    await flush();
    expect(q('.modal').textContent).toContain('This entry no longer exists.');
  });
});

describe('API client', () => {
  it('uses the documented memory routes', async () => {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url: String(url), method: init.method });
      if (init.method === 'DELETE') return new Response(null, { status: 204 });
      return new Response(JSON.stringify({ objects: [], totalRecords: 0 }), { status: 200 });
    });
    try {
      const api = new ApiClient('http://127.0.0.1:8700', 'tok');
      await api.listMemoryScopes('default');
      await api.listMemoryEntries('default', { scopeKind: 'Agent', scopeId: 'agt_1', tag: 'recall', writer: 'agt_1', pageNumber: 2, pageSize: 25 });
      await api.getMemoryEntry('default', 'mem_1');
      await api.getMemoryContent('default', 'mem_1');
      await api.deleteMemoryEntry('default', 'mem_1', 3);
      await api.deleteMemoryEntry('default', 'mem_2');
      expect(calls.map((c) => `${c.method} ${c.url.replace('http://127.0.0.1:8700/v1.0/api/tenants/default/', '')}`)).toEqual([
        'GET memory/scopes',
        'GET memory/entries?scopeKind=Agent&scopeId=agt_1&tag=recall&writer=agt_1&maxResults=25&skip=25',
        'GET memory/entries/mem_1',
        'GET memory/entries/mem_1/content',
        'DELETE memory/entries/mem_1?expectedVersion=3',
        'DELETE memory/entries/mem_2'
      ]);
    } finally {
      globalThis.fetch = original;
    }
  });
});
