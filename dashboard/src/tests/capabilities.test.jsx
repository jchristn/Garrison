// Capability catalog (AD4.8): the helpers (paging, locks, sources, bodies, tool probe rules, revision drafts), the API
// client routes, the Capabilities page configuration (filters, columns, locked Edit and Delete, form, body), the detail
// panel (source links, Unknown hints never shown as zero, refresh warning), the refresh dialog (totals and per-server
// errors), the revision capability editor and the Revisions column, tool probes on harness profiles, the NoToolWorker
// blocked reason, and the new labels in every locale.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import { en, TRANSLATIONS } from '../i18n/resources';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import CapabilityDetail, { CapabilityHints, CapabilitySource } from '../components/CapabilityDetail';
import CapabilityRefreshModal from '../components/CapabilityRefreshModal';
import AgentCapabilitiesModal from '../components/AgentCapabilitiesModal';
import AgentRevisionsPanel from '../components/AgentRevisionsPanel';
import ActionMenu from '../components/ActionMenu';
import { BlockedRunNotice } from '../components/BlockedRun';
import { capabilitiesConfig, harnessProfilesConfig } from '../views/resourceConfigs';
import { PAGE_VIEWS } from '../views/hubs/hubPanels';
import { findPage, pathFor } from '../config/navConfig';
import ApiClient, { ApiError } from '../utils/api';
import { ENUMS } from '../utils/constants';
import { errorMessage, fieldErrorMessages } from '../utils/errors';
import { translateServerText } from '../utils/serverText';
import {
  CAPABILITY_KINDS,
  PROBE_ARGUMENTS,
  capabilityDraftBody,
  capabilityErrors,
  capabilityToBody,
  capabilityToForm,
  catalogNames,
  cleanNames,
  isEditableCapability,
  lockedReasonKey,
  pageCapabilities,
  probeError,
  probeProblems,
  probesToBody,
  probesToForm,
  refreshTotals,
  requirementText,
  sameNames,
  sourceOf,
  toolNamesOf
} from '../utils/capabilities';
import { CAPABILITY_REFRESH, agentRevision, agentRevisions, capabilities, capability, mockRun, revisionDiff, revisionId } from '../../tests/e2e/mocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
const q = (sel) => document.body.querySelector(sel);
const LOOKUPS = { agents: { agt_0001: 'echo-agent', agt_0002: 'agent-2' }, mcpServers: { mcp_0001: 'mcp-1' }, harnessProfiles: { hp_0001: 'builtin/claude-code', hp_0002: 'profile-2' } };

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

const html = (node) => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);

describe('capability helpers', () => {
  it('locks derived and shared entries and says why', () => {
    expect(isEditableCapability(capability(6))).toBe(true);
    expect(isEditableCapability(capability(1))).toBe(false);
    expect(isEditableCapability({ ...capability(6), tenantId: null })).toBe(false);
    expect(lockedReasonKey(capability(6))).toBe('');
    expect(lockedReasonKey(capability(1))).toBe('tips.capabilities.locked.Agent');
    expect(lockedReasonKey(capability(3))).toBe('tips.capabilities.locked.McpTool');
    expect(lockedReasonKey(capability(5))).toBe('tips.capabilities.locked.HarnessBuiltIn');
    expect(lockedReasonKey(capability(4))).toBe('tips.capabilities.lockedShared');
    expect(t(lockedReasonKey(capability(3)))).toMatch(/cannot be edited or deleted here/);
  });

  it('sorts and pages the whole catalog in the browser', () => {
    const rows = capabilities();
    const first = pageCapabilities(rows, { pageNumber: 1, pageSize: 4, ordering: 'NameAscending' });
    expect(first.items.map((r) => r.name)).toEqual(['agent-2', 'doc-convert', 'echo-agent', 'libreoffice']);
    expect(first).toMatchObject({ totalCount: 6, totalPages: 2, pageNumber: 1, pageSize: 4 });
    expect(pageCapabilities(rows, { pageNumber: 2, pageSize: 4 }).items.map((r) => r.name)).toEqual(['mcp-1/search', 'pandoc']);
    expect(pageCapabilities(rows, { pageNumber: 9, pageSize: 4 }).pageNumber).toBe(2);
    expect(pageCapabilities(rows, { ordering: 'NameDescending' }).items[0].name).toBe('pandoc');
    // The mocks date row 1 newest.
    expect(pageCapabilities(rows, { ordering: 'CreatedDescending' }).items[0].id).toBe('cap_0001');
    expect(pageCapabilities(rows, { ordering: 'CreatedAscending' }).items[0].id).toBe('cap_0006');
    expect(pageCapabilities(null).items).toEqual([]);
  });

  it('finds the source of each kind and the node labels', () => {
    expect(sourceOf(capability(1))).toEqual({ type: 'agent', id: 'agt_0001' });
    expect(sourceOf(capability(3))).toEqual({ type: 'mcpServer', id: 'mcp_0001', tool: 'search' });
    expect(sourceOf(capability(4))).toEqual({ type: 'harnessProfile', id: 'hp_0001' });
    expect(sourceOf(capability(6))).toEqual({ type: 'none' });
    expect(requirementText({ key: 'garrison.io/tool-pandoc', value: 'true' })).toBe('garrison.io/tool-pandoc=true');
    expect(requirementText({ key: 'gpu', value: '' })).toBe('gpu=true');
    expect(toolNamesOf([{ key: 'garrison.io/tool-pandoc', value: 'true' }, { key: 'zone', value: 'a' }, { key: 'garrison.io/tool-python3', value: 'true' }])).toEqual(['pandoc', 'python3']);
  });

  it('checks a manual entry and builds its body', () => {
    expect(capabilityErrors({ name: ' ' }, t)).toHaveProperty('name');
    const errors = capabilityErrors({ name: 'x', inputSchemaJson: '{', tags: Array.from({ length: 33 }, (_, i) => `t${i}`), requirements: [{ key: '', value: 'x' }], kind: 'McpTool', sourceToolName: 'search' }, t);
    expect(Object.keys(errors).sort()).toEqual(['inputSchemaJson', 'requirements', 'sourceToolName', 'tags']);
    expect(capabilityErrors(capabilityToForm(capability(6)), t)).toEqual({});
    expect(
      capabilityToBody({ name: ' doc-convert ', kind: 'McpTool', summary: ' ', inputSchemaJson: '', outputSchemaJson: '{"type":"object"}', tags: [' docs ', ''], requirements: [{ key: ' gpu ', value: '' }, { key: '', value: '' }], sourceAgentId: 'agt_0001', sourceMcpServerId: 'mcp_0001', sourceToolName: ' convert ' })
    ).toEqual({ name: 'doc-convert', kind: 'McpTool', summary: null, inputSchemaJson: null, outputSchemaJson: '{"type":"object"}', tags: ['docs'], requirements: [{ key: 'gpu', value: 'true' }], sourceAgentId: null, sourceMcpServerId: 'mcp_0001', sourceToolName: 'convert' });
    expect(capabilityToBody({ name: 'a', kind: 'Agent', sourceAgentId: 'agt_0001', sourceMcpServerId: 'mcp_0001', sourceToolName: 'x' })).toMatchObject({ sourceAgentId: 'agt_0001', sourceMcpServerId: null, sourceToolName: null });
  });

  it('applies the tool probe rules of the server', () => {
    expect(PROBE_ARGUMENTS).toEqual(['--version', '-version', '-v', '-V', 'version', '--help', '-h']);
    const form = probesToForm([{ name: 'pandoc', executable: 'pandoc', arguments: ['--version'], description: 'Converts documents.' }, { name: 'jq', executable: 'jq', arguments: [] }]);
    expect(form).toEqual([
      { name: 'pandoc', executable: 'pandoc', argument: '--version', description: 'Converts documents.' },
      { name: 'jq', executable: 'jq', argument: '', description: '' }
    ]);
    expect(probesToBody([...form, { name: '', executable: '', argument: '--version', description: '' }])).toEqual([
      { name: 'pandoc', executable: 'pandoc', arguments: ['--version'], description: 'Converts documents.' },
      { name: 'jq', executable: 'jq', arguments: [] }
    ]);
    expect(probeProblems(form, t)).toEqual({});
    const bad = probeProblems(
      [
        { name: 'Pandoc', executable: '/usr/bin/pandoc', argument: '--output=x' },
        { name: 'jq', executable: 'jq', argument: '' },
        { name: 'jq', executable: 'jq', argument: '-h', description: 'x'.repeat(1025) }
      ],
      t
    );
    expect(Object.keys(bad)).toEqual(['0', '2']);
    expect(bad[0]).toMatch(/lowercase/);
    expect(bad[0]).toMatch(/no folder/);
    expect(bad[0]).toMatch(/--version, -version/);
    expect(bad[2]).toMatch(/Another probe in this profile is named jq/);
    expect(bad[2]).toMatch(/at most 1024/);
    expect(probeProblems(Array.from({ length: 33 }, (_, i) => ({ name: `t${i}`, executable: 't' })), t).count).toMatch(/at most 32/);
    expect(probeError([{ name: 'ok', executable: 'bad/path' }], t)).toMatch(/^Item 1: /);
    expect(probeError(form, t)).toBe('');
  });

  it('builds a draft body that changes only the capabilities', () => {
    const draft = agentRevision('agt_0001', 3);
    const body = capabilityDraftBody(draft, [' pandoc ', 'echo-agent', 'pandoc', '']);
    expect(body.capabilities).toEqual(['pandoc', 'echo-agent']);
    expect(body.assetPins).toEqual(draft.assetPins);
    expect(body).not.toHaveProperty('id');
    expect(body).not.toHaveProperty('state');
    const fromPublished = capabilityDraftBody({ ...agentRevision('agt_0001', 2) }, []);
    expect(fromPublished).not.toHaveProperty('changeNote');
    expect(cleanNames(['a', ' a', 'b'])).toEqual(['a', 'b']);
    expect(sameNames(['b', 'a'], ['a', 'b', 'a'])).toBe(true);
    expect(catalogNames([...capabilities(), { ...capability(4), id: 'cap_0010', kind: 'McpTool' }]).find((c) => c.name === 'pandoc').kinds).toEqual(['HarnessBuiltIn', 'McpTool']);
  });

  it('totals a refresh result', () => {
    expect(refreshTotals(CAPABILITY_REFRESH)).toEqual({ agents: 2, harnessBuiltIns: 1, hints: 2, servers: 2, failed: 1, tools: 3, removed: 1, warned: 1 });
    expect(refreshTotals(null)).toMatchObject({ servers: 0, failed: 0 });
  });
});

describe('API client', () => {
  const client = () => {
    const c = new ApiClient('http://127.0.0.1:8700');
    c.token = 'tok';
    return c;
  };
  const respond = (body, status = 200) => vi.fn().mockResolvedValue({ ok: status < 400, status, text: () => Promise.resolve(body === null ? '' : JSON.stringify(body)) });

  afterEach(() => vi.unstubAllGlobals());

  it('lists the catalog with only kind, tag, and search', async () => {
    const fetch = respond({ objects: capabilities(), totalRecords: 6 });
    vi.stubGlobal('fetch', fetch);
    const r = await client().listCapabilities('default', { kind: 'McpTool', tag: 'docs', search: 'convert', pageNumber: 2 });
    const url = new URL(fetch.mock.calls[0][0]);
    expect(url.pathname).toBe('/v1.0/api/tenants/default/capabilities');
    expect(Object.fromEntries(url.searchParams)).toEqual({ kind: 'McpTool', tag: 'docs', search: 'convert' });
    expect(r.items).toHaveLength(6);
    expect(r.totalCount).toBe(6);
  });

  it('creates, updates, deletes, and refreshes', async () => {
    const fetch = respond(capability(6));
    vi.stubGlobal('fetch', fetch);
    const c = client();
    await c.createCapability('default', { name: 'x' });
    await c.updateCapability('default', 'cap_0006', { name: 'x' });
    await c.getCapability('default', 'mcp-1/search');
    await c.refreshCapabilities('default', 'mcp_0001');
    await c.refreshCapabilities('default');
    const calls = fetch.mock.calls.map(([u, init]) => `${init.method} ${new URL(u).pathname}${new URL(u).search}`);
    expect(calls).toEqual([
      'POST /v1.0/api/tenants/default/capabilities',
      'PUT /v1.0/api/tenants/default/capabilities/cap_0006',
      'GET /v1.0/api/tenants/default/capabilities/mcp-1%2Fsearch',
      'POST /v1.0/api/tenants/default/capabilities/refresh?mcpServerId=mcp_0001',
      'POST /v1.0/api/tenants/default/capabilities/refresh'
    ]);
    vi.stubGlobal('fetch', respond(null, 204));
    await expect(c.deleteCapability('default', 'cap_0006')).resolves.toBeNull();
  });
});

describe('Capabilities page configuration', () => {
  const ctx = { t, i18n, lookups: LOOKUPS };

  it('is a tab of the Agents hub', () => {
    expect(findPage('capabilities')).toMatchObject({ hub: 'agents', tab: 'capabilities' });
    expect(pathFor('capabilities')).toBe('/dashboard/agents?tab=capabilities');
    expect(PAGE_VIEWS.capabilities).toBeTruthy();
  });

  it('filters by kind on the server and by origin in the browser', async () => {
    expect(capabilitiesConfig.filters.map((f) => f.name)).toEqual(['kind', 'origin', 'tag']);
    expect(capabilitiesConfig.filters[0].options).toEqual(CAPABILITY_KINDS);
    expect(capabilitiesConfig.filters[1].clientSide).toBe(true);
    const listCapabilities = vi.fn().mockResolvedValue({ items: capabilities(), totalCount: 6 });
    const page = await capabilitiesConfig.api.list({ listCapabilities }, 'default', { pageNumber: 1, pageSize: 25, ordering: 'NameAscending', kind: 'Agent', search: 'echo' });
    expect(listCapabilities).toHaveBeenCalledWith('default', { kind: 'Agent', search: 'echo' });
    expect(page.items[0].name).toBe('agent-2');
  });

  it('keeps Edit and Delete for derived entries disabled with the reason', () => {
    expect(capabilitiesConfig.bulkDelete).toBe(false);
    expect(capabilitiesConfig.isEditable(capability(1))).toBe(false);
    expect(capabilitiesConfig.canDelete(capability(6))).toBe(true);
    expect(capabilitiesConfig.lockedReason(capability(1), { t })).toMatch(/Publish a new revision/);
    expect(capabilitiesConfig.lockedReason(capability(4), { t })).toMatch(/Shared by every tenant/);
    expect(capabilitiesConfig.lockedReason(capability(6), { t })).toBe('');
  });

  it('renders kind, origin, source links, hints, and the warning badge', () => {
    const cols = Object.fromEntries(capabilitiesConfig.columns(ctx).map((c) => [c.key, c]));
    expect(Object.keys(cols)).toEqual(['name', 'kind', 'origin', 'summary', 'source', 'hints', 'tags', 'lastRefreshedUtc', 'id', 'createdUtc']);
    expect(html(cols.name.render(capability(3)))).toContain('Refresh failed');
    expect(html(cols.name.render(capability(1)))).not.toContain('Refresh failed');
    expect(html(cols.kind.render(capability(3)))).toContain('MCP tool');
    expect(html(cols.origin.render(capability(4)))).toContain('Shared');
    expect(html(cols.source.render(capability(1)))).toContain('href="/dashboard/agents/agt_0001"');
    const mcp = html(cols.source.render(capability(3)));
    expect(mcp).toContain('href="/dashboard/configuration?tab=mcp-servers&amp;search=mcp-1"');
    expect(mcp).toContain('<code');
    expect(mcp).toContain('search</code>');
    const builtIn = html(cols.source.render(capability(4)));
    expect(builtIn).toContain('href="/dashboard/configuration?search=builtin%2Fclaude-code"');
    expect(builtIn).toContain('garrison.io/tool-pandoc=true');
    expect(html(cols.source.render(capability(6)))).toContain('Manual entry');
    expect(html(cols.hints.render(capability(1)))).toMatch(/Median 4\.2 s, p90 9\.1 s, \$0\.0123 per run/);
    expect(html(cols.hints.render(capability(2)))).toContain('Unknown');
    expect(cols.source.csv(capability(3), LOOKUPS)).toBe('mcp-1/search');
  });

  it('shows the form for manual entries and nothing in the view dialog', () => {
    const fields = (d, mode) => capabilitiesConfig.fields(d, { t, mode, options: { agents: [{ id: 'agt_0001', name: 'echo-agent' }], servers: [{ id: 'mcp_0001', name: 'mcp-1' }] } });
    expect(fields(capabilityToForm(capability(6)), 'view')).toEqual([]);
    const names = fields(capabilitiesConfig.blank(), 'create').map((f) => f.name);
    expect(names).toEqual(['name', 'kind', 'summary', 'sourceAgentId', 'sourceMcpServerId', 'sourceToolName', 'tags', 'requirements', 'inputSchemaJson', 'outputSchemaJson']);
    const byName = Object.fromEntries(fields(capabilitiesConfig.blank(), 'create').map((f) => [f.name, f]));
    expect(byName.sourceAgentId.showIf({ kind: 'Agent' })).toBe(true);
    expect(byName.sourceMcpServerId.showIf({ kind: 'Agent' })).toBe(false);
    expect(byName.sourceToolName.showIf({ kind: 'McpTool', sourceMcpServerId: 'mcp_0001' })).toBe(true);
    expect(capabilitiesConfig.validate({ name: '' }, t)).toHaveProperty('name');
    expect(capabilitiesConfig.toBody(capabilityToForm(capability(6)))).toMatchObject({ name: 'doc-convert', kind: 'McpTool', tags: ['docs'], outputSchemaJson: '{"type":"object"}' });
  });

  it('translates the catalog refusals and the schema field code', () => {
    expect(errorMessage(t, new ApiError(409, { code: 'CapabilityDerived', message: 'Capability echo-agent is derived from its source and follows it; change the source instead.' }))).toBe('Capability echo-agent is derived from its source and follows it. Change the source instead.');
    expect(errorMessage(t, new ApiError(409, { code: 'CapabilityDerived' }))).toMatch(/cannot be edited or deleted here/);
    expect(errorMessage(t, new ApiError(409, { code: 'NameConflict', message: 'A manual capability named doc-convert already exists.' }))).toBe('A manual capability named doc-convert already exists.');
    const schema = new ApiError(400, { code: 'InvalidJsonSchema', message: 'The capability is not valid: x', fields: { outputSchemaJson: 'x' }, fieldCodes: { outputSchemaJson: 'InvalidJsonSchema' } });
    expect(errorMessage(t, schema)).toMatch(/not a valid JSON Schema/);
    expect(fieldErrorMessages(t, schema)).toEqual({ outputSchemaJson: 'This is not a valid JSON Schema.' });
    expect(translateServerText(t, 'Refresh failed 2026-10-28 09:15:00Z: Connection refused')).toBe('Refresh failed at 2026-10-28 09:15:00Z: Connection refused');
    expect(translateServerText(t, 'Required tools are missing: search, fetch.')).toBe('Required tools are missing: search, fetch.');
  });
});

describe('detail panel', () => {
  it('shows Known hints with values and links the agent', () => {
    mount(<CapabilityDetail descriptor={capability(1)} lookups={LOOKUPS} />);
    expect(q('[data-testid="capability-hints"]').getAttribute('data-status')).toBe('Known');
    expect(q('[data-item="sampleSize"]').textContent).toContain('12');
    expect(q('[data-item="medianDurationMs"]').textContent).toContain('4.2 s');
    expect(q('[data-item="meanCostUsd"]').textContent).toContain('$0.0123');
    expect(q('[data-item="windowDays"]').textContent).toContain('14 days');
    expect(q('[data-testid="capability-source-link"]').getAttribute('href')).toBe('/dashboard/agents/agt_0001');
    expect(q('[data-testid="capability-locked"]').textContent).toMatch(/Publish a new revision/);
    expect(q('[data-testid="capability-warning"]')).toBeNull();
  });

  it('never shows zero for Unknown hints', () => {
    mount(<CapabilityDetail descriptor={{ ...capability(2), hints: { status: 'Unknown', sampleSize: 0, medianDurationMs: 0, p90DurationMs: 0, meanCostUsd: 0, windowDays: 14 } }} lookups={LOOKUPS} />);
    const hints = q('[data-testid="capability-hints"]');
    expect(hints.getAttribute('data-status')).toBe('Unknown');
    for (const key of ['sampleSize', 'medianDurationMs', 'p90DurationMs', 'meanCostUsd']) {
      expect(q(`[data-item="${key}"] .detail-item-value`).textContent, key).toBe('Unknown');
    }
    expect(hints.textContent).not.toMatch(/\b0\b|\$0/);
    expect(html(<CapabilityHints hints={{ status: 'Unknown', medianDurationMs: 0 }} t={t} lng="en" />)).toContain('Unknown');
  });

  it('shows the refresh warning prominently and the node labels of a built-in', () => {
    mount(<CapabilityDetail descriptor={capability(5)} lookups={LOOKUPS} />);
    expect(q('[data-testid="capability-warning"]').textContent).toContain('Workers probe libreoffice as soffice --version, which another harness profile defined first.');
    expect(q('[data-testid="capability-requirements"]').textContent).toBe('garrison.io/tool-libreoffice=true');
    expect(q('[data-testid="capability-source-link"]').textContent).toBe('profile-2');
  });

  it('names a manual entry without a source', () => {
    expect(html(<CapabilitySource descriptor={capability(6)} lookups={LOOKUPS} t={t} />)).toContain('Manual entry');
    mount(<CapabilityDetail descriptor={capability(6)} lookups={LOOKUPS} />);
    expect(q('[data-testid="capability-locked"]')).toBeNull();
  });
});

describe('locked row actions', () => {
  it('keeps a disabled item in the menu with its tooltip and ignores clicks', () => {
    const onClick = vi.fn();
    mount(<ActionMenu label="echo-agent" items={[{ label: 'Edit', tip: 'Derived from the agent, so it cannot be edited here.', disabled: true, onClick }]} />);
    click(q('.action-menu-trigger'));
    const item = q('.action-menu-item');
    expect(item.getAttribute('aria-disabled')).toBe('true');
    expect(item.getAttribute('data-tip')).toMatch(/cannot be edited/);
    click(item);
    expect(onClick).not.toHaveBeenCalled();
    expect(q('.action-menu-dropdown')).not.toBeNull();
  });
});

describe('refresh dialog', () => {
  it('refreshes one server and shows totals and per-server errors', async () => {
    const refreshCapabilities = vi.fn().mockResolvedValue(CAPABILITY_REFRESH);
    const listMcpServers = vi.fn().mockResolvedValue({ items: [{ id: 'mcp_0001', name: 'mcp-1', active: true }, { id: 'mcp_0002', name: 'mcp-2', active: true }] });
    const onDone = vi.fn();
    const { addToast } = mount(<CapabilityRefreshModal onClose={() => {}} onDone={onDone} />, { apiClient: { refreshCapabilities, listMcpServers } });
    await flush();
    choose(q('[data-testid="capability-refresh-server"]'), 'mcp_0001');
    click(q('[data-testid="capability-refresh-run"]'));
    await flush();
    expect(refreshCapabilities).toHaveBeenCalledWith('default', 'mcp_0001');
    expect(q('[data-total="agents"]').textContent).toContain('2');
    expect(q('[data-total="failed"]').textContent).toContain('1');
    expect(q('[data-server="mcp-1"]').getAttribute('data-failed')).toBe('true');
    expect(q('[data-server="mcp-1"] [data-cell="error"]').textContent).toBe('Connection refused (127.0.0.1:9000)');
    expect(q('[data-server="mcp-2"] [data-cell="error"]').textContent).toBe('-');
    expect(addToast).toHaveBeenCalledWith({ type: 'warning', message: 'The catalog was refreshed, but 1 MCP server could not be listed.' });
    expect(onDone).toHaveBeenCalled();
  });

  it('shows a refusal in the dialog', async () => {
    const refreshCapabilities = vi.fn().mockRejectedValue(new ApiError(403, { code: 'Forbidden', message: 'Forbidden' }));
    mount(<CapabilityRefreshModal onClose={() => {}} />, { apiClient: { refreshCapabilities, listMcpServers: vi.fn().mockResolvedValue({ items: [] }) } });
    await flush();
    click(q('[data-testid="capability-refresh-run"]'));
    await flush();
    expect(refreshCapabilities).toHaveBeenCalledWith('default', null);
    expect(q('.error-banner')).not.toBeNull();
    expect(q('[data-testid="capability-refresh-result"]')).toBeNull();
  });
});

describe('capabilities on revisions', () => {
  const AGENT = { id: 'agt_0001', name: 'echo-agent', latestPublishedRevisionId: revisionId('agt_0001', 2), draftRevisionId: revisionId('agt_0001', 3) };
  const page = (objects) => ({ items: objects, totalCount: objects.length });
  const client = (extra = {}) => ({
    listAgentRevisions: vi.fn().mockResolvedValue(page(agentRevisions('agt_0001').map((r) => (r.number === 3 ? { ...r, capabilities: ['pandoc'] } : r)))),
    diffAgentRevisions: vi.fn((_t, agentId, from, to) => Promise.resolve(revisionDiff(agentId, from, to))),
    listAgentAssets: vi.fn().mockResolvedValue(page([])),
    listCapabilities: vi.fn().mockResolvedValue(page(capabilities())),
    ...extra
  });

  it('shows each revision capabilities on the Revisions panel', async () => {
    mount(<AgentRevisionsPanel agent={AGENT} />, { apiClient: client() });
    await flush();
    await flush();
    expect(q('[data-revision="3"] [data-cell="capabilities"]').textContent).toBe('pandoc');
    expect(q('[data-revision="2"] [data-cell="capabilities"]').textContent).toBe('-');
    expect(q('[data-revision="3"] [data-testid="revision-capabilities"]')).not.toBeNull();
    expect(q('[data-testid="revision-capabilities-new"]')).toBeNull();
  });

  it('picks capabilities from the catalog and saves the complete draft', async () => {
    const saveAgentDraft = vi.fn().mockResolvedValue({ number: 3, state: 'Draft' });
    const onSaved = vi.fn();
    const draft = { ...agentRevision('agt_0001', 3), capabilities: ['pandoc', 'retired-tool'] };
    const { addToast } = mount(<AgentCapabilitiesModal agent={AGENT} revision={draft} onClose={() => {}} onSaved={onSaved} />, { apiClient: client({ saveAgentDraft }) });
    await flush();
    expect(q('[data-testid="revision-capabilities-save"]').disabled).toBe(true);
    expect(q('[data-capability="pandoc"]').textContent).toContain('Harness built-in');
    expect(q('[data-capability="retired-tool"]').textContent).toContain('Not in the catalog');
    const options = [...q('[data-testid="revision-capability-choice"]').options].map((o) => o.value);
    expect(options).not.toContain('pandoc');
    expect(options).toContain('echo-agent');
    choose(q('[data-testid="revision-capability-choice"]'), 'echo-agent');
    click(q('[data-testid="revision-capability-add"]'));
    click(q('[data-capability="retired-tool"] [data-testid="revision-capability-remove"]'));
    click(q('[data-testid="revision-capabilities-save"]'));
    await flush();
    const [, agentId, body] = saveAgentDraft.mock.calls[0];
    expect(agentId).toBe('agt_0001');
    expect(body.capabilities).toEqual(['pandoc', 'echo-agent']);
    expect(body.assetPins).toEqual(draft.assetPins);
    expect(body).not.toHaveProperty('number');
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Saved the capabilities on draft revision 3.' });
    expect(onSaved).toHaveBeenCalled();
  });

  it('starts a new draft from the latest published revision when there is none', async () => {
    const published = agentRevisions('agt_0002');
    mount(<AgentRevisionsPanel agent={{ id: 'agt_0002', name: 'agent-2', latestPublishedRevisionId: revisionId('agt_0002', 2) }} />, { apiClient: client({ listAgentRevisions: vi.fn().mockResolvedValue(page(published)) }) });
    await flush();
    click(q('[data-testid="revision-capabilities-new"]'));
    await flush();
    expect(q('[data-testid="revision-capabilities-source"]').textContent).toContain('new draft from published revision 2');
  });
});

describe('tool probes on harness profiles', () => {
  it('edits probes with one allowed argument and validates them', () => {
    const fields = harnessProfilesConfig.fields(harnessProfilesConfig.blank(), { t, mode: 'create', options: {} });
    const probes = fields.find((f) => f.name === 'toolProbes');
    expect(probes.type).toBe('objectList');
    expect(probes.fields.map((f) => f.name)).toEqual(['name', 'executable', 'argument', 'description']);
    expect(probes.fields.find((f) => f.name === 'argument').options.map((o) => o.value)).toEqual(PROBE_ARGUMENTS);
    expect(probes.fields.every((f) => f.tip && f.tip.length > 25)).toBe(true);
    const form = harnessProfilesConfig.toForm({ name: 'p', executable: 'claude', toolProbes: [{ name: 'pandoc', executable: 'pandoc', arguments: ['--version'] }] });
    expect(form.toolProbes).toEqual([{ name: 'pandoc', executable: 'pandoc', argument: '--version', description: '' }]);
    expect(harnessProfilesConfig.toBody({ ...form, successExitCodes: ['0'] }).toolProbes).toEqual([{ name: 'pandoc', executable: 'pandoc', arguments: ['--version'] }]);
    expect(harnessProfilesConfig.validate({ ...form, toolProbes: [{ name: 'pandoc', executable: '../pandoc', argument: '' }] }, t).toolProbes).toMatch(/Item 1: .*bare file name/);
    expect(harnessProfilesConfig.validate(form, t)).toEqual({});
  });
});

describe('NoToolWorker and labels', () => {
  it('explains a run blocked on a tool and names the tool', () => {
    const run = mockRun('run_0033', { status: 'Queued', blockedReason: 'NoToolWorker', harnessType: 'ClaudeCode', requirements: [{ key: 'garrison.io/tool-pandoc', value: 'true' }] });
    mount(<BlockedRunNotice run={run} />);
    expect(q('.blocked-badge').textContent).toContain('No worker with the tool');
    expect(q('[data-testid="blocked-reason-text"]').textContent).toMatch(/uses pandoc, and no Ready worker that can run Claude Code reports it/);
  });

  it('labels the new enums and resource types in every locale', () => {
    expect(ENUMS.runBlockedReason).toContain('NoToolWorker');
    expect(ENUMS.resourceType).toEqual(expect.arrayContaining(['Capability', 'ConversationFileSpace']));
    expect(ENUMS.capabilityKind).toEqual(CAPABILITY_KINDS);
    for (const [code, catalog] of Object.entries(TRANSLATIONS)) {
      expect(catalog.enums.runBlockedReason.NoToolWorker, code).toBeTruthy();
      expect(catalog.enums.runBlockedReason.NoToolWorker, code).not.toBe(en.enums.runBlockedReason.NoToolWorker);
      expect(catalog.tips.enums.runBlockedReason.NoToolWorker, code).toBeTruthy();
      expect(catalog.enums.resourceType.Capability, code).toBeTruthy();
      expect(catalog.enums.resourceType.ConversationFileSpace, code).toBeTruthy();
      for (const kind of CAPABILITY_KINDS) expect(catalog.enums.capabilityKind[kind], `${code} ${kind}`).toBeTruthy();
    }
  });
});
