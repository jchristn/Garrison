// The board (AA10.4, AA10.6, AA10.7, AA10.8): navigation (Autonomy > Board and /dashboard/board/<id>), the board
// helpers, the page against the populated and empty mock boards (chart with health, attention, proposals with evidence
// and the diff on expand, spend, brief, brakes, direction, and the CEO conversation), approving a proposal, giving
// direction, talking to the CEO, the setup wizard's first keeper step, the tour stops, and the API routes.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import { en } from '../i18n/resources';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import BoardView from '../views/BoardView';
import SetupWizard from '../components/SetupWizard';
import { PAGE_VIEWS, DETAIL_VIEWS } from '../views/hubs/hubPanels';
import { findPage, pathFor } from '../config/navConfig';
import { ENUMS } from '../utils/constants';
import ApiClient from '../utils/api';
import { BOARD_ERROR_CODES, attentionCount, capHits, ceoUnavailable, directionBody, directionErrors, healthMap, messageBody, organizationFreeze, proposalPending, spendByUnit } from '../utils/board';
import { board, boardConversations, orgProposal, organization } from '../../tests/e2e/mocks.js';

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

function mount(element, { apiClient = {}, addToast = vi.fn(), app = {} } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <AuthContext.Provider value={{ apiClient, principal: { isAdmin: true } }}>
          <AppContext.Provider value={{ tenantId: 'default', setWizardOpen: () => {}, setTourOpen: () => {}, ...app }}>
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

const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const click = (el) => act(() => el.click());
const page = (items) => ({ items, totalCount: items.length });

/** An API client that serves one board and records the board calls. */
function client(b = board(1)) {
  return {
    getBoard: vi.fn(() => Promise.resolve(b)),
    getOrgProposal: vi.fn((tenant, org, draftId) => Promise.resolve({ ...orgProposal(2, true), draftId })),
    decideOrgProposal: vi.fn(() => Promise.resolve({ ...orgProposal(2), status: 'Applied', approvalStatus: 'Approved' })),
    giveBoardDirection: vi.fn(() => Promise.resolve({ id: 'mdr_0099', number: 4, source: 'Board' })),
    sendBoardMessage: vi.fn((tenant, org, body) => Promise.resolve({ id: `run_board_${body.conversationId ? 2 : 1}`, status: 'Queued', conversationId: 'cnv_board_0003', inputText: body.input })),
    listBoardConversations: vi.fn(() => Promise.resolve(page(b.organizationId === 'org_0001' ? boardConversations() : []))),
    listConversationRuns: vi.fn(() => Promise.resolve(page([]))),
    streamRunEvents: vi.fn(() => ({ abort: () => {} })),
    getRun: vi.fn((tenant, id) => Promise.resolve({ id, status: 'Running' })),
    listRunEvents: vi.fn(() => Promise.resolve({ items: [], hasMore: false })),
    getKillSwitch: vi.fn(() => Promise.resolve({ enabled: false })),
    listOrganizations: vi.fn(() => Promise.resolve(page([organization(1), organization(2)]))),
    rollbackOrganization: vi.fn(() => Promise.resolve({ number: 4 }))
  };
}

describe('navigation', () => {
  it('has the Board tab under Autonomy with a detail route', () => {
    const p = findPage('board');
    expect(p.hub).toBe('autonomy');
    expect(p.detail).toBe(true);
    expect(pathFor('board', 'org_0001')).toBe('/dashboard/board/org_0001');
    expect(PAGE_VIEWS.board).toBe(BoardView);
    expect(DETAIL_VIEWS.board).toBe(BoardView);
    expect(en.nav.items.board.label).toBe('Board');
  });

  it('labels the BoardBrief event and the board error codes', () => {
    expect(ENUMS.notificationEvent).toContain('BoardBrief');
    expect(en.enums.notificationEvent.BoardBrief).toBeTruthy();
    for (const code of BOARD_ERROR_CODES) expect(en.errorCodes[code], code).toBeTruthy();
  });
});

describe('board helpers', () => {
  const b = board(1);
  it('maps unit health for the chart, leaving out units without a report', () => {
    const h = healthMap(b);
    expect(Object.keys(h)).toEqual(['oun_0001', 'oun_0002']);
    expect(h.oun_0002.health).toBe('Degraded');
  });

  it('finds cap hits with their exhausted spend rows and counts attention', () => {
    const caps = capHits(b);
    expect(caps.map((c) => c.unitName)).toEqual(['Billing']);
    expect(caps[0].rows.map((r) => r.period)).toEqual(['Day']);
    expect(attentionCount(b)).toBe(2 + 2 + 1);
    expect(attentionCount(board(2))).toBe(0);
  });

  it('groups spend by unit and finds an organization freeze', () => {
    expect(spendByUnit(b.spend).map((g) => [g.unitName, g.rows.length])).toEqual([
      ['Leadership', 2],
      ['Billing', 1]
    ]);
    expect(organizationFreeze(b)).toBeNull();
    expect(organizationFreeze({ ...b, freezes: [{ id: 'mfz_1', active: true, targetKind: 'Organization', targetId: 'org_0001' }] }).id).toBe('mfz_1');
  });

  it('validates and builds the direction and message bodies', () => {
    expect(directionErrors({ direction: '  ' }, t).direction).toBe(en.board.direction.errors.required);
    expect(directionErrors({ direction: 'x'.repeat(4001) }, t).direction).toContain('4000');
    expect(directionErrors({ direction: 'ok', changeNote: 'n'.repeat(1025) }, t).changeNote).toContain('1024');
    expect(directionErrors({ direction: 'ok' }, t)).toEqual({});
    expect(directionBody({ direction: ' Hold refunds. ', changeNote: ' ' })).toEqual({ direction: 'Hold refunds.', changeNote: null });
    expect(messageBody(' hi ', null)).toEqual({ input: 'hi' });
    expect(messageBody('hi', 'cnv_1')).toEqual({ input: 'hi', conversationId: 'cnv_1' });
  });

  it('says why the CEO cannot be reached', () => {
    expect(ceoUnavailable(t, null)).toBe(en.board.ceo.missing);
    expect(ceoUnavailable(t, { agentId: 'a' })).toBe(en.board.ceo.noMandate);
    expect(ceoUnavailable(t, { agentId: 'a', mandateId: 'm' })).toBe(en.board.ceo.noDeployment);
    expect(ceoUnavailable(t, b.ceo)).toBe('');
    expect(proposalPending(b.proposals[0])).toBe(true);
    expect(proposalPending(orgProposal(1))).toBe(false);
  });
});

describe('BoardView', () => {
  it('renders every panel of a populated board', async () => {
    const api = client();
    mount(<BoardView recordId="org_0001" />, { apiClient: api });
    await flush();
    await flush();
    expect(api.getBoard).toHaveBeenCalledWith('default', 'org_0001');
    expect(q('[data-testid="board"] h1')?.textContent || document.body.textContent).toContain('Board of Refund operations');
    expect(qa('[data-testid="org-unit"]').length).toBe(3);
    expect(qa('[data-unit-health]').length).toBe(3);
    expect(q('[data-unit-health="oun_0003"]').textContent).toContain('Frozen');
    expect(q('[data-unit-health="oun_0002"]').textContent).toContain('Over budget');
    expect(qa('[data-testid="board-escalations"] li').length).toBe(2);
    expect(qa('[data-testid="board-unhealthy-reports"] li').length).toBe(2);
    expect(q('[data-cap-unit="oun_0002"]')).not.toBeNull();
    expect(qa('[data-proposal]').length).toBe(1);
    expect(qa('[data-eval-run]').length).toBe(2);
    expect(q('[data-shadow-trial="shd_0001"]').textContent).toContain('37 of 40 agreed');
    expect(q('[data-canary="cnr_0001"]').textContent).toContain('Step 2 of 3');
    expect(qa('[data-testid="board-spend-bar"]').length).toBe(3);
    expect(q('[data-testid="board-latest-brief"]').textContent).toContain('Weekly brief: refunds on track');
    expect(q('[data-testid="board-ceo"]').textContent).toContain('Briefs every 24 hours');
    expect(qa('[data-freeze]').length).toBe(1);
    expect(q('[data-testid="board-direction-blocked"]')).toBeNull();
    expect(q('[data-testid="board-ceo-blocked"]')).toBeNull();
    expect(qa('#board-ceo-conversation option').length).toBe(3);
  });

  it('renders the empty state of every panel and blocks the CEO panels without a CEO', async () => {
    const api = client(board(2));
    mount(<BoardView recordId="org_0002" />, { apiClient: api });
    await flush();
    await flush();
    for (const id of ['board-chart-empty', 'board-attention-empty', 'board-proposals-empty', 'board-spend-empty', 'board-brief-empty', 'board-freezes-empty', 'board-no-ceo', 'board-direction-blocked', 'board-ceo-blocked']) {
      expect(q(`[data-testid="${id}"]`), id).not.toBeNull();
    }
    expect(q('[data-testid="board-direction-submit"]').disabled).toBe(true);
    expect(q('[data-testid="board-ceo-message"]').disabled).toBe(true);
  });

  it('loads the diff on expand and approves a proposal', async () => {
    const api = client();
    const { addToast } = mount(<BoardView recordId="org_0001" />, { apiClient: api });
    await flush();
    const toggle = q('[data-testid="board-proposal-toggle-sdr_0102"]');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    await click(toggle);
    await flush();
    expect(api.getOrgProposal).toHaveBeenCalledWith('default', 'org_0001', 'sdr_0102');
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(qa('[data-testid="org-proposal-changes"] tbody tr').length).toBe(2);
    act(() => type(q('[data-testid="board-proposal-reason"]'), 'Evals pass.'));
    await click(q('[data-testid="board-proposal-approve"]'));
    await flush();
    expect(api.decideOrgProposal).toHaveBeenCalledWith('default', 'org_0001', 'sdr_0102', { allow: true, reason: 'Evals pass.' });
    expect(addToast).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }));
    expect(api.getBoard).toHaveBeenCalledTimes(2);
  });

  it('gives the CEO direction', async () => {
    const api = client();
    mount(<BoardView recordId="org_0001" />, { apiClient: api });
    await flush();
    await act(async () => q('[data-testid="board-direction-submit"]').click());
    expect(q('[data-testid="board-direction"]').textContent).toContain(en.board.direction.errors.required);
    expect(api.giveBoardDirection).not.toHaveBeenCalled();
    act(() => type(q('[data-testid="board-direction-text"]'), 'Hold refunds over $500.'));
    await act(async () => q('[data-testid="board-direction-submit"]').click());
    await flush();
    expect(api.giveBoardDirection).toHaveBeenCalledWith('default', 'org_0001', { direction: 'Hold refunds over $500.', changeNote: null });
    expect(q('[data-testid="board-direction-text"]').value).toBe('');
  });

  it('talks to the CEO and continues the conversation the first message started', async () => {
    const api = client();
    mount(<BoardView recordId="org_0001" />, { apiClient: api });
    await flush();
    act(() => type(q('[data-testid="board-ceo-message"]'), 'How is the quarter going?'));
    await click(q('[data-testid="board-ceo-send"]'));
    await flush();
    expect(api.sendBoardMessage).toHaveBeenCalledWith('default', 'org_0001', { input: 'How is the quarter going?' });
    expect(api.streamRunEvents).toHaveBeenCalled();
    expect(q('[data-testid="board-ceo-turns"]').textContent).toContain('How is the quarter going?');
    expect(q('#board-ceo-conversation').value).toBe('cnv_board_0003');
  });

  it('confirms a rollback before calling the route', async () => {
    const api = client();
    mount(<BoardView recordId="org_0001" />, { apiClient: api });
    await flush();
    await click(q('[data-testid="board-rollback"]'));
    expect(api.rollbackOrganization).not.toHaveBeenCalled();
    await act(async () => q('[data-testid="confirm-button"]').click());
    await flush();
    expect(api.rollbackOrganization).toHaveBeenCalledWith('default', 'org_0001', { note: en.board.brakes.rollbackNote, activeTicks: 'Finish' });
  });

  it('lists organizations to pick from without a record ID', async () => {
    const api = client();
    mount(<BoardView />, { apiClient: api });
    await flush();
    expect(q('[data-testid="board-picker"]')).not.toBeNull();
    expect(q('[data-testid="board-picker-link-org_0001"]').getAttribute('href')).toBe('/dashboard/board/org_0001');
  });
});

describe('setup wizard first keeper (AA10.8)', () => {
  it('creates a keeper on the sample agent fake harness deployment', async () => {
    const api = {
      listAgents: vi.fn(() => Promise.resolve(page([{ id: 'agt_0001', name: 'echo-agent' }]))),
      listDeployments: vi.fn(() => Promise.resolve(page([{ id: 'dep_0001', name: 'echo-agent-default', agentId: 'agt_0001' }]))),
      createMandate: vi.fn((tenant, body) => Promise.resolve({ id: 'mdt_0099', name: body.name })),
      applyManifest: vi.fn(() => Promise.resolve({ items: [] })),
      // The Agent Studio step's architect fields, which this test skips.
      listHarnessProfiles: vi.fn(() => Promise.resolve(page([]))),
      listArchitectPrompts: vi.fn(() => Promise.resolve([])),
      getPromptTemplate: vi.fn(() => Promise.resolve(null)),
      renderTemplateContent: vi.fn(() => Promise.resolve({ rendered: '' }))
    };
    mount(<SetupWizard />, { apiClient: api, app: { wizardOpen: true } });
    expect(qa('.wizard-steps li').map((li) => li.textContent)).toEqual(['Welcome', 'Credential', 'Agent Studio', 'Sample agent', 'First keeper', 'Test run']);
    const footer = () => qa('.modal-footer button');
    const press = (label) => click(footer().find((b) => b.textContent.trim() === label));
    await press('Start');
    await press('Skip this step');
    await flush();
    await click(q('[data-testid="wizard-skip-studio"]'));
    await act(async () => footer().find((b) => b.textContent.trim() === 'Apply').click());
    await flush();
    expect(q('[data-testid="wizard-keeper"]')).not.toBeNull();
    await act(async () => q('[data-testid="wizard-create-keeper"]').click());
    await flush();
    expect(api.createMandate).toHaveBeenCalledTimes(1);
    const body = api.createMandate.mock.calls[0][1];
    expect(body).toMatchObject({ name: 'first-keeper', agentId: 'agt_0001', deploymentId: 'dep_0001' });
    expect(body.currentRevision.objective).toBe(en.wizard.keeper.objectiveDefault);
    expect(q('.wizard-steps li.active').textContent).toBe('Test run');
  });
});

describe('API routes', () => {
  it('calls the board routes', async () => {
    const calls = [];
    const c = new ApiClient('http://127.0.0.1:8700', 'tok');
    c._request = (method, path, opts) => {
      calls.push([method, path, opts?.body ?? null, opts?.query ?? null]);
      return Promise.resolve({});
    };
    await c.getBoard('default', 'org_1');
    await c.getBoard('default', 'org_1', { limit: 5 });
    await c.giveBoardDirection('default', 'org_1', { direction: 'x', changeNote: null });
    await c.sendBoardMessage('default', 'org_1', { input: 'hi' });
    await c.listBoardConversations('default', 'org_1');
    const base = '/v1.0/api/tenants/default/organizations/org_1';
    expect(calls[0]).toEqual(['GET', `${base}/board`, null, null]);
    expect(calls[1]).toEqual(['GET', `${base}/board`, null, { limit: 5 }]);
    expect(calls[2]).toEqual(['POST', `${base}/direction`, { direction: 'x', changeNote: null }, null]);
    expect(calls[3]).toEqual(['POST', `${base}/board/messages`, { input: 'hi' }, null]);
    expect(calls[4][0]).toBe('GET');
    expect(calls[4][1]).toBe(`${base}/board/conversations`);
  });
});
