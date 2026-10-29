// Server-sent event streams that survive dropped connections.
//
// The browser's EventSource reconnects on its own, but it keeps the original URL and gives up for good on a non-200
// answer (for example 401 after the session ended). ReconnectingStream takes over instead: on any error it closes
// the EventSource, waits with exponential backoff (500 ms doubling to 15 s by default, with no attempt limit), and
// opens a new one whose URL resumes after the last sequence it saw. Events that carry a sequence (the SSE id) are
// delivered once: anything at or below the last delivered sequence is dropped, so a replayed event never shows
// twice. A terminal event (turn.completed) closes the stream for good.

export const DEFAULT_BACKOFF = { initialMs: 500, maxMs: 15000, factor: 2 };

/** Delay before reconnect attempt number `attempt` (0-based): initialMs * factor^attempt, capped at maxMs. */
export function backoffDelay(attempt, backoff = DEFAULT_BACKOFF) {
  const b = { ...DEFAULT_BACKOFF, ...(backoff || {}) };
  const delay = b.initialMs * Math.pow(b.factor, Math.max(0, attempt));
  return Math.min(b.maxMs, Math.round(delay));
}

function parseData(message) {
  try {
    return message && message.data ? JSON.parse(message.data) : null;
  } catch {
    return null;
  }
}

export class ReconnectingStream {
  /**
   * @param {object} options
   * @param {(afterSequence: number) => string} options.buildUrl URL for a connection that resumes after a sequence.
   * @param {Object<string, Function>} options.handlers Event name to handler(data, sequence).
   * @param {string[]} [options.sequenced] Event names whose SSE id is a sequence to de-duplicate on.
   * @param {string[]} [options.terminal] Event names that end the stream.
   * @param {number} [options.afterSequence] Start after this sequence (0 for the beginning).
   * @param {Function} [options.onOpen] Called each time a connection opens.
   * @param {Function} [options.onReconnecting] Called with { attempt, delayMs } before each reconnect.
   * @param {Function} [options.EventSourceImpl] EventSource constructor (tests pass a fake).
   * @param {object} [options.backoff] { initialMs, maxMs, factor }.
   * @param {Function} [options.setTimer] setTimeout replacement for tests.
   * @param {Function} [options.clearTimer] clearTimeout replacement for tests.
   */
  constructor(options) {
    this.buildUrl = options.buildUrl;
    this.handlers = options.handlers || {};
    this.sequenced = new Set(options.sequenced || []);
    this.terminal = new Set(options.terminal || []);
    this.lastSequence = Number(options.afterSequence) || 0;
    this.onOpen = options.onOpen || null;
    this.onReconnecting = options.onReconnecting || null;
    this.EventSourceImpl = options.EventSourceImpl || (typeof window !== 'undefined' ? window.EventSource : null);
    this.backoff = options.backoff || DEFAULT_BACKOFF;
    this.setTimer = options.setTimer || ((fn, ms) => setTimeout(fn, ms));
    this.clearTimer = options.clearTimer || ((id) => clearTimeout(id));
    this.source = null;
    this.timer = null;
    this.attempt = 0;
    this.closed = false;
    this.connections = 0;
  }

  /** Open the first connection. */
  start() {
    if (this.closed || this.source) return this;
    this.connect();
    return this;
  }

  /** Close for good (also used when the component unmounts). */
  close() {
    this.closed = true;
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null;
    if (this.source) this.source.close();
    this.source = null;
  }

  connect() {
    if (this.closed) return;
    const Impl = this.EventSourceImpl;
    if (!Impl) return;
    const source = new Impl(this.buildUrl(this.lastSequence));
    this.source = source;
    this.connections += 1;
    source.onopen = () => {
      if (this.source !== source) return;
      this.attempt = 0;
      if (this.onOpen) this.onOpen();
    };
    source.onerror = () => {
      if (this.source !== source || this.closed) return;
      this.scheduleReconnect();
    };
    const names = new Set([...Object.keys(this.handlers), ...this.terminal]);
    for (const name of names) {
      source.addEventListener(name, (message) => {
        if (this.source !== source || this.closed) return;
        this.dispatch(name, message);
      });
    }
  }

  dispatch(name, message) {
    const data = parseData(message);
    let sequence = null;
    if (this.sequenced.has(name)) {
      sequence = Number(message.lastEventId || (data && data.sequence));
      if (Number.isFinite(sequence) && sequence > 0) {
        if (sequence <= this.lastSequence) return;
        this.lastSequence = sequence;
      }
    }
    // A successful message means the connection works, so the next drop starts the backoff over.
    this.attempt = 0;
    const handler = this.handlers[name];
    if (this.terminal.has(name)) this.close();
    if (handler) handler(data, sequence);
  }

  scheduleReconnect() {
    if (this.source) this.source.close();
    this.source = null;
    if (this.closed || this.timer !== null) return;
    const delayMs = backoffDelay(this.attempt, this.backoff);
    const attempt = this.attempt + 1;
    this.attempt = attempt;
    if (this.onReconnecting) this.onReconnecting({ attempt, delayMs });
    this.timer = this.setTimer(() => {
      this.timer = null;
      this.connect();
    }, delayMs);
  }
}

/** Stream one turn: turn.event (sequenced), turn.status, and turn.completed (terminal). */
export function openTurnStream(client, conversationId, runId, { afterSequence = 0, onEvent, onStatus, onCompleted, ...rest } = {}) {
  return new ReconnectingStream({
    buildUrl: (after) => client.turnStreamUrl(conversationId, runId, after),
    handlers: {
      'turn.event': (data, sequence) => onEvent && data && onEvent(data, sequence),
      'turn.status': (data) => onStatus && data && onStatus(data),
      'turn.completed': (data) => onCompleted && onCompleted(data)
    },
    sequenced: ['turn.event'],
    terminal: ['turn.completed'],
    afterSequence,
    ...rest
  }).start();
}

/** Stream files.changed for a conversation. The first message after each connect lists every file. */
export function openFileStream(client, conversationId, { onChanged, ...rest } = {}) {
  return new ReconnectingStream({
    buildUrl: () => client.fileStreamUrl(conversationId),
    handlers: { 'files.changed': (data) => onChanged && data && onChanged(data) },
    ...rest
  }).start();
}
