// Simulated user findings on the Autonomy pages (AA12.8): the shared missing-permission helpers and the list
// configurations that use them (UT-03), the interval chart's distinct time labels (UT-11), and the scroll buttons of a
// tab strip that does not fit (UT-16).
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import HomeEscalationsCard from '../components/HomeEscalationsCard';
import Tabs from '../components/Tabs';
import { changeRulesConfig, organizationsConfig } from '../views/resourceConfigs';
import { distinctAxisLabels } from '../utils/chart';
import { deniedProps, deniedReasonFor, permissionDenied, permissionsLookup } from '../utils/permissions';
import { escalation } from '../../tests/e2e/mocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
const q = (sel) => document.body.querySelector(sel);
const viewer = { grants: [{ resourceTypes: ['All'], operations: ['Read'], permissionType: 'Permit' }] };

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

function mount(element, { apiClient = {}, principal = { isAdmin: true } } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <AuthContext.Provider value={{ apiClient, principal }}>
          <AppContext.Provider value={{ tenantId: 'default', setWizardOpen: () => {}, setTourOpen: () => {} }}>{element}</AppContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  });
  mounted.push({ root, container });
  return { container };
}

describe('missing-permission helpers (UT-03)', () => {
  it('explains a missing permission and stays quiet when it is held or unknown', () => {
    expect(permissionDenied(t, viewer, 'Organization', 'Create')).toBe('You may not do this. It needs Create on Organization.');
    expect(permissionDenied(t, null, 'Organization', 'Create')).toBe('');
    expect(permissionDenied(t, { isTenantAdmin: true, grants: [] }, 'Mandate', 'Execute')).toBe('');
    expect(deniedProps('why')).toEqual({ 'aria-disabled': 'true', 'data-denied': 'true' });
    expect(deniedProps('')).toEqual({});
  });

  it('maps ResourceView actions to operations and loads the permissions as a lookup', async () => {
    const reason = deniedReasonFor('ChangeRule');
    expect(reason('create', null, { t, lookups: { permissions: viewer } })).toContain('Create on');
    expect(reason('delete', { id: 'chr_1' }, { t, lookups: { permissions: viewer } })).toContain('Delete on');
    const apiClient = { getUserPermissions: vi.fn(async () => viewer) };
    expect(await permissionsLookup({ apiClient, tenantId: 'default', principal: { userId: 'usr_vic' } })).toEqual({ permissions: viewer });
    const failing = { getUserPermissions: vi.fn(async () => Promise.reject(new Error('no'))) };
    expect(await permissionsLookup({ apiClient: failing, tenantId: 'default', principal: { userId: 'usr_vic' } })).toEqual({ permissions: null });
  });

  it('gates Create organization and Add rule for a viewer', () => {
    const ctx = { t, lookups: { permissions: viewer } };
    expect(organizationsConfig.deniedReason('create', null, ctx)).toContain('Create on Organization');
    expect(changeRulesConfig.deniedReason('create', null, ctx)).toContain('Create on');
    expect(organizationsConfig.deniedReason('create', null, { t, lookups: { permissions: { isAdmin: true, grants: [] } } })).toBe('');
  });

  it('disables Answer on the Home escalation card for a viewer', async () => {
    const apiClient = { listEscalations: vi.fn(async () => ({ items: [escalation(1)], totalCount: 1 })), getUserPermissions: vi.fn(async () => viewer) };
    mount(<HomeEscalationsCard />, { apiClient, principal: { userId: 'usr_vic' } });
    await flush();
    await flush();
    const answer = q('[data-testid^="home-escalation-answer-"]');
    expect(answer.getAttribute('aria-disabled')).toBe('true');
    expect(answer.getAttribute('data-tip')).toContain('Update on Escalation');
    act(() => answer.click());
    expect(q('.modal')).toBeNull();
  });
});

describe('interval chart labels (UT-11)', () => {
  const format = (iso, withSeconds) => (withSeconds ? iso.slice(11, 19) : iso.slice(11, 16));

  it('keeps minute labels when they differ', () => {
    const times = ['2026-11-26T17:13:00Z', '2026-11-26T17:14:00Z', '2026-11-26T17:15:00Z'];
    expect([...distinctAxisLabels(times, new Set([0, 1, 2]), format).values()]).toEqual(['17:13', '17:14', '17:15']);
  });

  it('adds seconds when ticks share a minute, and drops a label that still repeats', () => {
    const times = ['2026-11-26T17:13:05Z', '2026-11-26T17:13:40Z', '2026-11-26T17:14:02Z', '2026-11-26T17:14:02Z'];
    const labels = distinctAxisLabels(times, new Set([0, 1, 2, 3]), format);
    expect([...labels.entries()]).toEqual([
      [0, '17:13:05'],
      [1, '17:13:40'],
      [2, '17:14:02']
    ]);
  });
});

describe('tab strip scroll buttons (UT-16)', () => {
  const tabs = Array.from({ length: 14 }, (_, i) => ({ id: `t${i}`, label: `Tab ${i}`, tip: `Tab ${i}` }));

  function sized(scrollWidth, clientWidth) {
    const w = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function () {
      return this.getAttribute?.('role') === 'tablist' ? scrollWidth : 0;
    });
    const c = vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function () {
      return this.getAttribute?.('role') === 'tablist' ? clientWidth : 0;
    });
    return () => {
      w.mockRestore();
      c.mockRestore();
    };
  }

  it('shows no scroll buttons when every tab fits', () => {
    const restore = sized(800, 1000);
    mount(<Tabs tabs={tabs} active="t0" onChange={() => {}} label="Autonomy" />);
    expect(q('[data-testid="tabs-scroll-forward"]')).toBeNull();
    expect(q('[data-testid="tabs-scroll-back"]')).toBeNull();
    restore();
  });

  it('shows a scroll button with a tooltip when tabs are hidden past the edge, and scrolls on click', () => {
    const restore = sized(2000, 1000);
    mount(<Tabs tabs={tabs} active="t0" onChange={() => {}} label="Autonomy" />);
    const forward = q('[data-testid="tabs-scroll-forward"]');
    expect(forward).not.toBeNull();
    expect(forward.getAttribute('aria-label')).toBe('Show more tabs');
    expect(forward.getAttribute('data-tip')).toBeTruthy();
    expect(q('[data-testid="tabs-scroll-back"]')).toBeNull();
    const list = q('[role="tablist"]');
    list.scrollBy = vi.fn();
    act(() => forward.click());
    expect(list.scrollBy).toHaveBeenCalledWith({ left: 600, behavior: 'smooth' });
    expect(q('[role="tablist"] [data-testid="tabs-scroll-forward"]')).toBeNull();
    restore();
  });
});
