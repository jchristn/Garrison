// The app gateway client (/v1.0/apps/{slug}/...) comes from the JavaScript SDK's browser entry point,
// @garrison/sdk/gateway (sdk/js/src/gateway.ts). This file only applies the app UI's settings to it:
//   - the API origin from the runtime configuration (/apps/config.js); empty means this origin;
//   - the session token (gas_...) kept in sessionStorage, one per tab and per app, under garrison.app.session.{slug};
//   - onUnauthorized, called after a 401 dropped the session, which sends the user back to sign-in.
// Requests send the session as Authorization: Bearer <token>; EventSource cannot send headers, so stream URLs carry it
// as ?session=<token>. Errors are AppGatewayError with the server's status (0 for a network failure, code
// NetworkError), code (for example ConversationBusy), and message.

import { AppGatewayClient, browserSessionStorage } from '@garrison/sdk/gateway';
import { STORAGE_KEYS } from '../utils/storage.js';

export { AppGatewayClient, AppGatewayError, openFileStream, openTurnStream } from '@garrison/sdk/gateway';

/** The API origin from the runtime configuration (/apps/config.js); empty means this origin. */
export function configuredBaseUrl() {
  const cfg = typeof window !== 'undefined' ? window.GARRISON_CONFIG : null;
  return String((cfg && cfg.apiUrl) || '').replace(/\/+$/, '');
}

/**
 * A gateway client for one app.
 * @param {object} options
 * @param {string} options.slug App slug from the URL.
 * @param {string} [options.baseUrl] API origin; defaults to the runtime configuration (same origin when empty).
 * @param {Function} [options.fetchImpl] fetch implementation (tests pass a mock); defaults to window.fetch.
 * @param {Function} [options.onUnauthorized] Called with the AppGatewayError after a 401 dropped the session.
 * @param {Function} [options.now] Clock for session expiry, in milliseconds.
 */
export function createGatewayClient({ slug, baseUrl, fetchImpl, onUnauthorized, now } = {}) {
  return new AppGatewayClient({
    slug,
    baseUrl: baseUrl === undefined ? configuredBaseUrl() : String(baseUrl),
    fetch: fetchImpl,
    storage: browserSessionStorage(),
    storageKeyPrefix: STORAGE_KEYS.sessionPrefix,
    onUnauthorized,
    now
  });
}
