/**
 * Browser server-sent event streams for the app gateway that survive dropped connections.
 *
 * The browser's EventSource reconnects on its own, but it keeps the original URL and gives up for good on a non-200
 * answer (for example 401 after the session ended). ReconnectingEventStream takes over instead: on any error it closes
 * the EventSource, waits with exponential backoff (500 ms doubling to 15 s by default, with no attempt limit), and
 * opens a new one whose URL resumes after the last sequence it saw. Events that carry a sequence (the SSE id) are
 * delivered once: anything at or below the last delivered sequence is dropped, so a replayed event never shows twice.
 * A terminal event (turn.completed) closes the stream for good.
 *
 * Used from a browser with EventSource; Node code uses AppGatewayClient.streamTurn and streamFiles (fetch) instead.
 */

import type { AppFilesChanged, AppTurnView } from "./gateway.js";
import type { RunEvent } from "./index.js";

/** Reconnect delays: attempt n (0-based) waits initialMs * factor^n, capped at maxMs. */
export interface BackoffOptions {
  /** Delay before the first reconnect, in milliseconds. Default 500. */
  initialMs?: number;
  /** Largest delay, in milliseconds. Default 15000. */
  maxMs?: number;
  /** Growth per attempt. Default 2; 1 keeps the delay fixed. */
  factor?: number;
}

/** Default reconnect delays: 500 ms doubling to 15 s. */
export const DEFAULT_BACKOFF: Required<BackoffOptions> = { initialMs: 500, maxMs: 15000, factor: 2 };

/** The parts of an EventSource the stream uses. */
export interface EventSourceLike {
  onopen: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  addEventListener(name: string, listener: (message: { data?: string; lastEventId?: string }) => void): void;
  close(): void;
}

/** An EventSource constructor (window.EventSource, or a fake in tests). */
export type EventSourceConstructor = new (url: string) => EventSourceLike;

/** Called with each event's parsed JSON data (null when it is not JSON) and its sequence (null when not sequenced). */
export type StreamHandler = (data: any, sequence: number | null) => void;

/** Reconnect notice passed to onReconnecting. attempt counts from 1 since the last working connection. */
export interface ReconnectInfo { attempt: number; delayMs: number; }

/** Options shared by every reconnecting stream. */
export interface ReconnectingStreamOptions {
  /** Called each time a connection opens. */
  onOpen?: () => void;
  /** Called before each reconnect with the attempt number and the delay. */
  onReconnecting?: (info: ReconnectInfo) => void;
  /** EventSource constructor; defaults to globalThis.EventSource. */
  EventSourceImpl?: EventSourceConstructor;
  /** Reconnect delays (default {@link DEFAULT_BACKOFF}); the stream never stops retrying until closed. */
  backoff?: BackoffOptions;
  /** setTimeout replacement (tests). */
  setTimer?: (fn: () => void, ms: number) => any;
  /** clearTimeout replacement (tests). */
  clearTimer?: (id: any) => void;
}

/** Options for {@link ReconnectingEventStream}. */
export interface ReconnectingEventStreamOptions extends ReconnectingStreamOptions {
  /** URL for a connection that resumes after a sequence (0 for the beginning). */
  buildUrl: (afterSequence: number) => string;
  /** Event name to handler. */
  handlers?: Record<string, StreamHandler>;
  /** Event names whose SSE id (or data.sequence) is a sequence to de-duplicate on. */
  sequenced?: string[];
  /** Event names that end the stream. */
  terminal?: string[];
  /** Start after this sequence. Default 0. */
  afterSequence?: number;
}

/** Delay before reconnect attempt number attempt (0-based): initialMs * factor^attempt, capped at maxMs. */
export function backoffDelay(attempt: number, backoff?: BackoffOptions): number {
  const b = { ...DEFAULT_BACKOFF, ...(backoff ?? {}) };
  return Math.min(b.maxMs, Math.round(b.initialMs * Math.pow(b.factor, Math.max(0, attempt))));
}

function parseData(message: { data?: string }): any {
  try {
    return message && message.data ? JSON.parse(message.data) : null;
  } catch {
    return null;
  }
}

/** An EventSource that reconnects forever with backoff, resumes after the last sequence, and drops duplicates. */
export class ReconnectingEventStream {
  /** Highest sequence delivered so far. */
  lastSequence: number;
  /** True after close() or a terminal event. */
  closed = false;
  /** Connections opened so far. */
  connections = 0;

  private readonly _buildUrl: (afterSequence: number) => string;
  private readonly _handlers: Record<string, StreamHandler>;
  private readonly _sequenced: Set<string>;
  private readonly _terminal: Set<string>;
  private readonly _onOpen?: () => void;
  private readonly _onReconnecting?: (info: ReconnectInfo) => void;
  private readonly _EventSourceImpl?: EventSourceConstructor;
  private readonly _backoff?: BackoffOptions;
  private readonly _setTimer: (fn: () => void, ms: number) => any;
  private readonly _clearTimer: (id: any) => void;
  private _source: EventSourceLike | null = null;
  private _timer: any = null;
  private _attempt = 0;

  constructor(options: ReconnectingEventStreamOptions) {
    if (!options || typeof options.buildUrl !== "function") throw new Error("buildUrl is required");
    this._buildUrl = options.buildUrl;
    this._handlers = options.handlers ?? {};
    this._sequenced = new Set(options.sequenced ?? []);
    this._terminal = new Set(options.terminal ?? []);
    this.lastSequence = Number(options.afterSequence) || 0;
    this._onOpen = options.onOpen;
    this._onReconnecting = options.onReconnecting;
    this._EventSourceImpl = options.EventSourceImpl ?? (globalThis as any).EventSource;
    this._backoff = options.backoff;
    this._setTimer = options.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this._clearTimer = options.clearTimer ?? ((id) => clearTimeout(id));
  }

  /** Open the first connection. Returns this. */
  start(): this {
    if (this.closed || this._source) return this;
    this.connect();
    return this;
  }

  /** Close for good (for example when a component unmounts). */
  close(): void {
    this.closed = true;
    if (this._timer !== null) this._clearTimer(this._timer);
    this._timer = null;
    if (this._source) this._source.close();
    this._source = null;
  }

  private connect(): void {
    if (this.closed) return;
    const Impl = this._EventSourceImpl;
    if (!Impl) return;
    const source = new Impl(this._buildUrl(this.lastSequence));
    this._source = source;
    this.connections += 1;
    source.onopen = () => {
      if (this._source !== source) return;
      this._attempt = 0;
      if (this._onOpen) this._onOpen();
    };
    source.onerror = () => {
      if (this._source !== source || this.closed) return;
      this.scheduleReconnect();
    };
    const names = new Set([...Object.keys(this._handlers), ...this._terminal]);
    for (const name of names) {
      source.addEventListener(name, (message) => {
        if (this._source !== source || this.closed) return;
        this.dispatch(name, message);
      });
    }
  }

  private dispatch(name: string, message: { data?: string; lastEventId?: string }): void {
    const data = parseData(message);
    let sequence: number | null = null;
    if (this._sequenced.has(name)) {
      sequence = Number(message.lastEventId || (data && data.sequence));
      if (Number.isFinite(sequence) && sequence > 0) {
        if (sequence <= this.lastSequence) return;
        this.lastSequence = sequence;
      }
    }
    // A delivered message means the connection works, so the next drop starts the backoff over.
    this._attempt = 0;
    const handler = this._handlers[name];
    if (this._terminal.has(name)) this.close();
    if (handler) handler(data, sequence);
  }

  private scheduleReconnect(): void {
    if (this._source) this._source.close();
    this._source = null;
    if (this.closed || this._timer !== null) return;
    const delayMs = backoffDelay(this._attempt, this._backoff);
    const attempt = this._attempt + 1;
    this._attempt = attempt;
    if (this._onReconnecting) this._onReconnecting({ attempt, delayMs });
    this._timer = this._setTimer(() => {
      this._timer = null;
      this.connect();
    }, delayMs);
  }
}

/** Options for {@link openTurnStream}. */
export interface TurnStreamOptions extends ReconnectingStreamOptions {
  /** Resume after this sequence. Default 0. */
  afterSequence?: number;
  /** A visible run event (turn.event), once per sequence. */
  onEvent?: (event: RunEvent, sequence: number | null) => void;
  /** The turn changed (turn.status). */
  onStatus?: (turn: AppTurnView) => void;
  /** The turn finished (turn.completed); the stream is closed by then. */
  onCompleted?: (turn: AppTurnView) => void;
}

/** Options for {@link openFileStream}. */
export interface FileStreamOptions extends ReconnectingStreamOptions {
  /** Files changed; the first message after each connect lists every file. */
  onChanged?: (changed: AppFilesChanged) => void;
}

/**
 * Stream one turn with EventSource: turn.event (sequenced, de-duplicated), turn.status, and turn.completed (terminal).
 * client is an AppGatewayClient, or anything with turnStreamUrl.
 */
export function openTurnStream(
  client: { turnStreamUrl(id: string, runId: string, afterSequence?: number): string },
  conversationId: string,
  runId: string,
  options: TurnStreamOptions = {}
): ReconnectingEventStream {
  const { afterSequence = 0, onEvent, onStatus, onCompleted, ...rest } = options;
  return new ReconnectingEventStream({
    buildUrl: (after) => client.turnStreamUrl(conversationId, runId, after),
    handlers: {
      "turn.event": (data, sequence) => { if (onEvent && data) onEvent(data, sequence); },
      "turn.status": (data) => { if (onStatus && data) onStatus(data); },
      "turn.completed": (data) => { if (onCompleted) onCompleted(data); }
    },
    sequenced: ["turn.event"],
    terminal: ["turn.completed"],
    afterSequence,
    ...rest
  }).start();
}

/** Stream files.changed for a conversation with EventSource. client is an AppGatewayClient, or anything with fileStreamUrl. */
export function openFileStream(
  client: { fileStreamUrl(id: string): string },
  conversationId: string,
  options: FileStreamOptions = {}
): ReconnectingEventStream {
  const { onChanged, ...rest } = options;
  return new ReconnectingEventStream({
    buildUrl: () => client.fileStreamUrl(conversationId),
    handlers: { "files.changed": (data) => { if (onChanged && data) onChanged(data); } },
    ...rest
  }).start();
}
