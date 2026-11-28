// LP4.5 to LP4.8: the guided tour engine (navigation, waiting, skipping, persistence, focus, Escape), placing the
// card inside the viewport in both directions and down to 390px, the sample data offer, the tour definitions and
// their strings in every locale, the hub "?" buttons, the setup wizard's next step, and the Home card.
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, useLocation } from 'react-router-dom';
import i18n from '../i18n';
import { TRANSLATIONS, en } from '../i18n/resources';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import { TourProvider, useTours } from '../context/TourContext';
import TourRunner from '../components/tours/TourRunner';
import HubTourButton from '../components/tours/HubTourButton';
import HomeLearnCard from '../components/tours/HomeLearnCard';
import SetupWizard from '../components/SetupWizard';
import { HUB_TOURS, TOURS, findTour, hubTourFor, tourNamespace } from '../config/tours';
import { HUBS } from '../config/navConfig';
import { TOUR_IDS, tourKey } from '../components/learn/learnSections';
import { STORAGE_KEYS, TOUR_TARGET_TIMEOUT_MS } from '../utils/constants';
import { exampleContents, fillRoute, markTourCompleted, placeTourCard, readCompletedTours, routePlaceholders, tenantHas, tourCardWidth, userStorageKey, waitForTarget, writeUserFlag } from '../utils/tours';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const PRINCIPAL = { tenantId: 'default', principalId: 'usr_admin', principalName: 'admin@garrison', isAdmin: true };
const OTHER = { tenantId: 'default', principalId: 'usr_other', principalName: 'other@garrison' };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitFor(check, ms = 3000) {
  const start = Date.now();
  for (;;) {
    let ok = false;
    try {
      ok = !!check();
    } catch {
      ok = false;
    }
    if (ok) return;
    if (Date.now() - start > ms) throw new Error('waitFor timed out');
    await act(async () => {
      await sleep(20);
    });
  }
}

const q = (sel) => document.body.querySelector(sel);
const click = (el) => act(() => el.click());

let mounted = [];
let rectSpy;
beforeAll(async () => {
  await i18n.changeLanguage('en');
});
beforeEach(() => {
  // jsdom lays nothing out: give every element a box so the engine treats targets as shown.
  rectSpy = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function rect() {
    if (this.hasAttribute && this.hasAttribute('data-hidden')) return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
    return { top: 100, left: 40, right: 240, bottom: 140, width: 200, height: 40 };
  });
  Element.prototype.scrollIntoView = vi.fn();
  localStorage.clear();
});
afterEach(() => {
  for (const { root, container } of mounted) {
    act(() => root.unmount());
    container.remove();
  }
  mounted = [];
  document.body.innerHTML = '';
  rectSpy.mockRestore();
  localStorage.clear();
});

/** A stand-in for the dashboard: each path renders the data-tour targets its real page has. */
function FakePages({ pages }) {
  const location = useLocation();
  const targets = pages[location.pathname] || [];
  return (
    <div data-testid="fake-page" data-path={`${location.pathname}${location.search}`}>
      {targets.map((x) => (
        <div key={x} data-tour={x}>
          {x}
        </div>
      ))}
    </div>
  );
}

function Starter({ tourId }) {
  const tours = useTours();
  return (
    <button type="button" data-testid="start" onClick={() => tours.startTour(tourId)}>
      start
    </button>
  );
}

function mount(element, { apiClient = {}, principal = PRINCIPAL, entries = ['/dashboard/home'], app = {} } = {}) {
  const container = document.createElement('div');
  container.id = 'root';
  document.body.appendChild(container);
  const root = createRoot(container);
  const addToast = vi.fn();
  act(() => {
    root.render(
      <MemoryRouter initialEntries={entries}>
        <AuthContext.Provider value={{ apiClient, principal }}>
          <AppContext.Provider value={{ tenantId: 'default', setWizardOpen: () => {}, setTourOpen: () => {}, wizardOpen: false, ...app }}>
            <ToastContext.Provider value={{ addToast }}>
              <TourProvider>{element}</TourProvider>
            </ToastContext.Provider>
          </AppContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  });
  mounted.push({ root, container });
  return { container, addToast };
}

const KEEP_IT_SAFE_PAGES = {
  '/dashboard/home': ['kill-switch'],
  '/dashboard/autonomy': ['resource-freezes'],
  '/dashboard/keepers/mdt_1': ['keeper-limits'],
  '/dashboard/organizations': ['resource-changeRules'],
  '/dashboard/approvals': ['resource-approvals']
};

const populated = () => ({
  listMandates: vi.fn(async () => ({ items: [{ id: 'mdt_1', name: 'gerbil-keeper' }], totalCount: 1 })),
  applyManifest: vi.fn(async () => ({ items: [] }))
});

describe('tour definitions (LP-009, LP4.7)', () => {
  it('defines the six tours the Learn page offers, each with three to seven steps', () => {
    expect(TOURS.map((x) => x.id)).toEqual(TOUR_IDS);
    for (const x of TOURS) {
      expect(x.steps.length).toBeGreaterThanOrEqual(3);
      expect(x.steps.length).toBeLessThanOrEqual(7);
      for (const s of x.steps) {
        expect(s.route.startsWith('/dashboard/')).toBe(true);
        expect(s.target).toMatch(/^[a-z][A-Za-z-]*$/);
        expect(s.title).toBe(`${tourNamespace(x.id)}.steps.${s.id}.title`);
      }
    }
  });

  it('has every tour string in English and in every translated locale', () => {
    const lookup = (catalog, key) => key.split('.').reduce((n, p) => (n && typeof n === 'object' ? n[p] : undefined), catalog);
    for (const catalog of [en, ...Object.values(TRANSLATIONS)]) {
      for (const x of TOURS) {
        expect(typeof lookup(catalog, `${tourNamespace(x.id)}.summary`)).toBe('string');
        expect(typeof lookup(catalog, tourKey(x.id))).toBe('string');
        for (const s of x.steps) {
          expect(typeof lookup(catalog, s.title), s.title).toBe('string');
          expect(typeof lookup(catalog, s.body), s.body).toBe('string');
        }
      }
      for (const key of ['skip', 'back', 'next', 'done', 'hub', 'start', 'replay', 'sampleLoad', 'sampleContinue', 'homeCardOpen', 'homeCardDismiss', 'wizardLearn', 'wizardTour']) {
        expect(typeof lookup(catalog, `tips.tours.${key}`), key).toBe('string');
      }
    }
  });

  it('maps hubs to tours, with tab overrides, and only names real hubs and tours', () => {
    for (const [hub, entry] of Object.entries(HUB_TOURS)) {
      expect(HUBS.some((h) => h.key === hub), hub).toBe(true);
      expect(findTour(entry.tour)).toBeTruthy();
      for (const id of Object.values(entry.tabs || {})) expect(findTour(id)).toBeTruthy();
    }
    expect(hubTourFor('organizations')).toBe('build-a-team');
    expect(hubTourFor('organizations', 'board')).toBe('watch-an-organization');
    expect(hubTourFor('autonomy', 'freezes')).toBe('keep-it-safe');
    expect(hubTourFor('fleet')).toBeNull();
  });

  it('keeps the target wait in constants, at 3 seconds', () => {
    expect(TOUR_TARGET_TIMEOUT_MS).toBe(3000);
  });
});

describe('tour helpers', () => {
  it('fills route placeholders and reports a missing record', () => {
    expect(routePlaceholders('/dashboard/runs/{run}?tab=trail&step={run}')).toEqual(['run', 'run']);
    expect(fillRoute('/dashboard/organizations/{organization}?tab=design&unit={unit}', { organization: 'org_1', unit: 'On call' })).toBe('/dashboard/organizations/org_1?tab=design&unit=On%20call');
    expect(fillRoute('/dashboard/runs/{run}', {})).toBeNull();
    expect(fillRoute('/dashboard/home', {})).toBe('/dashboard/home');
  });

  it('saves completion per tour per user', () => {
    expect(userStorageKey(STORAGE_KEYS.toursDone, PRINCIPAL, 'default')).toBe('garrison_tours_done:default:usr_admin');
    markTourCompleted(PRINCIPAL, 'default', 'first-look');
    markTourCompleted(PRINCIPAL, 'default', 'first-look');
    expect(readCompletedTours(PRINCIPAL, 'default')).toEqual(['first-look']);
    expect(readCompletedTours(OTHER, 'default')).toEqual([]);
    expect(readCompletedTours(PRINCIPAL, 'other-tenant')).toEqual([]);
  });

  it('keeps the card inside the viewport in both directions, beside tall targets, and at 390px', () => {
    const viewport = { width: 1366, height: 768 };
    const rect = { top: 100, bottom: 140, left: 1200, right: 1300, width: 100, height: 40 };
    const ltr = placeTourCard({ rect, cardHeight: 220, viewport });
    expect(ltr.top).toBe(152);
    expect(ltr.left + ltr.width).toBeLessThanOrEqual(1366 - 16);
    const rtl = placeTourCard({ rect: { ...rect, left: 60, right: 160 }, cardHeight: 220, viewport, rtl: true });
    expect(rtl.left).toBeGreaterThanOrEqual(16);
    // Low on the page: above the target.
    const above = placeTourCard({ rect: { top: 700, bottom: 740, left: 100, right: 200, width: 100, height: 40 }, cardHeight: 220, viewport });
    expect(above.top).toBe(700 - 12 - 220);
    // The sidebar: beside it, on the inline-end side.
    const tall = { top: 0, bottom: 768, left: 0, right: 240, width: 240, height: 768 };
    expect(placeTourCard({ rect: tall, cardHeight: 220, viewport }).left).toBe(252);
    const tallRtl = { top: 0, bottom: 768, left: 1126, right: 1366, width: 240, height: 768 };
    expect(placeTourCard({ rect: tallRtl, cardHeight: 220, viewport, rtl: true }).left).toBe(1126 - 12 - 340);
    // A phone: the card is the viewport less both margins and never leaves it.
    const phone = { width: 390, height: 844 };
    expect(tourCardWidth(390)).toBe(340);
    expect(tourCardWidth(360)).toBe(328);
    for (const r of [{ top: 10, bottom: 50, left: 300, right: 380, width: 80, height: 40 }, { top: 800, bottom: 840, left: 0, right: 390, width: 390, height: 40 }]) {
      for (const dir of [false, true]) {
        const p = placeTourCard({ rect: r, cardHeight: 300, viewport: phone, rtl: dir });
        expect(p.left).toBeGreaterThanOrEqual(16);
        expect(p.left + p.width).toBeLessThanOrEqual(390 - 16);
        expect(p.top).toBeGreaterThanOrEqual(16);
        expect(p.top + 300).toBeLessThanOrEqual(844 - 16);
      }
    }
  });

  it('waits for a target, and gives up after the timeout', async () => {
    const later = setTimeout(() => {
      const el = document.createElement('div');
      el.setAttribute('data-tour', 'late');
      document.body.appendChild(el);
    }, 120);
    const found = await waitForTarget('[data-tour="late"]', { timeoutMs: 1000, pollMs: 20 });
    expect(found?.getAttribute('data-tour')).toBe('late');
    clearTimeout(later);
    const started = Date.now();
    expect(await waitForTarget('[data-tour="never"]', { timeoutMs: 300, pollMs: 20 })).toBeNull();
    expect(Date.now() - started).toBeGreaterThanOrEqual(280);
  });

  it('knows when a tenant lacks what a tour needs; a failed read never pushes an apply', async () => {
    expect(await tenantHas({ listAgents: async () => ({ items: [{ name: 'agent-architect' }], totalCount: 1 }) }, 'default', 'agents')).toBe(false);
    expect(await tenantHas({ listAgents: async () => ({ items: [{ name: 'echo-agent' }], totalCount: 1 }) }, 'default', 'agents')).toBe(true);
    expect(await tenantHas({ listOrganizations: async () => ({ items: [], totalCount: 0 }) }, 'default', 'organizations')).toBe(false);
    expect(await tenantHas({ listRuns: async () => { throw new Error('down'); } }, 'default', 'runs')).toBe(true);
    expect(exampleContents('siteReliability').some((c) => c.kind === 'Organization' && c.name === 'site-reliability-org')).toBe(true);
    expect(exampleContents('gerbil').map((c) => c.kind)).toContain('Mandate');
  });
});

describe('the tour engine (LP4.5)', () => {
  it('navigates to each step, moves focus into the card, and saves completion on Done', async () => {
    const apiClient = populated();
    mount(
      <>
        <Starter tourId="keep-it-safe" />
        <FakePages pages={KEEP_IT_SAFE_PAGES} />
        <TourRunner timeoutMs={400} />
      </>,
      { apiClient }
    );
    q('[data-testid="start"]').focus();
    await click(q('[data-testid="start"]'));
    await waitFor(() => q('[data-tour-step="killSwitch"]'));
    const card = q('[data-testid="tour-card"]');
    expect(document.activeElement).toBe(card);
    expect(card.getAttribute('role')).toBe('dialog');
    expect(q('[data-testid="tour-highlight"]')).toBeTruthy();
    expect(q('[data-testid="tour-sample"]')).toBeNull();

    const expected = [
      ['freezes', '/dashboard/autonomy?tab=freezes'],
      ['spendCaps', '/dashboard/keepers/mdt_1'],
      ['changeRules', '/dashboard/organizations?tab=change-rules'],
      ['approvals', '/dashboard/approvals']
    ];
    for (const [id, path] of expected) {
      await click(q('[data-testid="tour-next"]'));
      await waitFor(() => q(`[data-tour-step="${id}"]`));
      expect(q('[data-testid="fake-page"]').getAttribute('data-path')).toBe(path);
    }
    expect(q('[data-testid="tour-next"]')).toBeNull();
    await click(q('[data-testid="tour-back"]'));
    await waitFor(() => q('[data-tour-step="changeRules"]'));
    await click(q('[data-testid="tour-next"]'));
    await waitFor(() => q('[data-tour-step="approvals"]'));
    await click(q('[data-testid="tour-done"]'));
    expect(q('[data-testid="tour-card"]')).toBeNull();
    expect(readCompletedTours(PRINCIPAL, 'default')).toEqual(['keep-it-safe']);
    await waitFor(() => document.activeElement === q('[data-testid="start"]'));
  });

  it('skips a step whose target never appears, with a visible note, after waiting', async () => {
    const pages = { '/dashboard/home': ['sidebar', 'topbar', 'kpis', 'nav-invoke', 'nav-organizations', 'sidebar-help'] };
    mount(
      <>
        <Starter tourId="first-look" />
        <FakePages pages={pages} />
        <TourRunner timeoutMs={300} />
      </>
    );
    await click(q('[data-testid="start"]'));
    await waitFor(() => q('[data-tour-step="sidebar"]'));
    for (const id of ['topbar', 'kpis', 'invoke']) {
      await click(q('[data-testid="tour-next"]'));
      await waitFor(() => q(`[data-tour-step="${id}"]`));
    }
    const started = Date.now();
    await click(q('[data-testid="tour-next"]'));
    await waitFor(() => q('[data-tour-step="organizations"]'));
    expect(Date.now() - started).toBeGreaterThanOrEqual(250);
    expect(q('[data-testid="tour-note"]').textContent).toContain('Skipped Agents that work on their own');
    // The next step clears the note.
    await click(q('[data-testid="tour-next"]'));
    await waitFor(() => q('[data-tour-step="help"]'));
    expect(q('[data-testid="tour-note"]')).toBeNull();
  });

  it('skips a step with no record, and ends with a note when the last steps are skipped', async () => {
    const apiClient = { listRuns: vi.fn(async () => ({ items: [{ id: 'run_1' }], totalCount: 1 })), listAgents: async () => ({ items: [{ name: 'echo-agent' }], totalCount: 1 }) };
    const pages = { '/dashboard/connections': ['resource-harnessProfiles'], '/dashboard/agents': ['resource-agents'], '/dashboard/invoke': ['invoke-form'] };
    mount(
      <>
        <Starter tourId="run-an-agent" />
        <FakePages pages={pages} />
        <TourRunner timeoutMs={250} />
      </>,
      { apiClient }
    );
    await click(q('[data-testid="start"]'));
    await waitFor(() => q('[data-tour-step="connections"]'));
    await click(q('[data-testid="tour-next"]'));
    await waitFor(() => q('[data-tour-step="agents"]'));
    // Deployments is on /dashboard/agents?tab=deployments, where this fake page has no resource-deployments.
    await click(q('[data-testid="tour-next"]'));
    await waitFor(() => q('[data-tour-step="invoke"]'));
    expect(q('[data-testid="tour-note"]').textContent).toContain('Deployments');
    // The run and its trail are on a page this fake does not draw: both are skipped and the tour ends.
    await click(q('[data-testid="tour-next"]'));
    await waitFor(() => q('[data-tour-step="end"]'), 4000);
    expect(q('[data-testid="fake-page"]').getAttribute('data-path')).toBe('/dashboard/runs/run_1');
    expect(q('[data-testid="tour-note"]').textContent).toContain('The run');
    await click(q('[data-testid="tour-done"]'));
    expect(readCompletedTours(PRINCIPAL, 'default')).toEqual(['run-an-agent']);
  });

  it('closes on Escape without saving, and puts focus back', async () => {
    mount(
      <>
        <Starter tourId="first-look" />
        <FakePages pages={{ '/dashboard/home': ['sidebar'] }} />
        <TourRunner timeoutMs={300} />
      </>
    );
    q('[data-testid="start"]').focus();
    await click(q('[data-testid="start"]'));
    await waitFor(() => q('[data-tour-step="sidebar"]'));
    expect(document.getElementById('root').inert).toBe(true);
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(q('[data-testid="tour-card"]')).toBeNull();
    expect(readCompletedTours(PRINCIPAL, 'default')).toEqual([]);
    expect(document.getElementById('root').inert).toBeFalsy();
    await waitFor(() => document.activeElement === q('[data-testid="start"]'));
  });

  it('turns off smooth scrolling under prefers-reduced-motion', async () => {
    const original = window.matchMedia;
    window.matchMedia = (query) => ({ matches: query.includes('reduce'), media: query, addEventListener() {}, removeEventListener() {} });
    try {
      mount(
        <>
          <Starter tourId="first-look" />
          <FakePages pages={{ '/dashboard/home': ['sidebar'] }} />
          <TourRunner timeoutMs={300} />
        </>
      );
      await click(q('[data-testid="start"]'));
      await waitFor(() => q('[data-tour-step="sidebar"]'));
      expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }));
    } finally {
      window.matchMedia = original;
    }
  });
});

describe('sample data (LP4.6)', () => {
  it('offers the example on an empty tenant, listing what the apply creates, and loads it on confirm', async () => {
    const dry = { items: [{ kind: 'Agent', name: 'gerbil', result: 'Created' }] };
    let keepers = [];
    const apiClient = {
      listMandates: vi.fn(async () => ({ items: keepers, totalCount: keepers.length })),
      applyManifest: vi.fn(async (_tenant, _text, dryRun) => {
        if (!dryRun) keepers = [{ id: 'mdt_1' }];
        return dry;
      })
    };
    mount(
      <>
        <Starter tourId="keep-it-safe" />
        <FakePages pages={KEEP_IT_SAFE_PAGES} />
        <TourRunner timeoutMs={300} />
      </>,
      { apiClient }
    );
    await click(q('[data-testid="start"]'));
    await waitFor(() => q('[data-testid="tour-sample"]'));
    expect(q('[data-testid="tour-sample"]').getAttribute('data-example')).toBe('gerbil');
    const items = [...document.querySelectorAll('[data-sample-item]')].map((li) => li.getAttribute('data-sample-item'));
    expect(items).toEqual(exampleContents('gerbil').map((c) => `${c.kind}/${c.name}`));
    await waitFor(() => apiClient.applyManifest.mock.calls.length === 1);
    expect(apiClient.applyManifest.mock.calls[0][2]).toBe(true);
    await waitFor(() => q('[data-sample-item="Agent/gerbil"]').textContent.includes('Created'));
    await click(q('[data-testid="tour-sample-load"]'));
    await waitFor(() => q('[data-tour-step="killSwitch"]'));
    expect(apiClient.applyManifest.mock.calls[1][2]).toBe(false);
    expect(q('[data-testid="tour-sample"]')).toBeNull();
  });

  it('does not offer it on a populated tenant', async () => {
    const apiClient = populated();
    mount(
      <>
        <Starter tourId="keep-it-safe" />
        <FakePages pages={KEEP_IT_SAFE_PAGES} />
        <TourRunner timeoutMs={300} />
      </>,
      { apiClient }
    );
    await click(q('[data-testid="start"]'));
    await waitFor(() => q('[data-tour-step="killSwitch"]'));
    expect(q('[data-testid="tour-sample"]')).toBeNull();
    expect(apiClient.applyManifest).not.toHaveBeenCalled();
  });

  it('lets a person continue without the example', async () => {
    const apiClient = { listMandates: vi.fn(async () => ({ items: [], totalCount: 0 })), applyManifest: vi.fn(async () => ({ items: [] })) };
    mount(
      <>
        <Starter tourId="keep-it-safe" />
        <FakePages pages={KEEP_IT_SAFE_PAGES} />
        <TourRunner timeoutMs={300} />
      </>,
      { apiClient }
    );
    await click(q('[data-testid="start"]'));
    await waitFor(() => q('[data-testid="tour-sample-continue"]'));
    await click(q('[data-testid="tour-sample-continue"]'));
    await waitFor(() => q('[data-tour-step="killSwitch"]'));
    expect(apiClient.applyManifest.mock.calls.every((c) => c[2] === true)).toBe(true);
  });
});

describe('hub buttons and first run (LP4.7, LP4.8)', () => {
  it('shows a "?" button that starts the hub tour, and none for a hub without one', async () => {
    mount(
      <>
        <HubTourButton hubKey="organizations" tab="board" />
        <div data-testid="fleet">
          <HubTourButton hubKey="fleet" />
        </div>
        <TourRunner timeoutMs={250} />
      </>,
      { apiClient: { listOrganizations: async () => ({ items: [{ id: 'org_1', name: 'x' }], totalCount: 1 }) } }
    );
    const button = q('[data-testid="hub-tour"]');
    expect(button.getAttribute('data-hub-tour')).toBe('watch-an-organization');
    expect(button.getAttribute('aria-label')).toBe('Start the Watch an organization tour');
    expect(q('[data-testid="fleet"]').children).toHaveLength(0);
    await click(button);
    await waitFor(() => q('[data-tour-id="watch-an-organization"]'));
  });

  it('offers Learn and the Run an agent tour on the wizard\'s last step, and records a skip per user', async () => {
    const setWizardOpen = vi.fn();
    mount(
      <>
        <SetupWizard />
        <TourRunner timeoutMs={250} />
      </>,
      { app: { wizardOpen: true, setWizardOpen }, apiClient: { listAgents: async () => ({ items: [{ name: 'echo-agent' }], totalCount: 1 }), applyManifest: async () => ({ items: [] }) } }
    );
    const byText = (text) => [...document.querySelectorAll('button')].find((x) => x.textContent === text);
    await click(byText(i18n.t('wizard.start')));
    await click(byText(i18n.t('wizard.skipStep')));
    await waitFor(() => q('[data-testid="wizard-skip-studio"]'));
    await click(q('[data-testid="wizard-skip-studio"]'));
    await click(byText(i18n.t('views.manifests.apply')));
    await waitFor(() => q('[data-testid="wizard-skip-keeper"]'));
    await click(q('[data-testid="wizard-skip-keeper"]'));
    await waitFor(() => q('[data-testid="wizard-next"]'));
    expect(q('[data-testid="wizard-open-learn"]').textContent).toBe('Open Learn');
    await click(q('[data-testid="wizard-start-tour"]'));
    await waitFor(() => q('[data-tour-id="run-an-agent"]'));
    expect(localStorage.getItem('garrison_setup_skipped:default:usr_admin')).toBeNull();
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    // Skip wizard, by contrast, records the skip for this person.
    await click(q('[data-testid="wizard-skip"]'));
    expect(localStorage.getItem('garrison_setup_skipped:default:usr_admin')).toBe('true');
  });

  it('shows the Home card to a person who skipped setup, and saves its dismissal per user', async () => {
    writeUserFlag(STORAGE_KEYS.setupSkipped, PRINCIPAL, 'default', true);
    mount(<HomeLearnCard />);
    expect(q('[data-testid="home-learn-card"]')).toBeTruthy();
    await click(q('[data-testid="home-learn-dismiss"]'));
    expect(q('[data-testid="home-learn-card"]')).toBeNull();
    expect(localStorage.getItem('garrison_learn_card_dismissed:default:usr_admin')).toBe('true');
    act(() => {
      mounted[0].root.unmount();
    });
    mounted[0].container.remove();
    mounted = [];
    mount(<HomeLearnCard />);
    expect(q('[data-testid="home-learn-card"]')).toBeNull();
    // Someone else in the tenant who did not skip sees nothing.
    mount(<HomeLearnCard />, { principal: OTHER });
    expect(q('[data-testid="home-learn-card"]')).toBeNull();
  });
});
