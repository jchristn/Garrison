// Client for the app gateway (/v1.0/apps/{slug}/...).
//
// The session token (gas_...) is kept in sessionStorage, one per tab and per app, and sent as
// Authorization: Bearer <token>. EventSource cannot send headers, so stream URLs carry it as ?session=<token>.
// Any 401 from a route that needs a session drops the token and calls onUnauthorized, which sends the user back to
// sign-in. Errors are GatewayError with the server's status, code (for example ConversationBusy), and message.

import { STORAGE_KEYS, readStorage, writeStorage } from '../utils/storage.js';

/** An error response from the gateway, or a network failure (status 0, code NetworkError). */
export class GatewayError extends Error {
  constructor(status, code, message, body = null) {
    super(message || code || `HTTP ${status}`);
    this.name = 'GatewayError';
    this.status = status;
    this.code = code || null;
    this.body = body;
  }
}

/** The API origin from the runtime configuration (/apps/config.js); empty means this origin. */
export function configuredBaseUrl() {
  const cfg = typeof window !== 'undefined' ? window.GARRISON_CONFIG : null;
  return String((cfg && cfg.apiUrl) || '').replace(/\/+$/, '');
}

function sessionKey(slug) {
  return `${STORAGE_KEYS.sessionPrefix}${slug}`;
}

/** Build a query string from an object, skipping null, undefined, and empty values. */
export function queryString(query) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query || {})) {
    if (value === null || value === undefined || value === '') continue;
    params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

export class GatewayClient {
  /**
   * @param {object} options
   * @param {string} options.slug App slug from the URL.
   * @param {string} [options.baseUrl] API origin; defaults to the runtime configuration (same origin when empty).
   * @param {Function} [options.fetchImpl] fetch implementation (tests pass a mock).
   * @param {Function} [options.onUnauthorized] Called with the GatewayError after a 401 dropped the session.
   * @param {Function} [options.now] Clock for session expiry, in milliseconds.
   */
  constructor({ slug, baseUrl, fetchImpl, onUnauthorized, now } = {}) {
    if (!slug) throw new Error('slug is required');
    this.slug = slug;
    this.baseUrl = (baseUrl === undefined ? configuredBaseUrl() : String(baseUrl)).replace(/\/+$/, '');
    this.fetchImpl = fetchImpl || ((...args) => window.fetch(...args));
    this.onUnauthorized = onUnauthorized || null;
    this.now = now || (() => Date.now());
  }

  /** The app's route prefix, for example /v1.0/apps/demo. */
  get prefix() {
    return `/v1.0/apps/${encodeURIComponent(this.slug)}`;
  }

  /** Absolute or same-origin URL for a gateway path below the app prefix. */
  url(path = '', query) {
    return `${this.baseUrl}${this.prefix}${path}${queryString(query)}`;
  }

  /** The stored session ({ token, expiresUtc, principalName, anonymous }) or null when absent or expired. */
  session() {
    const raw = readStorage(sessionKey(this.slug), 'session');
    if (!raw) return null;
    try {
      const session = JSON.parse(raw);
      if (!session || typeof session.token !== 'string' || !session.token) return null;
      if (session.expiresUtc && Date.parse(session.expiresUtc) <= this.now()) {
        this.clearSession();
        return null;
      }
      return session;
    } catch {
      this.clearSession();
      return null;
    }
  }

  /** The session token, or null. */
  get token() {
    const s = this.session();
    return s ? s.token : null;
  }

  setSession(session) {
    writeStorage(sessionKey(this.slug), JSON.stringify(session), 'session');
  }

  clearSession() {
    writeStorage(sessionKey(this.slug), null, 'session');
  }

  /**
   * Send a request. auth: attach the session and treat 401 as a lost session. raw: return the Response.
   * Throws GatewayError for non-2xx responses and for network failures (status 0).
   */
  async request(method, path, { body, query, auth = true, raw = false, signal } = {}) {
    const headers = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    const token = auth ? this.token : null;
    if (token) headers.Authorization = `Bearer ${token}`;
    let res;
    try {
      res = await this.fetchImpl(this.url(path, query), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal
      });
    } catch (err) {
      if (err && err.name === 'AbortError') throw err;
      throw new GatewayError(0, 'NetworkError', err && err.message ? err.message : 'Network error');
    }
    if (!res.ok) {
      let payload = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }
      const error = new GatewayError(res.status, payload && payload.code, payload && (payload.message || payload.error), payload);
      if (res.status === 401 && auth) {
        this.clearSession();
        if (this.onUnauthorized) this.onUnauthorized(error);
      }
      throw error;
    }
    if (raw) return res;
    if (res.status === 204) return null;
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  /** Branding and sign-in options (no session needed). */
  info(options) {
    return this.request('GET', '', { auth: false, ...options });
  }

  /** Absolute URL of the app's logo, or null when the app has none. */
  logoUrl(info) {
    if (!info || !info.logoUrl) return null;
    return /^https?:/i.test(info.logoUrl) ? info.logoUrl : `${this.baseUrl}${info.logoUrl}`;
  }

  /** Sign in with an email and password; stores and returns the session. */
  async signIn(email, password) {
    const session = await this.request('POST', '/session', { body: { email, password }, auth: false });
    this.setSession(session);
    return session;
  }

  /** Start an anonymous session (only when the app allows it); stores and returns the session. */
  async continueAnonymously() {
    const session = await this.request('POST', '/session', { body: {}, auth: false });
    this.setSession(session);
    return session;
  }

  /** End the session on the server (best effort) and forget it here. */
  async signOut() {
    const token = this.token;
    try {
      if (token) await this.request('DELETE', '/session', { auth: true });
    } catch {
      // The token is dropped below either way.
    } finally {
      this.clearSession();
    }
  }

  conversations(options) {
    return this.request('GET', '/conversations', options);
  }

  /** Start a conversation with the first message. Returns { conversationId, turn }. */
  startConversation(message) {
    return this.request('POST', '/conversations', { body: { message } });
  }

  /** One conversation with its turns. */
  conversation(id, options) {
    return this.request('GET', `/conversations/${encodeURIComponent(id)}`, options);
  }

  /** Send the next message. Returns the new turn. 409 ConversationBusy or AppRateLimited are GatewayErrors. */
  sendMessage(id, message) {
    return this.request('POST', `/conversations/${encodeURIComponent(id)}/messages`, { body: { message } });
  }

  /** Server-sent events for one turn, resuming after afterSequence. */
  turnStreamUrl(id, runId, afterSequence = 0) {
    return this.url(`/conversations/${encodeURIComponent(id)}/turns/${encodeURIComponent(runId)}/stream`, {
      session: this.token,
      afterSequence: afterSequence > 0 ? afterSequence : null
    });
  }

  files(id, options) {
    return this.request('GET', `/conversations/${encodeURIComponent(id)}/files`, options);
  }

  /** A file's versions, newest first. */
  fileVersions(id, path, options) {
    return this.request('GET', `/conversations/${encodeURIComponent(id)}/files/versions`, { query: { path }, ...options });
  }

  /** A file's bytes as a Blob (current version unless version is given). */
  async fileContent(id, path, version) {
    const res = await this.request('GET', `/conversations/${encodeURIComponent(id)}/files/content`, { query: { path, version }, raw: true });
    return res.blob();
  }

  /** A short-lived absolute download URL that needs no credentials. Returns { url, expiresUtc }. */
  downloadUrl(id, path, version) {
    return this.request('POST', `/conversations/${encodeURIComponent(id)}/files/download-url`, { query: { path, version } });
  }

  /** Server-sent files.changed events for a conversation. */
  fileStreamUrl(id) {
    return this.url(`/conversations/${encodeURIComponent(id)}/files/stream`, { session: this.token });
  }
}

export default GatewayClient;
