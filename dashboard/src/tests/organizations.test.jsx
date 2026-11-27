// Organizations (AA7.14): navigation (Autonomy > Organizations and the detail route), enums and the Organization
// resource type, the organization helpers (tree order, the revision diff, unit forms, readable 409 messages, spend), the
// list configuration, the organization page (chart, health, spend, unpublished changes, publish, revisions with a diff,
// rollback, unit removal refused with a readable reason), the unit editor, and the API routes.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import OrganizationDetailView from '../views/OrganizationDetailView';
import OrgUnitModal from '../components/OrgUnitModal';
import { organizationsConfig } from '../views/resourceConfigs';
import { PAGE_VIEWS, DETAIL_VIEWS } from '../views/hubs/hubPanels';
import { findPage, pathFor } from '../config/navConfig';
import { ENUMS, organizationStatusTone, orgRevisionStateTone } from '../utils/constants';
import ApiClient, { ApiError } from '../utils/api';
import {
  ORG_ERROR_CODES,
  blankUnit,
  chartToUnits,
  descendantIds,
  diffIsEmpty,
  diffOrgUnits,
  orgDenied,
  orgErrorMessage,
  organizationFormErrors,
  organizationFormToBody,
  spendFraction,
  spendOf,
  spendTone,
  statusBody,
  treeOrder,
  unitFormErrors,
  unitFormToBody,
  unitToForm
} from '../utils/organizations';
import { orgChart, orgRevision, orgSpend, orgUnits, organization, report } from '../../tests/e2e/mocks.js';

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
  document.body.innerHTML = '';
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

function type(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function choose(el, value) {
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, value);
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const click = (el) => act(() => el.click());
const byText = (sel, text) => qa(sel).find((el) => el.textContent.trim() === text);
const conflict = (code, message) => new ApiError(409, { error: code, code, message });
const AGENTS = [1, 2, 3, 4].map((i) => ({ id: `agt_${String(i).padStart(4, '0')}`, name: i === 1 ? 'echo-agent' : `agent-${i}` }));

/** A fake API client answering org_0001 from the e2e fixtures. */
function orgApi(overrides = {}) {
  return {
    getOrganization: vi.fn(() => Promise.resolve(organization(1, true))),
    getOrgChart: vi.fn(() => Promise.resolve(orgChart())),
    listOrgRevisions: vi.fn(() => Promise.resolve([3, 2, 1].map((n) => orgRevision(n, false)))),
    getOrgRevision: vi.fn((_t, _o, id) => Promise.resolve(orgRevision(Number(id.slice(4))))),
    getOrgSpend: vi.fn(() => Promise.resolve(orgSpend())),
    listAgents: vi.fn(() => Promise.resolve({ items: AGENTS })),
    listMandates: vi.fn(() => Promise.resolve({ items: [{ id: 'mdt_0001', name: 'inbox-keeper', agentId: 'agt_0001' }] })),
    listApps: vi.fn(() => Promise.resolve({ items: [] })),
    listReports: vi.fn((_t, p) => Promise.resolve({ items: p.unit === 'oun_0002' ? [report(3)] : p.unit === 'oun_0001' ? [report(5)] : [] })),
    createOrgRevision: vi.fn(() => Promise.resolve({ ...orgRevision(3), id: 'orv_0004', number: 4 })),
    publishOrgRevision: vi.fn(() => Promise.resolve({ ...orgRevision(3), state: 'Published' })),
    rollbackOrganization: vi.fn(() => Promise.resolve({ ...orgRevision(1), id: 'orv_0004', number: 4, state: 'Published' })),
    deleteOrgUnit: vi.fn(() => Promise.reject(conflict('UnitHasChildren', 'Unit Leadership has units below it.'))),
    ...overrides
  };
}

describe('navigation and enums', () => {
  it('puts Organizations under Autonomy with a detail route', () => {
    expect(findPage('organizations')).toMatchObject({ hub: 'autonomy', tab: 'organizations', detail: true });
    expect(pathFor('organizations')).toBe('/dashboard/autonomy?tab=organizations');
    expect(pathFor('organizations', 'org_0001')).toBe('/dashboard/organizations/org_0001');
    expect(PAGE_VIEWS.organizations).toBeTruthy();
    expect(DETAIL_VIEWS.organizations).toBe(OrganizationDetailView);
  });

  it('mirrors the server enums and explains every value', () => {
    expect(ENUMS.organizationStatus).toEqual(['Draft', 'Active', 'Frozen', 'Retired']);
    expect(ENUMS.budgetPeriod).toEqual(['Day', 'Month']);
    expect(ENUMS.orgRevisionState).toEqual(['Draft', 'Published', 'Superseded']);
    expect(ENUMS.resourceType).toContain('Organization');
    for (const group of ['organizationStatus', 'budgetPeriod', 'orgRevisionState']) {
      for (const v of ENUMS[group]) expect(t(`tips.enums.${group}.${v}`).length, `${group}.${v}`).toBeGreaterThan(25);
    }
    expect(ENUMS.organizationStatus.map(organizationStatusTone)).toEqual(['neutral', 'success', 'info', 'warning']);
    expect(ENUMS.orgRevisionState.map(orgRevisionStateTone)).toEqual(['info', 'success', 'neutral']);
  });

  it('explains every organization 409 code', () => {
    for (const code of ORG_ERROR_CODES) expect(t(`organizations.errors.${code}`), code).not.toBe(`organizations.errors.${code}`);
  });
});

describe('organization helpers', () => {
  it('orders units root first, depth first, and finds a subtree', () => {
    const shuffled = [orgUnits()[2], orgUnits()[1], orgUnits()[0]];
    expect(treeOrder(shuffled).map(({ unit, depth }) => `${unit.name}:${depth}`)).toEqual(['Leadership:0', 'Support:1', 'Billing:1']);
    expect([...descendantIds(orgUnits(), 'oun_0001')].sort()).toEqual(['oun_0002', 'oun_0003']);
    expect(descendantIds(orgUnits(), 'oun_0002').size).toBe(0);
  });

  it('diffs two trees by unit, field by field', () => {
    const names = { mandates: { mdt_0001: 'inbox-keeper' } };
    const working = diffOrgUnits(orgUnits(2), orgUnits('working'), names);
    expect(working).toEqual({ added: [], removed: [], changed: [{ id: 'oun_0003', name: 'Support', fields: [{ field: 'leadTitle', before: '', after: 'Head of support' }] }], unchanged: 2 });
    const grown = diffOrgUnits(orgUnits(1), orgUnits(2), names);
    expect(grown.added).toEqual(['Support']);
    expect(grown.changed).toEqual([{ id: 'oun_0002', name: 'Billing', fields: [{ field: 'peers', before: '', after: 'Support' }] }]);
    const shrunk = diffOrgUnits(orgUnits(2), orgUnits(1), names);
    expect(shrunk.removed).toEqual(['Support']);
    expect(diffIsEmpty(diffOrgUnits(orgUnits(2), orgUnits(2)))).toBe(true);
    expect(diffIsEmpty(working)).toBe(false);
    // Units match by name when IDs differ (a tree rebuilt elsewhere), and every field is compared as text.
    const renamed = orgUnits(2).map((u) => ({ ...u, id: `x_${u.id}`, parentUnitId: u.parentUnitId && `x_${u.parentUnitId}` }));
    renamed[0] = { ...renamed[0], budgets: [{ period: 'Day', amountUsd: 75 }], leadMandateId: null, members: [{ agentId: 'agt_0002', agentName: 'agent-2', title: 'Deputy' }] };
    const fields = diffOrgUnits(orgUnits(2), renamed, names).changed[0].fields;
    expect(fields.map((f) => f.field)).toEqual(['leadMandate', 'members', 'budgets']);
    expect(fields[0]).toEqual({ field: 'leadMandate', before: 'inbox-keeper', after: '' });
    expect(fields[1].after).toBe('agent-2 (Deputy)');
    expect(fields[2]).toEqual({ field: 'budgets', before: 'Day 50.00, Month 1000.00', after: 'Day 75.00' });
  });

  it('round-trips a unit through the editor form and validates it', () => {
    const billing = orgUnits()[1];
    const form = unitToForm(billing);
    expect(form).toMatchObject({ name: 'Billing', parentUnitId: 'oun_0001', leadAgentId: 'agt_0002', peerUnitIds: ['oun_0003'], budgetDay: 20, budgetMonth: null });
    expect(unitFormToBody(form)).toEqual({
      name: 'Billing',
      description: null,
      parentUnitId: 'oun_0001',
      leadAgentId: 'agt_0002',
      leadTitle: 'Head of billing',
      leadMandateId: null,
      appId: null,
      members: [{ agentId: 'agt_0003', title: 'Refund clerk', mandateId: null }],
      peerLines: [{ peerUnitId: 'oun_0003' }],
      budgets: [{ period: 'Day', amountUsd: 20 }]
    });
    // Without a lead, the lead's title and keeper are not sent.
    expect(unitFormToBody({ ...form, leadAgentId: null, leadMandateId: 'mdt_0001' })).toMatchObject({ leadAgentId: null, leadTitle: null, leadMandateId: null });
    expect(unitFormErrors(form, t)).toEqual({});
    const bad = unitFormErrors({ ...blankUnit(), members: [{ agentId: '' }], budgetDay: 0 }, t);
    expect(bad.name).toBe('Give the unit a name of 1 to 128 characters.');
    expect(bad.members).toBe('Pick an agent for every member, or remove the empty row.');
    expect(bad.budgetDay).toBe('Enter an amount above zero, or leave it empty for no budget.');
    expect(unitFormErrors({ ...form, members: [{ agentId: 'agt_0002' }] }, t).members).toBe('An agent can hold only one position in the unit.');
  });

  it('turns a live chart into the working-tree shape', () => {
    const units = chartToUnits(orgChart());
    expect(units.map((u) => u.name)).toEqual(['Leadership', 'Billing', 'Support']);
    expect(units[0]).toMatchObject({ leadAgentName: 'echo-agent', leadTitle: 'Chief executive', leadMandateName: 'inbox-keeper', leadMandateSummary: 'Keep the refund inbox empty.' });
    expect(units[1].peerLines).toEqual([{ peerUnitId: 'oun_0003', peerUnitName: 'Support' }]);
    expect(diffIsEmpty(diffOrgUnits(orgUnits(2), units, { mandates: { mdt_0001: 'inbox-keeper' } }))).toBe(true);
  });

  it('explains 409 codes with the server detail and reads spend', () => {
    expect(orgErrorMessage(t, conflict('LeadsTwoUnits', 'Agent agent-2 already leads Billing.'))).toBe('This agent already leads another unit. An agent leads at most one unit per organization. Agent agent-2 already leads Billing.');
    expect(orgErrorMessage(t, conflict('OneRoot', ''))).toBe('An organization has exactly one root unit, the one without a parent.');
    expect(orgErrorMessage(t, new ApiError(404, { code: 'NotFound', message: 'Organization x not found.' }))).toBe('Organization x not found.');
    const rows = spendOf(orgSpend(), 'oun_0001');
    expect(rows.map((r) => r.period)).toEqual(['Day', 'Month']);
    expect(rows.map(spendTone)).toEqual(['success', 'warning']);
    expect(spendTone(spendOf(orgSpend(), 'oun_0002')[0])).toBe('danger');
    expect(spendFraction({ amountUsd: 10, spentUsd: 25 })).toBe(1);
    expect(spendFraction({ amountUsd: null, spentUsd: 2 })).toBe(null);
  });

  it('builds organization bodies and permission reasons', () => {
    expect(organizationFormToBody({ name: '  Ops ', description: ' ', mission: 'Pay refunds.' })).toEqual({ name: 'Ops', description: null, mission: 'Pay refunds.', budgetFreezeMarginPercent: 10 });
    expect(organizationFormErrors({ name: '' }, t).name).toBe('Give the organization a name of 1 to 128 characters.');
    expect(statusBody(organization(1), 'Retired')).toEqual({ name: 'Refund operations', description: 'Runs refunds end to end.', mission: 'Pay every valid refund within a day.', budgetFreezeMarginPercent: 10, status: 'Retired' });
    expect(orgDenied(t, { grants: [{ resourceTypes: ['Organization'], operations: ['Read'], permissionType: 'Permit' }] }, 'Update')).toBe('You may not do this. It needs Update on Organization.');
    expect(orgDenied(t, null, 'Update')).toBe('');
  });
});

describe('organizations list configuration', () => {
  it('lists name, status, live revision, and created, and opens a new organization', () => {
    const navigate = vi.fn();
    const cols = organizationsConfig.columns({ t, i18n });
    expect(cols.map((c) => c.key)).toEqual(['name', 'status', 'currentRevisionNumber', 'description', 'createdUtc', 'mission', 'id']);
    expect(cols.filter((c) => !c.defaultHidden).map((c) => c.key)).toEqual(['name', 'status', 'currentRevisionNumber', 'description', 'createdUtc']);
    expect(organizationsConfig.fields({}, { t }).map((f) => f.name)).toEqual(['name', 'description', 'mission', 'budgetFreezeMarginPercent']);
    expect(organizationsConfig.toBody({ name: 'Ops', description: '', mission: '' })).toEqual({ name: 'Ops', description: null, mission: null, budgetFreezeMarginPercent: 10 });
    organizationsConfig.afterCreate({ id: 'org_0099' }, { navigate });
    expect(navigate).toHaveBeenCalledWith('/dashboard/organizations/org_0099');
    expect(organizationsConfig.detailPath({ id: 'org_0001' })).toBe('/dashboard/organizations/org_0001');
    expect(organizationsConfig.errorFields(conflict('NameConflict', ''), t)).toEqual({ name: 'Another organization already uses this name.' });
  });
});

describe('organization page', () => {
  it('draws the chart with leads, members, peer lines, health, and spend, and flags unpublished changes', async () => {
    const apiClient = orgApi();
    mount(<OrganizationDetailView recordId="org_0001" />, { apiClient });
    await flush();
    await flush();
    expect(q('h1, .page-title')?.textContent || '').toContain('Refund operations');
    const cards = qa('[data-testid="org-unit"]');
    expect(cards.map((c) => c.getAttribute('data-unit'))).toEqual(['Leadership', 'Billing', 'Support']);
    expect(cards[0].querySelector('[data-testid="org-unit-lead"]').textContent).toContain('echo-agent');
    expect(cards[0].querySelector('[data-testid="org-unit-lead"]').textContent).toContain('inbox-keeper');
    expect(cards[0].querySelector('.org-unit-description').innerHTML).toBe('Sets direction for &lt;b&gt;refunds&lt;/b&gt;.');
    expect(cards[1].querySelector('[data-testid="org-unit-members"]').textContent).toContain('agent-3 Refund clerk');
    expect(cards[1].querySelector('[data-testid="org-unit-peers"]').textContent).toContain('Support');
    expect(cards[1].querySelector('.pill').textContent).toBe('Degraded');
    expect(cards[0].querySelector('.pill').textContent).toBe('Healthy');
    expect(cards[1].querySelector('[data-testid="org-unit-spend"]').textContent).toContain('Budget used up');
    expect(cards[0].querySelectorAll('[role="meter"]').length).toBe(2);
    expect(apiClient.listReports).toHaveBeenCalledWith('default', { unit: 'oun_0002', pageNumber: 1, pageSize: 1 });
    // Support's new lead title is not live yet.
    expect(q('[data-testid="org-pending"]').textContent).toContain('0 added, 1 changed, 0 removed');
    await click(q('[data-testid="org-review-pending"]'));
    expect(q('[data-testid="org-diff-changed"] [data-unit="Support"] [data-field="leadTitle"]').textContent).toContain('Head of support');
    // Collapse the root's branch, then show the live revision.
    await click(cards[0].querySelector('[data-testid="org-unit-toggle"]'));
    expect(qa('[data-testid="org-unit"]').length).toBe(1);
    await click(cards[0].querySelector('[data-testid="org-unit-toggle"]'));
    await click(q('[data-testid="org-view-live"]'));
    expect(qa('[data-testid="org-unit-edit"]').length).toBe(0);
    expect(qa('[data-testid="org-unit"]').length).toBe(3);
  });

  it('publishes the working tree as a new revision with a note', async () => {
    const apiClient = orgApi();
    const { addToast } = mount(<OrganizationDetailView recordId="org_0001" />, { apiClient });
    await flush();
    await flush();
    await click(q('[data-testid="org-publish"]'));
    type(q('[data-testid="org-publish-note"]'), 'Title the support lead');
    await click(q('[data-testid="org-publish-submit"]'));
    await flush();
    expect(apiClient.createOrgRevision).toHaveBeenCalledWith('default', 'org_0001', 'Title the support lead');
    expect(apiClient.publishOrgRevision).toHaveBeenCalledWith('default', 'org_0001', 'orv_0004');
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Revision 4 is live.' });
    expect(q('[data-testid="org-publish"].flex-col')).toBeNull();
  });

  it('keeps a refused publish in the dialog with the reason', async () => {
    const apiClient = orgApi({ createOrgRevision: vi.fn(() => Promise.reject(conflict('BudgetExceedsParent', 'Billing asks for 80.00 a day; Leadership allows 50.00.'))) });
    mount(<OrganizationDetailView recordId="org_0001" />, { apiClient });
    await flush();
    await flush();
    await click(q('[data-testid="org-publish"]'));
    await click(q('[data-testid="org-publish-submit"]'));
    await flush();
    expect(q('[data-testid="org-publish-error"]').textContent).toBe("A unit's budget cannot be larger than the budget of the unit above it. Billing asks for 80.00 a day; Leadership allows 50.00.");
    expect(apiClient.publishOrgRevision).not.toHaveBeenCalled();
  });

  it('lists revisions, compares one with live, publishes a draft, and rolls back after confirming', async () => {
    const apiClient = orgApi();
    mount(<OrganizationDetailView recordId="org_0001" />, { apiClient });
    await flush();
    await flush();
    await click(byText('[role="tab"]', 'Revisions (3)'));
    const rows = qa('[data-testid="org-revisions-table"] tbody tr');
    expect(rows.map((r) => r.getAttribute('data-revision'))).toEqual(['3', '2', '1']);
    expect(rows[1].textContent).toContain('Live');
    expect(q('[data-testid="org-revision-rollback-2"]')).toBeNull();
    expect(q('[data-testid="org-revision-publish-3"]')).toBeTruthy();
    await click(q('[data-testid="org-revision-diff-1"]'));
    await flush();
    expect(q('[data-testid="org-diff-removed"]').textContent).toContain('Support');
    expect(q('[data-testid="org-diff-note"]').textContent).toBe('Note: First chart');
    await click(q('[aria-label="Close"], .modal-close'));
    await click(q('[data-testid="org-revision-rollback-1"]'));
    expect(q('.modal').textContent).toContain('Make revision 1 live again in place of revision 2?');
    await click(q('[data-testid="confirm-button"]'));
    await flush();
    expect(apiClient.rollbackOrganization).toHaveBeenCalledWith('default', 'org_0001', { revisionId: 'orv_0001', note: 'Rolled back to revision 1 from the dashboard.', activeTicks: 'Finish' });
  });

  it('shows why a unit with children cannot be removed', async () => {
    const apiClient = orgApi();
    mount(<OrganizationDetailView recordId="org_0001" />, { apiClient });
    await flush();
    await flush();
    await click(qa('[data-testid="org-unit-remove"]')[0]);
    await click(q('[data-testid="confirm-button"]'));
    await flush();
    expect(apiClient.deleteOrgUnit).toHaveBeenCalledWith('default', 'org_0001', 'oun_0001');
    expect(q('.modal').textContent).toContain('Remove or move the units below this one first. Unit Leadership has units below it.');
  });

  it('locks editing on a retired organization and offers to bring it back', async () => {
    const apiClient = orgApi({ getOrganization: vi.fn(() => Promise.resolve({ ...organization(1, true), status: 'Retired' })), updateOrganization: vi.fn(() => Promise.resolve({ ...organization(1), status: 'Active' })) });
    mount(<OrganizationDetailView recordId="org_0001" />, { apiClient });
    await flush();
    await flush();
    expect(q('[data-testid="org-retired-banner"]')).toBeTruthy();
    expect(qa('[data-testid="org-unit-edit"]').length).toBe(0);
    expect(q('[data-testid="org-publish"]').getAttribute('aria-disabled')).toBe('true');
    await click(q('[data-testid="org-reactivate"]'));
    await flush();
    expect(apiClient.updateOrganization).toHaveBeenCalledWith('default', 'org_0001', { name: 'Refund operations', description: 'Runs refunds end to end.', mission: 'Pay every valid refund within a day.', budgetFreezeMarginPercent: 10, status: 'Active' });
  });
});

describe('unit editor', () => {
  const options = { agents: AGENTS, mandates: [{ id: 'mdt_0001', name: 'inbox-keeper', agentId: 'agt_0001' }], apps: [] };

  it('adds a unit below a parent with a lead, a member, a peer line, and budgets', async () => {
    const onSaved = vi.fn();
    const apiClient = { createOrgUnit: vi.fn((_t, _o, body) => Promise.resolve({ ...body, id: 'oun_0099' })) };
    const { addToast } = mount(<OrgUnitModal organization={organization(1)} units={orgUnits()} parentUnitId="oun_0001" options={options} onClose={() => {}} onSaved={onSaved} />, { apiClient });
    expect(q('#org-unit-parentUnitId').value).toBe('oun_0001');
    await click(q('[data-testid="org-unit-save"]'));
    expect(q('.field-error').textContent).toBe('Give the unit a name of 1 to 128 characters.');
    await act(async () => type(q('#org-unit-name'), 'Disputes'));
    await act(async () => choose(q('#org-unit-leadAgentId'), 'agt_0001'));
    await act(async () => type(q('#org-unit-leadTitle'), 'Head of disputes'));
    await act(async () => choose(q('#org-unit-leadMandateId'), 'mdt_0001'));
    await click(byText('button', 'Add member'));
    await act(async () => choose(q('#ol-0-agentId'), 'agt_0003'));
    await act(async () => type(q('#ol-0-title'), 'Clerk'));
    const support = qa('.checkbox-chip').find((l) => l.textContent === 'Support');
    await click(support.querySelector('input'));
    await act(async () => type(q('#org-unit-budgetDay'), '10'));
    await click(q('[data-testid="org-unit-save"]'));
    await flush();
    expect(apiClient.createOrgUnit).toHaveBeenCalledWith('default', 'org_0001', {
      name: 'Disputes',
      description: null,
      parentUnitId: 'oun_0001',
      leadAgentId: 'agt_0001',
      leadTitle: 'Head of disputes',
      leadMandateId: 'mdt_0001',
      appId: null,
      members: [{ agentId: 'agt_0003', title: 'Clerk', mandateId: null }],
      peerLines: [{ peerUnitId: 'oun_0003' }],
      budgets: [{ period: 'Day', amountUsd: 10 }]
    });
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Added unit Disputes to the working tree.' });
    expect(onSaved).toHaveBeenCalled();
  });

  it('leaves a unit and its children out of its own parent list and shows a tree rule refusal', async () => {
    const apiClient = { updateOrgUnit: vi.fn(() => Promise.reject(conflict('PositionTaken', 'Agent agent-3 is already a member of Billing.'))) };
    mount(<OrganizationsEditorHost apiClient={apiClient} options={options} />, { apiClient });
    const parents = qa('#org-unit-parentUnitId option').map((o) => o.value);
    expect(parents).toEqual(['']);
    await click(q('[data-testid="org-unit-save"]'));
    await flush();
    expect(q('[data-testid="org-unit-error"]').textContent).toBe('This agent already holds a position in the organization. An agent is a lead or a member of one unit only. Agent agent-3 is already a member of Billing.');
  });
});

/** The editor opened on the root unit, whose every other unit sits below it. */
function OrganizationsEditorHost({ options }) {
  return <OrgUnitModal organization={organization(1)} units={orgUnits()} unit={orgUnits()[0]} options={options} onClose={() => {}} onSaved={() => {}} />;
}

describe('API routes', () => {
  it('calls the organization routes', async () => {
    const calls = [];
    const client = new ApiClient('http://127.0.0.1:8700', 'tok');
    client._request = (method, path, opts) => {
      calls.push([method, path, opts?.body ?? null]);
      return Promise.resolve([]);
    };
    await client.getOrganization('default', 'org_1');
    await client.createOrgUnit('default', 'org_1', { name: 'A' });
    await client.updateOrgUnit('default', 'org_1', 'oun_1', { name: 'B' });
    await client.deleteOrgUnit('default', 'org_1', 'oun_1');
    await client.getOrgChart('default', 'org_1');
    await client.createOrgRevision('default', 'org_1', '');
    await client.getOrgRevision('default', 'org_1', 'orv_1');
    await client.publishOrgRevision('default', 'org_1', 'orv_1');
    await client.rollbackOrganization('default', 'org_1', { revisionId: 'orv_1' });
    await client.getOrgSpend('default', 'org_1');
    await client.updateOrganization('default', 'org_1', { name: 'x', status: 'Retired' });
    const base = '/v1.0/api/tenants/default/organizations/org_1';
    expect(calls).toEqual([
      ['GET', base, null],
      ['POST', `${base}/units`, { name: 'A' }],
      ['PUT', `${base}/units/oun_1`, { name: 'B' }],
      ['DELETE', `${base}/units/oun_1`, null],
      ['GET', `${base}/chart`, null],
      ['POST', `${base}/revisions`, { note: null }],
      ['GET', `${base}/revisions/orv_1`, null],
      ['POST', `${base}/revisions/orv_1/publish`, null],
      ['POST', `${base}/rollback`, { revisionId: 'orv_1' }],
      ['GET', `${base}/spend`, null],
      ['PUT', base, { name: 'x', status: 'Retired' }]
    ]);
  });
});
