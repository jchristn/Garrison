// Activity trail views (LP2.3 to LP2.8) against the LP1.5 fixture: the sequence view (lanes, steps with an icon and a
// label, the hatched redacted step, the focus run, keyboard moves and Enter), the list view (columns, filters, row
// opens the drawer), the step drawer (a message, a report, an escalation, an effect, and a redacted step, with
// agent-written text shown as escaped data with its provenance), the Trail tab (summary, truncation banner, single
// run, load failure, ?step= opening the drawer, list only below 768px), and the Open trail links.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import TrailSequence from '../components/trail/TrailSequence';
import TrailList from '../components/trail/TrailList';
import TrailStepDrawer, { stepTexts } from '../components/trail/TrailStepDrawer';
import RunTrailPanel from '../components/trail/RunTrailPanel';
import OpenTrailLink from '../components/trail/OpenTrailLink';
import { trailToFlow } from '../components/trail/TrailGraph';
import { stepPath, trailPath } from '../components/trail/trailParts';
import { runsConfig } from '../views/runConfigs';
import { pathFor } from '../config/navConfig';
import fixture from './fixtures/runTrail.json';
import ApiClient from '../utils/api';
import EscalationDetailView from '../views/EscalationDetailView';
import ApprovalDetailView from '../views/ApprovalDetailView';
import ReportDetailView from '../views/ReportDetailView';
import MessageThreadView from '../views/MessageThreadView';
import ConversationDetailView from '../views/ConversationDetailView';
import KeeperDetailView from '../views/KeeperDetailView';
import BoardView from '../views/BoardView';
import { approval, board, escalation, messageThread, report, respond } from '../../tests/e2e/mocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });

beforeAll(async () => {
  await i18n.changeLanguage('en');
  if (typeof globalThis.requestAnimationFrame !== 'function') globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
});

let mounted = [];
afterEach(() => {
  for (const { root, container } of mounted) {
    act(() => root.unmount());
    container.remove();
  }
  mounted = [];
  vi.unstubAllGlobals();
  document.documentElement.dir = 'ltr';
});

let lastLocation = null;
function LocationProbe() {
  lastLocation = useLocation();
  return null;
}

function mount(element, { apiClient = {}, path = '/dashboard/runs/run_b2?tab=trail' } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <AuthContext.Provider value={{ apiClient, principal: { isAdmin: true } }}>
          <AppContext.Provider value={{ tenantId: 'default', setWizardOpen: () => {}, setTourOpen: () => {} }}>
            <ToastContext.Provider value={{ addToast: vi.fn() }}>
              <Routes>
                <Route
                  path="*"
                  element={
                    <>
                      {element}
                      <LocationProbe />
                    </>
                  }
                />
              </Routes>
            </ToastContext.Provider>
          </AppContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  });
  mounted.push({ root, container });
  return container;
}

const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const step = (id) => qa('[data-testid="trail-step"]').find((n) => n.getAttribute('data-step-id') === id);
const key = (el, k) => act(() => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true })));
const choose = (el, value) =>
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
const node = (id) => fixture.nodes.find((n) => n.id === id);

function narrowScreen(narrow) {
  vi.stubGlobal('matchMedia', (query) => ({ matches: narrow && query.includes('767'), media: query, addEventListener: () => {}, removeEventListener: () => {} }));
}

describe('TrailSequence', () => {
  it('draws a lane per agent with the caller first and every step with an icon and a state label', () => {
    mount(<TrailSequence trail={fixture} />);
    const lanes = qa('.trail-lane').map((l) => l.getAttribute('data-lane-id'));
    expect(lanes).toEqual(['caller', 'agt_lead', 'agt_triage', 'agt_logs', 'agt_metrics']);
    expect(q('.trail-lane[data-lane-id="caller"] .trail-lane-name').textContent).toContain('Caller');
    expect(qa('[data-testid="trail-step"]')).toHaveLength(15);
    const failed = step('run_c4');
    expect(failed.getAttribute('class')).toContain('tone-danger');
    expect(failed.querySelector('.trail-tone-icon.tone-danger')).not.toBeNull();
    expect(failed.querySelector('.trail-step-detail').textContent).toContain('Failed');
    expect(qa('.trail-edge-label').map((e) => e.textContent)).toContain('woke');
  });

  it('highlights the focus run and draws the redacted step as a hatched box with only its kind', () => {
    mount(<TrailSequence trail={fixture} />);
    expect(step('run_b2').getAttribute('class')).toContain('is-focus');
    expect(step('run_b2').getAttribute('tabindex')).toBe('0');
    const hidden = step('red_1');
    expect(hidden.getAttribute('class')).toContain('is-redacted');
    expect(hidden.querySelector('rect').getAttribute('fill')).toMatch(/^url\(#trail-hatch-/);
    expect(hidden.textContent).toBe('Approval (hidden)');
    expect(hidden.querySelector('.trail-step-detail')).toBeNull();
  });

  it('moves between steps with the arrow keys and opens one with Enter', () => {
    const onSelect = vi.fn();
    const onOpen = vi.fn();
    mount(<TrailSequence trail={fixture} selectedId="run_b2" onSelect={onSelect} onOpen={onOpen} />);
    key(step('run_b2'), 'ArrowDown');
    expect(onSelect).toHaveBeenLastCalledWith('fan_1');
    key(step('run_b2'), 'ArrowRight');
    expect(onSelect).toHaveBeenLastCalledWith('run_c3');
    key(step('run_b2'), 'Enter');
    expect(onOpen).toHaveBeenCalledWith('run_b2');
    act(() => step('msg_2').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    expect(onOpen).toHaveBeenLastCalledWith('msg_2');
  });

  it('mirrors the lanes in a right-to-left layout', () => {
    document.documentElement.dir = 'rtl';
    mount(<TrailSequence trail={fixture} />);
    const x = (id) => Number(q(`.trail-lane[data-lane-id="${id}"] .trail-lane-bg`).getAttribute('x'));
    expect(x('caller')).toBeGreaterThan(x('agt_lead'));
  });

  it('passes a basic accessibility scan', async () => {
    const axe = (await import('axe-core')).default;
    const container = mount(<TrailSequence trail={fixture} />);
    const result = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(result.violations.map((v) => v.id)).toEqual([]);
  });
});

describe('TrailGraph', () => {
  it('builds time-layered nodes and labeled edges, mirrored right to left', () => {
    const flow = trailToFlow(t, fixture);
    expect(flow.nodes).toHaveLength(15);
    expect(flow.edges).toHaveLength(15);
    const x = (f, id) => f.nodes.find((n) => n.id === id).position.x;
    expect(x(flow, 'usr_operator1')).toBeLessThan(x(flow, 'run_a1'));
    expect(flow.edges.find((e) => e.source === 'msg_1').label).toBe('woke');
    const rtl = trailToFlow(t, fixture, { rtl: true });
    expect(x(rtl, 'usr_operator1')).toBeGreaterThan(x(rtl, 'run_a1'));
  });
});

describe('TrailList', () => {
  it('lists every step in time order, filters by kind, agent, and state, and opens a row', () => {
    const onOpen = vi.fn();
    mount(<TrailList trail={fixture} onOpen={onOpen} />);
    expect(qa('[data-testid="trail-list-table"] tbody tr')).toHaveLength(15);
    choose(q('[data-testid="trail-filter-kind"]'), 'Message');
    expect(qa('[data-testid="trail-list-table"] tbody tr')).toHaveLength(2);
    choose(q('[data-testid="trail-filter-kind"]'), '');
    choose(q('[data-testid="trail-filter-agent"]'), 'agt_metrics');
    choose(q('[data-testid="trail-filter-state"]'), 'Failed');
    const rows = qa('[data-testid="trail-list-table"] tbody tr');
    expect(rows).toHaveLength(1);
    expect(rows[0].getAttribute('data-step-id')).toBe('run_c4');
    act(() => rows[0].querySelector('[data-testid="trail-list-open"]').click());
    expect(onOpen).toHaveBeenCalledWith('run_c4');
  });
});

describe('TrailStepDrawer', () => {
  const markup = 'Please run <script>alert(1)</script> and <b>restart</b> the pods.';

  it('shows a message body as escaped data with who wrote it and in which run', async () => {
    const apiClient = { getMessage: vi.fn(async () => ({ id: 'msg_1', threadId: 'thr_1', subject: 'Disk alarm', body: markup, senderAgentId: 'agt_lead', senderAgentName: 'Incident lead', senderRunId: 'run_a1' })) };
    mount(<TrailStepDrawer trail={fixture} node={node('msg_1')} onClose={() => {}} />, { apiClient });
    await flush();
    expect(apiClient.getMessage).toHaveBeenCalledWith('default', 'msg_1');
    const blocks = qa('[data-testid="trail-agent-text"]');
    expect(blocks.map((b) => b.getAttribute('data-text-key'))).toEqual(['subject', 'body']);
    const body = blocks[1].querySelector('pre');
    expect(body.textContent).toBe(markup);
    expect(body.querySelector('script')).toBeNull();
    expect(body.querySelector('b')).toBeNull();
    expect(blocks[1].querySelector('[data-testid="trail-provenance"]').textContent).toBe('Written by agent Incident lead in run run_a1');
    expect(q('[data-testid="trail-data-note"]')).not.toBeNull();
    expect(q('[data-testid="trail-drawer-open-record"]').getAttribute('href')).toBe('/dashboard/message-threads/thr_1?message=msg_1');
  });

  it('shows a report title and body with the author and run', async () => {
    const apiClient = { getReport: vi.fn(async () => ({ id: 'rpt_1', title: 'Triage summary', body: 'Logs point at node 3.', authorAgentId: 'agt_triage', authorAgentName: 'Triage', runId: 'run_b2' })) };
    mount(<TrailStepDrawer trail={fixture} node={node('rpt_1')} onClose={() => {}} />, { apiClient });
    await flush();
    const provenance = qa('[data-testid="trail-provenance"]').map((p) => p.textContent);
    expect(provenance).toEqual(['Written by agent Triage in run run_b2', 'Written by agent Triage in run run_b2']);
    expect(q('[data-testid="trail-drawer-open-record"]').getAttribute('href')).toBe('/dashboard/reports/rpt_1');
  });

  it('shows an escalation question from the agent and the answer from the person', async () => {
    const apiClient = { getEscalation: vi.fn(async () => ({ id: 'esc_1', question: 'Restart node 3?', agentId: 'agt_triage', agentName: 'Triage', raisingRunId: 'run_b2', answerText: 'Yes, go ahead.', resolvedBy: 'operator@example.com', resolutionSource: 'Person' })) };
    mount(<TrailStepDrawer trail={fixture} node={node('esc_1')} onClose={() => {}} />, { apiClient });
    await flush();
    const blocks = qa('[data-testid="trail-agent-text"]');
    expect(blocks.map((b) => b.getAttribute('data-text-key'))).toEqual(['question', 'answer']);
    expect(blocks[1].querySelector('[data-testid="trail-provenance"]').textContent).toBe('Written by operator@example.com');
  });

  it('loads an effect from its run operations and shows the tool and digest, never arguments', async () => {
    const apiClient = { listRunOperations: vi.fn(async () => [{ id: 'eff_1', runId: 'run_a1', tool: 'garrison_send_message', argumentDigest: 'sha256:abc', state: 'Completed', leaseEpoch: 3 }]) };
    mount(<TrailStepDrawer trail={fixture} node={node('eff_1')} onClose={() => {}} />, { apiClient });
    await flush();
    expect(apiClient.listRunOperations).toHaveBeenCalledWith('default', 'run_a1');
    expect(q('[data-testid="trail-drawer"]').textContent).toContain('sha256:abc');
    expect(q('[data-testid="trail-drawer"]').textContent).toContain('garrison_send_message');
    expect(qa('[data-testid="trail-agent-text"]')).toHaveLength(0);
    expect(q('[data-testid="trail-drawer-open-record"]').getAttribute('href')).toBe('/dashboard/runs/run_a1');
  });

  it('loads nothing for a redacted step and shows only its kind and time', async () => {
    const apiClient = { getApproval: vi.fn() };
    const onClose = vi.fn();
    mount(<TrailStepDrawer trail={fixture} node={node('red_1')} onClose={onClose} />, { apiClient });
    await flush();
    expect(apiClient.getApproval).not.toHaveBeenCalled();
    expect(q('[data-testid="trail-drawer-redacted"]').textContent).toContain('You do not have permission to read this Approval');
    expect(q('[data-testid="trail-drawer-open-record"]')).toBeNull();
    key(q('[data-testid="trail-drawer"]'), 'Escape');
    expect(onClose).toHaveBeenCalled();
  });

  it('names a person, not an agent, when a person wrote the message', () => {
    const texts = stepTexts(t, node('msg_1'), { subject: 'Hi', body: '', senderName: 'operator@example.com', senderRunId: null });
    expect(texts).toEqual([{ key: 'subject', label: 'Subject', text: 'Hi', author: 'operator@example.com', authorIsAgent: false, runId: null }]);
  });
});

describe('RunTrailPanel', () => {
  it('opens on the sequence view with the summary strip and switches views', async () => {
    narrowScreen(false);
    const apiClient = { getRunTrail: vi.fn(async () => fixture) };
    mount(<RunTrailPanel runId="run_b2" />, { apiClient });
    await flush();
    expect(q('[data-testid="trail-sequence"]')).not.toBeNull();
    expect(q('[data-testid="trail-view-sequence"]').getAttribute('aria-pressed')).toBe('true');
    expect(q('[data-testid="trail-summary-agents"] dd').textContent).toBe('4');
    expect(q('[data-testid="trail-summary-hops"] dd').textContent).toBe('2');
    expect(q('[data-testid="trail-summary-failures"] dd').textContent).toBe('1');
    expect(q('[data-testid="trail-redacted-note"]')).not.toBeNull();
    expect(q('[data-testid="trail-truncated"]')).toBeNull();
    act(() => q('[data-testid="trail-view-list"]').click());
    expect(q('[data-testid="trail-list"]')).not.toBeNull();
    expect(q('[data-testid="trail-sequence"]')).toBeNull();
  });

  it('opens the drawer for ?step= and writes the step to the address when another opens', async () => {
    narrowScreen(false);
    const apiClient = { getRunTrail: vi.fn(async () => fixture), getReport: vi.fn(async () => ({ id: 'rpt_1', title: 'T', body: 'B', authorAgentName: 'Triage', authorAgentId: 'agt_triage', runId: 'run_b2' })), getRun: vi.fn(async () => ({ id: 'run_c4', resultText: '' })) };
    mount(<RunTrailPanel runId="run_b2" />, { apiClient, path: '/dashboard/runs/run_b2?tab=trail&step=rpt_1' });
    await flush();
    expect(q('[data-testid="trail-drawer"]').getAttribute('data-step-id')).toBe('rpt_1');
    act(() => step('run_c4').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await flush();
    expect(q('[data-testid="trail-drawer"]').getAttribute('data-step-id')).toBe('run_c4');
    expect(lastLocation.search).toContain('step=run_c4');
    act(() => q('[data-testid="trail-drawer-close"]').click());
    expect(q('[data-testid="trail-drawer"]')).toBeNull();
    expect(lastLocation.search).not.toContain('step=');
  });

  it('names the cap in a banner when the trail was truncated', async () => {
    narrowScreen(false);
    const apiClient = { getRunTrail: vi.fn(async () => ({ ...fixture, truncation: 'HopCap', hopCount: 12 })) };
    mount(<RunTrailPanel runId="run_b2" />, { apiClient });
    await flush();
    expect(q('[data-testid="trail-truncated"]').textContent).toContain('12 message hops');
    expect(q('[data-testid="trail-truncated"] a').getAttribute('href')).toBe(pathFor('settings'));
  });

  it('explains a run that started nothing else', async () => {
    narrowScreen(false);
    const single = { ...fixture, nodes: fixture.nodes.filter((n) => ['usr_operator1', 'run_a1', 'rep_run_a1'].includes(n.id)), edges: fixture.edges.filter((e) => e.kind === 'Started' || e.kind === 'Replied'), nodeCount: 3, hopCount: 0 };
    const apiClient = { getRunTrail: vi.fn(async () => single) };
    mount(<RunTrailPanel runId="run_a1" />, { apiClient });
    await flush();
    expect(document.body.textContent).toContain('This run started nothing else');
    expect(qa('[data-testid="trail-step"]')).toHaveLength(3);
  });

  it('shows a retry banner when the trail cannot load', async () => {
    narrowScreen(false);
    const apiClient = { getRunTrail: vi.fn(async () => Promise.reject(Object.assign(new Error('gone'), { status: 404 }))) };
    mount(<RunTrailPanel runId="run_zz" />, { apiClient });
    await flush();
    expect(document.body.textContent).toContain("This run's trail could not be found");
    expect(q('.error-banner button')).not.toBeNull();
  });

  it('shows only the list view below 768px', async () => {
    narrowScreen(true);
    const apiClient = { getRunTrail: vi.fn(async () => fixture) };
    mount(<RunTrailPanel runId="run_b2" />, { apiClient });
    await flush();
    expect(q('[data-testid="trail-views"]')).toBeNull();
    expect(q('[data-testid="trail-list"]')).not.toBeNull();
    expect(q('[data-testid="trail-sequence"]')).toBeNull();
  });
});

describe('Open trail entry points (LP2.8)', () => {
  it('links to the run trail with the step selected', () => {
    mount(<OpenTrailLink runId="run_b2" step="esc_1" />);
    const link = q('[data-testid="open-trail"]');
    expect(link.textContent).toBe('Open trail');
    expect(link.getAttribute('href')).toBe('/dashboard/runs/run_b2?tab=trail&step=esc_1');
    act(() => link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 })));
    expect(lastLocation.pathname).toBe('/dashboard/runs/run_b2');
    expect(lastLocation.search).toBe('?tab=trail&step=esc_1');
  });

  it('renders nothing without a run', () => {
    mount(<OpenTrailLink runId={null} step="esc_1" />);
    expect(q('[data-testid="open-trail"]')).toBeNull();
  });

  it('adds Open trail to the Runs row action menu', () => {
    const navigate = vi.fn();
    const actions = runsConfig.rowActions({ id: 'run_b2', status: 'Succeeded' }, { t, navigate });
    const open = actions.find((a) => a.label === 'Open trail');
    expect(open.tip.length).toBeGreaterThan(25);
    open.onClick();
    expect(navigate).toHaveBeenCalledWith(trailPath('run_b2'));
    expect(trailPath('run_b2')).toBe('/dashboard/runs/run_b2?tab=trail');
  });

  it('opens each step kind on its own record page', () => {
    expect(stepPath(fixture, node('run_c3'))).toBe('/dashboard/runs/run_c3');
    expect(stepPath(fixture, node('esc_1'))).toBe('/dashboard/escalations/esc_1');
    expect(stepPath(fixture, node('fan_1'))).toBe('/dashboard/runs/run_b2?tab=children&group=fan_1');
    expect(stepPath(fixture, node('usr_operator1'))).toBeNull();
  });
});

describe('Open trail on record pages (LP2.8)', () => {
  // The real API client over the e2e mock responder, so each page loads the same records the e2e suite uses.
  function mockedClient() {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url, init) => {
        const body = respond((init && init.method) || 'GET', new URL(String(url)));
        if (body === undefined) return new Response(JSON.stringify({ code: 'RouteNotFound' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
      })
    );
    return new ApiClient('http://127.0.0.1:8700', 'tok');
  }
  const trailLinks = () => qa('a.trail-open-link').map((a) => a.getAttribute('href'));

  it('links an escalation to its raising run with the escalation selected', async () => {
    const e = escalation(1);
    mount(<EscalationDetailView recordId={e.id} />, { apiClient: mockedClient() });
    await flush();
    await flush();
    expect(q('[data-testid="escalation-open-trail"]').getAttribute('href')).toBe(trailPath(e.raisingRunId, e.id));
  });

  it('links an approval to its run with the approval selected', async () => {
    const a = approval(1);
    mount(<ApprovalDetailView recordId={a.id} />, { apiClient: mockedClient() });
    await flush();
    await flush();
    expect(q('[data-testid="approval-open-trail"]').getAttribute('href')).toBe(trailPath(a.runId, a.id));
  });

  it('links a report to the run that filed it with the report selected', async () => {
    const r = [1, 2, 3, 4, 5, 6].map(report).find((x) => x.runId);
    mount(<ReportDetailView recordId={r.id} />, { apiClient: mockedClient() });
    await flush();
    await flush();
    expect(q('[data-testid="report-open-trail"]').getAttribute('href')).toBe(trailPath(r.runId, r.id));
  });

  it('links each message of a thread to the run that sent it with the message selected', async () => {
    const thread = messageThread('amg_0001');
    mount(<MessageThreadView recordId="amg_0001" />, { apiClient: mockedClient() });
    await flush();
    await flush();
    const expected = thread.filter((m) => m.senderRunId || m.deliveredRunId).map((m) => trailPath(m.senderRunId || m.deliveredRunId, m.id));
    expect(expected.length).toBeGreaterThan(0);
    expect(qa('[data-testid="thread-open-trail"]').map((a) => a.getAttribute('href'))).toEqual(expected);
  });

  it('links conversation turns, keeper ticks, and board items that carry a run', async () => {
    mount(<ConversationDetailView recordId="cnv_0001" />, { apiClient: mockedClient() });
    await flush();
    await flush();
    const turns = qa('[data-testid="conversation-turn-trail"]').map((a) => a.getAttribute('href'));
    expect(turns.length).toBeGreaterThan(0);
    for (const href of turns) expect(href).toMatch(/^\/dashboard\/runs\/run_[^?]+\?tab=trail&step=run_/);
    act(() => mounted.splice(0).forEach(({ root, container }) => (root.unmount(), container.remove())));

    mount(<KeeperDetailView recordId="mdt_0001" />, { apiClient: mockedClient() });
    await flush();
    await flush();
    const ticks = qa('[data-testid^="keeper-tick-trail-"]');
    expect(ticks.length).toBeGreaterThan(0);
    expect(ticks[0].getAttribute('href')).toMatch(/\?tab=trail&step=mtk_/);
    act(() => mounted.splice(0).forEach(({ root, container }) => (root.unmount(), container.remove())));

    const b = board(1);
    mount(<BoardView recordId="org_0001" />, { apiClient: mockedClient() });
    await flush();
    await flush();
    const expected = [
      ...(b.escalations || []).filter((e) => e.raisingRunId).map((e) => trailPath(e.raisingRunId, e.id)),
      ...(b.unhealthyReports || []).filter((r) => r.runId).map((r) => trailPath(r.runId, r.id)),
      ...(b.latestBrief?.runId ? [trailPath(b.latestBrief.runId, b.latestBrief.id)] : [])
    ];
    expect(expected.length).toBeGreaterThan(0);
    expect(trailLinks()).toEqual(expected);
  });
});
