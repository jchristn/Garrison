// The studio chat's helpers: wait-state phrase rotation, the clipboard fallback for http origins, and the turn view
// (orientation, wait state, streaming caret, telemetry, copy buttons).

import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import { WAIT_NO_REPEAT, WAIT_PHRASE_KEYS, nextWaitPhrase, waitStage } from '../utils/chatWait';
import { copyToClipboard, copyWithTextarea } from '../utils/clipboard';
import ChatTurn from '../components/studio/ChatTurn';
import { buildPreview } from '../utils/streamPreview';

const html = (node) => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>);

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('wait phrases', () => {
  it('never repeat one of the last few', () => {
    let state = { recent: [] };
    const seen = [];
    for (let i = 0; i < 200; i++) {
      state = nextWaitPhrase(state.recent);
      seen.push(state.key);
    }
    for (let i = 1; i < seen.length; i++) expect(seen.slice(Math.max(0, i - WAIT_NO_REPEAT), i)).not.toContain(seen[i]);
    expect(new Set(seen).size).toBe(WAIT_PHRASE_KEYS.length);
  });

  it('have text in English and tell worker waits from model waits', () => {
    for (const key of WAIT_PHRASE_KEYS) expect(i18n.t(`components.studio.chat.wait.phrases.${key}`)).not.toMatch(/components\./);
    expect(waitStage('Queued')).toBe('worker');
    expect(waitStage('Running')).toBe('model');
  });
});

describe('copy to clipboard', () => {
  it('uses the Clipboard API in a secure context', async () => {
    const writeText = vi.fn(async () => {});
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    vi.stubGlobal('isSecureContext', true);
    expect(await copyToClipboard('hello')).toBe(true);
    expect(writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to a hidden textarea on plain http, where navigator.clipboard is missing', async () => {
    vi.stubGlobal('navigator', {});
    vi.stubGlobal('isSecureContext', false);
    document.execCommand = vi.fn(() => true);
    expect(await copyToClipboard('over http')).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelectorAll('textarea').length).toBe(0);
  });

  it('falls back when the Clipboard API refuses, and reports a refusal of both', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn(async () => Promise.reject(new Error('denied'))) } });
    vi.stubGlobal('isSecureContext', true);
    document.execCommand = vi.fn(() => false);
    expect(await copyToClipboard('x')).toBe(false);
    expect(copyWithTextarea('y')).toBe(false);
  });
});

describe('chat turn', () => {
  const base = { id: 'run_1', inputText: '[Studio draft drf_1: Desk]\n\nAdd a writer', createdUtc: '2026-10-29T10:00:00Z' };

  it('puts the person on the right and the architect on the left, with copy buttons', () => {
    const markup = html(<ChatTurn run={{ ...base, status: 'Succeeded', resultText: 'I added a **writer**.', completedUtc: '2026-10-29T10:00:05Z' }} architectName="architect" />);
    expect(markup).toContain('chat-msg chat-msg-user');
    expect(markup).toContain('chat-msg chat-msg-assistant');
    expect(markup.indexOf('chat-msg-user')).toBeLessThan(markup.indexOf('chat-msg-assistant'));
    expect(markup).toContain('Add a writer');
    expect(markup).not.toContain('[Studio draft');
    expect(markup).toContain('studio-chat-copy-user');
    expect(markup).toContain('studio-chat-copy-answer');
    expect(markup).toContain('<strong>writer</strong>');
  });

  it('shows the wait state before the first output, and says when it waits for a worker', () => {
    expect(html(<ChatTurn run={{ ...base, status: 'Running' }} />)).toContain('data-stage="model"');
    const queued = html(<ChatTurn run={{ ...base, status: 'Queued' }} />);
    expect(queued).toContain('Waiting for a worker to start this turn');
    expect(queued).toContain('chat-typing');
  });

  it('streams text with a caret and tool calls as chips', () => {
    const events = [
      { sequence: 1, eventType: 'AssistantText', text: 'Adding ' },
      { sequence: 2, eventType: 'ToolCall', toolName: 'garrison_studio_put_item', toolCallId: 't1' },
      { sequence: 3, eventType: 'ToolResult', toolCallId: 't1', success: true },
      { sequence: 4, eventType: 'AssistantText', text: 'done' }
    ];
    const markup = html(<ChatTurn run={{ ...base, status: 'Running' }} live={{ preview: buildPreview(events) }} />);
    expect(markup).toContain('is-streaming');
    expect(markup).toContain('chat-stream-last');
    expect(markup).toContain('chat-tool chat-tool-ok');
    expect(markup).toContain('garrison_studio_put_item');
    expect(markup).not.toContain('studio-chat-wait');
  });

  it('shows telemetry by type under a finished answer and leaves out what was not measured', () => {
    const run = { ...base, status: 'Succeeded', resultText: 'Done.', servedModel: 'claude-sonnet', timeToFirstTokenMs: 850, streamingMs: 4200, totalMs: 6100, inputTokens: 1200, outputTokens: 340, cachedTokens: 800, reasoningTokens: null, outputTokensPerSecond: 81, costUsd: 0.0123 };
    const markup = html(<ChatTurn run={run} />);
    for (const metric of ['model', 'timeToFirstTokenMs', 'streamingMs', 'totalMs', 'inputTokens', 'outputTokens', 'cachedTokens', 'outputTokensPerSecond', 'costUsd']) expect(markup).toContain(`data-metric="${metric}"`);
    expect(markup).not.toContain('data-metric="reasoningTokens"');
    expect(markup).toContain('claude-sonnet');
  });

  it('marks a failed turn and shows its error', () => {
    const markup = html(<ChatTurn run={{ ...base, status: 'Failed', outcome: 'NotCredentialed', errorMessage: 'Not logged in' }} />);
    expect(markup).toContain('is-error');
    expect(markup).toContain('Not logged in');
  });
});

describe('record links, telemetry popover, tool cards, and keys', () => {
  it('links the records an answer mentions and offers a button for each', async () => {
    const { findRecordRefs, linkifyRecords } = await import('../utils/recordLinks');
    const text = 'I asked for approval apr_mvuk3imh_MXlT6bgr2oWCSn8SpQa. See run run_abc123456 and run run_abc123456 again.';
    expect(findRecordRefs(text)).toEqual([
      { id: 'apr_mvuk3imh_MXlT6bgr2oWCSn8SpQa', kind: 'apr', href: '/dashboard/approvals/apr_mvuk3imh_MXlT6bgr2oWCSn8SpQa' },
      { id: 'run_abc123456', kind: 'run', href: '/dashboard/runs/run_abc123456' }
    ]);
    const root = document.createElement('div');
    root.innerHTML = '<p>Approve apr_mvuk3imh_MXlT6bgr2oWCSn8SpQa now. <a href="/x">run_abc123456</a> <code>run_zzz999999</code></p>';
    expect(linkifyRecords(root)).toBe(2);
    expect([...root.querySelectorAll('a.record-link')].map((a) => a.getAttribute('href'))).toEqual(['/dashboard/approvals/apr_mvuk3imh_MXlT6bgr2oWCSn8SpQa', '/dashboard/runs/run_zzz999999']);
    const markup = html(<ChatTurn run={{ id: 'run_1', status: 'Succeeded', inputText: 'go', resultText: text }} />);
    expect(markup).toContain('studio-chat-ref-apr_mvuk3imh_MXlT6bgr2oWCSn8SpQa');
    expect(markup).toContain('Open approval');
  });

  it('keeps telemetry behind an (i) button and tool calls in expandable cards', () => {
    const events = [
      { sequence: 1, eventType: 'ToolCall', toolName: 'mcp__garrison__garrison_studio_request_apply', toolCallId: 't1', text: '{"draftId":"sdr_1","version":4}', timestampUtc: '2026-10-29T10:00:00Z' },
      { sequence: 2, eventType: 'ToolResult', toolCallId: 't1', success: true, text: '{"id":"apr_1"}', timestampUtc: '2026-10-29T10:00:01.500Z' },
      { sequence: 3, eventType: 'AssistantText', text: 'Asked for approval.' }
    ];
    const run = { id: 'run_2', status: 'Succeeded', inputText: 'apply', resultText: 'Asked for approval.', timeToFirstTokenMs: 900, inputTokens: 10 };
    const markup = html(<ChatTurn run={run} live={{ preview: buildPreview(events) }} />);
    expect(markup).toContain('studio-chat-metrics-button');
    expect(markup).toContain('chat-info-popover');
    expect(markup).toContain('chat-tool-head');
    expect(markup).toContain('garrison_studio_request_apply');
    expect(markup).not.toContain('mcp__garrison__');
    expect(markup).toContain('1.5');
    // The card is closed until clicked: no arguments in the markup yet.
    expect(markup).not.toContain('studio-chat-tool-body');
  });

  it('sends on Enter and adds a line on Ctrl+Enter, Cmd+Enter, and Shift+Enter', async () => {
    const { composerKeyDown } = await import('../utils/composerKeys');
    const make = (extra) => ({ key: 'Enter', preventDefault: vi.fn(), nativeEvent: {}, currentTarget: { value: 'ab', selectionStart: 1, selectionEnd: 1 }, ...extra });
    vi.stubGlobal('requestAnimationFrame', (f) => f());
    const send = vi.fn();
    const set = vi.fn();
    composerKeyDown(make({}), send, set);
    expect(send).toHaveBeenCalledTimes(1);
    composerKeyDown(make({ ctrlKey: true }), send, set);
    composerKeyDown(make({ metaKey: true }), send, set);
    expect(set).toHaveBeenCalledWith('a\nb');
    expect(send).toHaveBeenCalledTimes(1);
    const shift = make({ shiftKey: true });
    composerKeyDown(shift, send, set);
    expect(shift.preventDefault).not.toHaveBeenCalled();
    composerKeyDown(make({ nativeEvent: { isComposing: true } }), send, set);
    expect(send).toHaveBeenCalledTimes(1);
  });
});
