// Messages (AA6.12): navigation (Autonomy > Messages and the thread route), enums and the Message run kind, the message
// helpers, the list configuration (server filters, the Rejected view, columns, row actions, Send message gated on
// Create), the thread page (oldest first, plain text, rejection reasons, links, Reply), the Send message dialog (with a
// 409 rejection), the agent inbox tab, the Home card line, and the API routes.
import { describe, it, expect, beforeAll, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext from '../context/AuthContext';
import AppContext from '../context/AppContext';
import ToastContext from '../context/ToastContext';
import MessageThreadView from '../views/MessageThreadView';
import SendMessageModal from '../components/SendMessageModal';
import AgentInboxPanel from '../components/AgentInboxPanel';
import HomeAutonomyCard from '../components/HomeAutonomyCard';
import { messagesConfig } from '../views/resourceConfigs';
import { PAGE_VIEWS, DETAIL_VIEWS } from '../views/hubs/hubPanels';
import { findPage, pathFor, hubForPath } from '../config/navConfig';
import { ENUMS, messageStatusTone } from '../utils/constants';
import ApiClient, { ApiError } from '../utils/api';
import { MESSAGES_CHANGED_EVENT, blankMessage, hoursAgo, messageDenied, messageErrors, messageToBody, recipientText, rejectedPath, rejectionOf, senderDetail, senderText, threadPath } from '../utils/messages';
import { SENT_MESSAGE, agentMessage, messageList, messageThread } from '../../tests/e2e/mocks.js';

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
function unmountAll() {
  for (const { root, container } of mounted) {
    act(() => root.unmount());
    container.remove();
  }
  mounted = [];
}
afterEach(unmountAll);

function mount(element, { apiClient = {}, addToast = vi.fn(), route = '/' } = {}) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(
      <MemoryRouter initialEntries={[route]}>
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
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function choose(el, value) {
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set.call(el, value);
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];
const click = (el) => act(() => el.click());
const page = (list) => ({ items: list, totalCount: list.length });
const readOnly = { grants: [{ resourceTypes: ['AgentMessage'], operations: ['Read'], permissionType: 'Permit' }] };
const list = (params) => {
  const url = new URL('http://127.0.0.1/x?maxResults=25&skip=0');
  for (const [k, v] of Object.entries(params || {})) url.searchParams.set(k, v);
  return messageList(url).objects;
};

describe('navigation and enums', () => {
  it('puts Messages under Autonomy and threads on a hidden detail route', () => {
    expect(findPage('messages')).toMatchObject({ hub: 'autonomy', tab: 'messages' });
    expect(pathFor('messages')).toBe('/dashboard/autonomy?tab=messages');
    expect(findPage('messageThreads')).toMatchObject({ hub: 'autonomy', detail: true, hidden: true });
    expect(pathFor('messageThreads', 'amg_1')).toBe('/dashboard/message-threads/amg_1');
    expect(hubForPath('/dashboard/message-threads/amg_1').key).toBe('autonomy');
    expect(PAGE_VIEWS.messages).toBeTruthy();
    expect(PAGE_VIEWS.messageThreads).toBeUndefined();
    expect(DETAIL_VIEWS.messageThreads).toBe(MessageThreadView);
  });

  it('mirrors the server enums, the AgentMessage resource type, and the Message run kind, and explains every value', () => {
    expect(ENUMS.messageStatus).toEqual(['Queued', 'Delivered', 'Acknowledged', 'Expired', 'Rejected']);
    expect(ENUMS.messageUrgency).toEqual(['Normal', 'Urgent']);
    expect(ENUMS.messageRejection).toEqual(['HopLimit', 'LineRate', 'ThreadBudget', 'NoLine', 'Frozen']);
    expect(ENUMS.resourceType).toContain('AgentMessage');
    expect(ENUMS.runKind).toContain('Message');
    expect(t('enums.runKind.Message')).toBe('Urgent message');
    for (const group of ['messageStatus', 'messageUrgency', 'messageRejection']) {
      for (const v of ENUMS[group]) expect(t(`tips.enums.${group}.${v}`).length, `${group}.${v}`).toBeGreaterThan(25);
    }
    expect(ENUMS.messageStatus.map(messageStatusTone)).toEqual(['neutral', 'info', 'success', 'warning', 'danger']);
  });
});

describe('message helpers', () => {
  it('names the sender and recipient, and links the thread', () => {
    expect(senderText(agentMessage(2))).toBe('echo-agent');
    expect(senderText(agentMessage(1))).toBe('admin@garrison');
    expect(senderDetail(t, agentMessage(1))).toBe('admin@garrison (User)');
    expect(senderDetail(t, agentMessage(2))).toBe('echo-agent');
    expect(recipientText(agentMessage(2))).toBe('agent-2');
    expect(recipientText({ recipientAgentId: 'agt_9' }, { agt_9: 'named' })).toBe('named');
    expect(threadPath(agentMessage(1))).toBe('/dashboard/message-threads/amg_0001');
    expect(threadPath(agentMessage(3))).toBe('/dashboard/message-threads/amg_0001?message=amg_0003');
    expect(rejectedPath()).toBe('/dashboard/autonomy?tab=messages&status=Rejected');
    expect(hoursAgo(24, Date.parse('2026-10-09T12:00:00Z'))).toBe('2026-10-08T12:00:00.000Z');
  });

  it('checks and builds a Send message body like the server expects', () => {
    const errors = messageErrors(blankMessage(), t);
    expect(errors.recipient).toBe('Choose the agent to send the message to.');
    expect(errors.subject).toBe('Give the message a subject of 1 to 256 characters.');
    const ok = { ...blankMessage('agt_1'), subject: 'Hi' };
    expect(messageErrors(ok, t)).toEqual({});
    expect(messageErrors({ ...ok, body: 'x'.repeat(16385) }, t).body).toBe('The body holds at most 16384 bytes.');
    expect(messageErrors({ ...ok, ttlSeconds: '0' }, t).ttlSeconds).toBe('Enter a whole number of seconds from 1 to 31536000, or leave it empty.');
    expect(messageErrors({ ...ok, ttlSeconds: '1.5' }, t).ttlSeconds).toBeTruthy();
    expect(messageErrors({ ...ok, ttlSeconds: '31536001' }, t).ttlSeconds).toBeTruthy();
    expect(messageErrors({ ...ok, ttlSeconds: '3600' }, t)).toEqual({});
    expect(messageToBody({ ...ok, subject: '  Hi  ', body: '   ' })).toEqual({ recipient: 'agt_1', subject: 'Hi', urgency: 'Normal' });
    expect(messageToBody({ ...ok, urgency: 'Urgent', body: 'Now.', ttlSeconds: '60', parentMessageId: 'amg_1' })).toEqual({ recipient: 'agt_1', subject: 'Hi', urgency: 'Urgent', body: 'Now.', ttlSeconds: 60, parentMessageId: 'amg_1' });
  });

  it('recognizes a loop guard refusal and explains a missing permission', () => {
    expect(rejectionOf(new ApiError(409, { code: 'LineRate', message: 'Too fast.' }))).toBe('LineRate');
    expect(rejectionOf(new ApiError(409, { code: 'Conflict' }))).toBeNull();
    expect(rejectionOf(new ApiError(400, { code: 'ValidationFailed' }))).toBeNull();
    expect(messageDenied(t, null, 'Create')).toBe('');
    expect(messageDenied(t, readOnly, 'Read')).toBe('');
    expect(messageDenied(t, readOnly, 'Create')).toBe('You may not do this. It needs Create on Agent message.');
  });
});

describe('Messages page configuration', () => {
  const ctx = { t, i18n, navigate: vi.fn(), setExtraModal: vi.fn(), reload: vi.fn(), addToast: vi.fn(), lookups: { agents: { agt_0001: 'echo-agent' } } };

  it('filters on the server, opens rows on their thread, and is read-only', () => {
    expect(messagesConfig.filters.map((f) => f.name)).toEqual(['status', 'urgency', 'reason', 'sender', 'recipient', 'from', 'to']);
    expect(messagesConfig.filters.some((f) => f.clientSide)).toBe(false);
    expect(messagesConfig.urlFilters).toEqual(expect.arrayContaining(['status', 'urgency', 'reason', 'sender', 'recipient', 'agent', 'from', 'to']));
    expect(messagesConfig.lookupsEvents).toEqual([MESSAGES_CHANGED_EVENT]);
    expect(messagesConfig.api.create).toBeNull();
    expect(messagesConfig.api.remove).toBeNull();
    expect(messagesConfig.canDelete(agentMessage(1))).toBe(false);
    expect(messagesConfig.detailPath(agentMessage(4))).toBe('/dashboard/message-threads/amg_0001?message=amg_0004');
  });

  it('shows time, urgency, status, subject, sender, recipient, and the rejection, with text kept plain', () => {
    const columns = messagesConfig.columns({ t, i18n, lookups: {} });
    expect(columns.filter((c) => !c.defaultHidden).map((c) => c.key)).toEqual(['createdUtc', 'urgency', 'status', 'subject', 'sender', 'recipient', 'reason']);
    const csv = (key, r) => columns.find((c) => c.key === key).csv(r);
    expect(csv('reason', agentMessage(4))).toBe('LineRate: echo-agent already sent 10 messages to agent-2 in the last minute (limit 10).');
    expect(csv('reason', agentMessage(1))).toBe('');
    expect(csv('sender', agentMessage(1))).toBe('admin@garrison');
    mount(columns.find((c) => c.key === 'subject').render(agentMessage(2)));
    expect(q('.message-subject-cell').textContent).toContain('<script>');
    expect(qa('script').length).toBe(0);
    mount(columns.find((c) => c.key === 'reason').render(agentMessage(5)));
    expect(q('.message-reason-cell .pill').textContent).toBe('No line');
    expect(q('.message-reason-detail').textContent).toBe('No line allows agent-2 to write to agent-3.');
  });

  it('switches between all and rejected messages through the status filter', () => {
    const setFilters = vi.fn();
    mount(messagesConfig.intro({ t, filters: {}, setFilters }));
    expect(q('[data-testid="messages-view-all"]').getAttribute('aria-pressed')).toBe('true');
    click(q('[data-testid="messages-view-rejected"]'));
    expect(setFilters.mock.calls[0][0]({ reason: '' })).toEqual({ reason: '', status: 'Rejected' });
    unmountAll();
    mount(messagesConfig.intro({ t, filters: { status: 'Rejected', reason: 'LineRate' }, setFilters }));
    expect(q('[data-testid="messages-rejected-note"]')).toBeTruthy();
    click(q('[data-testid="messages-view-all"]'));
    expect(setFilters.mock.calls[1][0]({ status: 'Rejected', reason: 'LineRate' })).toEqual({ status: '', reason: '' });
  });

  it('opens the thread, the agents, the delivered run, and the escalation when the message has them', () => {
    const shown = (m) => messagesConfig.rowActions(m, ctx).filter((a) => !a.hidden).map((a) => a.label);
    expect(shown(agentMessage(2))).toEqual(['Open thread', 'Copy ID', 'Open sender', 'Open recipient', 'Open delivered run']);
    expect(shown(agentMessage(5))).toEqual(['Open thread', 'Copy ID', 'Open sender', 'Open recipient', 'Open escalation']);
    expect(shown(agentMessage(7))).toEqual(['Open thread', 'Copy ID', 'Open recipient']);
    messagesConfig.rowActions(agentMessage(5), ctx).find((a) => a.label === 'Open escalation').onClick();
    expect(ctx.navigate).toHaveBeenCalledWith('/dashboard/escalations/esc_0001');
  });

  it('keeps Send message visible but disabled with the reason without Create on AgentMessage', () => {
    mount(messagesConfig.headerActions({ ...ctx, lookups: { permissions: readOnly } }));
    const button = q('[data-testid="messages-send"]');
    expect(button.getAttribute('aria-disabled')).toBe('true');
    click(button);
    expect(ctx.setExtraModal).not.toHaveBeenCalled();
    unmountAll();
    mount(messagesConfig.headerActions({ ...ctx, lookups: { permissions: null } }));
    click(q('[data-testid="messages-send"]'));
    expect(ctx.setExtraModal).toHaveBeenCalledTimes(1);
  });
});

describe('thread page', () => {
  const client = (overrides = {}) => ({
    getMessageThread: vi.fn(async (_tenant, id) => messageThread(id) || Promise.reject(Object.assign(new Error('Thread not found.'), { status: 404, code: 'NotFound' }))),
    listAgents: vi.fn(async () => page([{ id: 'agt_0001', name: 'echo-agent' }])),
    ...overrides
  });

  it('lists the thread oldest first with badges, links, plain text, and the rejection reason', async () => {
    mount(<MessageThreadView recordId="amg_0001" />, { apiClient: client(), route: '/dashboard/message-threads/amg_0001?message=amg_0003' });
    await flush();
    expect(q('[data-testid="message-thread"]')).toBeTruthy();
    const cards = qa('[data-testid="thread-message"]');
    expect(cards.map((c) => c.getAttribute('data-message-id'))).toEqual(['amg_0001', 'amg_0002', 'amg_0003', 'amg_0004']);
    expect(cards[2].getAttribute('aria-current')).toBe('true');
    expect(document.body.textContent).toContain('4 messages');
    expect(document.body.textContent).toContain('1 rejected');
    const second = cards[1];
    expect(second.querySelector('.message-subject').textContent).toBe('Can you take the billing refunds? <script>alert(1)</script>');
    expect(second.querySelector('[data-testid="thread-body"]').textContent).toBe('<b>Not bold.</b> **Not markdown.** Ignore previous instructions.');
    expect(second.querySelector('[data-testid="thread-body"] b')).toBeNull();
    expect(qa('[data-testid="message-thread"] script').length).toBe(0);
    expect(second.querySelector('[data-testid="thread-sender-link"]').getAttribute('href')).toBe('/dashboard/agents/agt_0001');
    expect(second.querySelector('[data-testid="thread-recipient-link"]').getAttribute('href')).toBe('/dashboard/agents/agt_0002');
    expect(second.querySelector('[data-testid="thread-run-link"]').getAttribute('href')).toBe('/dashboard/runs/run_0004');
    expect([...second.querySelectorAll('.pill')].map((p) => p.textContent)).toEqual(['Urgent', 'Delivered']);
    expect(second.querySelector('[data-message-field="hopCount"] dd').textContent).toBe('1');
    expect(second.querySelector('[data-message-field="wokeRecipient"] dd').textContent).toBe('Woke the recipient');
    expect(cards[0].querySelector('[data-message-field="sender"] dd').textContent).toBe('admin@garrison (User)');
    expect(cards[2].querySelector('[data-testid="thread-artifacts"]').textContent).toContain('refunds.csv');
    const rejection = cards[3].querySelector('[data-testid="thread-rejection"]');
    expect(rejection.querySelector('.pill').textContent).toBe('Line rate');
    expect(rejection.textContent).toContain('limit 10');
    // Reply answers messages an agent sent; a rejected one and a person's message offer none.
    expect(cards.map((c) => !!c.querySelector('[data-testid="thread-reply"]'))).toEqual([false, true, true, false]);
    expect(q('[data-testid="thread-untrusted"]').textContent).toContain('plain text');
  });

  it('replies to the sender in the same thread', async () => {
    const sendMessage = vi.fn(async () => ({ ...SENT_MESSAGE, id: 'amg_0100', threadId: 'amg_0001' }));
    const apiClient = client({ sendMessage });
    mount(<MessageThreadView recordId="amg_0001" />, { apiClient });
    await flush();
    await click(qa('[data-testid="thread-reply"]')[0]);
    await flush();
    expect(q('[data-testid="message-send-recipient"]').value).toBe('agt_0001');
    expect(q('[data-testid="message-send-subject"]').value).toBe('Re: Can you take the billing refunds? <script>alert(1)</script>');
    await click(q('[data-testid="message-send-submit"]'));
    await flush();
    expect(sendMessage).toHaveBeenCalledWith('default', { recipient: 'agt_0001', subject: 'Re: Can you take the billing refunds? <script>alert(1)</script>', urgency: 'Normal', parentMessageId: 'amg_0002' });
    expect(apiClient.getMessageThread).toHaveBeenCalledTimes(3);
  });

  it('shows not found for a thread in another tenant', async () => {
    mount(<MessageThreadView recordId="amg_0042" />, { apiClient: client() });
    await flush();
    expect(document.body.textContent).toContain('Thread not found');
  });
});

describe('Send message dialog', () => {
  it('validates, then sends with the recipient, subject, body, urgency, and time to live', async () => {
    const sendMessage = vi.fn(async () => SENT_MESSAGE);
    const listAgents = vi.fn(async () => page([{ id: 'agt_0001', name: 'echo-agent' }, { id: 'agt_0002', name: 'agent-2' }]));
    const onDone = vi.fn();
    const changed = vi.fn();
    window.addEventListener(MESSAGES_CHANGED_EVENT, changed);
    const { addToast } = mount(<SendMessageModal onClose={() => {}} onDone={onDone} />, { apiClient: { sendMessage, listAgents } });
    await flush();
    await click(q('[data-testid="message-send-submit"]'));
    expect(qa('.field-error').map((e) => e.textContent)).toEqual(['Choose the agent to send the message to.', 'Give the message a subject of 1 to 256 characters.']);
    expect(sendMessage).not.toHaveBeenCalled();
    act(() => choose(q('[data-testid="message-send-recipient"]'), 'agt_0001'));
    act(() => type(q('[data-testid="message-send-subject"]'), 'Check the refund queue'));
    act(() => type(q('[data-testid="message-send-body"]'), 'Depth is 48.'));
    act(() => choose(q('[data-testid="message-send-urgency"]'), 'Urgent'));
    act(() => type(q('[data-testid="message-send-ttl"]'), '3600'));
    await click(q('[data-testid="message-send-submit"]'));
    await flush();
    expect(sendMessage).toHaveBeenCalledWith('default', { recipient: 'agt_0001', subject: 'Check the refund queue', urgency: 'Urgent', body: 'Depth is 48.', ttlSeconds: 3600 });
    expect(addToast).toHaveBeenCalledWith({ type: 'success', message: 'Sent to echo-agent.' });
    expect(onDone).toHaveBeenCalledWith(SENT_MESSAGE);
    expect(changed).toHaveBeenCalled();
    window.removeEventListener(MESSAGES_CHANGED_EVENT, changed);
  });

  it('shows a loop guard refusal with its reason and keeps the dialog open', async () => {
    const err = new ApiError(409, { code: 'Frozen', message: 'Agent agent-2 is frozen by mfz_0001.' });
    const onDone = vi.fn();
    const changed = vi.fn();
    window.addEventListener(MESSAGES_CHANGED_EVENT, changed);
    mount(<SendMessageModal initial={{ recipient: 'agt_0002', recipientName: 'agent-2' }} onClose={() => {}} onDone={onDone} />, { apiClient: { sendMessage: vi.fn(async () => Promise.reject(err)) } });
    await flush();
    expect(q('[data-testid="message-send-recipient"]').value).toBe('agt_0002');
    expect(q('[data-testid="message-send-recipient"]').textContent).toContain('agent-2');
    act(() => type(q('[data-testid="message-send-subject"]'), 'Pause the refunds'));
    await click(q('[data-testid="message-send-submit"]'));
    await flush();
    const banner = q('[data-testid="message-send-rejected"]');
    expect(banner.querySelector('.pill').textContent).toBe('Recipient frozen');
    expect(banner.textContent).toContain('The loop guards refused this message.');
    expect(banner.textContent).toContain('Agent agent-2 is frozen by mfz_0001.');
    expect(onDone).not.toHaveBeenCalled();
    expect(changed).toHaveBeenCalled();
    window.removeEventListener(MESSAGES_CHANGED_EVENT, changed);
  });

  it('shows other refusals as an error', async () => {
    const err = new ApiError(400, { code: 'ValidationFailed', message: 'Agent nope does not exist.' });
    mount(<SendMessageModal initial={{ recipient: 'nope' }} onClose={() => {}} onDone={() => {}} />, { apiClient: { sendMessage: vi.fn(async () => Promise.reject(err)) } });
    await flush();
    act(() => type(q('[data-testid="message-send-subject"]'), 'Hello'));
    await click(q('[data-testid="message-send-submit"]'));
    await flush();
    expect(q('[data-testid="message-send"] .error-banner').textContent).toContain('Agent nope does not exist.');
    expect(q('[data-testid="message-send-rejected"]')).toBeNull();
  });
});

describe('agent inbox tab', () => {
  it('lists messages to the agent, filters by status, and sends to the agent', async () => {
    const listMessages = vi.fn(async (_tenant, params) => page(list(params)));
    const sendMessage = vi.fn(async () => SENT_MESSAGE);
    mount(<AgentInboxPanel agent={{ id: 'agt_0002', name: 'agent-2' }} />, { apiClient: { listMessages, sendMessage, listAgents: vi.fn(async () => page([])) } });
    await flush();
    // The inbox pages by 25 like every other table (UXP1-V027).
    expect(listMessages).toHaveBeenCalledWith('default', { recipient: 'agt_0002', pageNumber: 1, pageSize: 25 });
    expect(qa('[data-testid="agent-inbox-table"] tbody tr').map((r) => r.getAttribute('data-message-id'))).toEqual(['amg_0007', 'amg_0006', 'amg_0004', 'amg_0002']);
    expect(qa('[data-testid="agent-inbox-thread"]')[2].getAttribute('href')).toBe('/dashboard/message-threads/amg_0001?message=amg_0004');
    await act(async () => choose(q('[data-testid="agent-inbox-status"]'), 'Rejected'));
    await flush();
    expect(listMessages).toHaveBeenLastCalledWith('default', { recipient: 'agt_0002', status: 'Rejected', pageNumber: 1, pageSize: 25 });
    expect(qa('[data-testid="agent-inbox-table"] tbody tr').length).toBe(2);
    await click(q('[data-testid="agent-inbox-send"]'));
    await flush();
    expect(q('[data-testid="message-send-recipient"]').value).toBe('agt_0002');
  });
});

describe('Home Autonomy card', () => {
  it('counts messages rejected in the last 24 hours and links to the Rejected view', async () => {
    const listMessages = vi.fn(async () => ({ items: [agentMessage(4)], totalCount: 3 }));
    const apiClient = { listMandates: vi.fn(async () => ({ items: [], totalCount: 0 })), listMessages };
    mount(<HomeAutonomyCard />, { apiClient });
    await flush();
    const line = q('[data-testid="home-autonomy-rejected"] a');
    expect(line.textContent).toBe('3 messages rejected by loop guards in the last 24 hours');
    expect(line.getAttribute('href')).toBe('/dashboard/autonomy?tab=messages&status=Rejected');
    const [, params] = listMessages.mock.calls[0];
    expect(params).toMatchObject({ status: 'Rejected', pageNumber: 1, pageSize: 1 });
    expect(Date.now() - Date.parse(params.from)).toBeGreaterThan(23.9 * 3600000);
  });

  it('says none were rejected, and hides the line when messages cannot be read', async () => {
    mount(<HomeAutonomyCard />, { apiClient: { listMandates: vi.fn(async () => ({ items: [], totalCount: 0 })), listMessages: vi.fn(async () => ({ items: [], totalCount: 0 })) } });
    await flush();
    expect(q('[data-testid="home-autonomy-rejected"]').textContent).toBe('No messages rejected by loop guards in the last 24 hours');
    unmountAll();
    mount(<HomeAutonomyCard />, { apiClient: { listMandates: vi.fn(async () => ({ items: [], totalCount: 0 })), listMessages: vi.fn(async () => Promise.reject(new ApiError(403, { code: 'Forbidden' }))) } });
    await flush();
    expect(q('[data-testid="home-autonomy"]')).toBeTruthy();
    expect(q('[data-testid="home-autonomy-rejected"]')).toBeNull();
  });
});

describe('API client', () => {
  it('uses the documented message routes', async () => {
    const calls = [];
    const original = globalThis.fetch;
    globalThis.fetch = vi.fn(async (url, init) => {
      calls.push({ url: String(url), method: init.method, body: init.body });
      return new Response(JSON.stringify(String(url).includes('message-threads') ? [] : { objects: [], totalRecords: 0 }), { status: 200 });
    });
    try {
      const api = new ApiClient('http://127.0.0.1:8700', 'tok');
      await api.listMessages('default', { recipient: 'agt_1', status: 'Rejected', reason: 'LineRate', pageNumber: 2, pageSize: 25 });
      await api.getMessage('default', 'amg_1');
      await api.getMessageThread('default', 'amg_1');
      await api.sendMessage('default', { recipient: 'agt_1', subject: 'S' });
      expect(calls.map((c) => `${c.method} ${decodeURIComponent(c.url.replace('http://127.0.0.1:8700/v1.0/api/tenants/default/', ''))}`)).toEqual([
        'GET messages?recipient=agt_1&status=Rejected&reason=LineRate&maxResults=25&skip=25',
        'GET messages/amg_1',
        'GET message-threads/amg_1',
        'POST messages'
      ]);
      expect(JSON.parse(calls[3].body)).toEqual({ recipient: 'agt_1', subject: 'S' });
    } finally {
      globalThis.fetch = original;
    }
  });

  it('matches the mock list filters the e2e suite relies on', () => {
    expect(list({ status: 'Rejected' }).map((m) => m.id)).toEqual(['amg_0007', 'amg_0005', 'amg_0004']);
    expect(list({ sender: 'echo-agent', urgency: 'Urgent' }).map((m) => m.id)).toEqual(['amg_0002']);
    expect(list({ agent: 'agt_0003' }).map((m) => m.id)).toEqual(['amg_0005']);
    expect(messageThread('amg_0042')).toBeUndefined();
  });
});
