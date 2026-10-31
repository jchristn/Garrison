import { describe, it, expect, beforeAll, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import i18n from '../i18n';
import App from '../App.jsx';
import FilePanel from '../components/FilePanel.jsx';
import TurnView from '../components/TurnView.jsx';
import ConversationList from '../components/ConversationList.jsx';
import Splitter from '../components/Splitter.jsx';
import { createGatewayClient } from '../api/gateway.js';
import { newTurnState } from '../utils/turns.js';
import { FakeEventSource, mockFetch } from './fakes.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const INFO = {
  slug: 'demo',
  displayName: 'Research Desk',
  description: 'Ask the research team.',
  welcomeText: 'Welcome! Ask me about **anything**.',
  primaryColor: '#1e3a8a',
  accentColor: '#f59e0b',
  logoUrl: '/v1.0/apps/demo/logo',
  authMode: 'Anonymous',
  anonymousAllowed: true,
  showOperatorDetail: false
};
const SESSION = { token: 'gas_t', expiresUtc: '2099-01-01T00:00:00Z', principalName: 'anonymous', anonymous: true };
const TURN = { runId: 'run_1', turn: 1, message: 'What is new?', status: 'Queued', awaitingApproval: false, createdUtc: '2026-10-28T12:00:00Z' };

let container;
let root;
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
const q = (sel) => document.body.querySelector(sel);
const qa = (sel) => [...document.body.querySelectorAll(sel)];

async function render(element) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root.render(element));
  await flush();
  await flush();
}

async function type(el, value) {
  const setter = Object.getOwnPropertyDescriptor(el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value').set;
  await act(async () => {
    setter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

async function click(el) {
  await act(async () => el.click());
  await flush();
}

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  sessionStorage.clear();
  FakeEventSource.reset();
  window.EventSource = FakeEventSource;
  window.GARRISON_CONFIG = { apiUrl: '' };
  window.history.replaceState(null, '', '/apps/demo/');
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.body.innerHTML = '';
});

describe('App', () => {
  it('shows branding and the anonymous option on the sign-in screen', async () => {
    const fetchImpl = mockFetch({ 'GET /v1.0/apps/demo': INFO });
    await render(<App fetchImpl={fetchImpl} />);
    expect(q('h1').textContent).toBe('Sign in to Research Desk');
    expect(q('.signin-description').textContent).toBe('Ask the research team.');
    expect(q('img.brand-logo').getAttribute('src')).toBe('/v1.0/apps/demo/logo');
    expect(document.documentElement.style.getPropertyValue('--app-primary')).toBe('#1e3a8a');
    expect(q('[data-testid="signin-anonymous"]')).not.toBeNull();
    expect(q('#app-email').getAttribute('data-tip').length).toBeGreaterThan(25);
  });

  it('hides the anonymous option when the app requires sign-in and shows sign-in errors', async () => {
    const fetchImpl = mockFetch({
      'GET /v1.0/apps/demo': { ...INFO, authMode: 'AppUsers', anonymousAllowed: false },
      'POST /v1.0/apps/demo/session': [403, { code: 'AppAccessDenied', message: 'no' }]
    });
    await render(<App fetchImpl={fetchImpl} />);
    expect(q('[data-testid="signin-anonymous"]')).toBeNull();
    await type(q('#app-email'), 'ana@example.com');
    await type(q('#app-password'), 'secret');
    await act(async () => q('form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
    await flush();
    expect(q('[data-testid="signin-error"]').textContent).toBe(i18n.t('errors.AppAccessDenied'));
  });

  it('shows not found for an unknown app', async () => {
    await render(<App fetchImpl={mockFetch({})} />);
    expect(q('h1').textContent).toBe(i18n.t('app.notFoundTitle'));
  });

  it('streams the first answer, shows the welcome text first, and returns to sign-in on a 401', async () => {
    const fetchImpl = mockFetch({
      'GET /v1.0/apps/demo': INFO,
      'POST /v1.0/apps/demo/session': [201, SESSION],
      'GET /v1.0/apps/demo/conversations': [200, []],
      'POST /v1.0/apps/demo/conversations/cnv_1/messages': [401, { code: 'AppSessionRequired', message: 'The app session ended.' }],
      'POST /v1.0/apps/demo/conversations': [201, { conversationId: 'cnv_1', turn: TURN }],
      'GET /v1.0/apps/demo/conversations/cnv_1/files': { fileSpaceId: 'cfs_1', fileCount: 0, totalBytes: 0, files: [] }
    });
    await render(<App fetchImpl={fetchImpl} />);
    await click(q('[data-testid="signin-anonymous"]'));
    expect(q('[data-testid="brand-name"]').textContent).toBe('Research Desk');
    expect(q('[data-testid="welcome"]').textContent).toContain('Welcome! Ask me about anything.');
    expect(q('[data-testid="welcome"] strong').textContent).toBe('anything');

    await type(q('[data-testid="composer-input"]'), 'What is new?');
    await click(q('[data-testid="send-button"]'));
    expect(window.location.pathname).toBe('/apps/demo/c/cnv_1');
    expect(q('[data-testid="welcome"]')).toBeNull();
    const stream = FakeEventSource.instances.find((e) => e.url.includes('/turns/run_1/stream'));
    expect(stream.url).toContain('session=gas_t');
    await act(async () => {
      stream.open();
      stream.emit('turn.status', { ...TURN, status: 'Running', awaitingApproval: true });
    });
    expect(q('[data-testid="approval-notice"]').textContent).toBe('Waiting for an operator to approve a step');
    await act(async () => {
      stream.emit('turn.status', { ...TURN, status: 'Running', awaitingApproval: false });
      stream.emit('turn.event', { sequence: 1, eventType: 'AssistantText', text: 'Two ' }, 1);
      stream.emit('turn.event', { sequence: 2, eventType: 'AssistantText', text: 'things.' }, 2);
    });
    expect(q('[data-testid="approval-notice"]')).toBeNull();
    expect(q('[data-testid="answer"]').textContent.trim()).toBe('Two things.');
    await act(async () => stream.emit('turn.completed', { ...TURN, status: 'Succeeded', answer: 'Two things.' }));
    await flush();
    expect(q('[data-testid="turn"]').getAttribute('data-phase')).toBe('done');

    await type(q('[data-testid="composer-input"]'), 'And then?');
    await click(q('[data-testid="send-button"]'));
    expect(sessionStorage.getItem('garrison.app.session.demo')).toBeNull();
    expect(q('[data-testid="signin-submit"]')).not.toBeNull();
    expect(q('.notice-info').textContent).toBe(i18n.t('errors.AppSessionRequired'));
  });

  it('shows the busy and rate-limited errors and keeps the message', async () => {
    sessionStorage.setItem('garrison.app.session.demo', JSON.stringify(SESSION));
    window.history.replaceState(null, '', '/apps/demo/c/cnv_1');
    const done = { ...TURN, status: 'Succeeded', answer: 'ok' };
    let code = 'ConversationBusy';
    const fetchImpl = mockFetch({
      'GET /v1.0/apps/demo': INFO,
      'GET /v1.0/apps/demo/conversations': [{ id: 'cnv_1', turnCount: 1, busy: false, createdUtc: '2026-10-28T12:00:00Z' }],
      'GET /v1.0/apps/demo/conversations/cnv_1': { id: 'cnv_1', turnCount: 1, turns: [done] },
      'POST /v1.0/apps/demo/conversations/cnv_1/messages': () => [409, { code, message: 'x' }],
      'GET /v1.0/apps/demo/conversations/cnv_1/files': { fileCount: 0, totalBytes: 0, files: [] }
    });
    await render(<App fetchImpl={fetchImpl} />);
    expect(q('[data-testid="answer"]').textContent.trim()).toBe('ok');
    await type(q('[data-testid="composer-input"]'), 'again');
    await click(q('[data-testid="send-button"]'));
    expect(q('[data-testid="send-error"]').getAttribute('data-code')).toBe('ConversationBusy');
    expect(q('[data-testid="send-error"]').textContent).toContain(i18n.t('errors.ConversationBusy'));
    expect(q('[data-testid="composer-input"]').value).toBe('again');
    code = 'AppRateLimited';
    await click(q('[data-testid="send-button"]'));
    expect(q('[data-testid="send-error"]').textContent).toContain(i18n.t('errors.AppRateLimited'));
  });
});

describe('TurnView', () => {
  it('shows a failed turn and operator detail only when enabled', async () => {
    const turn = { ...newTurnState({ ...TURN, status: 'Failed' }), streamError: 'Tool crashed', details: [{ sequence: 4, eventType: 'ToolCall', toolName: 'search', text: '' }] };
    await render(
      <ol>
        <TurnView turn={turn} agentName="Desk" showDetail />
        <TurnView turn={{ ...turn, runId: 'run_2' }} agentName="Desk" showDetail={false} />
      </ol>
    );
    expect(qa('[data-testid="turn-error"]')[0].textContent).toContain('Tool crashed');
    expect(qa('[data-testid="activity"]')).toHaveLength(1);
    expect(q('.tool-label').textContent).toBe('Using search');
  });

  it('says what the agent is doing while it works, and lists the steps live', async () => {
    const details = [
      { sequence: 1, eventType: 'Thinking', text: 'Plan the search first.' },
      { sequence: 2, eventType: 'ToolCall', toolName: 'mcp__garrison__garrison_invoke_agent', toolCallId: 'c1', text: '{"agent":"web-searcher","input":"Find sources"}' },
      { sequence: 3, eventType: 'ToolResult', toolName: 'mcp__garrison__garrison_invoke_agent', toolCallId: 'c1', success: true, text: '{"status":"Succeeded"}' },
      { sequence: 4, eventType: 'ToolCall', toolName: 'mcp__garrison__content-retriever', toolCallId: 'c2', text: '{"input":"Fetch them"}' }
    ];
    const turn = { ...newTurnState({ ...TURN, status: 'Running' }), details };
    await render(
      <ol>
        <TurnView turn={turn} agentName="Desk" showDetail />
      </ol>
    );
    expect(q('[data-testid="turn-state"]').textContent).toBe('Asking content-retriever');
    expect(q('[data-testid="activity"]').open).toBe(true);
    expect(qa('[data-testid="activity-thinking"]')).toHaveLength(1);
    const tools = qa('[data-testid="activity-tool"]');
    expect(tools.map((el) => [el.querySelector('.tool-label').textContent, el.dataset.status])).toEqual([
      ['Asking web-searcher', 'ok'],
      ['Asking content-retriever', 'running']
    ]);
    expect(tools[0].querySelector('pre').textContent).toContain('"agent": "web-searcher"');
  });

  it('shows only the status without operator detail, without repeating it', async () => {
    await render(
      <ol>
        <TurnView turn={newTurnState({ ...TURN, status: 'Running' })} agentName="Desk" showDetail={false} />
      </ol>
    );
    expect(q('[data-testid="turn-state"]').textContent).toBe('The agent is working on it');
    expect(qa('[data-testid="activity"]')).toHaveLength(0);
  });
});

describe('FilePanel', () => {
  it('lists files with their version and marks fresh ones', async () => {
    const client = createGatewayClient({ slug: 'demo', baseUrl: '', fetchImpl: mockFetch({}) });
    const files = {
      loading: false,
      error: null,
      fresh: ['out/report.md'],
      listing: {
        fileSpaceId: 'cfs_1',
        fileCount: 2,
        totalBytes: 2048,
        files: [
          { path: 'out/report.md', currentVersion: 2, sizeBytes: 1024, sha256: 'ab', mediaType: 'text/markdown', deleted: false, lastUpdateUtc: '2026-10-28T12:00:00Z' },
          { path: 'notes.txt', currentVersion: 1, sizeBytes: 1024, sha256: 'cd', mediaType: 'text/plain', deleted: false, lastUpdateUtc: '2026-10-28T12:00:00Z' }
        ]
      }
    };
    await render(<FilePanel client={client} conversationId="cnv_1" files={files} onClose={() => {}} />);
    const items = qa('[data-testid="file-item"]');
    expect(items.map((i) => i.getAttribute('data-path'))).toEqual(['notes.txt', 'out/report.md']);
    expect(items[1].querySelector('.badge-new')).not.toBeNull();
    expect(items[0].querySelector('.badge-new')).toBeNull();
    expect(items[1].textContent).toContain('Version 2');
    expect(q('.file-summary').textContent).toBe('Files: 2 (2 KB)');
  });
});

describe('copy and telemetry on messages', () => {
  it('copies with a fallback where the Clipboard API is missing and shows a green check', async () => {
    const copied = [];
    const original = document.execCommand;
    document.execCommand = (cmd) => {
      copied.push([cmd, document.body.querySelector('textarea[readonly]')?.value]);
      return true;
    };
    const turn = { ...newTurnState({ ...TURN, status: 'Succeeded', answer: 'The answer.' }) };
    await render(
      <ol>
        <TurnView turn={turn} agentName="Desk" showDetail={false} />
      </ol>
    );
    expect(qa('[data-testid="copy-message"]')).toHaveLength(1);
    const button = q('[data-testid="copy-answer"]');
    await act(async () => {
      button.click();
    });
    expect(copied).toEqual([['copy', 'The answer.']]);
    expect(button.dataset.state).toBe('copied');
    expect(button.classList.contains('copy-copied')).toBe(true);
    document.execCommand = original;
  });

  it('shows how the turn ran behind the (i) when the app shows operator detail', async () => {
    const details = [
      { sequence: 1, eventType: 'ToolCall', toolName: 'search', toolCallId: 'c1', text: '{}', timestampUtc: '2026-10-28T12:00:00.000Z' },
      { sequence: 2, eventType: 'ToolResult', toolName: 'search', toolCallId: 'c1', success: true, text: '{}', timestampUtc: '2026-10-28T12:00:02.500Z' }
    ];
    const telemetry = { servedModel: 'claude-sonnet-5-5', timeToFirstTokenMs: 820, streamingMs: 4100, totalMs: 9300, inputTokens: 1200, outputTokens: 340, cachedTokens: 900, reasoningTokens: 50, outputTokensPerSecond: 82.9, toolCallCount: 1, costUsd: 0.0123 };
    const turn = { ...newTurnState({ ...TURN, status: 'Succeeded', answer: 'Done.', telemetry }), details };
    await render(
      <ol>
        <TurnView turn={turn} agentName="Desk" showDetail />
        <TurnView turn={{ ...turn, runId: 'run_2', telemetry: null }} agentName="Desk" showDetail={false} />
      </ol>
    );
    expect(qa('[data-testid="turn-telemetry"]')).toHaveLength(1);
    await act(async () => {
      q('[data-testid="turn-telemetry"]').focus();
    });
    const text = q('[data-testid="turn-telemetry-popover"]').textContent;
    for (const part of ['claude-sonnet-5-5', 'Time to first token', '820 ms', 'Streaming time', '4.1 s', 'Time in tools', '2.5 s', 'Total time', '9.3 s', 'Input tokens', '1,200', 'Cached tokens', '900', 'Reasoning tokens', 'Output speed', '82.9 tokens/s', 'Tool calls', 'Cost']) expect(text).toContain(part);
  });
});

describe('conversation list actions', () => {
  const list = [
    { id: 'cnv_1', title: 'Tides', turnCount: 2, createdUtc: '2026-10-01T00:00:00Z', lastActivityUtc: '2026-10-03T00:00:00Z' },
    { id: 'cnv_2', title: 'Apples', turnCount: 1, createdUtc: '2026-10-02T00:00:00Z', lastActivityUtc: '2026-10-02T00:00:00Z', busy: true }
  ];
  const change = (el, value) => {
    const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value').set;
    setter.call(el, value);
    el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  };

  it('filters, sorts, renames, and deletes after a confirmation', async () => {
    const renamed = [];
    const deleted = [];
    await render(<ConversationList conversations={list} error={null} selectedId="cnv_1" onSelect={() => {}} onNew={() => {}} onRename={async (id, title) => renamed.push([id, title])} onDelete={async (id) => deleted.push(id)} />);
    const titles = () => qa('.conversation-title').map((el) => el.textContent);
    expect(titles()).toEqual(['Tides', 'Apples']);
    await act(async () => change(q('[data-testid="conversation-sort"]'), 'nameAsc'));
    expect(titles()).toEqual(['Apples', 'Tides']);
    await act(async () => change(q('[data-testid="conversation-filter"]'), 'tid'));
    expect(titles()).toEqual(['Tides']);
    await act(async () => change(q('[data-testid="conversation-filter"]'), ''));

    const tides = qa('[data-testid="conversation-row"]').find((row) => row.textContent.includes('Tides'));
    await act(async () => tides.querySelector('[data-testid="conversation-rename"]').click());
    await act(async () => change(q('[data-testid="conversation-rename-input"]'), 'Tide research'));
    await act(async () => q('[data-testid="conversation-rename-save"]').click());
    expect(renamed).toEqual([['cnv_1', 'Tide research']]);

    const apples = qa('[data-testid="conversation-row"]').find((row) => row.textContent.includes('Apples'));
    expect(apples.querySelector('[data-testid="conversation-delete"]').disabled).toBe(true);
    const row = qa('[data-testid="conversation-row"]').find((r) => r.textContent.includes('Tides'));
    await act(async () => row.querySelector('[data-testid="conversation-delete"]').click());
    expect(q('[data-testid="conversation-confirm"]').textContent).toContain('Tides');
    await act(async () => q('[data-testid="conversation-delete-confirm"]').click());
    expect(deleted).toEqual(['cnv_1']);
  });

  it('resizes a pane from the keyboard within its limits', async () => {
    const widths = [];
    await render(<Splitter edge="start" width={280} min={200} max={520} onChange={(w) => widths.push(w)} label="Resize" tipText="Drag to resize the list" testId="splitter" />);
    const bar = q('[data-testid="splitter"]');
    expect(bar.getAttribute('role')).toBe('separator');
    const press = (key) => bar.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    await act(async () => press('ArrowRight'));
    await act(async () => press('ArrowLeft'));
    await act(async () => press('End'));
    await act(async () => press('Home'));
    expect(widths).toEqual([296, 264, 520, 200]);
  });
});
