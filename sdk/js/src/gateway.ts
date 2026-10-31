/**
 * Garrison app gateway client: the end-user side of an agentic app at /v1.0/apps/{slug}/.
 *
 * This module is the entry point @garrison/sdk/gateway. It does not import the management client, so a browser
 * bundle that only talks to an app (for example the app UI served at /apps/{slug}/) stays small. The main entry
 * point (@garrison/sdk) re-exports everything here.
 */

import { GarrisonError } from "./errors.js";
import { backoffDelay } from "./eventStream.js";
import type { BackoffOptions } from "./eventStream.js";
import { queryString, readServerSentEvents, seg } from "./http.js";
import type { AppAuthMode, AppFont, ConversationFileVersion, FileDownloadUrl, FileSpaceListing, RunEvent, RunStatus } from "./index.js";

export { GarrisonError } from "./errors.js";
export * from "./eventStream.js";

/** Server used when no base URL is given. An empty string instead means same-origin relative URLs. */
export const DEFAULT_BASE_URL = "http://127.0.0.1:8700";
/** Run statuses after which a run or an app turn does not change any more. */
export const TERMINAL_STATUSES = ["Succeeded", "Failed", "Cancelled", "TimedOut", "Rejected"];
/** Default storage key prefix for persisted app sessions; the app slug is appended. */
export const DEFAULT_SESSION_KEY_PREFIX = "garrison.app.session.";

/** Branding and sign-in mode of an app, from GET /v1.0/apps/{slug}. Needs no credentials. */
export interface AppInfo {
  slug: string; displayName: string; description?: string | null; welcomeText?: string | null; primaryColor?: string | null;
  accentColor?: string | null; logoUrl?: string | null; backgroundColor?: string | null; headerColor?: string | null;
  agentBubbleColor?: string | null; conversationListColor?: string | null; composerColor?: string | null; filesColor?: string | null;
  fontFamily?: AppFont; faviconUrl?: string | null; authMode: AppAuthMode; anonymousAllowed: boolean; showOperatorDetail: boolean;
}

/** An app session. token has the prefix gas_ and works only on /v1.0/apps/{slug}/ for that app. */
export interface AppSessionResponse { token: string; expiresUtc: string; principalName: string; anonymous: boolean; }

/** One turn of an app conversation as an end user sees it. */
/** How one app turn ran (AppTurnTelemetry). */
export interface AppTurnTelemetry {
  servedModel?: string | null; timeToFirstTokenMs?: number | null; streamingMs?: number | null; executionMs?: number | null;
  queueMs?: number | null; totalMs?: number | null; delegationWaitMs?: number | null; approvalWaitMs?: number | null;
  inputTokens: number; outputTokens: number; cachedTokens: number; reasoningTokens: number;
  outputTokensPerSecond?: number | null; toolCallCount: number; costUsd?: number | null;
}

export interface AppTurnView {
  runId: string; turn: number; message: string; status: RunStatus; answer?: string | null; error?: string | null;
  awaitingApproval: boolean; createdUtc: string; completedUtc?: string | null;
  /** How the turn ran; null unless the app shows operator detail. */
  telemetry?: AppTurnTelemetry | null;
}

/** An app conversation as its owner sees it. turns is empty in listings and filled when one conversation is read. */
export interface AppConversationView {
  id: string; title?: string | null; turnCount: number; busy: boolean; lastRunId?: string | null;
  createdUtc: string; lastActivityUtc?: string | null; turns: AppTurnView[];
}

/** Answer to starting an app conversation. */
export interface AppConversationStart { conversationId: string; turn: AppTurnView; }

/**
 * One server-sent event of an app turn stream. turn.event carries a visible run event (its id is the event sequence);
 * turn.status and turn.completed carry the turn. turn.completed is the last event.
 */
export type AppTurnStreamEvent =
  | { event: "turn.event"; id?: string; data: RunEvent }
  | { event: "turn.status"; id?: string; data: AppTurnView }
  | { event: "turn.completed"; id?: string; data: AppTurnView };

/** One changed file in a files.changed event. */
export interface AppFileChange { path: string; version: number; deleted: boolean; sha256?: string | null; sizeBytes: number; }
/** A files.changed event of an app conversation. The first event of a stream lists every current file. */
export interface AppFilesChanged { conversationId: string; changed: AppFileChange[]; }

/** Options for {@link AppGatewayClient.streamTurn}. */
export interface AppTurnStreamOptions {
  /** Resume after this event id (a turn.event sequence) instead of from the start. */
  lastEventId?: string;
  /**
   * Reconnect attempts in a row without receiving an event before giving up. Default 5; 0 disables reconnecting;
   * Infinity reconnects until turn.completed, an HTTP error, or the abort signal.
   */
  maxReconnects?: number;
  /** Fixed delay before each reconnect, in milliseconds. When set, it replaces backoff. */
  reconnectDelayMs?: number;
  /** Exponential reconnect delays (default 500 ms doubling to 15 s). Ignored when reconnectDelayMs is set. */
  backoff?: BackoffOptions;
  /** Cancellation for this stream; defaults to the client's abortSignal. */
  signal?: AbortSignal;
}

/** Per-call options. */
export interface AppRequestOptions {
  /** Cancellation for this call; defaults to the client's abortSignal. An abort rejects with the AbortError. */
  signal?: AbortSignal;
}

/** The subset of the Web Storage API the client uses to keep a session (window.sessionStorage fits). */
export interface AppSessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Construction options for {@link AppGatewayClient}. */
export interface AppGatewayClientOptions {
  /** App URL name (required). */
  slug: string;
  /**
   * Server origin, for example https://garrison.example.com. Omitted: {@link DEFAULT_BASE_URL}. An empty string makes
   * every URL relative (/v1.0/apps/...), so a browser page talks to its own origin.
   */
  baseUrl?: string;
  /** fetch implementation; defaults to globalThis.fetch at call time. Tests pass a mock. */
  fetch?: (input: string, init?: RequestInit) => Promise<Response>;
  /**
   * Where to keep the session so it survives a reload, one entry per app (key: storageKeyPrefix + slug). Omitted or
   * null: memory only. In a browser pass window.sessionStorage (or {@link browserSessionStorage}). Storage failures
   * fall back to memory.
   */
  storage?: AppSessionStorage | null;
  /** Prefix of the storage key. Default {@link DEFAULT_SESSION_KEY_PREFIX}. */
  storageKeyPrefix?: string;
  /**
   * Called after a request that carried the session got 401: the session has already been dropped. Sign-in calls
   * (startSession), info, and logo never trigger it.
   */
  onUnauthorized?: (error: AppGatewayError) => void;
  /** Clock used for the session expiry check, in epoch milliseconds. Default Date.now. */
  now?: () => number;
  /** Cancellation for every request and stream that has no per-call signal. */
  abortSignal?: AbortSignal;
}

/**
 * An error from the app gateway. status (also statusCode) is the HTTP status, or 0 when the server could not be
 * reached (code NetworkError). code is the server's machine code, for example ConversationBusy, AppRateLimited,
 * AppSessionRequired, or InvalidCredentials. It extends {@link GarrisonError}, so existing catch blocks keep working.
 */
export class AppGatewayError extends GarrisonError {
  private readonly _code?: string;

  constructor(statusCode: number, body: string, code?: string, message?: string) {
    super(statusCode, body);
    this.name = "AppGatewayError";
    this._code = code;
    if (message) this.message = message;
    else if (statusCode > 0) this.message = this.error?.message || this.error?.error || code || this.error?.code || `HTTP ${statusCode}`;
  }

  /** HTTP status; 0 for a network failure. */
  get status(): number { return this.statusCode; }
  /** Machine code: NetworkError for a network failure, otherwise the server's code when it sent one. */
  override get code(): string | undefined { return this._code ?? super.code; }
}

/** window.sessionStorage when a browser provides it and allows access, otherwise null. */
export function browserSessionStorage(): AppSessionStorage | null {
  try {
    const g: any = globalThis as any;
    return g.sessionStorage ?? null;
  } catch {
    return null;
  }
}

function isAbort(error: unknown, signal?: AbortSignal): boolean {
  return !!signal?.aborted || (!!error && typeof error === "object" && (error as { name?: string }).name === "AbortError");
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) { reject(signal.reason ?? new Error("aborted")); return; }
    const onAbort = () => { clearTimeout(timer); reject(signal?.reason ?? new Error("aborted")); };
    const timer = setTimeout(() => { signal?.removeEventListener("abort", onAbort); resolve(); }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

interface SendOptions {
  query?: Record<string, any>;
  body?: unknown;
  headers?: Record<string, string>;
  /** Attach the session and treat 401 as a lost session. Default true. */
  auth?: boolean;
  signal?: AbortSignal;
}

/**
 * Client for an agentic app's end-user gateway at /v1.0/apps/{slug}/. It needs no management credentials: start a
 * session with an email and password, or anonymously when the app allows it, and the session token (prefix gas_) is
 * kept and sent as a bearer token. The token works only on this app's gateway and reaches only the conversations its
 * owner started (anything else is 404). Errors reject with {@link AppGatewayError} (a {@link GarrisonError}):
 * 401 InvalidCredentials, AppSignInRequired, AnonymousDisabled, or an expired session; 403 AppAccessDenied;
 * 409 AppNotDeployed, ConversationBusy, or AppRateLimited; status 0 NetworkError when the server cannot be reached.
 *
 * Construct with new AppGatewayClient(baseUrl, slug, options?) or new AppGatewayClient({ slug, baseUrl, ... }).
 * Not safe for concurrent session changes from several tabs sharing one storage; each tab has its own sessionStorage.
 */
export class AppGatewayClient {
  /** Server base URL without a trailing slash; empty for same-origin relative URLs. */
  readonly baseUrl: string;
  /** App URL name. */
  readonly slug: string;
  /** Optional cancellation for requests and streams that have no per-call signal. */
  abortSignal?: AbortSignal;
  /** Called after a session-bearing request got 401 and the session was dropped. */
  onUnauthorized?: (error: AppGatewayError) => void;

  private readonly _fetch?: (input: string, init?: RequestInit) => Promise<Response>;
  private readonly _storage: AppSessionStorage | null;
  private readonly _storageKey: string;
  private readonly _now: () => number;
  private _memory?: AppSessionResponse;

  constructor(options: AppGatewayClientOptions);
  constructor(baseUrl: string | undefined, slug: string, options?: Omit<AppGatewayClientOptions, "slug" | "baseUrl">);
  constructor(first: string | undefined | AppGatewayClientOptions, slug?: string, options?: Omit<AppGatewayClientOptions, "slug" | "baseUrl">) {
    const opts: AppGatewayClientOptions = typeof first === "object" && first !== null
      ? first
      : { ...(options ?? {}), slug: slug as string, baseUrl: first as string | undefined };
    if (!opts.slug) throw new Error("slug is required");
    this.slug = opts.slug;
    this.baseUrl = (opts.baseUrl === undefined || opts.baseUrl === null ? DEFAULT_BASE_URL : String(opts.baseUrl)).replace(/\/+$/, "");
    this._fetch = opts.fetch;
    this._storage = opts.storage ?? null;
    this._storageKey = (opts.storageKeyPrefix ?? DEFAULT_SESSION_KEY_PREFIX) + opts.slug;
    this._now = opts.now ?? (() => Date.now());
    this.onUnauthorized = opts.onUnauthorized;
    this.abortSignal = opts.abortSignal;
  }

  /** The app's route prefix, for example /v1.0/apps/demo. */
  get prefix(): string { return `/v1.0/apps/${seg(this.slug)}`; }

  /** Absolute (or, with an empty base URL, same-origin) URL for a path below the app prefix, with an optional query. */
  url(path = "", query?: Record<string, any>): string {
    const text = queryString(query);
    return `${this.baseUrl}${this.prefix}${path}${text ? `?${text}` : ""}`;
  }

  /**
   * The current session, or undefined when there is none or it has expired (an expired session is dropped). With
   * storage configured, the stored entry is the source of truth.
   */
  get session(): AppSessionResponse | undefined {
    let session = this._memory;
    if (this._storage) {
      try {
        const raw = this._storage.getItem(this._storageKey);
        session = undefined;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && typeof parsed.token === "string" && parsed.token) session = parsed as AppSessionResponse;
            else { this.clearSession(); return undefined; }
          } catch {
            this.clearSession();
            return undefined;
          }
        }
      } catch {
        session = this._memory;
      }
    }
    if (!session || !session.token) return undefined;
    if (session.expiresUtc && Date.parse(session.expiresUtc) <= this._now()) {
      this.clearSession();
      return undefined;
    }
    return session;
  }

  /** The session token, or undefined. Setting it replaces the session's token; setting undefined drops the session. */
  get token(): string | undefined { return this.session?.token; }
  set token(value: string | undefined) {
    if (!value) this.clearSession();
    else this.setSession({ ...(this.session ?? { expiresUtc: "", principalName: "", anonymous: false }), token: value });
  }

  /** Keep a session (in memory, and in storage when configured). */
  setSession(session: AppSessionResponse): void {
    this._memory = session;
    if (!this._storage) return;
    try { this._storage.setItem(this._storageKey, JSON.stringify(session)); } catch { /* memory keeps it */ }
  }

  /** Forget the session here (does not end it on the server; see endSession). */
  clearSession(): void {
    this._memory = undefined;
    if (!this._storage) return;
    try { this._storage.removeItem(this._storageKey); } catch { /* nothing stored */ }
  }

  private conversationPath(id: string, suffix = ""): string { return `/conversations/${seg(id)}${suffix}`; }

  private async sendRequest(method: string, path: string, options: SendOptions = {}): Promise<Response> {
    const auth = options.auth ?? true;
    const headers: Record<string, string> = { ...(options.headers ?? {}) };
    const token = auth ? this.token : undefined;
    if (token) headers["Authorization"] = `Bearer ${token}`;
    let body: string | undefined;
    if (options.body !== undefined) { body = JSON.stringify(options.body); headers["Content-Type"] = "application/json"; }
    const signal = options.signal ?? this.abortSignal;
    const fetchImpl = this._fetch ?? ((input: string, init?: RequestInit) => (globalThis as any).fetch(input, init) as Promise<Response>);
    let response: Response;
    try {
      response = await fetchImpl(this.url(path, options.query), { method, headers, body, signal });
    } catch (e) {
      if (isAbort(e, signal)) throw e;
      const message = e && typeof e === "object" && (e as Error).message ? (e as Error).message : "Network error";
      throw new AppGatewayError(0, "", "NetworkError", message);
    }
    if (!response.ok) {
      let text = "";
      try { text = await response.text(); } catch { text = ""; }
      const error = new AppGatewayError(response.status, text);
      if (response.status === 401 && auth) {
        this.clearSession();
        if (this.onUnauthorized) this.onUnauthorized(error);
      }
      throw error;
    }
    return response;
  }

  private async json<T>(method: string, path: string, options: SendOptions = {}): Promise<T> {
    const response = await this.sendRequest(method, path, { ...options, headers: { Accept: "application/json", ...(options.headers ?? {}) } });
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  /** Branding and how to sign in. Needs no session (none is sent). */
  info(options?: AppRequestOptions): Promise<AppInfo> { return this.json("GET", "", { auth: false, signal: options?.signal }); }

  /** Absolute URL of the app's logo image route (404 when the app has none). */
  logoUrl(): string;
  /** The logo URL from an info answer resolved against the base URL, or null when the app has no logo. */
  logoUrl(info: AppInfo | null | undefined): string | null;
  logoUrl(...args: [] | [AppInfo | null | undefined]): string | null {
    if (args.length === 0) return this.url("/logo");
    const info = args[0];
    if (!info || !info.logoUrl) return null;
    return /^https?:/i.test(info.logoUrl) ? info.logoUrl : `${this.baseUrl}${info.logoUrl}`;
  }

  /** The favicon URL from an info answer resolved against the base URL, or null when the app has no favicon or logo. */
  faviconUrl(info: AppInfo | null | undefined): string | null {
    if (!info || !info.faviconUrl) return null;
    return /^https?:/i.test(info.faviconUrl) ? info.faviconUrl : `${this.baseUrl}${info.faviconUrl}`;
  }

  /** The app's logo image bytes; rejects with 404 when the app has none. */
  async logo(options?: AppRequestOptions): Promise<Uint8Array> {
    return new Uint8Array(await (await this.sendRequest("GET", "/logo", { auth: false, signal: options?.signal })).arrayBuffer());
  }

  /**
   * Start a session with an email and password, or with no credentials for an anonymous session (only when the app's
   * authMode is Anonymous and anonymous use is enabled; the body is then {}). The session is kept for later calls,
   * and a failure leaves the previous session in place. A 401 here never calls onUnauthorized.
   */
  async startSession(credentials?: { email: string; password: string }, options?: AppRequestOptions): Promise<AppSessionResponse> {
    const body = credentials ? { email: credentials.email, password: credentials.password } : {};
    const session = await this.json<AppSessionResponse>("POST", "/session", { body, auth: false, signal: options?.signal });
    this.setSession(session);
    return session;
  }

  /**
   * End the session on the server and forget it here. The session is forgotten even when the server call fails; the
   * failure still rejects. Without a session, nothing is sent.
   */
  async endSession(options?: AppRequestOptions): Promise<void> {
    if (!this.token) { this.clearSession(); return; }
    try {
      await this.sendRequest("DELETE", "/session", { signal: options?.signal });
    } finally {
      this.clearSession();
    }
  }

  /** The session owner's conversations in the app. */
  async conversations(options?: AppRequestOptions): Promise<AppConversationView[]> {
    return (await this.json<AppConversationView[]>("GET", "/conversations", { signal: options?.signal })) ?? [];
  }
  /** Start a conversation with the app's entry agent on the live environment's entry deployment. */
  startConversation(message: string, options?: AppRequestOptions): Promise<AppConversationStart> {
    return this.json("POST", "/conversations", { body: { message }, signal: options?.signal });
  }
  /** One of the owner's conversations with its turns. */
  conversation(id: string, options?: AppRequestOptions): Promise<AppConversationView> {
    return this.json("GET", this.conversationPath(id), { signal: options?.signal });
  }
  /** Rename one of the owner's conversations (the title's first line, at most 200 characters); answers it without turns. */
  renameConversation(id: string, title: string, options?: AppRequestOptions): Promise<AppConversationView> {
    return this.json("PUT", this.conversationPath(id), { body: { title }, signal: options?.signal });
  }
  /** Delete one of the owner's conversations; rejects with 409 ConversationBusy while a turn runs. Its runs are kept. */
  async deleteConversation(id: string, options?: AppRequestOptions): Promise<void> {
    await this.sendRequest("DELETE", this.conversationPath(id), { signal: options?.signal });
  }
  /** Send the next message; rejects with 409 ConversationBusy while the previous turn runs, or 409 AppRateLimited. */
  send(id: string, message: string, options?: AppRequestOptions): Promise<AppTurnView> {
    return this.json("POST", this.conversationPath(id, "/messages"), { body: { message }, signal: options?.signal });
  }

  /**
   * URL of a turn's server-sent event stream for EventSource, which cannot send headers: the session goes in
   * ?session= and the resume point in ?afterSequence= (omitted at 0). See {@link openTurnStream}.
   */
  turnStreamUrl(id: string, runId: string, afterSequence = 0): string {
    return this.url(this.conversationPath(id, `/turns/${seg(runId)}/stream`), { session: this.token, afterSequence: afterSequence > 0 ? afterSequence : null });
  }

  /** URL of a conversation's files.changed stream for EventSource, with the session in ?session=. See {@link openFileStream}. */
  fileStreamUrl(id: string): string {
    return this.url(this.conversationPath(id, "/files/stream"), { session: this.token });
  }

  /**
   * Stream a turn's visible events with fetch until turn.completed, calling onEvent for each. When the connection
   * drops before then, it reconnects with backoff and resumes after the last event id it saw (Last-Event-ID); a
   * replayed turn.event at or below that sequence is dropped. Resolves with the completed turn. HTTP errors reject at
   * once; connection failures reject after options.maxReconnects attempts in a row (default 5; Infinity never gives up).
   */
  async streamTurn(id: string, runId: string, onEvent: (event: AppTurnStreamEvent) => void | Promise<void>, options: AppTurnStreamOptions = {}): Promise<AppTurnView> {
    const maxReconnects = options.maxReconnects ?? 5;
    const signal = options.signal ?? this.abortSignal;
    let lastEventId = options.lastEventId;
    let lastSequence = Number(lastEventId) || 0;
    let failures = 0;
    while (true) {
      let received = false;
      let failure: unknown = new Error("The turn stream closed before turn.completed.");
      try {
        const headers: Record<string, string> = { Accept: "text/event-stream" };
        if (lastEventId) headers["Last-Event-ID"] = lastEventId;
        const response = await this.sendRequest("GET", this.conversationPath(id, `/turns/${seg(runId)}/stream`), { headers, signal });
        if (response.body) {
          for await (const message of readServerSentEvents(response.body)) {
            received = true;
            if (message.event !== "turn.event" && message.event !== "turn.status" && message.event !== "turn.completed") continue;
            if (message.event === "turn.event" && message.id) {
              const sequence = Number(message.id);
              if (Number.isFinite(sequence) && sequence > 0) {
                if (sequence <= lastSequence) continue;
                lastSequence = sequence;
              }
            }
            if (message.id) lastEventId = message.id;
            const data = message.data ? JSON.parse(message.data) : undefined;
            await onEvent({ event: message.event, id: message.id, data } as AppTurnStreamEvent);
            if (message.event === "turn.completed") return data as AppTurnView;
          }
        }
      } catch (e) {
        if ((e instanceof GarrisonError && e.statusCode > 0) || isAbort(e, signal)) throw e;
        failure = e;
      }
      failures = received ? 1 : failures + 1;
      if (failures > maxReconnects) throw failure;
      const delay = options.reconnectDelayMs ?? backoffDelay(failures - 1, options.backoff);
      await sleep(delay, signal);
    }
  }

  /**
   * Poll the conversation until the turn with runId reaches a terminal status or timeoutMs elapses (default 120000);
   * resolves with the turn as it stands then. Rejects when the turn is not listed before the timeout.
   */
  async waitForTurn(id: string, runId: string, timeoutMs = 120000, pollMs = 500, options?: AppRequestOptions): Promise<AppTurnView> {
    const deadline = Date.now() + timeoutMs;
    while (true) {
      const view = await this.conversation(id, options);
      const turn = (view.turns ?? []).find((t) => t.runId === runId);
      if (turn && (TERMINAL_STATUSES.includes(turn.status) || Date.now() >= deadline)) return turn;
      if (Date.now() >= deadline) throw new Error(`Turn ${runId} was not listed in conversation ${id} before the timeout.`);
      await sleep(pollMs, options?.signal ?? this.abortSignal);
    }
  }

  /**
   * Stream files.changed events for the conversation with fetch (the first lists every current file), calling onEvent
   * for each. Resolves when onEvent returns false or the server closes the stream; an abort rejects.
   */
  async streamFiles(id: string, onEvent: (event: AppFilesChanged) => boolean | void | Promise<boolean | void>, options?: AppRequestOptions): Promise<void> {
    const response = await this.sendRequest("GET", this.conversationPath(id, "/files/stream"), { headers: { Accept: "text/event-stream" }, signal: options?.signal });
    if (!response.body) return;
    const reader = readServerSentEvents(response.body);
    try {
      for await (const message of reader) {
        if (message.event !== "files.changed" || !message.data) continue;
        if ((await onEvent(JSON.parse(message.data) as AppFilesChanged)) === false) return;
      }
    } finally {
      await reader.return(undefined);
      await response.body.cancel().catch(() => undefined);
    }
  }

  /** List the conversation's files. */
  files(id: string, options?: AppRequestOptions): Promise<FileSpaceListing> {
    return this.json("GET", this.conversationPath(id, "/files"), { signal: options?.signal });
  }
  /** Read a file's content (the current version, or the given version). */
  async readFile(id: string, path: string, version?: number, options?: AppRequestOptions): Promise<Uint8Array> {
    return new Uint8Array(await (await this.sendRequest("GET", this.conversationPath(id, "/files/content"), { query: { path, version }, signal: options?.signal })).arrayBuffer());
  }
  /** Read a file's content as a Blob with the server's media type (for browser downloads). */
  async readFileBlob(id: string, path: string, version?: number, options?: AppRequestOptions): Promise<Blob> {
    return (await this.sendRequest("GET", this.conversationPath(id, "/files/content"), { query: { path, version }, signal: options?.signal })).blob();
  }
  /** A file's versions, newest first. */
  fileVersions(id: string, path: string, options?: AppRequestOptions): Promise<ConversationFileVersion[]> {
    return this.json("GET", this.conversationPath(id, "/files/versions"), { query: { path }, signal: options?.signal });
  }
  /** A short-lived download URL for a file (the current version, or the given version) that needs no credentials. */
  downloadUrl(id: string, path: string, version?: number, options?: AppRequestOptions): Promise<FileDownloadUrl> {
    return this.json("POST", this.conversationPath(id, "/files/download-url"), { query: { path, version }, signal: options?.signal });
  }
}
