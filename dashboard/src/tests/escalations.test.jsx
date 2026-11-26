// Escalations (AA2.13): navigation (Autonomy > Escalations), enums, the answer helpers and validation, the list
// configuration and its row actions, the answer dialog (choices as buttons, default answer, free text, refusals), the
// escalation page, the Autonomy sidebar badge, the Home attention list, the keeper escalation target, the notification
// endpoint minimum severity, and the API routes.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import { EscalationsProvider } from '../context/EscalationsContext';
import { ApprovalsProvider } from '../context/ApprovalsContext';
import EscalationDetailView from '../views/EscalationDetailView';
import EscalationAnswerModal from '../components/EscalationAnswerModal';
import HomeEscalationsCard from '../components/HomeEscalationsCard';
import Sidebar from '../components/Sidebar';
import { escalationsConfig, notificationEndpointsConfig } from '../views/resourceConfigs';
import { PAGE_VIEWS, DETAIL_VIEWS } from '../views/hubs/hubPanels';
import { findPage, pathFor, hubForPath } from '../config/navConfig';
import { ENUMS, SUBSCRIBABLE_NOTIFICATION_EVENTS } from '../utils/constants';
import ApiClient from '../utils/api';
import { answerErrors, answerToBody, attentionList, blankAnswer, isAnswerable, optionLabel } from '../utils/escalations';
import { blankRevision, revisionErrors, revisionToBody, revisionToForm } from '../utils/keepers';
import { blankEndpoint, endpointToBody } from '../utils/triggers';
import { escalation } from '../../tests/e2e/mocks.js';

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

function mount(element, { apiClient = {}, addToast = vi.fn(), refresh = vi.fn(), open = null } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter>
        <AuthContext.Provider value={{ apiClient, principal: { isAdmin: true } }}>
          <AppContext.Provider value={{ tenantId: 'default', setWizardOpen: () => {}, setTourOpen: () => {} }}>
            <ToastContext.Provider value={{ addToast }}>
              <ApprovalsProvider value={{ pending: null, approvalsPending: null, reviewsPending: null, refresh: () => {} }}>
                <EscalationsProvider value={{ open, refresh }}>{element}</EscalationsProvider>
              </ApprovalsProvider>
            </ToastContext.Provider>
          </AppContext.Provider>
        </AuthContext.Provider>
      </MemoryRouter>
    );
  });
  mounted.push({ root, container });
  return { container, addToast, refresh };
}

function type(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const page = (objects) => ({ items: objects, totalCount: objects.length, pageNumber: 1, pageSize: 25 });
const click = (el) => act(() => el.dispatchEvent(new MouseEvent('click', { bubbles: true })));

describe('navigation', () => {
  it('puts escalations in the Autonomy group with a detail route', () => {
    expect(findPage('escalations')).toMatchObject({ hub: 'autonomy', tab: 'escalations', detail: true });
    expect(pathFor('escalations')).toBe('/dashboard/autonomy?tab=escalations');
    expect(pathFor('escalations', 'esc_1')).toBe('/dashboard/escalations/esc_1');
    expect(hubForPath('/dashboard/escalations/esc_1').key).toBe('autonomy');
    expect(PAGE_VIEWS.escalations).toBeTruthy();
    expect(DETAIL_VIEWS.escalations).toBe(EscalationDetailView);
  });

  it('mirrors the server enums and explains every value', () => {
    expect(ENUMS.escalationStatus).toEqual(['Open', 'Answered', 'Expired', 'Cancelled', 'Withdrawn']);
    expect(ENUMS.escalationSeverity).toEqual(['Info', 'Warning', 'Urgent']);
    expect(ENUMS.escalationMode).toEqual(['NonBlocking', 'Blocking']);
    expect(ENUMS.escalationTargetKind).toEqual(['User', 'Role', 'Agent', 'Manager']);
    expect(ENUMS.escalationTimeoutAction).toEqual(['UseDefaultAnswer', 'Cancel', 'EscalateUp']);
    expect(ENUMS.escalationResolutionSource).toEqual(['User', 'Agent', 'Timeout', 'Raiser', 'System']);
    expect(ENUMS.resourceType).toContain('Escalation');
    expect(SUBSCRIBABLE_NOTIFICATION_EVENTS).toEqual(expect.arrayContaining(['EscalationRaised', 'EscalationExpired']));
    for (const group of ['escalationStatus', 'escalationSeverity', 'escalationMode', 'escalationTargetKind', 'escalationTimeoutAction', 'escalationResolutionSource']) {
      for (const v of ENUMS[group]) expect(t(`tips.enums.${group}.${v}`).length, `${group}.${v}`).toBeGreaterThan(25);
    }
  });
});

describe('answer helpers', () => {
  it('answers only open escalations that were not passed up', () => {
    expect(isAnswerable(escalation(1))).toBe(true);
    expect(isAnswerable(escalation(3))).toBe(false);
    expect(isAnswerable(escalation(4))).toBe(false);
  });

  it('preselects the default option and builds the body like the server expects', () => {
    expect(blankAnswer(escalation(1))).toEqual({ choice: 'wait', text: '' });
    expect(blankAnswer(escalation(5))).toEqual({ choice: '', text: '' });
    expect(answerToBody({ choice: 'refund', text: '  duplicate  ' }, escalation(1))).toEqual({ choice: 'refund', text: 'duplicate' });
    expect(answerToBody({ choice: 'refund', text: 'Finance owns it' }, escalation(2))).toEqual({ text: 'Finance owns it' });
    expect(optionLabel(escalation(1), 'refund')).toBe('Refund the duplicate');
    expect(optionLabel(escalation(4), 'yes')).toBe('yes');
  });

  it('requires a known choice with options and text without them', () => {
    expect(answerErrors({ choice: '', text: '' }, escalation(1), t)).toEqual({ choice: 'Choose one of the options.' });
    expect(answerErrors({ choice: 'maybe', text: '' }, escalation(1), t).choice).toBe('That option is not offered by this escalation.');
    expect(answerErrors({ choice: 'refund', text: '' }, escalation(1), t)).toEqual({});
    expect(answerErrors({ choice: '', text: ' ' }, escalation(2), t)).toEqual({ text: 'Write an answer.' });
    expect(answerErrors({ choice: '', text: 'x'.repeat(8001) }, escalation(2), t).text).toBe('The answer is limited to 8000 characters.');
  });

  it('orders the attention list Urgent first, then oldest first', () => {
    const list = attentionList([escalation(2), escalation(3), escalation(1), escalation(4), { ...escalation(2), id: 'esc_9', createdUtc: '2000-01-01T00:00:00Z' }]);
    expect(list.map((e) => e.id)).toEqual(['esc_0001', 'esc_9', 'esc_0002']);
  });
});

describe('escalation list configuration', () => {
  const ctx = { t, i18n, apiClient: {}, tenantId: 'default', navigate: vi.fn(), addToast: vi.fn(), reload: vi.fn(), setExtraModal: vi.fn() };
  const labels = (r) => escalationsConfig.rowActions(r, ctx).filter((a) => !a.hidden).map((a) => a.label);

  it('opens on the open ones and offers the row actions that apply', () => {
    expect(escalationsConfig.defaultFilters).toEqual({ status: 'Open' });
    expect(escalationsConfig.detailPath({ id: 'esc_7' })).toBe('/dashboard/escalations/esc_7');
    expect(labels(escalation(1))).toEqual(['Answer', 'Open raising run', 'Open keeper', 'Cancel escalation']);
    expect(labels(escalation(3))).toEqual(['Open the escalation it went to', 'Open raising run']);
    expect(labels(escalation(4))).toEqual(['Open raising run']);
    escalationsConfig.rowActions(escalation(3), ctx).find((a) => a.label === 'Open the escalation it went to').onClick();
    expect(ctx.navigate).toHaveBeenCalledWith('/dashboard/escalations/esc_0002');
  });

  it('shows the question, target, and answer columns', () => {
    const cols = escalationsConfig.columns({ t, i18n, lookups: {} });
    expect(cols.map((c) => c.key)).toEqual(expect.arrayContaining(['severity', 'status', 'question', 'agent', 'target', 'expiresUtc', 'answer']));
    expect(cols.find((c) => c.key === 'target').csv(escalation(2))).toBe('Role: support-leads');
    expect(cols.find((c) => c.key === 'answer').csv(escalation(4))).toBe('yes');
  });

  it('cancels from the row after confirming', async () => {
    const apiClient = { cancelEscalation: vi.fn(async () => ({ ...escalation(1), status: 'Cancelled' })) };
    let modal = null;
    const local = { ...ctx, apiClient, addToast: vi.fn(), reload: vi.fn(), setExtraModal: (m) => (modal = m) };
    escalationsConfig.rowActions(escalation(1), local).find((a) => a.label === 'Cancel escalation').onClick();
    expect(modal.props.message).toContain('cancels that run too');
    await modal.props.onConfirm();
    expect(apiClient.cancelEscalation).toHaveBeenCalledWith('default', 'esc_0001', {});
    expect(local.addToast).toHaveBeenCalledWith({ type: 'success', message: 'Escalation cancelled.' });
    expect(local.reload).toHaveBeenCalled();
  });
});

describe('answer dialog', () => {
  it('offers the options as buttons with the default marked and sends the chosen one', async () => {
    const answerEscalation = vi.fn(async () => ({ ...escalation(1), status: 'Answered' }));
    const onAnswered = vi.fn();
    const { addToast, refresh } = mount(<EscalationAnswerModal escalation={escalation(1)} onClose={() => {}} onAnswered={onAnswered} />, { apiClient: { answerEscalation } });
    expect(q('[data-testid="escalation-answer-question"]').textContent).toContain('Refund order 4411');
    expect(q('[data-testid="escalation-choice-wait"]').getAttribute('aria-checked')).toBe('true');
    expect(q('[data-testid="escalation-choice-wait"]').textContent).toContain('Default');
    await click(q('[data-testid="escalation-choice-refund"]'));
    act(() => type(q('[data-testid="escalation-answer-text"]'), 'Duplicate capture.'));
    await click(q('[data-testid="escalation-answer-submit"]'));
    await flush();
    expect(answerEscalation).toHaveBeenCalledWith('default', 'esc_0001', { choice: 'refund', text: 'Duplicate capture.' });
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Answer sent to echo-agent.' });
    expect(refresh).toHaveBeenCalled();
    expect(onAnswered).toHaveBeenCalled();
  });

  it('requires text when there are no options, before calling the server', async () => {
    const answerEscalation = vi.fn();
    mount(<EscalationAnswerModal escalation={escalation(2)} onClose={() => {}} onAnswered={() => {}} />, { apiClient: { answerEscalation } });
    expect(q('[data-testid^="escalation-choice-"]')).toBeNull();
    await click(q('[data-testid="escalation-answer-submit"]'));
    expect(answerEscalation).not.toHaveBeenCalled();
    expect(q('.field-error').textContent).toBe('Write an answer.');
  });

  it('says so when someone answered first', async () => {
    const taken = Object.assign(new Error('taken'), { status: 409, code: 'EscalationNotOpen' });
    const onAnswered = vi.fn();
    const { addToast } = mount(<EscalationAnswerModal escalation={escalation(2)} onClose={() => {}} onAnswered={onAnswered} />, {
      apiClient: {
        answerEscalation: vi.fn(async () => {
          throw taken;
        })
      }
    });
    act(() => type(q('[data-testid="escalation-answer-text"]'), 'Finance.'));
    await click(q('[data-testid="escalation-answer-submit"]'));
    await flush();
    expect(addToast).toHaveBeenCalledWith({ type: 'warning', message: 'Someone else answered it first, or it timed out.' });
    expect(onAnswered).toHaveBeenCalledWith(null);
  });
});

describe('escalation page', () => {
  it('shows the question, options, links, and Answer while open', async () => {
    const apiClient = { getEscalation: vi.fn(async () => escalation(1)) };
    mount(<EscalationDetailView recordId="esc_0001" />, { apiClient });
    await flush();
    expect(q('[data-testid="escalation-detail"]')).toBeTruthy();
    expect(q('[data-testid="escalation-question"]').textContent).toContain('Refund order 4411');
    expect(q('[data-testid="escalation-context"]').textContent).toContain('two captures');
    expect(qa('[data-testid="escalation-options"] li')).toHaveLength(2);
    expect(q('[data-testid="escalation-open-banner"]').textContent).toContain('suspended');
    expect(q('[data-testid="escalation-run-link"]').getAttribute('href')).toBe('/dashboard/runs/run_0019');
    expect(q('[data-testid="escalation-keeper-link"]').getAttribute('href')).toBe('/dashboard/keepers/mdt_0001');
    expect(q('[data-testid="escalation-answer"]')).toBeTruthy();
    expect(q('[data-testid="escalation-answer-panel"]')).toBeNull();
  });

  it('shows the answer once resolved, and the escalation it went to when passed up', async () => {
    mount(<EscalationDetailView recordId="esc_0004" />, { apiClient: { getEscalation: vi.fn(async () => escalation(4)) } });
    await flush();
    expect(q('[data-testid="escalation-answer-panel"]').textContent).toContain('Paid on the 3rd.');
    expect(q('[data-testid="escalation-answer"]')).toBeNull();
    expect(q('[data-testid="escalation-routed-run-link"]')).toBeTruthy();
    act(() => mounted.forEach(({ root }) => root.unmount()));
    mounted = [];
    mount(<EscalationDetailView recordId="esc_0003" />, { apiClient: { getEscalation: vi.fn(async () => escalation(3)) } });
    await flush();
    expect(q('[data-testid="escalation-passed-up-banner"]')).toBeTruthy();
    expect(q('[data-testid="escalation-escalated-to-banner-link"]').getAttribute('href')).toBe('/dashboard/escalations/esc_0002');
    expect(q('[data-testid="escalation-answer"]')).toBeNull();
  });

  it('says so when the escalation does not exist', async () => {
    const missing = Object.assign(new Error('missing'), { status: 404 });
    mount(<EscalationDetailView recordId="esc_9999" />, {
      apiClient: {
        getEscalation: vi.fn(async () => {
          throw missing;
        })
      }
    });
    await flush();
    expect(document.body.textContent).toContain('Escalation not found');
  });
});

describe('Autonomy badge and Home list', () => {
  it('counts open escalations on the Autonomy item', () => {
    mount(<Sidebar />, { open: 2 });
    const badge = q('.sidebar-item[data-nav="autonomy"] [data-testid="escalations-badge"]');
    expect(badge.textContent).toBe('2');
    expect(badge.getAttribute('aria-label')).toBe('2 escalations waiting for an answer');
    act(() => mounted.forEach(({ root }) => root.unmount()));
    mounted = [];
    mount(<Sidebar />, { open: 0 });
    expect(q('[data-testid="escalations-badge"]')).toBeNull();
  });

  it('lists the open escalations most urgent first and hides when there are none', async () => {
    const listEscalations = vi.fn(async () => page([escalation(2), escalation(3), escalation(1)]));
    mount(<HomeEscalationsCard />, { apiClient: { listEscalations } });
    await flush();
    expect(listEscalations).toHaveBeenCalledWith('default', { status: 'Open', pageNumber: 1, pageSize: 100 });
    const rows = qa('[data-testid="home-escalations-list"] li');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Refund order 4411');
    expect(q('#escalations-title').textContent).toBe('2 escalations waiting for an answer');
    act(() => mounted.forEach(({ root }) => root.unmount()));
    mounted = [];
    mount(<HomeEscalationsCard />, { apiClient: { listEscalations: vi.fn(async () => page([])) } });
    await flush();
    expect(q('[data-testid="home-escalations"]')).toBeNull();
  });
});

describe('keeper escalation target and endpoint severity', () => {
  it('carries the keeper default target and needs an identifier with a kind', () => {
    const form = { ...blankRevision(), objective: 'x', escalationTargetKind: 'Role', escalationTargetId: '' };
    expect(revisionErrors(form, t).escalationTargetId).toBe('Name the user, role, or agent to escalate to.');
    const body = revisionToBody({ ...form, escalationTargetId: ' support-leads ' });
    expect(body).toMatchObject({ escalationTargetKind: 'Role', escalationTargetId: 'support-leads' });
    expect(revisionToBody({ ...form, escalationTargetKind: '', escalationTargetId: 'stale' })).toMatchObject({ escalationTargetKind: null, escalationTargetId: null });
    expect(revisionToForm({ escalationTargetKind: 'User', escalationTargetId: 'usr_1' })).toMatchObject({ escalationTargetKind: 'User', escalationTargetId: 'usr_1' });
  });

  it('sends the endpoint minimum severity and shows it only for escalation events', () => {
    expect(endpointToBody({ ...blankEndpoint(), name: 'n', events: ['EscalationRaised'], escalationMinimumSeverity: 'Urgent' })).toMatchObject({ events: ['EscalationRaised'], escalationMinimumSeverity: 'Urgent' });
    expect(endpointToBody(blankEndpoint()).escalationMinimumSeverity).toBeNull();
    const field = notificationEndpointsConfig.fields(blankEndpoint(), { t, options: {} }).find((f) => f.name === 'escalationMinimumSeverity');
    expect(field.showIf({ events: ['RunFailed'] })).toBe(false);
    expect(field.showIf({ events: ['EscalationExpired'] })).toBe(true);
  });
});

describe('API client', () => {
  it('uses the documented escalation routes and counts escalations waiting here', async () => {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url: String(url), method: init.method, body: init.body });
      const open = String(url).includes('status=Open');
      return new Response(JSON.stringify(open ? { objects: [{ id: 'esc_1' }, { id: 'esc_2', escalatedToId: 'esc_3' }, { id: 'esc_3' }], totalRecords: 3 } : { objects: [], totalRecords: 0 }), { status: 200 });
    });
    try {
      const client = new ApiClient('http://127.0.0.1:8700', 'tok');
      await client.listEscalations('default', { status: 'Answered', severity: 'Urgent', pageNumber: 2, pageSize: 25 });
      await client.getEscalation('default', 'esc_1');
      await client.answerEscalation('default', 'esc_1', { choice: 'refund' });
      await client.cancelEscalation('default', 'esc_1');
      expect(await client.countOpenEscalations('default')).toBe(2);
      expect(calls.map((c) => `${c.method} ${c.url.replace('http://127.0.0.1:8700/v1.0/api/tenants/default/', '')}`)).toEqual([
        'GET escalations?status=Answered&severity=Urgent&maxResults=25&skip=25',
        'GET escalations/esc_1',
        'POST escalations/esc_1/answer',
        'POST escalations/esc_1/cancel',
        'GET escalations?status=Open&maxResults=100&skip=0'
      ]);
      expect(JSON.parse(calls[2].body)).toEqual({ choice: 'refund' });
      expect(JSON.parse(calls[3].body)).toEqual({});
    } finally {
      globalThis.fetch = original;
    }
  });
});
