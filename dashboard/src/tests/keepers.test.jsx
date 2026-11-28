// Keepers (AA1.16): navigation (Autonomy > Keepers), enums, the form helpers and validation, interval formatting, the
// list configuration and its row actions, the keeper page (summary, ticks, revisions, Pause and Wake, delete with a
// running tick), the New revision dialog, the Home Autonomy card, the run link back to a keeper, and the API routes.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import KeeperDetailView from '../views/KeeperDetailView';
import KeeperRevisionModal from '../components/KeeperRevisionModal';
import HomeAutonomyCard from '../components/HomeAutonomyCard';
import { keepersConfig } from '../views/resourceConfigs';
import { runsConfig } from '../views/runConfigs';
import { PAGE_VIEWS, DETAIL_VIEWS } from '../views/hubs/hubPanels';
import { findPage, findHub, pathFor, hubForPath } from '../config/navConfig';
import { ENUMS, MANDATE_LIMITS } from '../utils/constants';
import ApiClient from '../utils/api';
import {
  blankKeeper,
  keeperToForm,
  keeperToBody,
  keeperDuplicate,
  keeperErrors,
  revisionErrors,
  revisionToBody,
  revisionToForm,
  intervalParts,
  formatInterval,
  canPause,
  canResume,
  canWake,
  revisionText,
  previousRevision,
  tickSeries,
  outcomeCounts,
  autonomySummary,
  needsAttention
} from '../utils/keepers';
import { keeper, keeperRevision, keeperTick } from '../../tests/e2e/mocks.js';

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
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
}

const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const page = (objects) => ({ items: objects, totalCount: objects.length, pageNumber: 1, pageSize: 25 });
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

/** An API client stub for the keeper page: keeper 1 with its revisions and ticks. */
function keeperClient(overrides = {}) {
  return {
    getMandate: vi.fn(async () => keeper(1)),
    listMandateTicks: vi.fn(async () => page([1, 2, 3, 4, 5, 6].map((i) => keeperTick(i)))),
    listMandateRevisions: vi.fn(async () => page([2, 1, 3].map((n) => keeperRevision([1, 2, 3][[2, 1, 3].indexOf(n)])))),
    getAgent: vi.fn(async () => ({ id: 'agt_0001', name: 'echo-agent' })),
    getDeployment: vi.fn(async () => ({ id: 'dep_0001', name: 'deployment-1' })),
    pauseMandate: vi.fn(async () => ({ ...keeper(1), status: 'Paused' })),
    resumeMandate: vi.fn(async () => keeper(1)),
    wakeMandate: vi.fn(async () => ({ ...keeper(1), pendingWakeSource: 'Manual' })),
    deleteMandate: vi.fn(async () => null),
    publishMandateRevision: vi.fn(async () => keeper(1)),
    createMandateRevision: vi.fn(async (_t, _id, body) => ({ ...body, id: 'mdr_0099', number: 4, state: 'Draft' })),
    ...overrides
  };
}

describe('navigation', () => {
  it('puts keepers in the Autonomy group with a detail route', () => {
    expect(findPage('keepers')).toMatchObject({ hub: 'autonomy', tab: 'keepers', detail: true });
    expect(findHub('autonomy')).toMatchObject({ icon: 'AutonomyIcon' });
    expect(pathFor('keepers')).toBe('/dashboard/autonomy');
    expect(pathFor('keepers', 'mdt_1')).toBe('/dashboard/keepers/mdt_1');
    expect(hubForPath('/dashboard/keepers/mdt_1').key).toBe('autonomy');
    expect(PAGE_VIEWS.keepers).toBeTruthy();
    expect(DETAIL_VIEWS.keepers).toBe(KeeperDetailView);
  });

  it('mirrors the server enums and explains every value', () => {
    expect(ENUMS.mandateStatus).toEqual(['Draft', 'Active', 'Paused', 'Frozen', 'CapReached', 'Retired']);
    expect(ENUMS.wakeMode).toEqual(['Fixed', 'Backoff']);
    expect(ENUMS.wakeSource).toEqual(['Timer', 'Manual', 'Message', 'EscalationAnswer', 'Webhook', 'Report']);
    expect(ENUMS.tickOutcome).toEqual(['Quiet', 'Acted', 'Attention', 'Escalated', 'Failed', 'Skipped', 'Unreported']);
    expect(ENUMS.mandateRevisionSource).toEqual(['Human', 'Board', 'Executive', 'Architect']);
    expect(ENUMS.runKind).toContain('Keeper');
    expect(ENUMS.resourceType).toContain('Mandate');
    for (const group of ['mandateStatus', 'mandateRevisionState', 'mandateRevisionSource', 'wakeMode', 'wakeSource', 'tickOutcome']) {
      for (const v of ENUMS[group]) expect(t(`tips.enums.${group}.${v}`).length, `${group}.${v}`).toBeGreaterThan(25);
    }
  });
});

describe('keeper form helpers', () => {
  it('sends the first revision inline on create and only the mandate fields on edit', () => {
    const form = { ...blankKeeper(), name: ' support-queue ', agentId: 'agt_1', deploymentId: 'dep_1', objective: ' Keep the queue short. ', signals: [{ name: ' depth ', description: '' }, { name: '', description: '' }], jitterPercent: null, budgetPerTickUsd: 0.25 };
    const create = keeperToBody(form, 'create');
    expect(create).toMatchObject({ name: 'support-queue', description: null, agentId: 'agt_1', deploymentId: 'dep_1' });
    expect(create.currentRevision).toMatchObject({ objective: 'Keep the queue short.', wakeMode: 'Backoff', minIntervalSeconds: 900, maxIntervalSeconds: 86400, backoffFactor: 2, jitterPercent: null, budgetPerTickUsd: 0.25, budgetPerDayUsd: null, maxTokensPerTick: null });
    expect(create.currentRevision.signals).toEqual([{ name: 'depth', description: null, order: 0 }]);
    const edit = keeperToBody(form, 'edit');
    expect(edit).not.toHaveProperty('currentRevision');
  });

  it('validates names, references, text, intervals, and signals like the server', () => {
    expect(keeperErrors({ ...blankKeeper(), name: 'ok', agentId: 'a', deploymentId: 'd', objective: 'x' }, t, 'create')).toEqual({});
    const errors = keeperErrors({ ...blankKeeper(), name: 'Bad Name', objective: '', minIntervalSeconds: 5, maxIntervalSeconds: 3000000, backoffFactor: 20, jitterPercent: 60 }, t, 'create');
    expect(Object.keys(errors).sort()).toEqual(['agentId', 'backoffFactor', 'deploymentId', 'jitterPercent', 'maxIntervalSeconds', 'minIntervalSeconds', 'name', 'objective']);
    expect(revisionErrors({ ...blankKeeper(), objective: 'x', minIntervalSeconds: 3600, maxIntervalSeconds: 60 }, t)).toHaveProperty('maxIntervalSeconds');
    const signals = revisionErrors({ ...blankKeeper(), objective: 'x', signals: [{ name: 'Depth' }, { name: 'depth' }] }, t);
    expect(signals).toHaveProperty(['signals[1].name']);
    expect(signals).toHaveProperty('signals');
    expect(revisionErrors({ ...blankKeeper(), objective: 'x'.repeat(MANDATE_LIMITS.textMax + 1) }, t)).toHaveProperty('objective');
    // Edit checks only the mandate fields: the revision changes through New revision.
    expect(keeperErrors({ name: 'ok', agentId: 'a', deploymentId: 'd', objective: '' }, t, 'edit')).toEqual({});
  });

  it('round-trips a stored keeper and duplicates without identity or schedule state', () => {
    const form = keeperToForm(keeper(1));
    expect(form.objective).toContain('support queue');
    expect(form.signals).toHaveLength(2);
    expect(form.jitterPercent).toBe(10);
    expect(form.budgetPerDayUsd).toBe(5);
    expect(keeperToForm(keeper(3)).budgetPerDayUsd).toBe('');
    const copy = keeperDuplicate(keeper(1));
    for (const k of ['id', 'status', 'nextWakeUtc', 'tickCount', 'runAsId', 'currentRevision', 'currentRevisionId']) expect(copy).not.toHaveProperty(k);
    expect(copy.name).toBe('support-queue-copy');
    expect(revisionToBody(revisionToForm(keeperRevision(1))).signals.map((s) => s.name)).toEqual(['open tickets', 'oldest ticket age']);
  });

  it('formats intervals in the largest unit that fits', () => {
    expect(intervalParts(45)).toEqual({ value: 45, unit: 'seconds' });
    expect(intervalParts(900)).toEqual({ value: 15, unit: 'minutes' });
    expect(intervalParts(5400)).toEqual({ value: 90, unit: 'minutes' });
    expect(intervalParts(9000)).toEqual({ value: 2.5, unit: 'hours' });
    expect(intervalParts(86400)).toEqual({ value: 1, unit: 'days' });
    expect(intervalParts(0)).toBeNull();
    expect(formatInterval(t, 1800)).toBe('30 min');
    expect(formatInterval(t, 86400)).toBe('1 day');
    expect(formatInterval(t, null)).toBe('-');
  });

  it('offers Pause, Resume, and Wake only where the server allows them', () => {
    expect([canPause(keeper(1)), canResume(keeper(1)), canWake(keeper(1))]).toEqual([true, false, true]);
    expect([canPause(keeper(2)), canResume(keeper(2)), canWake(keeper(2))]).toEqual([false, true, false]);
    expect([canPause(keeper(3)), canResume(keeper(3)), canWake(keeper(3))]).toEqual([false, false, false]);
    expect(canPause({ status: 'CapReached' })).toBe(true);
  });

  it('builds the tick chart, outcome counts, revision diff text, and Home summary', () => {
    const ticks = [1, 2, 3, 4, 5, 6].map((i) => keeperTick(i));
    const series = tickSeries(ticks);
    expect(series.times).toHaveLength(6);
    expect(series.times[0] < series.times[5]).toBe(true);
    expect(series.intervals[5]).toBe(30);
    expect(series.intervals[0]).toBeNull();
    expect(outcomeCounts(ticks, ENUMS.tickOutcome).map((c) => c.outcome)).toEqual(['Quiet', 'Acted', 'Attention', 'Failed', 'Skipped']);
    const text = revisionText(keeperRevision(1), t);
    expect(text).toContain('Objective:');
    expect(text).toContain('  - open tickets: Count in the support inbox');
    const revisions = [1, 2, 3].map((i) => keeperRevision(i));
    expect(previousRevision(revisions, revisions[2]).number).toBe(2);
    expect(previousRevision(revisions, revisions[1])).toBeNull();
    const summary = autonomySummary([keeper(1), keeper(2), keeper(3)], 3);
    expect(summary).toMatchObject({ total: 3, active: 1, paused: 1, running: 0 });
    expect(summary.attention.map((m) => m.name)).toEqual(['nightly-costs']);
    expect(needsAttention({ status: 'CapReached' })).toBe(true);
  });
});

describe('keeper list configuration', () => {
  const ctx = { t, i18n, apiClient: {}, tenantId: 'default', navigate: vi.fn(), addToast: vi.fn(), reload: vi.fn() };

  it('opens the keeper page from a row and offers the row actions that apply', () => {
    expect(keepersConfig.detailPath({ id: 'mdt_7' })).toBe('/dashboard/keepers/mdt_7');
    const active = keepersConfig.rowActions(keeper(1), ctx).filter((a) => !a.hidden).map((a) => a.label);
    expect(active).toEqual(['Pause', 'Wake now', 'View runs']);
    const paused = keepersConfig.rowActions(keeper(2), ctx).filter((a) => !a.hidden).map((a) => a.label);
    expect(paused).toEqual(['Resume', 'View runs']);
    keepersConfig.rowActions(keeper(1), ctx).find((a) => a.label === 'View runs').onClick();
    expect(ctx.navigate).toHaveBeenCalledWith('/dashboard/runs?mandateId=mdt_0001');
  });

  it('saves the agent and deployment the form shows when they were never picked (UXP1-S003)', () => {
    const options = {
      agents: [{ id: 'agt_1', name: 'research-flaky' }, { id: 'agt_2', name: 'other' }],
      deployments: [
        { id: 'dep_1', name: 'research-flaky-fake', agentId: 'agt_1' },
        { id: 'dep_2', name: 'other-fake', agentId: 'agt_2' }
      ]
    };
    // The designer opens the form with the agent filled in and the deployment empty; the select shows dep_1.
    const filled = keepersConfig.withOptions({ ...keepersConfig.blank(), agentId: 'agt_1' }, options);
    expect(filled).toMatchObject({ agentId: 'agt_1', deploymentId: 'dep_1' });
    expect(keepersConfig.withOptions(keepersConfig.blank(), options)).toMatchObject({ agentId: 'agt_1', deploymentId: 'dep_1' });
    // Changing the agent leaves another agent's deployment behind; the check and the body use the one shown.
    const stale = { ...keepersConfig.blank(), name: 'k', objective: 'Watch.', agentId: 'agt_2', deploymentId: 'dep_1' };
    expect(keepersConfig.validate(stale, t, { options }).deploymentId).toBeUndefined();
    expect(keepersConfig.toBody(stale, 'create', { options }).deploymentId).toBe('dep_2');
    // An agent with no active deployment still needs one.
    expect(keepersConfig.validate({ ...stale, agentId: 'agt_3' }, t, { options: { ...options, agents: [...options.agents, { id: 'agt_3', name: 'x' }] } }).deploymentId).toBe('Choose the deployment its ticks run on.');
  });

  it('says which keeper budgets are enforced (UXP1-S002)', () => {
    expect(t('resources.keepers.sectionHints.budgets')).toContain('Both dollar budgets are enforced');
    expect(t('resources.keepers.sectionHints.budgets')).not.toContain('later release');
    expect(t('resources.keepers.hints.maxTokensPerTick')).toContain('not enforced yet');
  });

  it('disables the add button, Edit, Delete, and the Execute actions for a viewer (UT-03)', () => {
    const lookups = { permissions: { grants: [{ resourceTypes: ['All'], operations: ['Read'], permissionType: 'Permit' }] } };
    const viewer = { ...ctx, lookups };
    for (const action of ['create', 'update', 'delete']) expect(keepersConfig.deniedReason(action, keeper(1), viewer)).toContain('on Keeper');
    const shown = keepersConfig.rowActions(keeper(1), viewer).filter((a) => !a.hidden);
    for (const label of ['Pause', 'Wake now']) {
      const a = shown.find((x) => x.label === label);
      expect(a.disabled).toBe(true);
      expect(a.tip).toContain('Execute on Keeper');
    }
    expect(shown.find((x) => x.label === 'View runs').disabled).toBeFalsy();
    const admin = { ...ctx, lookups: { permissions: { isAdmin: true, grants: [] } } };
    expect(keepersConfig.deniedReason('create', null, admin)).toBe('');
    expect(keepersConfig.rowActions(keeper(1), admin).find((x) => x.label === 'Wake now').disabled).toBe(false);
  });

  it('wakes a keeper from its row and reports the result', async () => {
    const apiClient = { wakeMandate: vi.fn(async () => keeper(1)) };
    const local = { ...ctx, apiClient, addToast: vi.fn(), reload: vi.fn() };
    await keepersConfig.rowActions(keeper(1), local).find((a) => a.label === 'Wake now').onClick();
    expect(apiClient.wakeMandate).toHaveBeenCalledWith('default', 'mdt_0001');
    expect(local.addToast).toHaveBeenCalledWith({ type: 'success', message: 'support-queue wakes now.' });
    expect(local.reload).toHaveBeenCalled();
  });

  it('shows revision fields only when creating, and locks the agent on edit', () => {
    const options = { agents: [{ id: 'agt_1', name: 'a' }], deployments: [{ id: 'dep_1', name: 'd', agentId: 'agt_1' }] };
    const visible = (mode, data) => keepersConfig.fields(data, { ...ctx, mode, options }).filter((f) => !f.showIf || f.showIf(data)).map((f) => f.name);
    expect(visible('create', blankKeeper())).toEqual(expect.arrayContaining(['objective', 'signals', 'wakeMode', 'maxIntervalSeconds', 'budgetPerDayUsd']));
    expect(visible('create', { ...blankKeeper(), wakeMode: 'Fixed' })).not.toContain('maxIntervalSeconds');
    expect(visible('edit', keeperToForm(keeper(1)))).toEqual(['name', 'description', 'agentId', 'deploymentId']);
    expect(keepersConfig.fields(blankKeeper(), { ...ctx, mode: 'edit', options }).find((f) => f.name === 'agentId').readOnly).toBe(true);
    expect(keepersConfig.errorFields({ code: 'NameConflict' }, t)).toEqual({ name: 'Another keeper already uses this name.' });
  });

  it('links a keeper tick run back to its keeper in the runs list', () => {
    const column = runsConfig.columns({ t, i18n, navigate: vi.fn() }).find((c) => c.key === 'mandateId');
    expect(column).toBeTruthy();
    expect(runsConfig.urlFilters).toContain('mandateId');
  });
});

describe('keeper page', () => {
  it('shows the summary, current revision, ticks, and revisions', async () => {
    const apiClient = keeperClient();
    mount(<KeeperDetailView recordId="mdt_0001" />, { apiClient });
    await flush();
    await flush();
    expect(q('[data-testid="keeper-detail"]')).toBeTruthy();
    expect(q('[data-testid="keeper-agent"]').textContent).toBe('echo-agent');
    expect(q('[data-testid="keeper-objective"]').textContent).toContain('under 20 open tickets');
    expect(qa('[data-testid="keeper-signals"] li')).toHaveLength(2);
    expect(qa('[data-testid="keeper-ticks-table"] tbody tr')).toHaveLength(6);
    expect(q('[data-testid="keeper-outcome-counts"]').textContent).toContain('Quiet');
    expect(qa('[data-testid="keeper-revisions-table"] tbody tr')).toHaveLength(3);
    expect(q('[data-testid="keeper-revision-publish-3"]')).toBeTruthy();
    expect(q('[data-testid="keeper-resume"]')).toBeNull();
    expect(apiClient.listMandateTicks).toHaveBeenCalledWith('default', 'mdt_0001', { pageNumber: 1, pageSize: 25 });
  });

  it('disables New revision, Pause, Wake now, Delete, and Publish for a viewer (UT-03)', async () => {
    const getUserPermissions = vi.fn(async () => ({ grants: [{ resourceTypes: ['All'], operations: ['Read'], permissionType: 'Permit' }] }));
    const apiClient = keeperClient({ getUserPermissions });
    mount(<KeeperDetailView recordId="mdt_0001" />, { apiClient, principal: { userId: 'usr_vic' } });
    await flush();
    await flush();
    for (const id of ['keeper-new-revision', 'keeper-pause', 'keeper-wake', 'keeper-delete', 'keeper-revision-publish-3']) {
      const button = q(`[data-testid="${id}"]`);
      expect(button.getAttribute('aria-disabled')).toBe('true');
      expect(button.getAttribute('data-tip')).toMatch(/You may not do this\. It needs \w+ on Keeper/);
      await click(button);
    }
    await flush();
    expect(apiClient.wakeMandate).not.toHaveBeenCalled();
    expect(apiClient.pauseMandate).not.toHaveBeenCalled();
    expect(apiClient.publishMandateRevision).not.toHaveBeenCalled();
    expect(q('.modal')).toBeNull();
  });

  it('labels a wake a person caused as Woken by hand (UT-15)', async () => {
    const apiClient = keeperClient({ listMandateTicks: vi.fn(async () => page([{ ...keeperTick(1), wakeSource: 'Manual' }])) });
    mount(<KeeperDetailView recordId="mdt_0001" />, { apiClient });
    await flush();
    await flush();
    const cell = q('[data-testid="keeper-ticks-table"] tbody tr td:nth-child(2) span');
    expect(cell.textContent).toBe('Woken by hand');
    expect(cell.getAttribute('data-tip')).toContain('A person woke the keeper');
  });

  it('filters ticks by outcome', async () => {
    const apiClient = keeperClient();
    mount(<KeeperDetailView recordId="mdt_0001" />, { apiClient });
    await flush();
    act(() => type(q('[data-testid="keeper-ticks-outcome"]'), 'Failed'));
    await flush();
    expect(apiClient.listMandateTicks).toHaveBeenLastCalledWith('default', 'mdt_0001', { pageNumber: 1, pageSize: 25, outcome: 'Failed' });
  });

  it('pauses and wakes the keeper', async () => {
    const apiClient = keeperClient();
    const { addToast } = mount(<KeeperDetailView recordId="mdt_0001" />, { apiClient });
    await flush();
    await click(q('[data-testid="keeper-wake"]'));
    await flush();
    expect(apiClient.wakeMandate).toHaveBeenCalledWith('default', 'mdt_0001');
    await click(q('[data-testid="keeper-pause"]'));
    await flush();
    expect(apiClient.pauseMandate).toHaveBeenCalledWith('default', 'mdt_0001');
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Paused support-queue.' });
  });

  it('offers to delete anyway, cancelling the tick, when a tick is running', async () => {
    const busy = Object.assign(new Error('busy'), { status: 409, code: 'MandateActive' });
    const deleteMandate = vi.fn(async (_t, _id, force) => {
      if (!force) throw busy;
      return null;
    });
    const apiClient = keeperClient({ deleteMandate });
    mount(<KeeperDetailView recordId="mdt_0001" />, { apiClient });
    await flush();
    await click(q('[data-testid="keeper-delete"]'));
    await click(qa('.modal-footer button').find((b) => b.textContent === 'Delete'));
    await flush();
    expect(document.body.textContent).toContain('Delete the keeper anyway and cancel');
    await click(qa('.modal-footer button').find((b) => b.textContent === 'Delete and cancel tick'));
    await flush();
    expect(deleteMandate.mock.calls.map((c) => c[2])).toEqual([false, true]);
  });

  it('compares a revision with the one before it', async () => {
    mount(<KeeperDetailView recordId="mdt_0001" />, { apiClient: keeperClient() });
    await flush();
    await click(q('[data-testid="keeper-revision-diff-2"]'));
    expect(q('[data-testid="keeper-diff-note"]').textContent).toContain('Watch the backlog');
    expect(q('.diff-viewer').textContent).toContain('Back off when quiet');
    expect(qa('.diff-add').length).toBeGreaterThan(0);
  });

  it('says so when the keeper does not exist', async () => {
    const missing = Object.assign(new Error('not found'), { status: 404, code: 'NotFound' });
    mount(<KeeperDetailView recordId="mdt_9999" />, { apiClient: keeperClient({ getMandate: vi.fn(async () => { throw missing; }) }) });
    await flush();
    expect(document.body.textContent).toContain('Keeper not found');
  });
});

describe('New revision dialog', () => {
  it('starts from the current revision and publishes the new one', async () => {
    const apiClient = keeperClient();
    const onSaved = vi.fn();
    const onClose = vi.fn();
    mount(<KeeperRevisionModal mandate={keeper(1)} onClose={onClose} onSaved={onSaved} />, { apiClient });
    const objective = q('#keeper-revision-objective');
    expect(objective.value).toContain('support queue');
    act(() => type(objective, 'Keep the queue under 10.'));
    act(() => type(q('#keeper-revision-changeNote'), 'Stricter target.'));
    await click(q('[data-testid="keeper-revision-publish"]'));
    await flush();
    const body = apiClient.createMandateRevision.mock.calls[0][2];
    expect(body).toMatchObject({ objective: 'Keep the queue under 10.', changeNote: 'Stricter target.', wakeMode: 'Backoff', minIntervalSeconds: 900 });
    expect(apiClient.publishMandateRevision).toHaveBeenCalledWith('default', 'mdt_0001', 'mdr_0099');
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the dialog open to list values the server adjusted', async () => {
    const createMandateRevision = vi.fn(async (_t, _id, body) => ({ ...body, id: 'mdr_0099', number: 4, warnings: [{ field: 'minIntervalSeconds', given: '30', stored: '60', message: 'minIntervalSeconds 30 is below Autonomy.MinIntervalSeconds; 60 was stored.' }] }));
    const onClose = vi.fn();
    mount(<KeeperRevisionModal mandate={keeper(1)} onClose={onClose} onSaved={vi.fn()} />, { apiClient: keeperClient({ createMandateRevision }) });
    await click(q('[data-testid="keeper-revision-draft"]'));
    await flush();
    expect(q('[data-testid="keeper-revision-warnings"]').textContent).toContain('Autonomy.MinIntervalSeconds');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('refuses an empty objective before calling the server', async () => {
    const apiClient = keeperClient();
    mount(<KeeperRevisionModal mandate={keeper(1)} onClose={vi.fn()} onSaved={vi.fn()} />, { apiClient });
    act(() => type(q('#keeper-revision-objective'), '  '));
    await click(q('[data-testid="keeper-revision-publish"]'));
    expect(apiClient.createMandateRevision).not.toHaveBeenCalled();
    expect(document.body.textContent).toContain('Describe the standing job.');
  });
});

describe('Home Autonomy card', () => {
  it('counts keepers and lists the ones that need attention', async () => {
    const apiClient = { listMandates: vi.fn(async () => page([keeper(1, false), keeper(2, false), keeper(3, false)])) };
    mount(<HomeAutonomyCard />, { apiClient });
    await flush();
    expect(q('[data-testid="home-autonomy-active"]').textContent).toContain('1');
    expect(q('[data-testid="home-autonomy-attention"]').textContent).toContain('nightly-costs');
  });

  it('says there are none, and hides when keepers cannot be read', async () => {
    mount(<HomeAutonomyCard />, { apiClient: { listMandates: vi.fn(async () => page([])) } });
    await flush();
    expect(q('[data-testid="home-autonomy-empty"]')).toBeTruthy();
    act(() => mounted.forEach(({ root }) => root.unmount()));
    mounted = [];
    const denied = Object.assign(new Error('no'), { status: 403 });
    mount(<HomeAutonomyCard />, { apiClient: { listMandates: vi.fn(async () => { throw denied; }) } });
    await flush();
    expect(q('[data-testid="home-autonomy"]')).toBeNull();
  });
});

describe('API client', () => {
  it('uses the documented mandate routes', async () => {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url: String(url), method: init.method, body: init.body });
      return new Response(JSON.stringify({ objects: [], totalRecords: 0 }), { status: 200 });
    });
    try {
      const client = new ApiClient('http://127.0.0.1:8700', 'tok');
      await client.listMandates('default', { status: 'Active', pageNumber: 2, pageSize: 25 });
      await client.getMandate('default', 'mdt_1');
      await client.createMandate('default', { name: 'k' });
      await client.updateMandate('default', 'mdt_1', { name: 'k' });
      await client.deleteMandate('default', 'mdt_1');
      await client.deleteMandate('default', 'mdt_1', true);
      await client.listMandateRevisions('default', 'mdt_1', { pageNumber: 1, pageSize: 100 });
      await client.getMandateRevision('default', 'mdt_1', 'mdr_1');
      await client.createMandateRevision('default', 'mdt_1', { objective: 'x' });
      await client.publishMandateRevision('default', 'mdt_1', 'mdr_1');
      await client.pauseMandate('default', 'mdt_1');
      await client.resumeMandate('default', 'mdt_1');
      await client.wakeMandate('default', 'mdt_1');
      await client.listMandateTicks('default', 'mdt_1', { outcome: 'Quiet', pageNumber: 1, pageSize: 25 });
      await client.getMandateTick('default', 'mtk_1');
      expect(calls.map((c) => `${c.method} ${c.url.replace('http://127.0.0.1:8700/v1.0/api/tenants/default/', '')}`)).toEqual([
        'GET mandates?status=Active&maxResults=25&skip=25',
        'GET mandates/mdt_1',
        'POST mandates',
        'PUT mandates/mdt_1',
        'DELETE mandates/mdt_1',
        'DELETE mandates/mdt_1?force=true',
        'GET mandates/mdt_1/revisions?maxResults=100&skip=0',
        'GET mandates/mdt_1/revisions/mdr_1',
        'POST mandates/mdt_1/revisions',
        'POST mandates/mdt_1/revisions/mdr_1/publish',
        'POST mandates/mdt_1/pause',
        'POST mandates/mdt_1/resume',
        'POST mandates/mdt_1/wake',
        'GET mandates/mdt_1/ticks?outcome=Quiet&maxResults=25&skip=0',
        'GET mandate-ticks/mtk_1'
      ]);
    } finally {
      globalThis.fetch = original;
    }
  });
});
