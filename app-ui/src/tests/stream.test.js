import { describe, it, expect, beforeEach } from 'vitest';
import { ReconnectingEventStream as ReconnectingStream, backoffDelay, openTurnStream, openFileStream } from '@garrison/sdk/gateway';
import { FakeEventSource } from './fakes.js';

function timers() {
  const pending = [];
  return {
    pending,
    setTimer: (fn, ms) => {
      pending.push({ fn, ms });
      return pending.length;
    },
    clearTimer: () => {},
    runNext() {
      const next = pending.shift();
      next.fn();
      return next.ms;
    }
  };
}

const fakeClient = {
  turnStreamUrl: (c, r, after) => `/turn/${c}/${r}?after=${after}`,
  fileStreamUrl: (c) => `/files/${c}`
};

beforeEach(() => FakeEventSource.reset());

describe('backoffDelay', () => {
  it('doubles from 500 ms up to 15 s', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map((a) => backoffDelay(a))).toEqual([500, 1000, 2000, 4000, 8000, 15000, 15000]);
    expect(backoffDelay(2, { initialMs: 100, maxMs: 1000, factor: 3 })).toBe(900);
  });
});

describe('turn stream resume', () => {
  it('delivers each sequence once and resumes after the last one on reconnect', () => {
    const t = timers();
    const events = [];
    const reconnects = [];
    const stream = openTurnStream(fakeClient, 'cnv_1', 'run_1', {
      onEvent: (e) => events.push(e.sequence),
      onReconnecting: (r) => reconnects.push(r),
      EventSourceImpl: FakeEventSource,
      setTimer: t.setTimer,
      clearTimer: t.clearTimer
    });
    const first = FakeEventSource.last();
    expect(first.url).toBe('/turn/cnv_1/run_1?after=0');
    first.open();
    first.emit('turn.event', { sequence: 1, eventType: 'AssistantText', text: 'Hel' }, 1);
    first.emit('turn.event', { sequence: 2, eventType: 'AssistantText', text: 'lo' }, 2);
    first.fail();
    expect(first.closed).toBe(true);
    expect(reconnects).toEqual([{ attempt: 1, delayMs: 500 }]);
    t.runNext();
    const second = FakeEventSource.last();
    expect(second.url).toBe('/turn/cnv_1/run_1?after=2');
    // A replay of an event already delivered is dropped.
    second.emit('turn.event', { sequence: 2, eventType: 'AssistantText', text: 'lo' }, 2);
    second.emit('turn.event', { sequence: 3, eventType: 'AssistantText', text: '!' }, 3);
    expect(events).toEqual([1, 2, 3]);
    expect(stream.lastSequence).toBe(3);
  });

  it('backs off further on repeated failures and starts over after a connection works', () => {
    const t = timers();
    const delays = [];
    openTurnStream(fakeClient, 'c', 'r', { onReconnecting: (r) => delays.push(r.delayMs), EventSourceImpl: FakeEventSource, setTimer: t.setTimer, clearTimer: t.clearTimer });
    FakeEventSource.last().fail();
    t.runNext();
    FakeEventSource.last().fail();
    t.runNext();
    FakeEventSource.last().fail();
    expect(delays).toEqual([500, 1000, 2000]);
    t.runNext();
    FakeEventSource.last().open();
    FakeEventSource.last().fail();
    expect(delays[3]).toBe(500);
  });

  it('closes for good on turn.completed and ignores later errors', () => {
    const t = timers();
    let completed = null;
    const statuses = [];
    const stream = openTurnStream(fakeClient, 'c', 'r', {
      onStatus: (s) => statuses.push(s.status),
      onCompleted: (v) => (completed = v),
      EventSourceImpl: FakeEventSource,
      setTimer: t.setTimer,
      clearTimer: t.clearTimer
    });
    const es = FakeEventSource.last();
    es.emit('turn.status', { runId: 'r', status: 'Running', awaitingApproval: true });
    es.emit('turn.completed', { runId: 'r', status: 'Succeeded', answer: 'Done' });
    es.fail();
    expect(statuses).toEqual(['Running']);
    expect(completed.answer).toBe('Done');
    expect(es.closed).toBe(true);
    expect(stream.closed).toBe(true);
    expect(t.pending).toHaveLength(0);
    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it('does not reconnect after close()', () => {
    const t = timers();
    const stream = new ReconnectingStream({ buildUrl: () => '/x', handlers: {}, EventSourceImpl: FakeEventSource, setTimer: t.setTimer, clearTimer: t.clearTimer }).start();
    const es = FakeEventSource.last();
    stream.close();
    es.fail();
    expect(t.pending).toHaveLength(0);
  });

  it('can start after a known sequence', () => {
    openTurnStream(fakeClient, 'c', 'r', { afterSequence: 41, EventSourceImpl: FakeEventSource });
    expect(FakeEventSource.last().url).toBe('/turn/c/r?after=41');
  });
});

describe('file stream', () => {
  it('passes files.changed through and reconnects without a sequence', () => {
    const t = timers();
    const seen = [];
    openFileStream(fakeClient, 'cnv_1', { onChanged: (d) => seen.push(d.changed.length), EventSourceImpl: FakeEventSource, setTimer: t.setTimer, clearTimer: t.clearTimer });
    const es = FakeEventSource.last();
    es.emit('files.changed', { conversationId: 'cnv_1', changed: [{ path: 'a.txt', version: 1 }] });
    es.fail();
    t.runNext();
    expect(FakeEventSource.last().url).toBe('/files/cnv_1');
    FakeEventSource.last().emit('files.changed', { conversationId: 'cnv_1', changed: [] });
    expect(seen).toEqual([1, 0]);
  });
});
