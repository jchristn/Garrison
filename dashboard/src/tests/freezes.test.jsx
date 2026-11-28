// Brakes (AA3.8): navigation (Autonomy > Freezes), enums, the freeze helpers, the Freezes list configuration and the
// Freeze and Lift row actions of the Deployments and Apps lists, the freeze and lift dialogs, the frozen banner, the
// Freeze and Lift header button, the kill switch control, the Home Autonomy card, and the API routes.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import FreezeModal from '../components/FreezeModal';
import LiftFreezeModal from '../components/LiftFreezeModal';
import FrozenBanner from '../components/FrozenBanner';
import FreezeAction from '../components/FreezeAction';
import KillSwitchControl from '../components/KillSwitchControl';
import HomeAutonomyCard from '../components/HomeAutonomyCard';
import { freezesConfig, deploymentsConfig, appsConfig } from '../views/resourceConfigs';
import { freezeRowActions } from '../views/freezeConfigs';
import { PAGE_VIEWS } from '../views/hubs/hubPanels';
import { findPage, pathFor } from '../config/navConfig';
import { ENUMS, FREEZE_TARGET_KINDS, SUBSCRIBABLE_NOTIFICATION_EVENTS } from '../utils/constants';
import ApiClient from '../utils/api';
import { FREEZES_CHANGED_EVENT, freezeDenied, freezeIndex, freezeOn, freezesFor, freezeTargetPath, freezeTargetText, isActive, isKillSwitch, reasonError } from '../utils/freezes';
import { freeze, killSwitch } from '../../tests/e2e/mocks.js';

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
const click = (el) => act(() => el.click());

const active = [freeze(1), freeze(2)];
const all = [freeze(1), freeze(2), freeze(3), freeze(4)];
const readOnly = { grants: [{ resourceTypes: ['Freeze'], operations: ['Read'], permissionType: 'Permit' }] };

describe('navigation and enums', () => {
  it('puts Freezes under Autonomy with a view', () => {
    expect(findPage('freezes').hub).toBe('autonomy');
    expect(pathFor('freezes')).toBe('/dashboard/autonomy?tab=freezes');
    expect(PAGE_VIEWS.freezes).toBeTypeOf('function');
  });

  it('lists the freeze kinds, resource type, audit events, and notification events', () => {
    expect(ENUMS.freezeTargetKind).toEqual(['Agent', 'Deployment', 'Mandate', 'App', 'OrgUnit', 'Organization', 'TenantAutonomy']);
    expect(FREEZE_TARGET_KINDS).toEqual(['Agent', 'Deployment', 'Mandate', 'App']);
    expect(ENUMS.resourceType).toContain('Freeze');
    expect(ENUMS.auditEventType).toEqual(expect.arrayContaining(['FreezeApplied', 'FreezeLifted', 'KillSwitchChanged']));
    expect(SUBSCRIBABLE_NOTIFICATION_EVENTS).toEqual(expect.arrayContaining(['FreezeApplied', 'MandateCapReached']));
    expect(t('enums.freezeTargetKind.Mandate')).toBe('Keeper');
    expect(t('enums.freezeTargetKind.TenantAutonomy')).toBe('Kill switch');
  });
});

describe('freeze helpers', () => {
  it('finds the freezes that stop a record, its own first, and the kill switch only when asked', () => {
    const kill = { ...freeze(4), active: true, liftedUtc: undefined };
    const list = [...all, kill];
    expect(freezeOn(list, 'Deployment', 'dep_0003').id).toBe('mfz_0001');
    expect(freezeOn(list, 'Agent', 'agt_0001')).toBeNull();
    expect(isActive(freeze(3))).toBe(false);
    expect(isKillSwitch(kill)).toBe(true);
    const stopping = freezesFor(list, [{ kind: 'App', id: 'app_0002' }, { kind: 'Deployment', id: 'dep_0003' }], { killSwitch: true });
    expect(stopping.map((f) => f.id)).toEqual(['mfz_0002', 'mfz_0001', kill.id]);
    expect(freezesFor(list, [{ kind: 'Agent', id: 'agt_0001' }])).toEqual([]);
    expect(Object.keys(freezeIndex(list))).toEqual(['Deployment', 'App', 'TenantAutonomy']);
  });

  it('names and links what a freeze stops', () => {
    expect(freezeTargetText(t, freeze(1))).toBe('Deployment deployment-3');
    expect(freezeTargetText(t, freeze(4))).toBe('The autonomy kill switch');
    expect(freezeTargetPath(freeze(3))).toBe('/dashboard/agents/agt_0001');
    expect(freezeTargetPath({ targetKind: 'Mandate', targetId: 'mdt_0001' })).toBe('/dashboard/keepers/mdt_0001');
    expect(freezeTargetPath(freeze(1))).toBe('/dashboard/agents?tab=deployments&search=deployment-3');
    expect(freezeTargetPath(freeze(4))).toBeNull();
  });

  it('explains a missing permission and checks the reason length', () => {
    expect(freezeDenied(t, null, 'Create')).toBe('');
    expect(freezeDenied(t, { isAdmin: true }, 'Update')).toBe('');
    expect(freezeDenied(t, readOnly, 'Create')).toBe('You may not do this. It needs Create on Freeze.');
    expect(reasonError(t, 'x'.repeat(2001), 2000)).toBe('The reason is limited to 2000 characters.');
    expect(reasonError(t, 'fine', 2000)).toBe('');
  });
});

describe('Freezes list configuration', () => {
  const ctx = { t, i18n, navigate: vi.fn(), setExtraModal: vi.fn(), reload: vi.fn(), lookups: {} };

  it('opens on the active freezes and filters by every kind, units and organizations too (UXP1-S019)', () => {
    expect(freezesConfig.defaultFilters).toEqual({ active: 'true' });
    expect(freezesConfig.filters.find((f) => f.name === 'targetKind').options).toEqual(ENUMS.freezeTargetKind);
    expect(ENUMS.freezeTargetKind).toEqual(expect.arrayContaining(['OrgUnit', 'Organization']));
    expect(freezesConfig.lookupsEvents).toEqual([FREEZES_CHANGED_EVENT]);
  });

  it('offers Lift only on active freezes other than the kill switch, disabled without Update', () => {
    const labels = (r, c = ctx) => freezesConfig.rowActions(r, c).filter((a) => !a.hidden).map((a) => a.label);
    expect(labels(freeze(1))).toEqual(['Open what it freezes', 'Lift freeze']);
    expect(labels(freeze(3))).toEqual(['Open what it freezes']);
    expect(labels(freeze(4))).toEqual([]);
    const lift = freezesConfig.rowActions(freeze(1), { ...ctx, lookups: { permissions: readOnly } }).find((a) => a.label === 'Lift freeze');
    expect(lift.disabled).toBe(true);
    expect(lift.tip).toMatch(/Update on Freeze/);
  });

  it('renders the target, status, and kill switch rows', () => {
    const columns = freezesConfig.columns({ t, i18n });
    const csv = (key, r) => columns.find((c) => c.key === key).csv(r);
    expect(csv('target', freeze(1))).toBe('Deployment: deployment-3');
    expect(csv('target', freeze(4))).toBe('The autonomy kill switch');
    expect(csv('status', freeze(1))).toBe('Active');
    expect(csv('status', freeze(3))).toBe('Lifted');
  });

  it('adds Freeze or Lift to the Deployments and Apps row menus from the freeze lookups', () => {
    const lookups = { freezes: freezeIndex(active), permissions: null };
    expect(freezeRowActions('Deployment', { id: 'dep_0003', name: 'deployment-3' }, { ...ctx, lookups }).map((a) => a.label)).toEqual(['Lift freeze']);
    expect(freezeRowActions('Deployment', { id: 'dep_0001', name: 'deployment-1' }, { ...ctx, lookups }).map((a) => a.label)).toEqual(['Freeze']);
    expect(freezeRowActions('App', { id: 'app_0001' }, { ...ctx, lookups: {} })).toEqual([]);
    expect(deploymentsConfig.rowActions({ id: 'dep_0001', agentId: 'agt_0001' }, { ...ctx, lookups }).map((a) => a.label)).toContain('Freeze');
    expect(appsConfig.rowActions({ id: 'app_0002', name: 'support' }, { ...ctx, lookups }).map((a) => a.label)).toContain('Lift freeze');
    expect(deploymentsConfig.lookupsEvents).toEqual([FREEZES_CHANGED_EVENT]);
    expect(appsConfig.lookupsEvents).toEqual([FREEZES_CHANGED_EVENT]);
  });
});

describe('freeze and lift dialogs', () => {
  it('freezes a fixed target with a reason and cancelling active runs, then tells the page', async () => {
    const applyFreeze = vi.fn(async () => ({ ...freeze(1), cancelledRunCount: 2 }));
    const onDone = vi.fn();
    const changed = vi.fn();
    window.addEventListener(FREEZES_CHANGED_EVENT, changed);
    const { addToast } = mount(<FreezeModal targetKind="Mandate" targetId="mdt_0001" targetName="support-queue" onClose={() => {}} onDone={onDone} />, { apiClient: { applyFreeze } });
    expect(q('.modal').textContent).toContain('Freeze Keeper support-queue?');
    act(() => type(q('[data-testid="freeze-reason"]'), ' Runaway spend '));
    click(q('[data-testid="freeze-cancel-active"]'));
    click(q('[data-testid="confirm-button"]'));
    await flush();
    expect(applyFreeze).toHaveBeenCalledWith('default', { targetKind: 'Mandate', targetId: 'mdt_0001', reason: 'Runaway spend', cancelActiveRuns: true });
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Keeper support-queue is frozen and 2 active runs were cancelled.' });
    expect(changed).toHaveBeenCalled();
    expect(onDone).toHaveBeenCalled();
    window.removeEventListener(FREEZES_CHANGED_EVENT, changed);
  });

  it('picks the kind and target on the Freezes page and refuses without a target', async () => {
    const applyFreeze = vi.fn(async () => freeze(1));
    const listAgents = vi.fn(async () => ({ items: [{ id: 'agt_0001', name: 'echo-agent', displayName: 'Echo' }] }));
    const listApps = vi.fn(async () => ({ items: [{ id: 'app_0001', name: 'research' }] }));
    mount(<FreezeModal onClose={() => {}} onDone={() => {}} />, { apiClient: { applyFreeze, listAgents, listApps } });
    await flush();
    expect(qa('[data-testid="freeze-target"] option').map((o) => o.textContent)).toEqual(['Choose...', 'Echo (echo-agent)']);
    click(q('[data-testid="confirm-button"]'));
    await flush();
    expect(q('.modal').textContent).toContain('Choose what to freeze.');
    expect(applyFreeze).not.toHaveBeenCalled();
    act(() => type(q('[data-testid="freeze-kind"]'), 'App'));
    await flush();
    expect(listApps).toHaveBeenCalled();
    act(() => type(q('[data-testid="freeze-target"]'), 'app_0001'));
    click(q('[data-testid="confirm-button"]'));
    await flush();
    expect(applyFreeze).toHaveBeenCalledWith('default', { targetKind: 'App', targetId: 'app_0001', reason: null, cancelActiveRuns: false });
  });

  it('shows the server refusal in the dialog', async () => {
    const applyFreeze = vi.fn(async () => {
      throw Object.assign(new Error('x'), { status: 409, code: 'AlreadyFrozen' });
    });
    mount(<FreezeModal targetKind="Agent" targetId="agt_0001" targetName="echo-agent" onClose={() => {}} />, { apiClient: { applyFreeze } });
    click(q('[data-testid="confirm-button"]'));
    await flush();
    expect(q('.modal').textContent).toContain('This is already frozen.');
  });

  it('lifts with a reason and explains a freeze someone else lifted', async () => {
    const liftFreeze = vi.fn(async () => ({ ...freeze(1), active: false }));
    const { addToast } = mount(<LiftFreezeModal freeze={freeze(1)} onClose={() => {}} onDone={() => {}} />, { apiClient: { liftFreeze } });
    act(() => type(q('[data-testid="lift-reason"]'), 'Fixed'));
    click(q('[data-testid="confirm-button"]'));
    await flush();
    expect(liftFreeze).toHaveBeenCalledWith('default', 'mfz_0001', { reason: 'Fixed' });
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'The freeze on Deployment deployment-3 is lifted.' });

    const gone = vi.fn(async () => {
      throw Object.assign(new Error('x'), { status: 409, code: 'FreezeLifted' });
    });
    mount(<LiftFreezeModal freeze={freeze(2)} onClose={() => {}} />, { apiClient: { liftFreeze: gone } });
    click(qa('[data-testid="confirm-button"]').pop());
    await flush();
    expect(document.body.textContent).toContain('Someone already lifted this freeze.');
  });
});

describe('frozen banner and header button', () => {
  it('shows its own freeze, freezes inherited from the agent or deployment with a link, and the kill switch without Lift', () => {
    const own = { ...freeze(1), targetKind: 'Mandate', targetId: 'mdt_0001', targetName: 'support-queue' };
    const agentFreeze = { ...freeze(3), active: true, liftedUtc: undefined };
    const kill = { ...freeze(4), id: 'mfz_0009', active: true, liftedUtc: undefined };
    mount(<FrozenBanner freezes={[own, agentFreeze, kill]} own={own} />);
    const banners = qa('[data-testid="frozen-banner"]');
    expect(banners).toHaveLength(3);
    expect(banners[0].textContent).toContain('Frozen: new runs are refused');
    expect(banners[0].textContent).toContain('Reason: Canary is answering in the wrong language.');
    expect(banners[1].textContent).toContain('Agent echo-agent is frozen');
    expect(banners[1].querySelector('a').getAttribute('href')).toBe('/dashboard/agents/agt_0001');
    expect(banners[2].textContent).toContain('The autonomy kill switch is on');
    expect(banners[2].querySelector('[data-testid="frozen-banner-lift"]')).toBeNull();
  });

  it('disables Lift on the banner without Update on Freeze', () => {
    mount(<FrozenBanner freezes={[freeze(1)]} permissions={readOnly} />);
    const lift = q('[data-testid="frozen-banner-lift"]');
    expect(lift.getAttribute('aria-disabled')).toBe('true');
    click(lift);
    expect(q('.modal')).toBeNull();
  });

  it('switches between Freeze and Lift and hides when freezes cannot be read', () => {
    mount(<FreezeAction targetKind="Deployment" targetId="dep_0003" targetName="deployment-3" active={{ freezes: active, readable: true }} />);
    expect(q('[data-testid="freeze-lift"]')).not.toBeNull();
    mount(<FreezeAction targetKind="Deployment" targetId="dep_0001" targetName="deployment-1" active={{ freezes: active, readable: true }} />);
    expect(q('[data-testid="freeze-apply"]')).not.toBeNull();
    click(q('[data-testid="freeze-apply"]'));
    expect(q('.modal').textContent).toContain('Freeze Deployment deployment-1?');
    const { container } = mount(<FreezeAction targetKind="Agent" targetId="agt_0001" active={{ freezes: [], readable: false }} />);
    expect(container.textContent).toBe('');
  });
});

describe('kill switch', () => {
  it('turns on after a confirmation with a reason', async () => {
    let on = false;
    const getKillSwitch = vi.fn(async () => killSwitch(on));
    const setKillSwitch = vi.fn(async (_tenant, body) => {
      on = body.enabled;
      return killSwitch(on);
    });
    const { addToast } = mount(<KillSwitchControl />, { apiClient: { getKillSwitch, setKillSwitch } });
    await flush();
    const control = q('[data-testid="kill-switch"]');
    expect(control.dataset.enabled).toBe('false');
    expect(control.textContent).toContain('Off');
    click(q('[data-testid="kill-switch-toggle"]'));
    expect(q('.modal').textContent).toContain('Every keeper in this tenant stops waking');
    act(() => type(q('[data-testid="kill-switch-reason"]'), 'Incident drill.'));
    click(q('[data-testid="confirm-button"]'));
    await flush();
    expect(setKillSwitch).toHaveBeenCalledWith('default', { enabled: true, reason: 'Incident drill.' });
    expect(addToast).toHaveBeenCalledWith({ type: 'warning', message: 'The kill switch is on. No keeper wakes and no message wakes an agent.' });
    expect(q('[data-testid="kill-switch"]').dataset.enabled).toBe('true');
    expect(q('[data-testid="kill-switch-meta"]').textContent).toContain('Turned on by admin@garrison');
  });

  it('hides when the caller may not read it', async () => {
    const getKillSwitch = vi.fn(async () => {
      throw Object.assign(new Error('x'), { status: 403 });
    });
    const { container } = mount(<KillSwitchControl />, { apiClient: { getKillSwitch } });
    await flush();
    expect(container.textContent).toBe('');
  });

  it('shows on the Home Autonomy card with the number of active freezes', async () => {
    const apiClient = {
      listMandates: vi.fn(async () => ({ items: [], totalCount: 0 })),
      listFreezes: vi.fn(async () => ({ items: active })),
      getKillSwitch: vi.fn(async () => killSwitch(false))
    };
    mount(<HomeAutonomyCard />, { apiClient });
    await flush();
    expect(q('[data-testid="home-autonomy"] [data-testid="kill-switch"]')).not.toBeNull();
    expect(q('[data-testid="home-autonomy-freezes"]').textContent).toBe('2 freezes are active');
    expect(apiClient.listFreezes).toHaveBeenCalledWith('default', { active: true, pageNumber: 1, pageSize: 1000 });
  });
});

describe('API client', () => {
  it('uses the documented freeze and kill switch routes', async () => {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url: String(url), method: init.method, body: init.body });
      return new Response(JSON.stringify({ objects: [], totalRecords: 0 }), { status: 200 });
    });
    try {
      const client = new ApiClient('http://127.0.0.1:8700', 'tok');
      await client.listFreezes('default', { active: true, targetKind: 'Agent', pageNumber: 1, pageSize: 25 });
      await client.getFreeze('default', 'mfz_1');
      await client.applyFreeze('default', { targetKind: 'Agent', targetId: 'echo-agent' });
      await client.liftFreeze('default', 'mfz_1');
      await client.getKillSwitch('default');
      await client.setKillSwitch('default', { enabled: true });
      expect(calls.map((c) => `${c.method} ${c.url.replace('http://127.0.0.1:8700/v1.0/api/tenants/default/', '')}`)).toEqual([
        'GET freezes?active=true&targetKind=Agent&maxResults=25&skip=0',
        'GET freezes/mfz_1',
        'POST freezes',
        'POST freezes/mfz_1/lift',
        'GET autonomy/kill-switch',
        'PUT autonomy/kill-switch'
      ]);
      expect(JSON.parse(calls[2].body)).toEqual({ targetKind: 'Agent', targetId: 'echo-agent' });
      expect(JSON.parse(calls[3].body)).toEqual({});
      expect(JSON.parse(calls[5].body)).toEqual({ enabled: true });
    } finally {
      globalThis.fetch = original;
    }
  });
});
