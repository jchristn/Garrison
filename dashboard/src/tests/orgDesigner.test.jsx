// The organization designer (LP3.2 to LP3.10): the working tree source over a mocked API client, the client checks and
// the validate route (LP3.7), undo inverses, the people palette and drop targets (LP3.3), the Keepers, Budget, and
// Rules tabs (LP3.4 to LP3.6), the problems list, and the canvas end to end with React Flow stubbed out.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act, useCallback, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import { ApiError } from '../utils/api';
import { AGENT_DRAG_TYPE, ORG_ERROR_CODES, ORG_WARNING_CODES, publishable, budgetCap, draftOrgSource, inverseSteps, normalizeProblems, problemText, rulesForUnit, workingTreeFlow, workingTreeOrgSource, workingTreeProblems } from '../utils/orgCanvasSource';
import { UNIT_OPERATIONS } from '../utils/orgCanvas';
import OrgPeoplePalette from '../components/orgDesigner/OrgPeoplePalette';
import OrgBudgetTab from '../components/orgDesigner/OrgBudgetTab';
import OrgRulesTab from '../components/orgDesigner/OrgRulesTab';
import OrgKeepersTab from '../components/orgDesigner/OrgKeepersTab';
import OrgProblemsList from '../components/orgDesigner/OrgProblemsList';
import CanvasUnitNode from '../components/studio/canvas/CanvasUnitNode';
import OrgCanvas from '../components/studio/canvas/OrgCanvas';

// React Flow measures the DOM, which jsdom cannot do, so the canvas renders its nodes as plain focusable boxes.
vi.mock('@xyflow/react', async () => {
  const React = await import('react');
  return {
    Handle: () => null,
    Position: { Left: 'left', Right: 'right' },
    Background: () => null,
    MiniMap: () => React.createElement('div', { 'data-testid': 'minimap' }),
    ReactFlowProvider: ({ children }) => children,
    useReactFlow: () => ({ fitView: () => {} }),
    applyNodeChanges: (_changes, list) => list,
    ReactFlow: ({ nodes, nodeTypes, children, onNodeClick }) =>
      React.createElement(
        'div',
        { className: 'react-flow' },
        nodes.map((n) =>
          React.createElement(
            'div',
            { key: n.id, className: 'react-flow__node', 'data-id': n.id, tabIndex: 0, onClick: () => onNodeClick?.(null, n) },
            React.createElement(nodeTypes[n.type], { data: n.data, selected: n.selected })
          )
        ),
        children
      )
  };
});

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);
const flush = async (times = 8) => {
  for (let i = 0; i < times; i += 1) {
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });
  }
};

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

function mount(element, { apiClient = {}, principal = { isAdmin: true } } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <AuthContext.Provider value={{ apiClient, principal }}>
          <AppContext.Provider value={{ tenantId: 'default' }}>
            <ToastContext.Provider value={{ addToast: vi.fn() }}>{element}</ToastContext.Provider>
          </AppContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  });
  mounted.push({ root, container });
  return container;
}

const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));
const key = (el, k) => act(() => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })));
function setValue(el, value) {
  const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
}
/** A drag event carrying data the way the palette sets it. */
function dragEvent(type, data) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  const store = { ...data };
  Object.defineProperty(event, 'dataTransfer', { value: { types: Object.keys(store), getData: (k) => store[k] || '', setData: (k, v) => (store[k] = v), effectAllowed: '' } });
  return { event, store };
}

const AGENTS = [
  { id: 'agt_1', name: 'chief' },
  { id: 'agt_2', name: 'billing-lead' },
  { id: 'agt_3', name: 'clerk' },
  { id: 'agt_4', name: 'support-lead' },
  { id: 'agt_5', name: 'spare' }
];
const UNITS = () => [
  { id: 'oun_1', name: 'Leadership', parentUnitId: null, leadAgentId: 'agt_1', leadTitle: 'Chief', leadMandateId: 'mdt_1', members: [], peerLines: [], budgets: [{ period: 'Day', amountUsd: 50 }] },
  { id: 'oun_2', name: 'Billing', parentUnitId: 'oun_1', leadAgentId: 'agt_2', leadTitle: 'Head of billing', leadMandateId: null, members: [{ agentId: 'agt_3', title: 'Clerk', mandateId: null }], peerLines: [{ peerUnitId: 'oun_3' }], budgets: [{ period: 'Day', amountUsd: 20 }] },
  { id: 'oun_3', name: 'Support', parentUnitId: 'oun_1', leadAgentId: null, leadTitle: null, leadMandateId: null, members: [], peerLines: [], budgets: [] }
];

/** The unit routes over an in-memory working tree, shaped like the server's answers. */
function fakeApi(units = UNITS()) {
  const state = { units: structuredClone(units) };
  const find = (id) => state.units.find((u) => u.id === id);
  const fromBody = (b) => ({
    name: b.name,
    parentUnitId: b.parentUnitId,
    leadAgentId: b.leadAgentId,
    leadTitle: b.leadTitle,
    leadMandateId: b.leadMandateId,
    members: b.members.map((m) => ({ agentId: m.agentId, title: m.title, mandateId: m.mandateId })),
    peerLines: b.peerLines.map((p) => ({ peerUnitId: p.peerUnitId })),
    budgets: b.budgets
  });
  return {
    state,
    getOrganization: vi.fn(async () => ({ id: 'org_1', name: 'Refunds', units: structuredClone(state.units) })),
    getOrgUnit: vi.fn(async (_t, _o, id) => structuredClone(find(id))),
    updateOrgUnit: vi.fn(async (_t, _o, id, body) => Object.assign(find(id), fromBody(body))),
    createOrgUnit: vi.fn(async (_t, _o, body) => {
      const unit = { id: `oun_${state.units.length + 1}`, ...fromBody(body) };
      state.units.push(unit);
      return unit;
    }),
    deleteOrgUnit: vi.fn(async (_t, _o, id) => {
      state.units = state.units.filter((u) => u.id !== id);
    }),
    validateOrganization: vi.fn(async () => {
      throw new ApiError(404, { code: 'RouteNotFound' });
    })
  };
}

const ORG = () => ({ id: 'org_1', name: 'Refunds', units: UNITS() });

describe('working tree flow', () => {
  it('draws the working tree the way the canvas draws a draft', () => {
    const flow = workingTreeFlow(ORG(), AGENTS);
    expect(flow.units.map((u) => `${u.name}:${u.parent || '-'}:${u.lead || '-'}:${u.depth}`)).toEqual(['Leadership:-:chief:0', 'Billing:Leadership:billing-lead:1', 'Support:Leadership:-:1']);
    expect(flow.units[1]).toMatchObject({ unitId: 'oun_2', leadTitle: 'Head of billing', members: ['clerk'], budgets: [{ period: 'Day', amountUsd: 20 }] });
    expect(flow.units[1].people).toEqual([
      { name: 'billing-lead', agentId: 'agt_2', title: 'Head of billing', mandateId: null, lead: true },
      { name: 'clerk', agentId: 'agt_3', title: 'Clerk', mandateId: null, lead: false }
    ]);
    expect(flow.units[0].children).toEqual(['Billing', 'Support']);
    expect(flow.peers).toEqual([{ id: 'Billing~Support', from: 'Billing', to: 'Support' }]);
    expect(flow.roots).toEqual(['Leadership']);
  });
});

describe('working tree source', () => {
  const make = (api = fakeApi()) => {
    const onChanged = vi.fn(() => Promise.resolve());
    const onError = vi.fn();
    const source = workingTreeOrgSource({ apiClient: api, tenantId: 'default', organization: ORG(), agents: AGENTS, onChanged, onError });
    return { api, source, onChanged, onError };
  };

  it('adds a unit, sets a lead, adds a member, connects peers, and removes a unit through the unit routes', async () => {
    const { api, source, onChanged } = make();
    const o = 'Refunds';
    expect(await source.addUnit({ organization: o, unit: 'Archive', parent: 'Billing', agent: 'spare', role: 'Archivist' })).toBeTruthy();
    expect(api.createOrgUnit.mock.calls[0][2]).toMatchObject({ name: 'Archive', parentUnitId: 'oun_2', leadAgentId: 'agt_5', leadTitle: 'Archivist', members: [], peerLines: [], budgets: [] });

    await source.setLead({ organization: o, unit: 'Billing', agent: 'clerk', role: 'Head clerk' });
    expect(api.updateOrgUnit.mock.calls.at(-1).slice(2)).toEqual(['oun_2', expect.objectContaining({ leadAgentId: 'agt_3', leadTitle: 'Head clerk', leadMandateId: null, members: [] })]);

    await source.addMember({ organization: o, unit: 'Support', agent: 'support-lead', role: 'Helper' });
    expect(api.updateOrgUnit.mock.calls.at(-1)[3].members).toEqual([{ agentId: 'agt_4', title: 'Helper', mandateId: null }]);

    await source.connectUnits({ organization: o, from: 'Leadership', to: 'Support' });
    expect(api.updateOrgUnit.mock.calls.at(-1).slice(2, 3)).toEqual(['oun_1']);
    expect(api.updateOrgUnit.mock.calls.at(-1)[3].peerLines).toEqual([{ peerUnitId: 'oun_3' }]);

    const before = api.updateOrgUnit.mock.calls.length;
    await source.disconnectUnits({ organization: o, from: 'Support', to: 'Billing' });
    // The line is stored on Billing only, so only Billing is replaced.
    expect(api.updateOrgUnit.mock.calls.length).toBe(before + 1);
    expect(api.updateOrgUnit.mock.calls.at(-1)[2]).toBe('oun_2');
    expect(api.updateOrgUnit.mock.calls.at(-1)[3].peerLines).toEqual([]);

    await source.moveUnit({ organization: o, unit: 'Support', parent: 'Billing' });
    expect(api.updateOrgUnit.mock.calls.at(-1)[3].parentUnitId).toBe('oun_2');

    await source.removeUnit({ organization: o, unit: 'Support' });
    expect(api.deleteOrgUnit).toHaveBeenCalledWith('default', 'org_1', 'oun_3');
    expect(onChanged).toHaveBeenCalledTimes(7);
  });

  it('attaches and detaches a keeper on the lead or a member, and sets and clears budgets', async () => {
    const { api, source } = make();
    await source.attachMandate({ organization: 'Refunds', unit: 'Billing', agent: 'clerk', mandateId: 'mdt_9' });
    expect(api.updateOrgUnit.mock.calls.at(-1)[3].members).toEqual([{ agentId: 'agt_3', title: 'Clerk', mandateId: 'mdt_9' }]);
    await source.attachMandate({ organization: 'Refunds', unit: 'Billing', agent: 'billing-lead', mandateId: 'mdt_8' });
    expect(api.updateOrgUnit.mock.calls.at(-1)[3].leadMandateId).toBe('mdt_8');
    await source.detachMandate({ organization: 'Refunds', unit: 'Leadership', agent: 'chief' });
    expect(api.updateOrgUnit.mock.calls.at(-1)[3].leadMandateId).toBeNull();
    await source.setBudget({ organization: 'Refunds', unit: 'Billing', period: 'Month', amountUsd: 300 });
    expect(api.updateOrgUnit.mock.calls.at(-1)[3].budgets).toEqual([
      { period: 'Day', amountUsd: 20 },
      { period: 'Month', amountUsd: 300 }
    ]);
    await source.setBudget({ organization: 'Refunds', unit: 'Billing', period: 'Day', amountUsd: null });
    expect(api.updateOrgUnit.mock.calls.at(-1)[3].budgets).toEqual([{ period: 'Month', amountUsd: 300 }]);
  });

  it('answers null and reports a refusal with the operation', async () => {
    const api = fakeApi();
    const refusal = new ApiError(409, { code: 'BudgetExceedsParent', message: 'BudgetExceedsParent: The Day budget of unit Billing (80 USD) exceeds the Day budget of Leadership (50 USD).' });
    api.updateOrgUnit.mockRejectedValueOnce(refusal);
    const { source, onError, onChanged } = make(api);
    expect(await source.setBudget({ organization: 'Refunds', unit: 'Billing', period: 'Day', amountUsd: 80 })).toBeNull();
    expect(onError).toHaveBeenCalledWith(refusal, 'SetBudget');
    expect(onChanged).not.toHaveBeenCalled();
    expect(await source.setLead({ organization: 'Refunds', unit: 'Nowhere', agent: 'spare' })).toBeNull();
    expect(onError.mock.calls.at(-1)[0].code).toBe('UnitNotFound');
  });

  it('validates through the server route and names units, agents, and keepers', async () => {
    const api = fakeApi();
    api.validateOrganization.mockResolvedValueOnce({
      valid: false,
      problems: [
        { code: 'UnitWithoutLead', severity: 'Warning', unitId: 'oun_3', message: 'Unit Support has no lead.' },
        { code: 'BudgetOverParent', severity: 'Error', unitId: 'oun_2', message: 'x' },
        { code: 'KeeperDeploymentMissing', severity: 'Warning', unitId: 'oun_1', agentId: 'agt_1', mandateId: 'mdt_1', message: 'x' }
      ]
    });
    const source = workingTreeOrgSource({ apiClient: api, tenantId: 'default', organization: ORG(), agents: AGENTS, mandates: [{ id: 'mdt_1', name: 'chief-brief' }] });
    const result = await source.validate();
    expect(api.validateOrganization).toHaveBeenCalledWith('default', 'org_1');
    expect(result.valid).toBe(false);
    expect(result.problems.map((p) => problemText(t, p))).toEqual(['Support has no lead.', 'The budget of Billing is higher than the budget of a unit above it.', 'The keeper chief-brief of chief in Leadership has no active deployment.']);
  });

  it('runs the same checks on the client while the server has no validate route', async () => {
    const { source } = make();
    const result = await source.validate();
    expect(result).toEqual({ valid: true, problems: [expect.objectContaining({ code: 'UnitWithoutLead', severity: 'Warning', unit: 'Support', unitId: 'oun_3' })] });
    const api = fakeApi();
    api.validateOrganization.mockRejectedValueOnce(new ApiError(500, { code: 'InternalError' }));
    const failed = await workingTreeOrgSource({ apiClient: api, tenantId: 'default', organization: ORG(), agents: AGENTS }).validate();
    expect(failed.valid).toBeNull();
    expect(failed.error.code).toBe('InternalError');
  });
});

describe('organization checks', () => {
  it('finds every problem code of LP3.7 and passes a sound tree', () => {
    const units = UNITS();
    units[2].leadAgentId = 'agt_4';
    expect(workingTreeProblems(units, { agents: AGENTS, mandates: [], deployments: [] })).toEqual({ valid: true, problems: [] });
    const broken = UNITS();
    broken[1].members.push({ agentId: 'agt_1', title: null, mandateId: null });
    broken[1].peerLines.push({ peerUnitId: 'oun_gone' });
    broken[1].budgets = [{ period: 'Day', amountUsd: 80 }];
    broken.push({ id: 'oun_4', name: 'Lost', parentUnitId: 'oun_gone', leadAgentId: 'agt_5', members: [], peerLines: [], budgets: [] });
    broken.push({ id: 'oun_5', name: 'Second', parentUnitId: null, leadAgentId: 'agt_6', members: [], peerLines: [], budgets: [] });
    const { valid, problems } = workingTreeProblems(broken, { agents: AGENTS, mandates: [{ id: 'mdt_1', name: 'chief-brief', deploymentId: 'dep_gone' }], deployments: [{ id: 'dep_1', active: true }] });
    expect(valid).toBe(false);
    expect([...new Set(problems.map((p) => p.code))].sort()).toEqual(['AgentInTwoUnits', 'BudgetOverParent', 'KeeperDeploymentMissing', 'PeerLineToMissingUnit', 'UnitDetachedFromRoot', 'UnitWithoutLead']);
    for (const p of problems) expect(p.severity).toBe(ORG_WARNING_CODES.includes(p.code) ? 'Warning' : 'Error');
    expect(problems.find((p) => p.code === 'AgentInTwoUnits')).toMatchObject({ unit: 'Billing', agent: 'chief' });
    expect(problems.find((p) => p.code === 'BudgetOverParent')).toMatchObject({ unit: 'Billing' });
    expect(problems.filter((p) => p.code === 'UnitDetachedFromRoot').map((p) => p.unit)).toEqual(['Lost', 'Second']);
    expect(problems.find((p) => p.code === 'KeeperDeploymentMissing')).toMatchObject({ unit: 'Leadership', mandate: 'chief-brief', agent: 'chief' });
    for (const p of problems) expect(problemText(t, p)).not.toMatch(/components\.orgDesigner/);
  });

  it('translates every code of the validate route', () => {
    for (const code of [...ORG_ERROR_CODES, ...ORG_WARNING_CODES]) expect(problemText(t, { code, unit: 'Billing', agent: 'clerk', mandate: 'clerk-watch' }), code).not.toMatch(/components\.orgDesigner|\{\{/);
    expect(ORG_WARNING_CODES).toEqual(['UnitWithoutLead', 'KeeperDeploymentMissing', 'MandateMismatch']);
  });

  it('lets a tree with only warnings publish, and reads severity and missing fields from the route', () => {
    const answer = normalizeProblems({ valid: true, problems: [{ code: 'UnitWithoutLead', severity: 'Warning', unitId: 'oun_3' }, { code: 'MandateMismatch', unitId: 'oun_2' }] }, UNITS(), AGENTS);
    expect(answer.valid).toBe(true);
    expect(answer.problems.map((p) => `${p.code}:${p.severity}:${p.unit}:${p.agentId}`)).toEqual(['UnitWithoutLead:Warning:Support:null', 'MandateMismatch:Warning:Billing:null']);
    expect(normalizeProblems({ problems: [{ code: 'Cycle', unitId: 'oun_2' }] }, UNITS()).valid).toBe(false);
    expect(publishable([{ severity: 'Warning' }])).toBe(true);
    expect(publishable([{ severity: 'Warning' }, { severity: 'Error' }])).toBe(false);
    expect(workingTreeProblems(UNITS(), { agents: AGENTS })).toMatchObject({ valid: true, problems: [{ code: 'UnitWithoutLead', severity: 'Warning' }] });
  });

  it('names an unknown problem by the server message', () => {
    expect(normalizeProblems({ problems: [{ code: 'Novel', unitId: 'oun_1', message: 'Something new.' }] }, UNITS()).problems[0]).toMatchObject({ unit: 'Leadership', message: 'Something new.' });
    expect(problemText(t, { code: 'Novel', message: 'Something new.' })).toBe('Something new.');
  });

  it('works out the budget cap and the rules that cover a unit', () => {
    const units = UNITS();
    expect(budgetCap(units, 'oun_2', 'Day')).toEqual({ unitId: 'oun_1', unitName: 'Leadership', amountUsd: 50 });
    expect(budgetCap(units, 'oun_2', 'Month')).toBeNull();
    expect(budgetCap(units, 'oun_1', 'Day')).toBeNull();
    const rules = [
      { id: 'cr_1', unitId: 'oun_1' },
      { id: 'cr_2', unitId: 'oun_2' },
      { id: 'cr_3', unitId: 'oun_3' }
    ];
    expect(rulesForUnit(rules, units, 'oun_2').map((r) => r.id)).toEqual(['cr_1', 'cr_2']);
    expect(rulesForUnit(rules, units, 'oun_1').map((r) => r.id)).toEqual(['cr_1']);
  });

  it('never writes a change rule through a source or a draft operation (LP-007)', () => {
    for (const source of [draftOrgSource({ graph: { nodes: [], edges: [] }, runOperation: vi.fn() }), workingTreeOrgSource({ apiClient: {}, tenantId: 't', organization: ORG() })]) {
      expect(Object.keys(source).some((k) => /rule/i.test(k))).toBe(false);
    }
    expect(UNIT_OPERATIONS.some((op) => /rule/i.test(op))).toBe(false);
  });
});

describe('undo inverses', () => {
  const flow = () => workingTreeFlow(ORG(), AGENTS);
  const o = 'Refunds';

  it('undoes each change with the opposite one', () => {
    expect(inverseSteps('addUnit', { organization: o, unit: 'X' }, flow())).toEqual([['removeUnit', { organization: o, unit: 'X' }]]);
    expect(inverseSteps('addMember', { organization: o, unit: 'Billing', agent: 'spare' }, flow())).toEqual([['removeMember', { organization: o, unit: 'Billing', agent: 'spare' }]]);
    expect(inverseSteps('removeMember', { organization: o, unit: 'Billing', agent: 'clerk' }, flow())).toEqual([['addMember', { organization: o, unit: 'Billing', agent: 'clerk', role: 'Clerk' }]]);
    expect(inverseSteps('connectUnits', { organization: o, from: 'A', to: 'B' }, flow())).toEqual([['disconnectUnits', { organization: o, from: 'A', to: 'B' }]]);
    expect(inverseSteps('disconnectUnits', { organization: o, from: 'A', to: 'B' }, flow())).toEqual([['connectUnits', { organization: o, from: 'A', to: 'B' }]]);
    expect(inverseSteps('moveUnit', { organization: o, unit: 'Support', parent: 'Billing' }, flow())).toEqual([['moveUnit', { organization: o, unit: 'Support', parent: 'Leadership' }]]);
    expect(inverseSteps('setBudget', { organization: o, unit: 'Billing', period: 'Day', amountUsd: 5 }, flow())).toEqual([['setBudget', { organization: o, unit: 'Billing', period: 'Day', amountUsd: 20 }]]);
    expect(inverseSteps('setBudget', { organization: o, unit: 'Billing', period: 'Month', amountUsd: 5 }, flow())).toEqual([['setBudget', { organization: o, unit: 'Billing', period: 'Month', amountUsd: null }]]);
    expect(inverseSteps('attachMandate', { organization: o, unit: 'Leadership', agent: 'chief', mandateId: 'mdt_2' }, flow())).toEqual([['attachMandate', { organization: o, unit: 'Leadership', agent: 'chief', mandateId: 'mdt_1' }]]);
    expect(inverseSteps('attachMandate', { organization: o, unit: 'Billing', agent: 'clerk', mandateId: 'mdt_2' }, flow())).toEqual([['detachMandate', { organization: o, unit: 'Billing', agent: 'clerk' }]]);
    expect(inverseSteps('unknown', {}, flow())).toEqual([]);
  });

  it('gives a promoted member back its place and rebuilds a removed unit', () => {
    expect(inverseSteps('setLead', { organization: o, unit: 'Billing', agent: 'clerk' }, flow())).toEqual([
      ['setLead', { organization: o, unit: 'Billing', agent: 'billing-lead', role: 'Head of billing' }],
      ['addMember', { organization: o, unit: 'Billing', agent: 'clerk', role: 'Clerk' }]
    ]);
    expect(inverseSteps('removeUnit', { organization: o, unit: 'Billing' }, flow())).toEqual([
      ['addUnit', { organization: o, unit: 'Billing', parent: 'Leadership', agent: 'billing-lead', role: 'Head of billing' }],
      ['addMember', { organization: o, unit: 'Billing', agent: 'clerk', role: 'Clerk' }],
      ['connectUnits', { organization: o, from: 'Billing', to: 'Support' }],
      ['setBudget', { organization: o, unit: 'Billing', period: 'Day', amountUsd: 20 }]
    ]);
  });
});

describe('people palette', () => {
  const props = () => ({ choices: ['chief', 'clerk', 'spare'], placed: { chief: 'Leadership', clerk: 'Billing' }, units: ['Leadership', 'Billing', 'Support'], canLead: true, onPick: vi.fn(), onPlace: vi.fn(() => Promise.resolve(true)), onNewAgent: vi.fn() });

  it('filters by name and shows where each agent sits', () => {
    const c = mount(<OrgPeoplePalette {...props()} />);
    expect([...c.querySelectorAll('[data-palette-agent]')].map((b) => b.textContent)).toEqual(['chiefin Leadership', 'clerkin Billing', 'spare']);
    act(() => setValue(c.querySelector('[data-testid="org-palette-search"]'), 'SPA'));
    expect([...c.querySelectorAll('[data-palette-agent]')].map((b) => b.getAttribute('data-palette-agent'))).toEqual(['spare']);
    act(() => setValue(c.querySelector('[data-testid="org-palette-search"]'), 'nobody'));
    expect(c.querySelector('[data-testid="org-palette-empty"]').textContent).toBe('No agent matches the search.');
  });

  it('starts a drag with the agent name', () => {
    const c = mount(<OrgPeoplePalette {...props()} />);
    const { event, store } = dragEvent('dragstart', {});
    act(() => c.querySelector('[data-palette-agent="spare"]').dispatchEvent(event));
    expect(store[AGENT_DRAG_TYPE]).toBe('spare');
  });

  it('places a picked agent with the keyboard path: pick, choose a unit and a position, Place', async () => {
    const p = props();
    const c = mount(<OrgPeoplePalette {...p} />);
    click(c.querySelector('[data-palette-agent="spare"]'));
    expect(p.onPick).toHaveBeenCalledWith('spare');
    const picked = mount(<OrgPeoplePalette {...p} picked="spare" defaultUnit="Billing" />);
    expect(picked.querySelector('[data-testid="org-palette-unit"]').value).toBe('Billing');
    act(() => setValue(picked.querySelector('[data-testid="org-palette-unit"]'), 'Support'));
    act(() => setValue(picked.querySelector('[data-testid="org-palette-as"]'), 'lead'));
    await act(async () => picked.querySelector('[data-testid="org-palette-confirm"]').click());
    expect(p.onPlace).toHaveBeenCalledWith({ agent: 'spare', unit: 'Support', as: 'lead' });
    expect(p.onPick).toHaveBeenLastCalledWith('');
    click(picked.querySelector('[data-testid="org-palette-new-agent"]'));
    expect(p.onNewAgent).toHaveBeenCalledWith('Support');
  });

  it('offers only Member when the source cannot set a lead, and does nothing when blocked', () => {
    const p = props();
    const c = mount(<OrgPeoplePalette {...p} canLead={false} picked="spare" />);
    expect([...c.querySelectorAll('[data-testid="org-palette-as"] option')].map((o) => o.value)).toEqual(['member']);
    const blocked = mount(<OrgPeoplePalette {...p} blocked="Read only." />);
    const agent = blocked.querySelector('[data-palette-agent="spare"]');
    expect(agent.getAttribute('aria-disabled')).toBe('true');
    expect(agent.getAttribute('draggable')).toBe('false');
    click(agent);
    expect(p.onPick).not.toHaveBeenCalled();
  });
});

describe('unit box drop targets', () => {
  const data = (onDropAgent) => ({ unit: { name: 'Billing', parent: 'Leadership', lead: 'billing-lead', members: ['clerk'], inDraft: false }, header: 100, onDropAgent, canLead: true, keepers: { clerk: 'Next wake in 5 minutes' }, problems: 2 });

  it('adds a dropped agent as a member, or as the lead on the lead row', () => {
    const onDropAgent = vi.fn();
    const c = mount(<CanvasUnitNode data={data(onDropAgent)} selected={false} />);
    const box = c.querySelector('.studio-canvas-unit');
    const over = dragEvent('dragover', { [AGENT_DRAG_TYPE]: 'spare' });
    act(() => box.dispatchEvent(over.event));
    expect(over.event.defaultPrevented).toBe(true);
    act(() => box.dispatchEvent(dragEvent('drop', { [AGENT_DRAG_TYPE]: 'spare' }).event));
    expect(onDropAgent).toHaveBeenLastCalledWith('Billing', 'spare', 'member');
    act(() => c.querySelector('[data-lead-slot="Billing"]').dispatchEvent(dragEvent('drop', { [AGENT_DRAG_TYPE]: 'spare' }).event));
    expect(onDropAgent).toHaveBeenLastCalledWith('Billing', 'spare', 'lead');
    expect(onDropAgent).toHaveBeenCalledTimes(2);
    // A drag from anywhere else (a file, a link) is not a drop target.
    const other = dragEvent('dragover', { 'text/uri-list': 'x' });
    act(() => box.dispatchEvent(other.event));
    expect(other.event.defaultPrevented).toBe(false);
  });

  it('shows the keeper badge and the problem count in words', () => {
    const c = mount(<CanvasUnitNode data={data(null)} selected={false} />);
    expect(c.querySelector('[data-keeper-badge="clerk"]').textContent).toBe('Next wake in 5 minutes');
    expect(c.querySelector('[data-unit-problems]').textContent).toBe('2 problems');
  });
});

describe('unit panel tabs', () => {
  const unit = () => workingTreeFlow(ORG(), AGENTS).units[1];

  it('Budget: refuses a budget above the parent inline with the server reason', async () => {
    const refusal = new ApiError(409, { code: 'BudgetExceedsParent', message: 'BudgetExceedsParent: The Day budget of unit Billing (80 USD) exceeds the Day budget of Leadership (50 USD).' });
    const onSave = vi.fn(() => Promise.resolve({ error: refusal }));
    const spend = [{ unitId: 'oun_1', period: 'Day', amountUsd: 50, spentUsd: 12.5 }];
    const c = mount(<OrgBudgetTab unit={unit()} units={UNITS()} spend={spend} onSave={onSave} />);
    expect(c.querySelector('[data-testid="org-budget-cap-Day"]').textContent).toBe('At most $50.00, the Day budget of Leadership. Leadership has $37.50 left in this window.');
    const input = c.querySelector('[data-testid="org-budget-input-Day"]');
    expect(input.value).toBe('20');
    act(() => setValue(input, '80'));
    await act(async () => c.querySelector('[data-testid="org-budget-save-Day"]').click());
    expect(onSave).toHaveBeenCalledWith('Day', 80);
    const alert = c.querySelector('[data-testid="org-budget-error-Day"]');
    expect(alert.getAttribute('role')).toBe('alert');
    expect(alert.textContent).toContain(t('organizations.errors.BudgetExceedsParent'));
    expect(alert.textContent).toContain('exceeds the Day budget of Leadership (50 USD)');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    act(() => setValue(input, '-3'));
    await act(async () => c.querySelector('[data-testid="org-budget-save-Day"]').click());
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('Rules: lists the rules that cover the unit and opens the rule editor; read-only for a run token', () => {
    const rules = [
      { id: 'cr_1', name: 'wake-tuning', unitId: 'oun_1', unitName: 'Leadership', active: true, classes: [{ class: 'WakeTuning' }], limits: [], createdByName: 'admin@garrison' },
      { id: 'cr_2', name: 'billing-hires', unitId: 'oun_2', unitName: 'Billing', active: true, classes: [{ class: 'Hire' }], limits: [] }
    ];
    const onAdd = vi.fn();
    const onEdit = vi.fn();
    const c = mount(<OrgRulesTab unit={unit()} rules={rules} onAdd={onAdd} onEdit={onEdit} />);
    expect([...c.querySelectorAll('[data-rule]')].map((r) => r.getAttribute('data-rule'))).toEqual(['wake-tuning', 'billing-hires']);
    expect(c.querySelector('[data-rule="wake-tuning"]').textContent).toContain('Set on Leadership, above this unit. Written by admin@garrison.');
    expect(c.querySelector('[data-rule="billing-hires"]').textContent).toContain('Set on this unit.');
    click(c.querySelector('[data-testid="org-rules-add"]'));
    expect(onAdd).toHaveBeenCalled();
    click(c.querySelector('[data-testid="org-rules-edit-billing-hires"]'));
    expect(onEdit).toHaveBeenCalledWith(rules[1]);
    const reason = t('components.orgDesigner.rules.runToken');
    const ro = mount(<OrgRulesTab unit={unit()} rules={rules} readOnly={reason} onAdd={vi.fn()} onEdit={vi.fn()} />);
    expect(ro.querySelector('[data-testid="org-rules-readonly"]').textContent).toBe(reason);
    expect(ro.querySelector('[data-testid="org-rules-add"]')).toBeNull();
    expect(ro.querySelector('[data-testid="org-rules-edit-wake-tuning"]').getAttribute('aria-disabled')).toBe('true');
    const empty = mount(<OrgRulesTab unit={unit()} rules={[]} onAdd={vi.fn()} onEdit={vi.fn()} />);
    expect(empty.querySelector('[data-testid="org-rules-empty"]').textContent).toBe('No change rule covers this unit.');
  });

  it('Keepers: attaches, detaches, creates, and reschedules a keeper per person', () => {
    const f = workingTreeFlow({ ...ORG(), units: UNITS().map((u) => (u.id === 'oun_2' ? { ...u, members: [{ agentId: 'agt_3', title: 'Clerk', mandateId: 'mdt_3' }] } : u)) }, AGENTS).units[1];
    const mandates = [
      { id: 'mdt_3', name: 'clerk-watch', agentId: 'agt_3', status: 'Active', nextWakeUtc: new Date(Date.now() + 300000).toISOString(), currentIntervalSeconds: 900 },
      { id: 'mdt_4', name: 'billing-brief', agentId: 'agt_2', status: 'Paused' }
    ];
    const h = { onAttach: vi.fn(), onDetach: vi.fn(), onCreate: vi.fn(), onEditSchedule: vi.fn() };
    const c = mount(<OrgKeepersTab unit={f} mandates={mandates} {...h} />);
    expect(c.querySelector('[data-testid="org-keeper-attached-clerk"]').textContent).toContain('clerk-watch');
    expect(c.querySelector('[data-testid="org-keeper-attached-clerk"]').textContent).toContain('Next wake');
    click(c.querySelector('[data-testid="org-keeper-attach-billing-lead"]'));
    expect(h.onAttach).toHaveBeenCalledWith('billing-lead', 'mdt_4');
    click(c.querySelector('[data-testid="org-keeper-detach-clerk"]'));
    expect(h.onDetach).toHaveBeenCalledWith('clerk');
    click(c.querySelector('[data-testid="org-keeper-schedule-clerk"]'));
    expect(h.onEditSchedule).toHaveBeenCalledWith(mandates[0]);
    click(c.querySelector('[data-testid="org-keeper-create-billing-lead"]'));
    expect(h.onCreate).toHaveBeenCalledWith(expect.objectContaining({ name: 'billing-lead', agentId: 'agt_2', lead: true }));
  });

  it('Problems: lists each problem with a link to its unit, and says when none are left', () => {
    const onShowUnit = vi.fn();
    const result = workingTreeProblems(UNITS(), { agents: AGENTS });
    const c = mount(<OrgProblemsList result={result} onShowUnit={onShowUnit} />);
    expect(c.querySelector('[data-problem="UnitWithoutLead"]').textContent).toContain('Support has no lead.');
    expect(c.querySelector('[data-problem-group="warnings"] [data-problem="UnitWithoutLead"]')).not.toBeNull();
    expect(c.querySelector('[data-problem-group="errors"]')).toBeNull();
    expect(c.querySelector('[data-testid="org-problems-publishable"]')).not.toBeNull();
    const both = mount(<OrgProblemsList result={normalizeProblems({ valid: false, problems: [{ code: 'Cycle', severity: 'Error', unitId: 'oun_2' }, { code: 'UnitWithoutLead', severity: 'Warning', unitId: 'oun_3' }] }, UNITS())} onShowUnit={onShowUnit} />);
    expect(both.querySelector('[data-problem-group="errors"]').textContent).toContain('Errors: 1');
    expect(both.querySelector('[data-problem-group="errors"] [data-problem="Cycle"]').textContent).toContain('Billing sits below itself.');
    expect(both.querySelector('[data-problem-group="warnings"] [data-problem="UnitWithoutLead"]')).not.toBeNull();
    expect(both.querySelector('[data-testid="org-problems-publishable"]')).toBeNull();
    click(c.querySelector('[data-testid="org-problem-show-0"]'));
    expect(onShowUnit).toHaveBeenCalledWith('Support');
    const clean = mount(<OrgProblemsList result={{ valid: true, problems: [] }} onShowUnit={onShowUnit} />);
    expect(clean.querySelector('[data-testid="org-problems-none"]').textContent).toBe('No problems found.');
    const failed = mount(<OrgProblemsList result={{ valid: null, problems: [], error: new ApiError(500, { code: 'InternalError', message: 'Boom' }) }} />);
    expect(failed.querySelector('[data-testid="org-problems-error"]')).not.toBeNull();
  });
});

/** The canvas over the working tree source and the fake unit routes, reloading the organization after each change. */
function WorkingTreeCanvas({ api }) {
  const [org, setOrg] = useState(ORG());
  const reload = useCallback(async () => setOrg(await api.getOrganization()), [api]);
  const source = useMemo(() => workingTreeOrgSource({ apiClient: api, tenantId: 'default', organization: org, agents: AGENTS, onChanged: reload }), [api, org, reload]);
  return <OrgCanvas source={source} scopeId="test" palette agents={AGENTS} say={() => {}} />;
}

describe('organization canvas over the working tree', () => {
  it('places an agent with the keyboard, clears the problem it fixes, and undoes and redoes it', async () => {
    const api = fakeApi();
    const c = mount(<WorkingTreeCanvas api={api} />);
    await flush();
    expect(c.querySelector('[data-problem="UnitWithoutLead"]').getAttribute('data-problem-unit')).toBe('Support');
    expect(c.querySelector('[data-canvas-unit="Support"] [data-unit-problems]')).toBeNull();
    expect(c.querySelector('.react-flow__node[data-id="Support"] [data-unit-problems]').textContent).toBe('1 problem');

    // Pick an agent in the palette, then press L on the Support box: spare becomes its lead.
    click(c.querySelector('[data-palette-agent="spare"]'));
    expect(c.querySelector('[data-testid="org-palette-place"]')).not.toBeNull();
    key(c.querySelector('.react-flow__node[data-id="Support"]'), 'l');
    await flush();
    expect(api.updateOrgUnit).toHaveBeenCalledTimes(1);
    expect(api.state.units.find((u) => u.id === 'oun_3').leadAgentId).toBe('agt_5');
    expect(c.querySelector('[data-testid="org-problems-none"]')).not.toBeNull();
    expect(c.querySelector('[data-testid="org-palette-place"]')).toBeNull();

    // Undo sends the opposite change: Support has no lead again and the problem is back.
    const undo = c.querySelector('[data-testid="org-undo"]');
    expect(undo.getAttribute('aria-disabled')).toBeNull();
    await act(async () => undo.click());
    await flush();
    expect(api.state.units.find((u) => u.id === 'oun_3').leadAgentId).toBeNull();
    expect(c.querySelector('[data-problem="UnitWithoutLead"]')).not.toBeNull();

    // Redo makes it again, from the keyboard this time.
    key(c.querySelector('[data-testid="studio-org-canvas"]'), 'y');
    await act(async () => c.querySelector('[data-testid="studio-org-canvas"]').dispatchEvent(new KeyboardEvent('keydown', { key: 'y', ctrlKey: true, bubbles: true })));
    await flush();
    expect(api.state.units.find((u) => u.id === 'oun_3').leadAgentId).toBe('agt_5');
    expect(c.querySelector('[data-testid="org-redo"]').getAttribute('aria-disabled')).toBe('true');
  });

  it('adds a dropped agent as a member and links a problem to its unit', async () => {
    const api = fakeApi();
    const c = mount(<WorkingTreeCanvas api={api} />);
    await flush();
    act(() => c.querySelector('[data-canvas-unit="Support"], .react-flow__node[data-id="Support"] .studio-canvas-unit').dispatchEvent(dragEvent('drop', { [AGENT_DRAG_TYPE]: 'spare' }).event));
    await flush();
    expect(api.state.units.find((u) => u.id === 'oun_3').members).toEqual([{ agentId: 'agt_5', title: null, mandateId: null }]);
    click(c.querySelector('[data-testid="org-problem-show-0"]'));
    expect(c.querySelector('[data-unit-panel="Support"]')).not.toBeNull();
  });
});
