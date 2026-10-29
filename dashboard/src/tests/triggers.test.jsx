// Triggers (P12.5) and notification endpoints (P12.14): navigation (Agents > Triggers, Configuration > Notifications),
// form helpers and validation, the list configurations, the signing secret shown once, the fire and fire history
// dialogs, the test send and delivery log, the run trigger link, and the API client routes.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import SigningSecretModal from '../components/SigningSecretModal';
import TriggerFireModal from '../components/TriggerFireModal';
import TriggerFiresModal from '../components/TriggerFiresModal';
import NotificationDeliveriesModal from '../components/NotificationDeliveriesModal';
import NotificationTestModal from '../components/NotificationTestModal';
import { triggersConfig, notificationEndpointsConfig } from '../views/resourceConfigs';
import { runsConfig } from '../views/runConfigs';
import { PAGE_VIEWS } from '../views/hubs/hubPanels';
import { findPage, findHub, pathFor } from '../config/navConfig';
import { ENUMS, SUBSCRIBABLE_NOTIFICATION_EVENTS } from '../utils/constants';
import ApiClient from '../utils/api';
import {
  blankTrigger,
  triggerToForm,
  triggerToBody,
  triggerDuplicate,
  triggerErrors,
  looksLikeCron,
  webhookUrl,
  blankEndpoint,
  endpointToBody,
  endpointDuplicate,
  endpointErrors,
  isHttpUrl,
  prettyPayload
} from '../utils/triggers';
import { trigger, triggerFire, notificationEndpoint, notificationDelivery, testDelivery, SIGNING_SECRET } from '../../tests/e2e/mocks.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const t = (...args) => i18n.t(...args);
const flush = () => act(async () => {
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

function type(el, value) {
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
}

const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const page = (objects) => ({ items: objects, totalCount: objects.length, pageNumber: 1, pageSize: 50 });

describe('navigation', () => {
  it('puts triggers under Agents and notifications under Configuration, with no new sidebar item', () => {
    expect(findPage('triggers')).toMatchObject({ hub: 'agents', tab: 'triggers' });
    expect(findPage('notifications')).toMatchObject({ hub: 'configuration', tab: 'notifications' });
    expect(pathFor('triggers')).toBe('/dashboard/agents?tab=triggers');
    expect(pathFor('notifications')).toBe('/dashboard/configuration?tab=notifications');
    expect(findHub('agents').tabs.map((p) => p.id)).toEqual(['agents', 'deployments', 'pipelines', 'triggers', 'capabilities', 'apps']);
    expect(PAGE_VIEWS.triggers).toBeTruthy();
    expect(PAGE_VIEWS.notifications).toBeTruthy();
  });

  it('mirrors the server enums', () => {
    expect(ENUMS.triggerType).toEqual(['Cron', 'Webhook']);
    expect(ENUMS.triggerTargetType).toEqual(['Agent', 'Pipeline']);
    expect(ENUMS.triggerFireOutcome).toEqual(['Started', 'Failed', 'Skipped']);
    expect(ENUMS.notificationDeliveryStatus).toEqual(['Pending', 'Delivering', 'Succeeded', 'Failed']);
    expect(SUBSCRIBABLE_NOTIFICATION_EVENTS).not.toContain('Test');
    expect(ENUMS.notificationEvent).toContain('Test');
    expect(ENUMS.runKind).toContain('Trigger');
    expect(ENUMS.resourceType).toEqual(expect.arrayContaining(['Trigger', 'NotificationEndpoint']));
    expect(ENUMS.auditEventType).toContain('SigningSecretRotated');
    for (const group of ['triggerType', 'triggerFireOutcome', 'notificationEvent', 'notificationDeliveryStatus', 'runKind']) {
      for (const v of ENUMS[group]) expect(t(`tips.enums.${group}.${v}`).length, `${group}.${v}`).toBeGreaterThan(25);
    }
  });
});

describe('trigger form helpers', () => {
  it('sends only the fields the type and target use', () => {
    const body = triggerToBody({ ...blankTrigger(), name: ' nightly ', agentId: 'agt_1', deploymentId: '', pipelineId: 'ppl_x', inputTemplateId: '' });
    expect(body).toMatchObject({ name: 'nightly', type: 'Cron', targetType: 'Agent', agentId: 'agt_1', deploymentId: null, pipelineId: null, inputTemplateId: null, cronExpression: '0 9 * * *', timeZone: 'UTC', active: true });
    const webhook = triggerToBody({ ...blankTrigger(), name: 'hook', type: 'Webhook', targetType: 'Pipeline', pipelineId: 'ppl_1', agentId: 'agt_1', cronExpression: '0 * * * *', timeZone: 'Europe/Berlin' });
    expect(webhook).toMatchObject({ type: 'Webhook', targetType: 'Pipeline', pipelineId: 'ppl_1', agentId: null, cronExpression: null, timeZone: 'UTC' });
  });

  it('validates names, targets, cron fields, and priority like the server', () => {
    expect(triggerErrors({ ...blankTrigger(), name: 'ok-name', agentId: 'agt_1' }, t)).toEqual({});
    const errors = triggerErrors({ ...blankTrigger(), name: 'Bad Name', agentId: '', cronExpression: '0 9 *', priority: 500 }, t);
    expect(Object.keys(errors).sort()).toEqual(['agentId', 'cronExpression', 'name', 'priority']);
    expect(triggerErrors({ ...blankTrigger(), name: 'p', targetType: 'Pipeline', pipelineId: '' }, t)).toHaveProperty('pipelineId');
    expect(triggerErrors({ ...blankTrigger(), name: 'w', type: 'Webhook', agentId: 'agt_1', cronExpression: '' }, t)).toEqual({});
    expect(looksLikeCron('@daily')).toBe(true);
    expect(looksLikeCron('*/5 * * * 1-5')).toBe(true);
    expect(looksLikeCron('* * *')).toBe(false);
  });

  it('round-trips a stored trigger and duplicates without identity, schedule state, or secret', () => {
    const form = triggerToForm(trigger(2));
    expect(form.type).toBe('Webhook');
    const copy = triggerDuplicate(trigger(2));
    for (const k of ['id', 'signingSecretLast4', 'lastFireUtc', 'nextFireUtc', 'runAsId', 'fireCount']) expect(copy).not.toHaveProperty(k);
    expect(copy.name).toBe('github-issues-copy');
  });

  it('builds the webhook URL from the API base URL', () => {
    expect(webhookUrl('http://127.0.0.1:8700/', 'default', 'trg_1')).toBe('http://127.0.0.1:8700/v1.0/api/tenants/default/triggers/trg_1/webhook');
  });
});

describe('notification endpoint helpers', () => {
  it('requires an HTTP or HTTPS URL without credentials and at least one subscribable event', () => {
    expect(isHttpUrl('https://hooks.example.com/x')).toBe(true);
    expect(isHttpUrl('ftp://hooks.example.com/x')).toBe(false);
    expect(isHttpUrl('https://user:pw@hooks.example.com/x')).toBe(false);
    expect(endpointErrors({ ...blankEndpoint(), name: 'ops', url: 'https://hooks.example.com/x' }, t)).toEqual({});
    const errors = endpointErrors({ ...blankEndpoint(), name: 'Ops', url: 'nope', events: ['Test'], includeResultText: true, resultTextMaxChars: 0 }, t);
    expect(Object.keys(errors).sort()).toEqual(['events', 'name', 'resultTextMaxChars', 'url']);
  });

  it('sends events in server order without Test and keeps filters optional', () => {
    const body = endpointToBody({ ...blankEndpoint(), name: 'ops', url: ' https://h.example.com ', events: ['ApprovalRequested', 'Test', 'RunFailed'], agentId: '' });
    expect(body).toMatchObject({ url: 'https://h.example.com', events: ['RunFailed', 'ApprovalRequested'], agentId: null, deploymentId: null });
    expect(endpointDuplicate(notificationEndpoint(1))).not.toHaveProperty('signingSecretLast4');
    expect(prettyPayload('{"a":1}')).toBe('{\n  "a": 1\n}');
    expect(prettyPayload('not json')).toBe('not json');
  });
});

describe('list configurations', () => {
  const ctx = { t, i18n, apiClient: {}, tenantId: 'default', navigate: vi.fn(), addToast: vi.fn(), reload: vi.fn(), setExtraModal: vi.fn() };

  it('offers fire, history, runs, and rotate (webhook only) on triggers', () => {
    const cron = triggersConfig.rowActions(trigger(1), ctx);
    const hook = triggersConfig.rowActions(trigger(2), ctx);
    expect(cron.filter((a) => !a.hidden).map((a) => a.label)).toEqual(['Fire now', 'Fire history', 'View runs']);
    expect(hook.filter((a) => !a.hidden).map((a) => a.label)).toEqual(['Fire now', 'Fire history', 'View runs', 'Rotate secret']);
    cron[2].onClick();
    expect(ctx.navigate).toHaveBeenCalledWith('/dashboard/runs?triggerId=trg_0001');
  });

  it('makes the type read-only when editing and shows the webhook field for webhook triggers', () => {
    const fields = triggersConfig.fields(triggerToForm(trigger(2)), { ...ctx, mode: 'edit', options: {} });
    const typeField = fields.find((f) => f.name === 'type');
    expect(typeField.readOnly).toBe(true);
    expect(fields.find((f) => f.name === 'webhook').showIf(trigger(2))).toBe(true);
    expect(fields.find((f) => f.name === 'cronExpression').showIf(trigger(2))).toBe(false);
    expect(triggersConfig.fields(blankTrigger(), { ...ctx, mode: 'create', options: {} }).find((f) => f.name === 'type').readOnly).toBe(false);
  });

  it('shows a webhook signing secret once after create', () => {
    const setExtraModal = vi.fn();
    triggersConfig.afterCreate({ ...trigger(2), signingSecret: SIGNING_SECRET }, { ...ctx, setExtraModal });
    expect(setExtraModal).toHaveBeenCalledTimes(1);
    const cron = vi.fn();
    triggersConfig.afterCreate(trigger(1), { ...ctx, setExtraModal: cron });
    expect(cron).not.toHaveBeenCalled();
  });

  it('offers test, deliveries, and rotate on notification endpoints', () => {
    expect(notificationEndpointsConfig.rowActions(notificationEndpoint(1), ctx).map((a) => a.label)).toEqual(['Send test', 'Delivery log', 'Rotate secret']);
  });

  it('accepts triggerId as a run list filter and has a trigger column', () => {
    expect(runsConfig.urlFilters).toContain('triggerId');
    const cols = runsConfig.columns({ ...ctx, lookups: {} }).map((c) => c.key);
    expect(cols).toEqual(expect.arrayContaining(['triggerId', 'kind']));
  });
});

describe('dialogs', () => {
  it('shows the signing secret with a warning and the webhook URL', () => {
    mount(<SigningSecretModal secret={SIGNING_SECRET} name="github-issues" url="http://x/v1.0/api/tenants/default/triggers/trg_1/webhook" onClose={() => {}} />);
    expect(q('[data-testid="signing-secret-value"]').textContent).toBe(SIGNING_SECRET);
    expect(q('[data-testid="signing-secret-warning"]').textContent).toMatch(/will not show it again/);
    expect(q('[data-testid="signing-secret-url"]').textContent).toContain('/triggers/trg_1/webhook');
    expect(document.body.textContent).toContain('X-Garrison-Signature');
  });

  it('fires a trigger with a payload and links the started run', async () => {
    const fireTrigger = vi.fn(async () => ({ ...triggerFire(1), source: 'Manual' }));
    mount(<TriggerFireModal trigger={trigger(2)} onClose={() => {}} />, { apiClient: { fireTrigger } });
    type(q('[data-testid="trigger-fire-body"]'), '{"action":"opened"}');
    await act(async () => q('[data-testid="trigger-fire-submit"]').click());
    expect(fireTrigger).toHaveBeenCalledWith('default', 'trg_0002', { body: '{"action":"opened"}', contentType: 'application/json' });
    expect(q('[data-testid="trigger-fire-run"]').textContent).toBe('run_0001');
  });

  it('shows a failed fire with its error code', async () => {
    const fireTrigger = vi.fn(async () => triggerFire(3));
    mount(<TriggerFireModal trigger={trigger(1)} onClose={() => {}} />, { apiClient: { fireTrigger } });
    await act(async () => q('[data-testid="trigger-fire-submit"]').click());
    expect(fireTrigger).toHaveBeenCalledWith('default', 'trg_0001', { body: null, contentType: null });
    expect(q('[data-testid="trigger-fire-error"]').textContent).toMatch(/^RunAsNotAuthorized:/);
  });

  it('lists fire history and filters by outcome', async () => {
    const listTriggerFires = vi.fn(async (_t, _id, params) => page([1, 2, 3, 4, 5].map((i) => triggerFire(i)).filter((f) => !params.outcome || f.outcome === params.outcome)));
    mount(<TriggerFiresModal triggerId="trg_0001" triggerName="nightly-report" onClose={() => {}} />, { apiClient: { listTriggerFires, getTrigger: vi.fn() } });
    await flush();
    expect(qa('[data-testid="trigger-fires-table"] tbody tr')).toHaveLength(5);
    await act(async () => type(q('[data-testid="trigger-fires-outcome"]'), 'Failed'));
    await flush();
    expect(listTriggerFires).toHaveBeenLastCalledWith('default', 'trg_0001', { outcome: 'Failed', pageNumber: 1, pageSize: 50 });
    expect(qa('[data-testid="trigger-fires-table"] tbody tr')).toHaveLength(1);
  });

  it('sends a test notification and shows the delivery result', async () => {
    const testNotificationEndpoint = vi.fn(async () => testDelivery('nep_0001'));
    mount(<NotificationTestModal endpoint={notificationEndpoint(1)} onClose={() => {}} />, { apiClient: { testNotificationEndpoint } });
    await flush();
    expect(testNotificationEndpoint).toHaveBeenCalledWith('default', 'nep_0001');
    expect(q('[data-testid="notification-test-result"]').getAttribute('data-outcome')).toBe('succeeded');
  });

  it('reports a retryable test failure as pending', async () => {
    const testNotificationEndpoint = vi.fn(async () => notificationDelivery(2));
    mount(<NotificationTestModal endpoint={notificationEndpoint(1)} onClose={() => {}} />, { apiClient: { testNotificationEndpoint } });
    await flush();
    expect(q('[data-testid="notification-test-result"]').getAttribute('data-outcome')).toBe('pending');
    expect(document.body.textContent).toContain('The endpoint answered 503.');
  });

  it('lists deliveries, filters by status, and shows a delivery payload', async () => {
    const listNotificationDeliveries = vi.fn(async (_t, _id, params) => page([1, 2, 3, 4].map((i) => notificationDelivery(i)).filter((d) => !params.status || d.status === params.status)));
    const getNotificationDelivery = vi.fn(async (_t, _id, did) => notificationDelivery(Number(did.slice(4))));
    mount(<NotificationDeliveriesModal endpoint={notificationEndpoint(1)} onClose={() => {}} />, { apiClient: { listNotificationDeliveries, getNotificationDelivery } });
    await flush();
    expect(qa('[data-testid="deliveries-table"] tbody tr')).toHaveLength(4);
    await act(async () => qa('[data-testid="deliveries-table"] tbody tr')[2].querySelector('button').click());
    await flush();
    expect(getNotificationDelivery).toHaveBeenCalledWith('default', 'nep_0001', 'ndl_0003');
    expect(q('[data-testid="delivery-detail"]').textContent).toContain('redirects are not followed');
    await act(async () => type(q('[data-testid="deliveries-status"]'), 'Failed'));
    await flush();
    expect(listNotificationDeliveries).toHaveBeenLastCalledWith('default', 'nep_0001', { status: 'Failed', pageNumber: 1, pageSize: 50 });
  });
});

describe('API client', () => {
  it('uses the documented trigger and notification routes', async () => {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url: String(url), method: init.method, body: init.body });
      return new Response(JSON.stringify({ objects: [], totalRecords: 0 }), { status: 200 });
    });
    try {
      const client = new ApiClient('http://127.0.0.1:8700', 'tok');
      await client.listTriggers('default', { type: 'Webhook', pageNumber: 1, pageSize: 25 });
      await client.rotateTriggerSecret('default', 'trg_1');
      await client.fireTrigger('default', 'trg_1', { body: 'x' });
      await client.listTriggerFires('default', 'trg_1', { outcome: 'Failed', pageNumber: 1, pageSize: 50 });
      await client.testNotificationEndpoint('default', 'nep_1');
      await client.listNotificationDeliveries('default', 'nep_1', { status: 'Pending', pageNumber: 2, pageSize: 10 });
      await client.getNotificationDelivery('default', 'nep_1', 'ndl_1');
      await client.rotateNotificationEndpointSecret('default', 'nep_1');
      expect(calls.map((c) => `${c.method} ${c.url.replace('http://127.0.0.1:8700/v1.0/api/tenants/default/', '')}`)).toEqual([
        'GET triggers?type=Webhook&maxResults=25&skip=0',
        'POST triggers/trg_1/rotate-secret',
        'POST triggers/trg_1/fire',
        'GET triggers/trg_1/fires?outcome=Failed&maxResults=50&skip=0',
        'POST notification-endpoints/nep_1/test',
        'GET notification-endpoints/nep_1/deliveries?status=Pending&maxResults=10&skip=10',
        'GET notification-endpoints/nep_1/deliveries/ndl_1',
        'POST notification-endpoints/nep_1/rotate-secret'
      ]);
      expect(JSON.parse(calls[2].body)).toEqual({ body: 'x' });
    } finally {
      globalThis.fetch = original;
    }
  });
});
