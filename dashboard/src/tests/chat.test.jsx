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
