// Performance signals and org-scale brakes (AA11.7): navigation (Autonomy > Performance and /dashboard/performance/<id>),
// the window and chart helpers, the page against the mock performance (window picker, unit filter, unit and agent
// tables, chart, checks linking to eval runs, New check), cancel everything in a unit with its counts, the rollback's
// in-flight ticks choice, the EvalSet trigger target, the budget freeze margin, the new enum labels in every locale,
// and the API routes.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import i18n from '../i18n';
import { en, TRANSLATIONS } from '../i18n/resources';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import PerformanceView from '../views/PerformanceView';
import BoardView from '../views/BoardView';
import CascadeCancelModal from '../components/CascadeCancelModal';
import { PAGE_VIEWS, DETAIL_VIEWS } from '../views/hubs/hubPanels';
import { findPage, pathFor } from '../config/navConfig';
import { ENUMS, SUBSCRIBABLE_NOTIFICATION_EVENTS } from '../utils/constants';
import ApiClient from '../utils/api';
import { triggersConfig } from '../views/resourceConfigs';
import { blankTrigger, triggerErrors, triggerToBody, triggerToForm } from '../utils/triggers';
import { organizationFormErrors, organizationFormToBody, organizationToForm } from '../utils/organizations';
import { cascadeBody, cascadeCounts, chartRows, customWindowErrors, newCheckQuery, unitDepths, windowQuery } from '../utils/performance';
import { board, cascadeCancelResult, organization, performance } from '../../tests/e2e/mocks.js';

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

function Where() {
  const location = useLocation();
  return <output data-testid="where">{`${location.pathname}${location.search}`}</output>;
}

function mount(element, { apiClient = {}, addToast = vi.fn(), principal = { isAdmin: true } } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <AuthContext.Provider value={{ apiClient, principal }}>
          <AppContext.Provider value={{ tenantId: 'default', setWizardOpen: () => {}, setTourOpen: () => {} }}>
            <ToastContext.Provider value={{ addToast }}>
              {element}
              <Where />
            </ToastContext.Provider>
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

function choose(el, value) {
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, value);
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const click = (el) => act(() => el.click());
const page = (items) => ({ items, totalCount: items.length });
const DAY = 86400000;

function client() {
  return {
    getOrganizationPerformance: vi.fn((tenant, org, params) => Promise.resolve(performance({ searchParams: new URLSearchParams(Object.entries(params).filter(([, v]) => v)) }))),
    cancelOrgUnitAll: vi.fn((tenant, org, unitId) => Promise.resolve(cascadeCancelResult(unitId))),
    listOrganizations: vi.fn(() => Promise.resolve(page([organization(1), organization(2)]))),
    getBoard: vi.fn(() => Promise.resolve(board(1))),
    getKillSwitch: vi.fn(() => Promise.resolve({ enabled: false })),
    listBoardConversations: vi.fn(() => Promise.resolve(page([]))),
    rollbackOrganization: vi.fn(() => Promise.resolve({ number: 4 }))
  };
}

describe('navigation and enums', () => {
  it('has the Performance tab under Autonomy with a detail route', () => {
    const p = findPage('performance');
    expect(p.hub).toBe('autonomy');
    expect(p.detail).toBe(true);
    expect(pathFor('performance', 'org_0001')).toBe('/dashboard/performance/org_0001');
    expect(PAGE_VIEWS.performance).toBe(PerformanceView);
    expect(DETAIL_VIEWS.performance).toBe(PerformanceView);
    expect(en.nav.items.performance.label).toBe('Performance');
  });

  it('adds OrgBudgetFrozen, UnitCascadeCancelled, EvalSet, and the rollback ticks choice with labels in every locale', () => {
    expect(ENUMS.notificationEvent).toContain('OrgBudgetFrozen');
    expect(SUBSCRIBABLE_NOTIFICATION_EVENTS).toContain('OrgBudgetFrozen');
    expect(ENUMS.auditEventType).toEqual(expect.arrayContaining(['OrgBudgetFrozen', 'UnitCascadeCancelled']));
    expect(ENUMS.triggerTargetType).toContain('EvalSet');
    expect(ENUMS.rollbackActiveTicks).toEqual(['Finish', 'Cancel']);
    for (const [code, catalog] of [['en', en], ...Object.entries(TRANSLATIONS)]) {
      expect(catalog.enums.auditEventType.OrgBudgetFrozen, code).toBeTruthy();
      expect(catalog.enums.auditEventType.UnitCascadeCancelled, code).toBeTruthy();
      expect(catalog.enums.notificationEvent.OrgBudgetFrozen, code).toBeTruthy();
      expect(catalog.tour.steps.performance.title, code).toBeTruthy();
    }
  });
});

describe('helpers', () => {
  const now = new Date('2026-11-26T12:00:00Z');

  it('turns a window choice into fromUtc and toUtc', () => {
    expect(windowQuery('24h', null, now)).toEqual({ fromUtc: '2026-11-25T12:00:00.000Z', toUtc: '2026-11-26T12:00:00.000Z' });
    expect(windowQuery('30d', null, now).fromUtc).toBe('2026-10-27T12:00:00.000Z');
    expect(windowQuery('custom', { from: '2026-11-01', to: '2026-11-10' }, now)).toEqual({ fromUtc: '2026-11-01T00:00:00.000Z', toUtc: '2026-11-11T00:00:00.000Z' });
    expect(windowQuery('custom', { from: '2026-01-01', to: '2026-11-10' }, now)).toBeNull();
  });

  it('checks a custom window like the server: both days, in order, at most 90 days', () => {
    expect(customWindowErrors({ from: '', to: '' }, t)).toEqual({ from: en.performance.window.errors.from, to: en.performance.window.errors.to });
    expect(customWindowErrors({ from: '2026-11-10', to: '2026-11-01' }, t).to).toBe(en.performance.window.errors.order);
    expect(customWindowErrors({ from: '2026-01-01', to: '2026-11-01' }, t).to).toContain('90');
    expect(customWindowErrors({ from: '2026-08-04', to: '2026-11-01' }, t)).toEqual({});
  });

  it('scales the chart rows and orders the unit depths', () => {
    const p = performance();
    const rows = chartRows(p.units);
    expect(rows.map((r) => r.unitName)).toEqual(['Leadership', 'Billing', 'Support']);
    expect(rows[0].costFraction).toBe(1);
    expect(rows[2].successRate).toBeNull();
    expect(unitDepths(p.units)).toEqual({ oun_0001: 0, oun_0002: 1, oun_0003: 1 });
  });

  it('builds the cascade body and counts and the new check query', () => {
    expect(cascadeBody('  ')).toEqual({ reason: null });
    expect(cascadeBody(' incident ')).toEqual({ reason: 'incident' });
    expect(cascadeBody('x'.repeat(2000)).reason.length).toBe(1024);
    expect(cascadeCounts(cascadeCancelResult()).map((c) => c.value)).toEqual([3, 1, 2, 4]);
    expect(newCheckQuery()).toEqual({ new: 'EvalSet' });
    expect(newCheckQuery('dep_1')).toEqual({ new: 'EvalSet', deploymentId: 'dep_1' });
  });
});

describe('PerformanceView', () => {
  it('lists organizations to pick from without a record ID', async () => {
    mount(<PerformanceView />, { apiClient: client() });
    await flush();
    expect(q('[data-testid="performance-picker-link-org_0001"]').getAttribute('href')).toBe('/dashboard/performance/org_0001');
  });

  it('renders the chart, the unit and agent tables, and the checks for the last 7 days', async () => {
    const api = client();
    mount(<PerformanceView recordId="org_0001" />, { apiClient: api });
    await flush();
    const params = api.getOrganizationPerformance.mock.calls[0][2];
    expect(new Date(params.toUtc) - new Date(params.fromUtc)).toBe(7 * DAY);
    expect(params.unitId).toBeUndefined();
    expect(q('[data-testid="performance"]').textContent).toContain('Performance of Refund operations');
    expect(qa('[data-chart-unit]')).toHaveLength(3);
    expect(qa('[data-perf-unit]')).toHaveLength(3);
    expect(q('[data-perf-unit="oun_0002"] [data-metric="successRate"]').textContent).toBe('65.2%');
    expect(q('[data-perf-unit="oun_0003"] [data-metric="successRate"]').textContent).toBe('-');
    expect(qa('[data-perf-agent]')).toHaveLength(4);
    expect(q('[data-perf-agent="agt_0001"]').textContent).toContain('Lead');
    expect(q('[data-testid="performance-check-run-trg_0099"]').getAttribute('href')).toBe('/dashboard/eval-runs/evr_0001');
    expect(q('[data-check="trg_0099"]').textContent).toContain('Below threshold');
  });

  it('reads again for another window, a valid custom range, and one unit', async () => {
    const api = client();
    mount(<PerformanceView recordId="org_0001" />, { apiClient: api });
    await flush();
    await click(q('[data-testid="performance-window-24h"]'));
    await flush();
    const last = () => api.getOrganizationPerformance.mock.calls.at(-1)[2];
    expect(new Date(last().toUtc) - new Date(last().fromUtc)).toBe(DAY);

    await click(q('[data-testid="performance-window-custom"]'));
    const calls = api.getOrganizationPerformance.mock.calls.length;
    act(() => type(q('[data-testid="performance-from"]'), '2026-01-01'));
    act(() => type(q('[data-testid="performance-to"]'), '2026-11-01'));
    await click(q('[data-testid="performance-window-apply"]'));
    await flush();
    expect(q('[data-testid="performance-window-error"]').textContent).toContain('90');
    act(() => type(q('[data-testid="performance-from"]'), '2026-10-01'));
    await click(q('[data-testid="performance-window-apply"]'));
    await flush();
    expect(api.getOrganizationPerformance.mock.calls.length).toBeGreaterThan(calls);
    expect(last()).toMatchObject({ fromUtc: '2026-10-01T00:00:00.000Z', toUtc: '2026-11-02T00:00:00.000Z' });

    act(() => choose(q('[data-testid="performance-unit"]'), 'oun_0002'));
    await flush();
    expect(last().unitId).toBe('oun_0002');
    expect(qa('[data-perf-unit]')).toHaveLength(1);
    expect(q('[data-testid="performance-checks-empty"]')).not.toBeNull();
    expect(qa('#performance-unit option')).toHaveLength(4);
  });

  it('opens the trigger editor preset to EvalSet from New check', async () => {
    mount(<PerformanceView recordId="org_0001" />, { apiClient: client() });
    await flush();
    await click(q('[data-testid="performance-new-check"]'));
    expect(q('[data-testid="where"]').textContent).toBe('/dashboard/agents?tab=triggers&new=EvalSet');
  });

  it('disables New check for a caller who may not create triggers (UT-03)', async () => {
    const api = { ...client(), getUserPermissions: vi.fn(async () => ({ grants: [{ resourceTypes: ['All'], operations: ['Read'], permissionType: 'Permit' }] })) };
    mount(<PerformanceView recordId="org_0001" />, { apiClient: api, principal: { userId: 'usr_vic' } });
    await flush();
    await flush();
    const button = q('[data-testid="performance-new-check"]');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    expect(button.getAttribute('data-tip')).toContain('Create on');
    const before = q('[data-testid="where"]').textContent;
    await click(button);
    expect(q('[data-testid="where"]').textContent).toBe(before);
  });
});

describe('cancel everything in a unit', () => {
  it('confirms with the unit name, sends the reason, and shows the counts', async () => {
    const api = client();
    const onDone = vi.fn();
    const onFreeze = vi.fn();
    mount(<CascadeCancelModal organizationId="org_0001" unit={{ id: 'oun_0002', name: 'Billing' }} onClose={() => {}} onDone={onDone} onFreeze={onFreeze} />, { apiClient: api });
    expect(q('.modal').textContent).toContain('Cancel everything in Billing');
    expect(api.cancelOrgUnitAll).not.toHaveBeenCalled();
    act(() => type(q('[data-testid="cascade-cancel-reason"]'), ' runaway loop '));
    await act(async () => q('[data-testid="cascade-cancel-confirm"]').click());
    await flush();
    expect(api.cancelOrgUnitAll).toHaveBeenCalledWith('default', 'org_0001', 'oun_0002', { reason: 'runaway loop' });
    expect(onDone).toHaveBeenCalled();
    const result = q('[data-testid="cascade-cancel-result"]');
    expect(result.querySelector('[data-count="runsCancelled"] dd').textContent).toBe('3');
    expect(result.querySelector('[data-count="messagesExpired"] dd').textContent).toBe('4');
    await click(q('[data-testid="cascade-cancel-freeze"]'));
    expect(onFreeze).toHaveBeenCalledWith({ id: 'oun_0002', name: 'Billing' });
  });

  it('is offered in the board brakes panel and on the chart cards', async () => {
    const api = client();
    mount(<BoardView recordId="org_0001" />, { apiClient: api });
    await flush();
    expect(qa('[data-testid="board-chart"] [data-testid="org-unit-cancel-all"]')).toHaveLength(3);
    const button = q('[data-testid="board-cancel-all"]');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    act(() => choose(q('[data-testid="board-freeze-unit"]'), 'oun_0002'));
    await click(q('[data-testid="board-cancel-all"]'));
    expect(q('[data-testid="cascade-cancel-modal"]')).not.toBeNull();
    await act(async () => q('[data-testid="cascade-cancel-confirm"]').click());
    await flush();
    expect(api.cancelOrgUnitAll).toHaveBeenCalledWith('default', 'org_0001', 'oun_0002', { reason: null });
  });

  it('rolls back with the chosen in-flight ticks option', async () => {
    const api = client();
    mount(<BoardView recordId="org_0001" />, { apiClient: api });
    await flush();
    await click(q('[data-testid="board-rollback"]'));
    expect(q('[data-testid="rollback-ticks-finish"]').checked).toBe(true);
    await click(q('[data-testid="rollback-ticks-cancel"]'));
    await act(async () => q('[data-testid="confirm-button"]').click());
    await flush();
    expect(api.rollbackOrganization).toHaveBeenCalledWith('default', 'org_0001', { note: en.board.brakes.rollbackNote, activeTicks: 'Cancel' });
  });
});

describe('scheduled checks and the budget freeze margin', () => {
  it('sends the EvalSet target fields and checks them', () => {
    const body = triggerToBody({ ...blankTrigger(), name: 'nightly-check', targetType: 'EvalSet', agentId: 'agt_1', evalSetId: 'evs_1', deploymentId: 'dep_1', evalJudgeAgentId: '', evalRecentInputCount: '30', inputTemplateId: 'tpl_1' });
    expect(body).toMatchObject({ targetType: 'EvalSet', agentId: null, pipelineId: null, evalSetId: 'evs_1', deploymentId: 'dep_1', evalJudgeAgentId: null, evalRecentInputCount: 30, inputTemplateId: null });
    expect(triggerToBody({ ...blankTrigger(), name: 'a', agentId: 'agt_1' })).toMatchObject({ evalSetId: null, evalRecentInputCount: null });
    const errors = triggerErrors({ ...blankTrigger(), name: 'c', targetType: 'EvalSet', evalSetId: '', deploymentId: '', evalRecentInputCount: 51 }, t);
    expect(Object.keys(errors).sort()).toEqual(['deploymentId', 'evalRecentInputCount', 'evalSetId']);
    expect(triggerErrors({ ...blankTrigger(), name: 'c', targetType: 'EvalSet', evalSetId: 'evs_1', deploymentId: 'dep_1' }, t)).toEqual({});
    expect(triggerToForm({ name: 'c', targetType: 'EvalSet', evalSetId: 'evs_1' }).evalRecentInputCount).toBe(20);
  });

  it('opens a new EvalSet trigger from the URL and shows its fields', () => {
    const preset = triggersConfig.createFromUrl(new URLSearchParams('tab=triggers&new=EvalSet&deploymentId=dep_1'));
    expect(preset).toEqual({ data: { targetType: 'EvalSet', deploymentId: 'dep_1', name: '' }, clear: ['new', 'deploymentId'] });
    expect(triggersConfig.createFromUrl(new URLSearchParams('tab=triggers'))).toBeNull();
    const data = { ...blankTrigger(), ...preset.data };
    const fields = triggersConfig.fields(data, { t, options: { agents: [], deployments: [{ id: 'dep_1', name: 'd', agentId: 'agt_9' }], evalSets: [{ id: 'evs_1', name: 'refund-answers', version: 2 }] }, mode: 'create' });
    const shown = fields.filter((f) => !f.showIf || f.showIf(data)).map((f) => f.name);
    expect(shown).toEqual(expect.arrayContaining(['evalSetId', 'deploymentId', 'evalJudgeAgentId', 'evalRecentInputCount']));
    expect(shown).not.toContain('agentId');
    expect(shown).not.toContain('inputTemplateId');
    expect(fields.find((f) => f.name === 'evalSetId').options).toEqual([{ value: 'evs_1', label: 'refund-answers v2' }]);
    expect(fields.find((f) => f.name === 'deploymentId').required).toBe(true);
  });

  it('keeps the budget freeze margin between 0 and 100 with a default of 10', () => {
    expect(organizationToForm(null).budgetFreezeMarginPercent).toBe(10);
    expect(organizationFormToBody({ name: 'x', budgetFreezeMarginPercent: '0' }).budgetFreezeMarginPercent).toBe(0);
    expect(organizationFormToBody({ name: 'x', budgetFreezeMarginPercent: '' }).budgetFreezeMarginPercent).toBe(10);
    expect(organizationFormErrors({ name: 'x', budgetFreezeMarginPercent: 101 }, t).budgetFreezeMarginPercent).toContain('100');
    expect(organizationFormErrors({ name: 'x', budgetFreezeMarginPercent: 2.5 }, t)).toHaveProperty('budgetFreezeMarginPercent');
    expect(organizationFormErrors({ name: 'x', budgetFreezeMarginPercent: 100 }, t)).toEqual({});
  });
});

describe('API routes', () => {
  it('calls the performance and cascade cancel routes', async () => {
    const calls = [];
    const c = new ApiClient('http://127.0.0.1:8700', 'tok');
    c._request = (method, path, opts) => {
      calls.push([method, path, opts?.body ?? null, opts?.query ?? null]);
      return Promise.resolve({});
    };
    await c.getOrganizationPerformance('default', 'org_1');
    await c.getOrganizationPerformance('default', 'org_1', { fromUtc: 'a', toUtc: 'b', unitId: 'oun_1' });
    await c.cancelOrgUnitAll('default', 'org_1', 'oun_1', { reason: 'r' });
    await c.rollbackOrganization('default', 'org_1', { activeTicks: 'Cancel' });
    const base = '/v1.0/api/tenants/default/organizations/org_1';
    expect(calls[0]).toEqual(['GET', `${base}/performance`, null, null]);
    expect(calls[1]).toEqual(['GET', `${base}/performance`, null, { fromUtc: 'a', toUtc: 'b', unitId: 'oun_1' }]);
    expect(calls[2]).toEqual(['POST', `${base}/units/oun_1/cancel-all`, { reason: 'r' }, null]);
    expect(calls[3]).toEqual(['POST', `${base}/rollback`, { activeTicks: 'Cancel' }, null]);
  });
});
