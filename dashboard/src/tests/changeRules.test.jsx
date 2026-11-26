// Change rules and proposals (AA8.12): navigation (Autonomy > Change rules), the enum mirrors (change classes,
// management access, ChangeRule, OrgProposalApplied), the rule helpers (form round trip, client checks, limit text,
// status, readable field codes), the list configuration, the deployment form's management access, the Proposals tab of
// the organization page (decisions, rule names, review with covered and uncovered changes, approve), and the API routes.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import OrganizationDetailView from '../views/OrganizationDetailView';
import { changeRulesConfig, deploymentsConfig } from '../views/resourceConfigs';
import { PAGE_VIEWS } from '../views/hubs/hubPanels';
import { findPage, pathFor } from '../config/navConfig';
import { CHANGE_RULE_LIMIT_NAMES, ENUMS } from '../utils/constants';
import ApiClient from '../utils/api';
import { fieldErrorMessages, withListItemErrors } from '../utils/errors';
import {
  CHANGE_RULE_ERROR_CODES,
  changeRuleFormErrors,
  changeRuleFormToBody,
  changeRuleToForm,
  limitText,
  proposalDecision,
  ruleStatus,
  upsertProposal
} from '../utils/changeRules';
import { changeRule, orgChart, orgProposal, orgRevision, orgSpend, organization } from '../../tests/e2e/mocks.js';

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

const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const click = (el) => act(() => el.click());

describe('navigation and enums', () => {
  it('puts Change rules under Autonomy', () => {
    expect(findPage('changeRules')).toMatchObject({ hub: 'autonomy', tab: 'change-rules' });
    expect(pathFor('changeRules')).toBe('/dashboard/autonomy?tab=change-rules');
    expect(PAGE_VIEWS.changeRules).toBeTruthy();
  });

  it('mirrors the server enums and explains every value', () => {
    expect(ENUMS.changeClass).toEqual(['PromptRetune', 'WakeTuning', 'MandateTextEdit', 'AddWorker', 'RemoveWorker', 'ModelChange', 'DeploymentWeight']);
    expect(ENUMS.managementAccess).toEqual(['None', 'Drafts', 'OrgSubtree']);
    expect(ENUMS.resourceType).toContain('ChangeRule');
    expect(ENUMS.notificationEvent).toContain('OrgProposalApplied');
    for (const group of ['changeClass', 'managementAccess']) {
      for (const v of ENUMS[group]) expect(t(`tips.enums.${group}.${v}`).length, `${group}.${v}`).toBeGreaterThan(25);
    }
    expect(t('tips.enums.managementAccess.OrgSubtree')).toContain('units below');
    expect(Object.keys(CHANGE_RULE_LIMIT_NAMES)).toEqual(ENUMS.changeClass);
    for (const names of Object.values(CHANGE_RULE_LIMIT_NAMES)) for (const n of names) expect(t(`changeRules.limitNames.${n}`)).not.toBe(`changeRules.limitNames.${n}`);
  });

  it('explains every change rule field code and the new error codes', () => {
    for (const code of CHANGE_RULE_ERROR_CODES) expect(t(`changeRules.errors.${code}`), code).not.toBe(`changeRules.errors.${code}`);
    for (const code of ['RulesArePeopleOnly', 'ProposalNotPending', 'ApproverIsAgent']) expect(t(`errorCodes.${code}`)).not.toBe(`errorCodes.${code}`);
  });
});

describe('change rule helpers', () => {
  it('round-trips a rule through the form', () => {
    const rule = changeRule(1);
    const form = changeRuleToForm(rule);
    expect(form).toMatchObject({ organizationId: 'org_0001', unitId: 'oun_0001', classes: ['WakeTuning', 'PromptRetune'], active: true });
    expect(changeRuleFormToBody(form)).toEqual({
      organizationId: 'org_0001',
      unitId: 'oun_0001',
      name: 'routine-wake-tuning',
      description: 'Keepers may slow down or speed up within sane bounds.',
      active: true,
      expiresUtc: null,
      // Classes go in enum order.
      classes: [{ class: 'PromptRetune' }, { class: 'WakeTuning' }],
      limits: [
        { class: 'WakeTuning', name: 'minIntervalSeconds', minimum: 60, maximum: null },
        { class: 'WakeTuning', name: 'count', minimum: null, maximum: 3 }
      ]
    });
    expect(changeRuleFormErrors(form, t)).toEqual({});
  });

  it('checks a rule like the server does', () => {
    const e = changeRuleFormErrors({ name: '', organizationId: '', unitId: '', classes: [], limits: [], expiresUtc: '2000-01-01T00:00:00Z' }, t);
    expect(e).toMatchObject({
      name: 'Give the rule a name of 1 to 128 characters.',
      organizationId: 'Pick the organization the rule is for.',
      unitId: 'Pick a unit of this organization.',
      classes: 'Pick at least one class of change.',
      expiresUtc: 'Pick an expiry in the future, or leave it empty so the rule never expires.'
    });
    const base = { name: 'r', organizationId: 'org_0001', unitId: 'oun_0001', classes: ['WakeTuning'] };
    const limits = (rows) => changeRuleFormErrors({ ...base, limits: rows }, t).limits;
    expect(limits([{ class: 'ModelChange', name: 'count', maximum: 1 }])).toContain('A limit must be for a class the rule lists');
    expect(limits([{ class: 'WakeTuning', name: 'weight', maximum: 1 }])).toContain('This class has no limit by that name');
    expect(limits([{ class: 'WakeTuning', name: 'count' }])).toContain('Give the limit a minimum, a maximum, or both.');
    expect(limits([{ class: 'WakeTuning', name: 'count', minimum: -1 }])).toContain('Limits are zero or more.');
    expect(limits([{ class: 'WakeTuning', name: 'count', minimum: 5, maximum: 2 }])).toBe('Item 1: The minimum is larger than the maximum.');
    expect(limits([{ class: 'WakeTuning', name: 'count', maximum: 2 }, { class: 'WakeTuning', name: 'count', maximum: 3 }])).toContain('Item 2: Each class and each limit can appear only once.');
  });

  it('describes limits, statuses, and proposal decisions', () => {
    expect(limitText(t, { class: 'WakeTuning', name: 'minIntervalSeconds', minimum: 60, maximum: 3600 }, 'en')).toBe('Wake tuning, Shortest wake interval (seconds): 60 to 3,600');
    expect(limitText(t, { class: 'AddWorker', name: 'count', maximum: 2 }, 'en')).toBe('Add worker, Changes per proposal: at most 2');
    expect(ruleStatus(changeRule(1))).toBe('Active');
    expect(ruleStatus(changeRule(2))).toBe('Inactive');
    expect(ruleStatus({ active: true, expiresUtc: '2000-01-01T00:00:00Z' })).toBe('Expired');
    expect([1, 2, 3].map((i) => proposalDecision(orgProposal(i)))).toEqual(['rule', 'needsApproval', 'approved']);
    expect(proposalDecision({ status: 'Open', approvalStatus: 'Denied' })).toBe('denied');
    expect(proposalDecision({ status: 'Open' })).toBe('drafting');
    const list = upsertProposal([orgProposal(1), orgProposal(3)], { ...orgProposal(2), lastUpdateUtc: '2030-01-01T00:00:00Z' });
    expect(list.map((p) => p.draftId)).toEqual(['sdr_0102', 'sdr_0101', 'sdr_0103']);
  });

  it('places server field codes on the form in plain words', () => {
    const err = { fields: { 'limits[0].name': 'A WakeTuning limit is one of count.' }, fieldCodes: { 'limits[0].name': 'UnknownLimit' } };
    const out = withListItemErrors(t, fieldErrorMessages(t, err, changeRulesConfig.fieldErrorSpecial(t)));
    expect(out.limits).toBe('Item 1: This class has no limit by that name. Pick one from the list.');
  });
});

describe('configuration', () => {
  const ctx = { t, i18n, mode: 'create', options: { organizations: [organization(1, true)] } };

  it('offers the organization units and only the limit names of each class', () => {
    const fields = changeRulesConfig.fields({ ...changeRuleToForm(null), organizationId: 'org_0001', classes: ['WakeTuning'] }, ctx);
    const unit = fields.find((f) => f.name === 'unitId');
    expect(unit.options.map((o) => o.label.trim())).toEqual(['Leadership', 'Billing', 'Support']);
    const limits = fields.find((f) => f.name === 'limits');
    expect(limits.fields[0].options.map((o) => o.value)).toEqual(['WakeTuning']);
    expect(limits.fields[1].options({ class: 'DeploymentWeight' }).map((o) => o.value)).toEqual(['count', 'weight']);
    expect(limits.rowAdjust({ class: 'ModelChange', name: 'minIntervalSeconds' }, { class: 'WakeTuning', name: 'minIntervalSeconds' }).name).toBe('count');
    // A unit of another organization is refused.
    expect(changeRulesConfig.validate({ ...changeRuleToForm(changeRule(1)), unitId: 'oun_9999' }, t, ctx).unitId).toBe('Pick a unit of this organization.');
    // The organization is fixed once the rule exists.
    expect(changeRulesConfig.fields(changeRuleToForm(changeRule(1)), { ...ctx, mode: 'edit' }).find((f) => f.name === 'organizationId').readOnly).toBe(true);
  });

  it('renders classes, limits, and status in the list', () => {
    const cols = changeRulesConfig.columns({ t, i18n });
    const cell = (key, row) => {
      const c = document.createElement('div');
      document.body.appendChild(c);
      const root = createRoot(c);
      act(() => root.render(<MemoryRouter>{cols.find((x) => x.key === key).render(row)}</MemoryRouter>));
      mounted.push({ root, container: c });
      return c.textContent;
    };
    expect(cell('classes', changeRule(1))).toBe('Wake tuning, Prompt retune');
    expect(cell('limits', changeRule(1))).toBe('Wake tuning, Shortest wake interval (seconds): at least 60Wake tuning, Changes per proposal: at most 3');
    expect(cell('status', changeRule(2))).toBe('Switched off');
    expect(cell('limits', changeRule(2))).toBe('No limits');
  });

  it('gives deployments a management access choice that it sends', () => {
    const fields = deploymentsConfig.fields(deploymentsConfig.blank(), { t, i18n, mode: 'create', options: {} });
    const access = fields.find((f) => f.name === 'managementAccess');
    expect(access.options.map((o) => o.value)).toEqual(['None', 'Drafts', 'OrgSubtree']);
    expect(access.tip).toContain('Executive over its subtree');
    expect(deploymentsConfig.toForm({ managementAccess: 'OrgSubtree' }).managementAccess).toBe('OrgSubtree');
    expect(deploymentsConfig.toBody({ ...deploymentsConfig.blank(), managementAccess: 'OrgSubtree' }, 'create', {}).managementAccess).toBe('OrgSubtree');
    expect(deploymentsConfig.blank().managementAccess).toBe('None');
  });
});

describe('proposals tab', () => {
  function api(overrides = {}) {
    return {
      getOrganization: vi.fn(() => Promise.resolve(organization(1, true))),
      getOrgChart: vi.fn(() => Promise.resolve(orgChart())),
      listOrgRevisions: vi.fn(() => Promise.resolve([{ ...orgRevision(3, false), id: 'orv_0004', number: 4, state: 'Published', draftId: 'sdr_0101' }, orgRevision(2, false)])),
      getOrgRevision: vi.fn((_t, _o, id) => Promise.resolve(orgRevision(Math.min(Number(id.slice(4)), 3)))),
      getOrgSpend: vi.fn(() => Promise.resolve(orgSpend())),
      listOrgProposals: vi.fn(() => Promise.resolve({ items: [1, 2, 3].map((i) => orgProposal(i)) })),
      getOrgProposal: vi.fn((_t, _o, id) => Promise.resolve(orgProposal(Number(id.slice(4)) - 100, true))),
      decideOrgProposal: vi.fn(() => Promise.resolve({ ...orgProposal(2), status: 'Applied', approvalStatus: 'Approved', decisionSource: 'User', decidedBy: 'admin@garrison' })),
      listChangeRules: vi.fn(() => Promise.resolve({ items: [changeRule(1), changeRule(2)] })),
      ...overrides
    };
  }

  async function openTab(client) {
    const out = mount(<OrganizationDetailView recordId="org_0001" />, { apiClient: client });
    await flush();
    await flush();
    const tab = qa('[role="tab"]').find((b) => b.textContent === 'Proposals (3)');
    expect(tab).toBeTruthy();
    click(tab);
    await flush();
    return out;
  }

  it('lists proposals with their decision and the rules that applied them', async () => {
    const client = api();
    await openTab(client);
    expect(client.listOrgProposals).toHaveBeenCalledWith('default', 'org_0001', { pageNumber: 1, pageSize: 200 });
    const rows = qa('[data-testid="org-proposals-table"] tbody tr');
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain('Applied by rule');
    expect(rows[0].textContent).toContain('Rules: routine-wake-tuning');
    expect(rows[1].textContent).toContain('Needs approval');
    expect(rows[2].textContent).toContain('By admin@garrison');
    click(q('[data-testid="org-proposals-view-needsApproval"]'));
    expect(qa('[data-testid="org-proposals-table"] tbody tr')).toHaveLength(1);
    // The revision that recorded a proposal says so.
    click(qa('[role="tab"]').find((b) => b.textContent.startsWith('Revisions')));
    expect(q('[data-revision="4"]').textContent).toContain('Applied proposal');
  });

  it('reviews a waiting proposal and approves it', async () => {
    const client = api();
    const { addToast } = await openTab(client);
    click(q('[data-testid="org-proposal-open-sdr_0102"]'));
    await flush();
    expect(client.getOrgProposal).toHaveBeenCalledWith('default', 'org_0001', 'sdr_0102');
    expect(q('[data-testid="org-proposal-coverage"]').textContent).toContain('At least one change below is not covered');
    expect(q('[data-testid="org-proposal-refusals"]').textContent).toContain('An executive cannot change secrets.');
    expect(q('[data-change="Agent/agent-2"]').textContent).toContain('Rule routine-wake-tuning');
    expect(q('[data-change="Deployment/agent-2-default"]').textContent).toContain('Needs approval');
    click(q('[data-testid="org-proposal-approve"]'));
    await flush();
    expect(client.decideOrgProposal).toHaveBeenCalledWith('default', 'org_0001', 'sdr_0102', { allow: true, reason: null });
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Approved Move Billing to a cheaper model. It is live now.' });
    expect(q('[data-testid="org-proposal"]')).toBeNull();
  });

  it('shows how an applied proposal was decided and the revision it became', async () => {
    await openTab(api());
    click(q('[data-testid="org-proposal-open-sdr_0101"]'));
    await flush();
    expect(q('[data-testid="org-proposal-by-rule"]').textContent).toContain('Rules: routine-wake-tuning');
    expect(q('[data-testid="org-proposal-revision"]').textContent).toContain('revision 4');
    expect(q('[data-testid="org-proposal-approve"]')).toBeNull();
  });
});

describe('API routes', () => {
  it('calls the change rule and proposal routes', async () => {
    const calls = [];
    const client = new ApiClient('http://127.0.0.1:8700', 'tok');
    client._request = (method, path, opts) => {
      calls.push([method, path, opts?.body ?? null, opts?.query ?? null]);
      return Promise.resolve({ objects: [] });
    };
    await client.listChangeRules('default', { organization: 'org_1', pageNumber: 1, pageSize: 10 });
    await client.getChangeRule('default', 'cru_1');
    await client.createChangeRule('default', { name: 'a' });
    await client.updateChangeRule('default', 'cru_1', { name: 'b' });
    await client.deleteChangeRule('default', 'cru_1');
    await client.listOrgProposals('default', 'org_1', { status: 'PendingApproval' });
    await client.getOrgProposal('default', 'org_1', 'sdr_1');
    await client.decideOrgProposal('default', 'org_1', 'sdr_1', { allow: false, reason: 'no' });
    const rules = '/v1.0/api/tenants/default/change-rules';
    const proposals = '/v1.0/api/tenants/default/organizations/org_1/proposals';
    expect(calls).toEqual([
      ['GET', rules, null, { organization: 'org_1', maxResults: 10, skip: 0 }],
      ['GET', `${rules}/cru_1`, null, null],
      ['POST', rules, { name: 'a' }, null],
      ['PUT', `${rules}/cru_1`, { name: 'b' }, null],
      ['DELETE', `${rules}/cru_1`, null, null],
      ['GET', proposals, null, { status: 'PendingApproval' }],
      ['GET', `${proposals}/sdr_1`, null, null],
      ['POST', `${proposals}/sdr_1/decide`, { allow: false, reason: 'no' }, null]
    ]);
  });
});
