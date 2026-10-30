// Agentic apps (AD6.11): the helpers (form and body, client checks worded like the server's field codes, graph layout,
// sign-in explanations, URL, promotion body and checks, delegation summary, permissions), the API client routes, the
// Apps page configuration (columns, steps, missing permissions, field codes, 409s on fields), the graph, the share
// link, the delegation dialog (drift, Write drafts, DraftConflict), and the revisions dialog (take, publish, promote
// with NoTargetDeployments naming the member).
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import AgenticAppGraph from '../components/AgenticAppGraph';
import AgenticAppShare from '../components/AgenticAppShare';
import AgenticAppDelegationModal from '../components/AgenticAppDelegationModal';
import AgenticAppRevisionsModal from '../components/AgenticAppRevisionsModal';
import { appsConfig } from '../views/resourceConfigs';
import { appDenied } from '../views/appConfigs';
import { PAGE_VIEWS } from '../views/hubs/hubPanels';
import { findPage, pathFor } from '../config/navConfig';
import ApiClient, { ApiError } from '../utils/api';
import { ENUMS } from '../utils/constants';
import { errorMessage, fieldErrorMessages, withListItemErrors } from '../utils/errors';
import { architectBody, architectFormErrors, needsCredential, suggestedCredential } from '../utils/architect';
import {
  APP_FIELD_CODES,
  canPromoteTo,
  compareEnvironments,
  draftAppNames,
  environmentMatrix,
  sortPromotions,
  appDuplicate,
  appErrors,
  appPromotionBody,
  appPromotionErrors,
  appToBody,
  appToForm,
  appUrl,
  blankApp,
  delegationSummary,
  effectiveSlug,
  entryDeployments,
  hasCycle,
  holds,
  latestAppRevision,
  layoutAppGraph,
  loadCallerPermissions,
  signInKey,
  sortAppRevisions,
  unreachableMembers,
  unreachableNames
} from '../utils/apps';
import { ENVIRONMENTS, agenticApp, appDelegation, appRevision } from '../../tests/e2e/mocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
const q = (sel) => document.body.querySelector(sel);
const NAMES = { agt_0001: 'echo-agent', agt_0002: 'agent-2', agt_0003: 'agent-3' };
const nameOf = (id) => NAMES[id] || id;

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

function click(el) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

function type(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  act(() => {
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
}

const html = (node) => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);

/** A valid three-member app form: echo-agent calls agent-2, which calls agent-3. */
function form(extra = {}) {
  return appToForm({ ...agenticApp(1), ...extra });
}

describe('app helpers', () => {
  it('builds the URL next to the dashboard and falls back to the name for the slug', () => {
    expect(appUrl('http://127.0.0.1:8080', 'research')).toBe('http://127.0.0.1:8080/apps/research/');
    expect(appUrl('http://127.0.0.1:8080/', 'research')).toBe('http://127.0.0.1:8080/apps/research/');
    expect(appUrl('http://127.0.0.1:8080', '')).toBe('');
    expect(effectiveSlug({ name: 'research', slug: '' })).toBe('research');
    expect(effectiveSlug({ name: 'support', slug: 'support-desk' })).toBe('support-desk');
  });

  it('explains who can sign in for every mode, including Anonymous without anonymous use', () => {
    expect(signInKey({ authMode: 'TenantUsers' })).toBe('TenantUsers');
    expect(signInKey({})).toBe('AppUsers');
    expect(signInKey({ authMode: 'Anonymous', anonymousEnabled: true })).toBe('Anonymous');
    expect(signInKey({ authMode: 'Anonymous', anonymousEnabled: false })).toBe('AnonymousDisabled');
    for (const key of ['TenantUsers', 'AppUsers', 'Anonymous', 'AnonymousDisabled']) {
      expect(t(`tips.apps.signIn.${key}`)).not.toBe(`tips.apps.signIn.${key}`);
      expect(t(`components.apps.share.signIn.${key}`)).not.toBe(`components.apps.share.signIn.${key}`);
    }
  });

  it('turns an app into a form and back, with empty optional values as null and the slug defaulting to the name', () => {
    const f = form({ slug: '', description: null, accentColor: null });
    expect(f.slug).toBe('');
    expect(f.accentColor).toBe('');
    expect(f.members[2]).toEqual({ agentId: 'agt_0003', role: '' });
    const body = appToBody({ ...f, members: [...f.members, { agentId: '', role: '' }], environments: [...f.environments, { environment: '', deploymentId: '' }] });
    expect(body.slug).toBe('research');
    expect(body.description).toBeNull();
    expect(body.accentColor).toBeNull();
    expect(body.members).toHaveLength(3);
    expect(body.members[2]).toEqual({ agentId: 'agt_0003', role: null });
    expect(body.edges[1]).toEqual({ callerAgentId: 'agt_0002', calleeAgentId: 'agt_0003', fanOutAllowed: false });
    expect(body.environments).toEqual([{ environment: 'dev', deploymentId: 'dep_0001' }]);
    expect(body).not.toHaveProperty('id');
    expect(body.authMode).toBe('AppUsers');
    expect(appToBody({ ...blankApp(), authMode: 'Bogus' }).authMode).toBe('AppUsers');
  });

  it('duplicates without identity, revision, or slug', () => {
    const copy = appDuplicate(agenticApp(1));
    expect(copy.id).toBeUndefined();
    expect(copy.latestPublishedRevisionId).toBeUndefined();
    expect(copy.name).toBe('research-copy');
    expect(copy.slug).toBe('');
    expect(copy.members).toHaveLength(3);
  });

  it('finds cycles and members the entry agent cannot reach', () => {
    expect(hasCycle(form())).toBe(false);
    const looped = form({ edges: [...agenticApp(1).edges, { callerAgentId: 'agt_0003', calleeAgentId: 'agt_0001' }] });
    expect(hasCycle(looped)).toBe(true);
    expect(unreachableMembers(form())).toEqual([]);
    expect(unreachableMembers(form({ edges: [agenticApp(1).edges[0]] }))).toEqual(['agt_0003']);
    expect(unreachableMembers(form({ entryAgentId: 'agt_0009' }))).toEqual([]);
  });

  it('checks the form the way the server does, with the same translated field codes', () => {
    expect(appErrors(form(), t)).toEqual({});
    const e = appErrors(form({ name: 'Bad Name', slug: 'x', primaryColor: 'blue', entryAgentId: 'agt_0009' }), t);
    expect(e.name).toBe(t('common.fieldCodes.InvalidName'));
    expect(e.slug).toBe(t('common.fieldCodes.InvalidSlug'));
    expect(e.primaryColor).toBe(t('common.fieldCodes.InvalidColor'));
    expect(e.entryAgentId).toBe(t('common.fieldCodes.EntryNotMember'));
    expect(appErrors({ ...blankApp(), name: 'empty' }, t).members).toBe(t('common.fieldCodes.Required'));
    const dup = appErrors(form({ members: [{ agentId: 'agt_0001' }, { agentId: 'agt_0001' }], edges: [] }), t);
    expect(dup.members).toBe(t('common.fieldCodes.DuplicateMember'));
    const edges = appErrors(form({ edges: [{ callerAgentId: 'agt_0001', calleeAgentId: 'agt_0009' }, { callerAgentId: 'agt_0002', calleeAgentId: 'agt_0002' }] }), t);
    expect(edges['edges[0].calleeAgentId']).toBe(t('common.fieldCodes.EdgeNotMember'));
    expect(edges['edges[1]']).toBe(t('common.fieldCodes.SelfEdge'));
    const looped = appErrors(form({ edges: [...agenticApp(1).edges, { callerAgentId: 'agt_0003', calleeAgentId: 'agt_0002' }] }), t);
    expect(looped.edges).toBe(t('common.fieldCodes.AppGraphCycle'));
    const lost = appErrors(form({ edges: [agenticApp(1).edges[0]] }), t, nameOf);
    expect(lost.edges).toContain('agent-3');
    const envs = appErrors(form({ environments: [{ environment: 'dev' }, { environment: 'dev' }] }), t);
    expect(envs.environments).toBe(t('common.fieldCodes.DuplicateEnvironment'));
  });

  it('lays the graph out in layers by the longest call path, with unreachable members last', () => {
    const layout = layoutAppGraph(form({ edges: [...agenticApp(1).edges, { callerAgentId: 'agt_0001', calleeAgentId: 'agt_0003' }] }));
    const layer = Object.fromEntries(layout.nodes.map((n) => [n.id, n.layer]));
    expect(layer).toEqual({ agt_0001: 0, agt_0002: 1, agt_0003: 2 });
    expect(layout.nodes.find((n) => n.id === 'agt_0001').entry).toBe(true);
    expect(layout.layers).toBe(3);
    const lost = layoutAppGraph(form({ edges: [agenticApp(1).edges[0]] }));
    expect(lost.nodes.find((n) => n.id === 'agt_0003')).toMatchObject({ unreachable: true, layer: 2 });
    // A cycle does not loop forever.
    const looped = layoutAppGraph(form({ edges: [...agenticApp(1).edges, { callerAgentId: 'agt_0003', calleeAgentId: 'agt_0002' }] }));
    expect(looped.nodes).toHaveLength(3);
    expect(layoutAppGraph(blankApp())).toMatchObject({ nodes: [], edges: [] });
  });

  it('offers only the entry agent deployments of the environment', () => {
    const deployments = [
      { id: 'dep_0001', agentId: 'agt_0001', environment: 'dev' },
      { id: 'dep_0002', agentId: 'agt_0001', environment: 'staging' },
      { id: 'dep_0003', agentId: 'agt_0003' }
    ];
    expect(entryDeployments(deployments, 'agt_0001', 'dev').map((d) => d.id)).toEqual(['dep_0001']);
    expect(entryDeployments(deployments, 'agt_0003', 'dev').map((d) => d.id)).toEqual(['dep_0003']);
    expect(entryDeployments(deployments, '', 'dev')).toEqual([]);
  });

  it('sorts revisions and finds the latest published one', () => {
    const list = sortAppRevisions([appRevision(1), appRevision(2)]);
    expect(list.map((r) => r.number)).toEqual([2, 1]);
    expect(latestAppRevision(list, agenticApp(1)).number).toBe(1);
    expect(latestAppRevision([appRevision(2)], {})).toBeNull();
  });

  it('builds the promote body and checks the dialog', () => {
    const envs = ENVIRONMENTS.environments;
    expect(appPromotionBody({ sourceEnvironment: 'dev', note: ' go ' }, envs)).toEqual({ sourceEnvironment: 'dev', targetEnvironment: 'staging', note: 'go' });
    expect(appPromotionBody({ sourceEnvironment: 'dev', targetEnvironment: 'prod', allowSkip: true, appRevision: 1 }, envs)).toEqual({ sourceEnvironment: 'dev', targetEnvironment: 'prod', appRevision: '1', allowSkip: true });
    expect(appPromotionErrors({ sourceEnvironment: '' }, envs, t).sourceEnvironment).toBeTruthy();
    expect(appPromotionErrors({ sourceEnvironment: 'prod' }, envs, t).targetEnvironment).toBeTruthy();
    expect(appPromotionErrors({ sourceEnvironment: 'dev', targetEnvironment: 'prod' }, envs, t).allowSkip).toBeTruthy();
    expect(appPromotionErrors({ sourceEnvironment: 'dev' }, envs, t)).toEqual({});
  });

  it('summarizes a delegation plan', () => {
    expect(delegationSummary(appDelegation())).toEqual({ members: 3, drifting: 2, drafts: 0, skipped: 0 });
    expect(delegationSummary(appDelegation('app_0001', true))).toEqual({ members: 3, drifting: 2, drafts: 1, skipped: 1 });
    expect(delegationSummary(null)).toEqual({ members: 0, drifting: 0, drafts: 0, skipped: 0 });
  });

  it('pulls member names out of the server UnreachableMember message', () => {
    expect(unreachableNames('Members the entry agent cannot reach through edges: writer, editor.')).toBe('writer, editor');
    expect(unreachableNames('')).toBe('');
  });

  it('decides permissions like the server: admins hold all, Deny wins, Write implies Create, resource scope counts for its resource', () => {
    expect(holds(null, 'AgenticApp', 'Create')).toBe(true);
    expect(holds({ isTenantAdmin: true }, 'AgenticApp', 'Delete')).toBe(true);
    const reader = { grants: [{ permissionType: 'Permit', resourceTypes: ['AgenticApp'], operations: ['Read'], scope: 'Tenant' }] };
    expect(holds(reader, 'AgenticApp', 'Read')).toBe(true);
    expect(holds(reader, 'AgenticApp', 'Create')).toBe(false);
    const writer = { grants: [{ permissionType: 'Permit', resourceTypes: ['All'], operations: ['Write'], scope: 'Tenant' }] };
    expect(holds(writer, 'AgenticApp', 'Update')).toBe(true);
    expect(holds(writer, 'AgenticApp', 'Execute')).toBe(false);
    const denied = { grants: [...writer.grants, { permissionType: 'Deny', resourceTypes: ['AgenticApp'], operations: ['Delete'], scope: 'Tenant' }] };
    expect(holds(denied, 'AgenticApp', 'Delete')).toBe(false);
    const scoped = { grants: [{ permissionType: 'Permit', resourceTypes: ['Promotion'], operations: ['Execute'], scope: 'Resource', resourceId: 'staging' }] };
    expect(holds(scoped, 'Promotion', 'Execute')).toBe(false);
    expect(holds(scoped, 'Promotion', 'Execute', { anyResource: true })).toBe(true);
    expect(holds(scoped, 'Promotion', 'Execute', { resourceId: 'staging' })).toBe(true);
    expect(holds(scoped, 'Promotion', 'Execute', { resourceId: 'prod' })).toBe(false);
  });

  it('loads the caller permissions only when needed', async () => {
    const api = { getUserPermissions: vi.fn(async () => ({ grants: [] })), getCredentialPermissions: vi.fn(async () => ({ grants: [] })) };
    expect(await loadCallerPermissions(api, 'default', { isAdmin: true })).toMatchObject({ isAdmin: true });
    expect(api.getUserPermissions).not.toHaveBeenCalled();
    await loadCallerPermissions(api, 'default', { principalType: 'User', userId: 'usr_1' });
    expect(api.getUserPermissions).toHaveBeenCalledWith('default', 'usr_1');
    await loadCallerPermissions(api, 'default', { principalType: 'Credential', credentialId: 'cred_1' });
    expect(api.getCredentialPermissions).toHaveBeenCalledWith('default', 'cred_1');
    expect(await loadCallerPermissions({ getUserPermissions: async () => Promise.reject(new Error('403')) }, 'default', { userId: 'usr_1' })).toBeNull();
    expect(await loadCallerPermissions(api, 'default', null)).toBeNull();
  });
});

describe('API client', () => {
  it('calls the app routes', async () => {
    const calls = [];
    const fetchMock = vi.fn(async (url, init) => {
      calls.push(`${init.method} ${String(url).replace('http://127.0.0.1:8700', '')}${init.body ? ` ${init.body}` : ''}`);
      const body = String(url).endsWith('/revisions') && init.method === 'GET' ? [appRevision(1)] : {};
      return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      const c = new ApiClient('http://127.0.0.1:8700', 'tok');
      await c.listApps('default', { pageNumber: 2, pageSize: 10, search: 'res' });
      await c.getApp('default', 'research');
      await c.createApp('default', { name: 'a' });
      await c.updateApp('default', 'app_1', { name: 'a' });
      await c.deleteApp('default', 'app_1');
      await c.getAppDelegation('default', 'app_1');
      await c.applyAppDelegation('default', 'app_1');
      expect((await c.listAppRevisions('default', 'app_1')).items).toHaveLength(1);
      await c.createAppRevision('default', 'app_1', 'note');
      await c.publishAppRevision('default', 'app_1', 2);
      await c.promoteApp('default', 'app_1', { sourceEnvironment: 'dev' });
    } finally {
      vi.unstubAllGlobals();
    }
    expect(calls).toEqual([
      'GET /v1.0/api/tenants/default/apps?search=res&maxResults=10&skip=10',
      'GET /v1.0/api/tenants/default/apps/research',
      'POST /v1.0/api/tenants/default/apps {"name":"a"}',
      'PUT /v1.0/api/tenants/default/apps/app_1 {"name":"a"}',
      'DELETE /v1.0/api/tenants/default/apps/app_1',
      'GET /v1.0/api/tenants/default/apps/app_1/delegation',
      'POST /v1.0/api/tenants/default/apps/app_1/delegation',
      'GET /v1.0/api/tenants/default/apps/app_1/revisions',
      'POST /v1.0/api/tenants/default/apps/app_1/revisions {"changeNote":"note"}',
      'POST /v1.0/api/tenants/default/apps/app_1/revisions/2/publish',
      'POST /v1.0/api/tenants/default/apps/app_1/promote {"sourceEnvironment":"dev"}'
    ]);
  });
});

describe('Apps page configuration', () => {
  const ctx = { t, i18n, apiClient: {}, tenantId: 'default', navigate: () => {}, addToast: () => {}, reload: () => {}, setExtraModal: vi.fn(), setJsonValue: () => {} };

  it('is a tab under Agents with its view', () => {
    expect(findPage('apps')).toMatchObject({ hub: 'agents', tab: 'apps' });
    expect(pathFor('apps')).toBe('/dashboard/agents?tab=apps');
    expect(PAGE_VIEWS.apps).toBeTruthy();
    expect(ENUMS.appAuthMode).toEqual(['TenantUsers', 'AppUsers', 'Anonymous']);
    expect(ENUMS.resourceType).toContain('AgenticApp');
  });

  it('lists name, URL, entry agent, members, live environment, sign-in, and status', () => {
    const cols = appsConfig.columns({ ...ctx, lookups: { agents: NAMES } });
    expect(cols.map((c) => c.key).slice(0, 7)).toEqual(['name', 'url', 'entryAgentId', 'members', 'liveEnvironment', 'authMode', 'active']);
    const row = agenticApp(1);
    const cell = (key) => html(cols.find((c) => c.key === key).render(row));
    expect(cell('url')).toContain('/apps/research/');
    expect(cell('entryAgentId')).toContain('echo-agent');
    expect(cell('members')).toContain('>3<');
    expect(cell('members')).toContain('echo-agent, agent-2, agent-3');
    expect(cell('authMode')).toContain('App users');
    expect(cell('liveEnvironment')).toContain('dev');
    expect(html(cols.find((c) => c.key === 'active').render(agenticApp(2)))).toContain('Inactive');
  });

  it('spreads the editor over five steps and names agents in the member, entry, and call pickers', () => {
    expect(appsConfig.steps).toEqual(['general', 'members', 'environments', 'access', 'branding']);
    const options = { agents: [{ id: 'agt_0001', name: 'echo-agent' }, { id: 'agt_0002', name: 'agent-2' }, { id: 'agt_0003', name: 'agent-3' }], deployments: [{ id: 'dep_0001', name: 'deployment-1', agentId: 'agt_0001', environment: 'dev' }, { id: 'dep_0002', name: 'deployment-2', agentId: 'agt_0001', environment: 'staging' }], assets: [{ id: 'aas_0001', name: 'style-guide' }], environments: ENVIRONMENTS.environments };
    const fields = appsConfig.fields(form(), { ...ctx, mode: 'edit', options });
    const byName = Object.fromEntries(fields.map((f) => [f.name, f]));
    expect(Object.keys(byName)).toEqual(expect.arrayContaining(['name', 'slug', 'members', 'entryAgentId', 'edges', 'graph', 'environments', 'liveEnvironment', 'authMode', 'anonymousEnabled', 'showOperatorDetail', 'share', 'displayName', 'logoAssetId', 'primaryColor', 'accentColor', 'welcomeText']));
    expect(byName.entryAgentId.options.map((o) => o.label)).toEqual(['echo-agent', 'agent-2', 'agent-3']);
    const callee = byName.edges.fields.find((f) => f.name === 'calleeAgentId');
    expect(callee.options({}).map((o) => o.label)).toEqual(['echo-agent', 'agent-2', 'agent-3']);
    const deployment = byName.environments.fields.find((f) => f.name === 'deploymentId');
    expect(deployment.options({ environment: 'dev' }).map((o) => o.value)).toEqual(['dep_0001']);
    expect(deployment.options({ environment: 'staging' }).map((o) => o.value)).toEqual(['dep_0002']);
    expect(byName.authMode.options.map((o) => o.label)).toEqual(['Tenant users', 'App users', 'Anonymous']);
    expect(byName.logoAssetId.options).toEqual([{ value: 'aas_0001', label: 'style-guide' }]);
    expect(byName.primaryColor.type).toBe('color');
    // New calls allow fan-out by default; edited ones keep their value.
    const adjust = byName.edges.rowAdjust;
    expect(adjust({ callerAgentId: '', fanOutAllowed: false }, null).fanOutAllowed).toBe(true);
    expect(adjust({ fanOutAllowed: false }, { fanOutAllowed: true }).fanOutAllowed).toBe(false);
  });

  it('disables actions the caller lacks the permission for, with the permission in the tooltip', () => {
    const reader = { grants: [{ permissionType: 'Permit', resourceTypes: ['AgenticApp'], operations: ['Read'], scope: 'Tenant' }] };
    const reason = appsConfig.deniedReason('create', null, { t, lookups: { permissions: reader } });
    expect(reason).toBe(appDenied(t, reader, 'AgenticApp', 'Create'));
    expect(reason).toContain('Create');
    expect(reason).toContain('Agentic app');
    expect(appsConfig.deniedReason('delete', agenticApp(1), { t, lookups: { permissions: { isAdmin: true } } })).toBe('');
    expect(appsConfig.deniedReason('update', agenticApp(1), { t, lookups: {} })).toBe('');
  });

  it('places field codes and 409 refusals on their fields', () => {
    const err = new ApiError(400, {
      code: 'ValidationFailed',
      message: 'The app is not valid.',
      fields: { entryAgentId: 'The entry agent must be one of the members.', 'edges[1].calleeAgentId': 'Edges connect members.', edges: 'Members the entry agent cannot reach through edges: writer, editor.' },
      fieldCodes: { entryAgentId: 'EntryNotMember', 'edges[1].calleeAgentId': 'EdgeNotMember', edges: 'UnreachableMember' }
    });
    const fields = withListItemErrors(t, fieldErrorMessages(t, err, appsConfig.fieldErrorSpecial(t)));
    expect(fields.entryAgentId).toBe(t('common.fieldCodes.EntryNotMember'));
    expect(fields['edges[1].calleeAgentId']).toBe(t('common.fieldCodes.EdgeNotMember'));
    expect(fields.edges).toContain('writer, editor');
    for (const code of APP_FIELD_CODES) expect(t(`common.fieldCodes.${code}`), code).not.toBe(`common.fieldCodes.${code}`);
    expect(appsConfig.errorFields(new ApiError(409, { code: 'AppSlugTaken', message: 'The URL slug research is taken. Slugs are unique across the cluster; choose another.' }), t)).toEqual({ slug: t('errorCodes.AppSlugTaken') });
    expect(appsConfig.errorFields(new ApiError(409, { code: 'NameConflict', message: 'An app named research already exists.' }), t).name).toBeTruthy();
    expect(appsConfig.errorFields(new ApiError(500, { code: 'InternalError' }), t)).toBeNull();
  });

  it('translates the server messages for apps', () => {
    const named = new ApiError(409, { code: 'NoTargetDeployments', message: 'Member agent-3 has no deployment in environment staging. Create one there first; nothing was promoted.' });
    expect(errorMessage(t, named)).toBe(t('common.serverText.appNoTargetDeployments', { member: 'agent-3', environment: 'staging' }));
    const inUse = new ApiError(409, { code: 'AgentInUse', message: 'Agent echo-agent is a member of app research. Remove it from that app first.' });
    expect(errorMessage(t, inUse)).toContain('research');
  });

  it('opens the delegation, revisions, and environments dialogs from the row menu', () => {
    const setExtraModal = vi.fn();
    const actions = appsConfig.rowActions(agenticApp(1), { ...ctx, setExtraModal, lookups: { agents: NAMES } });
    expect(actions.map((a) => a.label)).toEqual(['Delegation', 'Revisions and promotion', 'Environments']);
    actions.forEach((a) => a.onClick());
    expect(setExtraModal).toHaveBeenCalledTimes(3);
  });
});

describe('app environments and promotion (AD9.6)', () => {
  const app = { entryAgentId: 'agt_2', members: [{ agentId: 'agt_1', agentName: 'writer' }, { agentId: 'agt_2', agentName: 'planner' }] };
  const deployments = [
    { id: 'd1', name: 'planner-dev', agentId: 'agt_2', environment: 'dev', environmentOverrides: [{ name: 'LOG', valueTemplate: 'debug' }] },
    { id: 'd2', name: 'planner-staging', agentId: 'agt_2', environment: 'staging', agentRevisionId: 'arv_2_1', environmentOverrides: [{ name: 'LOG', valueTemplate: 'info' }, { name: 'KEY', valueTemplate: '{{secret.k}}', isSecret: true }] },
    { id: 'd3', name: 'writer-dev', agentId: 'agt_1', environment: 'dev', agentRevisionId: 'arv_1_2' },
    { id: 'd4', name: 'other', agentId: 'agt_9', environment: 'dev' }
  ];

  it('lays out each member per environment, the entry agent first, with pins and overrides', () => {
    const rows = environmentMatrix(app, deployments, ['dev', 'staging', 'prod'], { arv_2_1: 1, arv_1_2: 2 });
    expect(rows.map((r) => r.name)).toEqual(['planner', 'writer']);
    expect(rows[0].entry).toBe(true);
    expect(rows[0].cells.dev[0]).toMatchObject({ name: 'planner-dev', revisionId: null, overrides: [{ name: 'LOG', value: 'debug', isSecret: false }] });
    expect(rows[0].cells.staging[0]).toMatchObject({ revisionNumber: 1, overrides: [{ name: 'KEY', value: null, isSecret: true }, { name: 'LOG', value: 'info', isSecret: false }] });
    expect(rows[1].cells.staging).toEqual([]);
    expect(rows[1].cells.dev[0].revisionNumber).toBe(2);
  });

  it('compares two environments: missing, differing revisions or overrides, and the same', () => {
    const [planner, writer] = environmentMatrix(app, deployments, ['dev', 'staging'], {});
    expect(compareEnvironments(writer, 'dev', 'staging').status).toBe('Missing');
    expect(compareEnvironments(planner, 'dev', 'staging')).toEqual({ status: 'Differs', revisions: true, overrides: true });
    expect(compareEnvironments(planner, 'staging', 'staging').status).toBe('Same');
  });

  it('checks Execute on Promotion per target environment and sorts records newest first', () => {
    const staging = { grants: [{ permissionType: 'Permit', resourceTypes: ['Promotion'], operations: ['Execute'], scope: 'Resource', resourceId: 'staging' }] };
    expect(canPromoteTo(staging, 'staging')).toBe(true);
    expect(canPromoteTo(staging, 'prod')).toBe(false);
    expect(canPromoteTo(null, 'prod')).toBe(true);
    expect(sortPromotions([{ id: 'a', createdUtc: '2026-01-01' }, { id: 'b', createdUtc: '2026-02-01' }]).map((r) => r.id)).toEqual(['b', 'a']);
  });

  it('names the apps a studio draft builds, its target app first', () => {
    const draft = { targetApp: 'research', items: [{ kind: 'Agent', name: 'x' }, { kind: 'AgenticApp', name: 'docs' }, { kind: 'AgenticApp', name: 'old', operation: 'Delete' }, { kind: 'AgenticApp', name: 'research' }] };
    expect(draftAppNames(draft)).toEqual(['research', 'docs']);
    expect(draftAppNames({ items: [] })).toEqual([]);
  });

  it('builds the architect deployment body from the wizard or dialog form', () => {
    expect(architectBody({ name: ' architect ', harnessProfileId: 'hp_1', model: '', promptId: 'pt_guided' })).toEqual({ name: 'architect', harnessProfileId: 'hp_1', architectPromptTemplateId: 'pt_guided' });
    expect(architectFormErrors({ name: '', harnessProfileId: '' }, t)).toEqual({ name: t('common.errors.required'), harnessProfileId: t('common.errors.required') });
    expect(architectBody({ name: 'a', harnessProfileId: 'hp_1', credentialSecretId: 'sec_1' })).toEqual({ name: 'a', harnessProfileId: 'hp_1', credentialSecretId: 'sec_1' });
  });

  it('suggests the secret a harness signs in with, skipping inactive and broken logins', () => {
    const secrets = [
      { id: 'a', kind: 'OpenAiApiKey', active: false },
      { id: 'b', kind: 'CodexAuthJson', status: 'NeedsReauthentication' },
      { id: 'c', kind: 'ClaudeCodeOAuthToken' },
      { id: 'd', kind: 'AnthropicApiKey' },
      { id: 'e', kind: 'GeminiApiKey' }
    ];
    expect(suggestedCredential(secrets, 'ClaudeCode').id).toBe('d');
    expect(suggestedCredential(secrets, 'GeminiCli').id).toBe('e');
    expect(suggestedCredential(secrets, 'Codex')).toBeNull();
    expect(suggestedCredential(secrets, 'Generic')).toBeNull();
    expect(needsCredential('ClaudeCode')).toBe(true);
    expect(needsCredential('Generic')).toBe(false);
  });
});

describe('app components', () => {
  it('draws members, calls, the entry agent, and unreachable members', () => {
    const markup = html(<AgenticAppGraph app={form({ edges: [agenticApp(1).edges[0]] })} nameOf={nameOf} />);
    expect(markup).toContain('data-node="agt_0001"');
    expect(markup).toContain('echo-agent, the entry agent');
    expect(markup).toContain('agent-3, which the entry agent cannot reach');
    expect(markup).toContain('data-edge="agt_0001&gt;agt_0002"');
    expect(html(<AgenticAppGraph app={blankApp()} />)).toContain('data-testid="app-graph"');
    expect(html(<AgenticAppGraph app={blankApp()} />)).toContain('Add members to see the app&#x27;s graph.');
  });

  it('shows the link with copy and open, and who can sign in', () => {
    const markup = html(<AgenticAppShare app={agenticApp(2)} />);
    expect(markup).toContain('/apps/support-desk/');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain(t('components.apps.share.signIn.Anonymous'));
    expect(markup).toContain(t('components.apps.share.inactive'));
    expect(html(<AgenticAppShare app={{ name: '', slug: '' }} />)).toContain(t('components.apps.share.noSlug'));
  });

  it('shows delegation drift and writes drafts, reporting a draft conflict', async () => {
    const apiClient = { getAppDelegation: vi.fn(async () => appDelegation()), applyAppDelegation: vi.fn(async () => appDelegation('app_0001', true)) };
    const { addToast } = mount(<AgenticAppDelegationModal app={agenticApp(1)} onClose={() => {}} />, { apiClient });
    await flush();
    expect(q('[data-member="agent-2"]').getAttribute('data-drift')).toBe('true');
    expect(q('[data-member="echo-agent"]').textContent).toContain('In sync');
    expect(q('[data-testid="app-delegation-summary"]').textContent).toContain('2 members');
    click(q('[data-testid="app-delegation-apply"]'));
    await flush();
    expect(apiClient.applyAppDelegation).toHaveBeenCalledWith('default', 'app_0001');
    expect(q('[data-member="agent-2"]').textContent).toContain('Draft 3');
    expect(q('[data-member="agent-3"]').textContent).toContain('Draft conflict');
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'warning' }));
  });

  it('keeps Write drafts disabled with the missing permission', async () => {
    const apiClient = { getAppDelegation: vi.fn(async () => appDelegation()), applyAppDelegation: vi.fn() };
    mount(<AgenticAppDelegationModal app={agenticApp(1)} deniedTip="You need Update permission" onClose={() => {}} />, { apiClient });
    await flush();
    const button = q('[data-testid="app-delegation-apply"]');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('data-tip')).toBe('You need Update permission');
    click(button);
    expect(apiClient.applyAppDelegation).not.toHaveBeenCalled();
  });

  it('takes, publishes, and promotes revisions, and shows NoTargetDeployments naming the member', async () => {
    const apiClient = {
      listAppRevisions: vi.fn(async () => ({ items: [appRevision(2), appRevision(1)] })),
      createAppRevision: vi.fn(async () => appRevision(3)),
      publishAppRevision: vi.fn(async () => ({ ...appRevision(2), state: 'Published' })),
      getEnvironments: vi.fn(async () => ENVIRONMENTS),
      promoteApp: vi.fn(async () => {
        throw new ApiError(409, { code: 'NoTargetDeployments', message: 'Member agent-3 has no deployment in environment staging. Create one there first; nothing was promoted.' });
      })
    };
    const onChanged = vi.fn();
    mount(<AgenticAppRevisionsModal app={agenticApp(1)} nameOf={nameOf} onClose={() => {}} onChanged={onChanged} />, { apiClient });
    await flush();
    expect(q('[data-revision="2"]').getAttribute('data-state')).toBe('Draft');
    expect(q('[data-revision="1"]').textContent).toContain('Latest');
    expect(q('[data-revision="1"] [data-cell="members"]').textContent).toContain('agent-3, revision 1');
    type(q('#app-revision-note'), 'Writer added');
    click(q('[data-testid="app-revision-take"]'));
    await flush();
    expect(apiClient.createAppRevision).toHaveBeenCalledWith('default', 'app_0001', 'Writer added');
    click(q('[data-revision="2"] [data-testid="app-revision-publish"]'));
    click([...document.body.querySelectorAll('.modal-footer button')].find((b) => b.textContent === 'Publish'));
    await flush();
    expect(apiClient.publishAppRevision).toHaveBeenCalledWith('default', 'app_0001', 2);
    click(q('[data-testid="app-promote"]'));
    await flush();
    click(q('[data-testid="app-promote-submit"]'));
    await flush();
    expect(apiClient.promoteApp).toHaveBeenCalledWith('default', 'app_0001', { sourceEnvironment: 'dev', targetEnvironment: 'staging' });
    expect(q('[data-testid="app-promote-error"]').textContent).toContain('agent-3');
    expect(q('[data-testid="app-promote-error"]').textContent).toContain('staging');
  });

  it('keeps Take, Publish, and Promote disabled with the missing permission', async () => {
    const apiClient = { listAppRevisions: vi.fn(async () => ({ items: [appRevision(2), appRevision(1)] })), createAppRevision: vi.fn() };
    const denied = { take: 'no update', publish: 'no execute', promote: 'no promotion' };
    mount(<AgenticAppRevisionsModal app={agenticApp(1)} denied={denied} onClose={() => {}} />, { apiClient });
    await flush();
    expect(q('[data-testid="app-revision-take"]').getAttribute('data-tip')).toBe('no update');
    expect(q('[data-testid="app-revision-publish"]').getAttribute('aria-disabled')).toBe('true');
    expect(q('[data-testid="app-promote"]').getAttribute('data-tip')).toBe('no promotion');
    click(q('[data-testid="app-revision-take"]'));
    click(q('[data-testid="app-promote"]'));
    await flush();
    expect(apiClient.createAppRevision).not.toHaveBeenCalled();
    expect(q('[data-testid="app-promote-submit"]')).toBeNull();
  });
});
