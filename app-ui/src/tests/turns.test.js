import { describe, it, expect } from 'vitest';
import { applyEvent, applyView, isTerminal, newTurnState, turnPhase, visibleAnswer } from '../utils/turns.js';

const base = () => newTurnState({ runId: 'run_1', turn: 1, message: 'Hi', status: 'Running', awaitingApproval: false });

describe('turn state', () => {
  it('appends AssistantText in order and ignores replays', () => {
    let s = base();
    s = applyEvent(s, { sequence: 1, eventType: 'Lifecycle', text: 'started' });
    s = applyEvent(s, { sequence: 2, eventType: 'AssistantText', text: 'Hello' });
    s = applyEvent(s, { sequence: 3, eventType: 'AssistantText', text: ', world' });
    s = applyEvent(s, { sequence: 3, eventType: 'AssistantText', text: ', world' });
    expect(s.streamed).toBe('Hello, world');
    expect(s.lastSequence).toBe(3);
    expect(turnPhase(s)).toBe('streaming');
  });

  it('keeps operator detail events and error text', () => {
    let s = base();
    s = applyEvent(s, { sequence: 1, eventType: 'ToolCall', toolName: 'search' });
    s = applyEvent(s, { sequence: 2, eventType: 'Error', text: 'quota' });
    expect(s.details).toEqual([{ sequence: 1, eventType: 'ToolCall', text: '', toolName: 'search', toolCallId: null, success: undefined, timestampUtc: null }]);
    expect(s.streamError).toBe('quota');
  });

  it('takes tool arguments and results sent as JSON objects', () => {
    let s = base();
    s = applyEvent(s, { sequence: 1, eventType: 'ToolCall', toolName: 'search', toolCallId: 'c1', toolInput: { query: 'tides' } });
    s = applyEvent(s, { sequence: 2, eventType: 'ToolResult', toolName: 'search', toolCallId: 'c1', success: true, toolOutput: { hits: 3 } });
    expect(s.details.map((d) => d.text)).toEqual(['{"query":"tides"}', '{"hits":3}']);
  });

  it('prefers the final answer once the turn completes', () => {
    let s = applyEvent(base(), { sequence: 1, eventType: 'AssistantText', text: 'partial' });
    s = applyView(s, { runId: 'run_1', status: 'Succeeded', answer: 'The whole answer' });
    expect(visibleAnswer(s)).toBe('The whole answer');
    expect(turnPhase(s)).toBe('done');
  });

  it('reports approval, waiting, and failure phases', () => {
    expect(turnPhase(applyView(base(), { awaitingApproval: true }))).toBe('approval');
    expect(turnPhase(base())).toBe('waiting');
    expect(turnPhase(applyView(base(), { status: 'TimedOut' }))).toBe('failed');
    expect(isTerminal('Rejected')).toBe(true);
    expect(isTerminal('Suspended')).toBe(false);
  });
});
