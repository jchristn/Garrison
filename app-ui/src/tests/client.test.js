import { describe, it, expect, beforeEach, vi } from 'vitest';
import GatewayClient, { GatewayError, queryString } from '../api/client.js';
import { mockFetch } from './fakes.js';

const SESSION = { token: 'gas_abc', expiresUtc: '2099-01-01T00:00:00Z', principalName: 'ana@example.com', anonymous: false };

beforeEach(() => {
  sessionStorage.clear();
  window.GARRISON_CONFIG = { apiUrl: '' };
});

describe('GatewayClient', () => {
  it('builds app-scoped URLs from the configured API origin', () => {
    window.GARRISON_CONFIG = { apiUrl: 'https://api.example.com/' };
    const client = new GatewayClient({ slug: 'demo', fetchImpl: mockFetch({}) });
    expect(client.url('/conversations')).toBe('https://api.example.com/v1.0/apps/demo/conversations');
    expect(new GatewayClient({ slug: 'demo', baseUrl: '' }).url('', { a: 1, b: null, c: '' })).toBe('/v1.0/apps/demo?a=1');
    expect(queryString({ path: 'out/a b.txt', version: 2 })).toBe('?path=out%2Fa+b.txt&version=2');
  });

  it('signs in, stores the session per tab and per app, and sends it as a bearer token', async () => {
    const fetchImpl = mockFetch({ 'POST /v1.0/apps/demo/session': [201, SESSION], 'GET /v1.0/apps/demo/conversations': [] });
    const client = new GatewayClient({ slug: 'demo', fetchImpl });
    await client.signIn('ana@example.com', 'pw');
    expect(fetchImpl.calls[0].body).toEqual({ email: 'ana@example.com', password: 'pw' });
    expect(fetchImpl.calls[0].init.headers.Authorization).toBeUndefined();
    expect(JSON.parse(sessionStorage.getItem('garrison.app.session.demo')).token).toBe('gas_abc');
    expect(new GatewayClient({ slug: 'other', fetchImpl }).session()).toBeNull();
    await client.conversations();
    expect(fetchImpl.calls[1].init.headers.Authorization).toBe('Bearer gas_abc');
  });

  it('starts an anonymous session with an empty body', async () => {
    const fetchImpl = mockFetch({ 'POST /v1.0/apps/demo/session': [201, { ...SESSION, anonymous: true, principalName: 'anonymous' }] });
    const client = new GatewayClient({ slug: 'demo', fetchImpl });
    const session = await client.continueAnonymously();
    expect(fetchImpl.calls[0].body).toEqual({});
    expect(session.anonymous).toBe(true);
  });

  it('drops an expired session', () => {
    const client = new GatewayClient({ slug: 'demo', fetchImpl: mockFetch({}), now: () => Date.parse('2030-01-01T00:00:00Z') });
    client.setSession({ ...SESSION, expiresUtc: '2029-12-31T23:59:59Z' });
    expect(client.session()).toBeNull();
    expect(sessionStorage.getItem('garrison.app.session.demo')).toBeNull();
  });

  it('turns a 401 into a lost session and calls onUnauthorized', async () => {
    const onUnauthorized = vi.fn();
    const fetchImpl = mockFetch({ 'GET /v1.0/apps/demo/conversations': [401, { error: 'Unauthorized', code: 'AppSessionRequired', message: 'The app session ended.' }] });
    const client = new GatewayClient({ slug: 'demo', fetchImpl, onUnauthorized });
    client.setSession(SESSION);
    await expect(client.conversations()).rejects.toMatchObject({ status: 401, code: 'AppSessionRequired' });
    expect(client.session()).toBeNull();
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
    expect(onUnauthorized.mock.calls[0][0]).toBeInstanceOf(GatewayError);
  });

  it('does not treat a failed sign-in as a lost session', async () => {
    const onUnauthorized = vi.fn();
    const fetchImpl = mockFetch({ 'POST /v1.0/apps/demo/session': [401, { code: 'InvalidCredentials', message: 'The email or password is not correct.' }] });
    const client = new GatewayClient({ slug: 'demo', fetchImpl, onUnauthorized });
    await expect(client.signIn('a@b.c', 'x')).rejects.toMatchObject({ status: 401, code: 'InvalidCredentials' });
    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('reports busy and rate-limited sends with their codes', async () => {
    const fetchImpl = mockFetch({
      'POST /v1.0/apps/demo/conversations/cnv_1/messages': [409, { code: 'ConversationBusy', message: 'busy' }],
      'POST /v1.0/apps/demo/conversations/cnv_2/messages': [409, { code: 'AppRateLimited', message: 'slow down' }]
    });
    const client = new GatewayClient({ slug: 'demo', fetchImpl });
    client.setSession(SESSION);
    await expect(client.sendMessage('cnv_1', 'hi')).rejects.toMatchObject({ status: 409, code: 'ConversationBusy' });
    await expect(client.sendMessage('cnv_2', 'hi')).rejects.toMatchObject({ status: 409, code: 'AppRateLimited' });
    expect(client.session()).not.toBeNull();
  });

  it('reports a network failure as status 0', async () => {
    const client = new GatewayClient({ slug: 'demo', fetchImpl: async () => { throw new TypeError('Failed to fetch'); } });
    await expect(client.info()).rejects.toMatchObject({ status: 0, code: 'NetworkError' });
  });

  it('signs out on the server and forgets the token even when the server call fails', async () => {
    const fetchImpl = mockFetch({ 'DELETE /v1.0/apps/demo/session': [500, { code: 'Boom' }] });
    const client = new GatewayClient({ slug: 'demo', fetchImpl });
    client.setSession(SESSION);
    await client.signOut();
    expect(fetchImpl.calls[0].method).toBe('DELETE');
    expect(fetchImpl.calls[0].init.headers.Authorization).toBe('Bearer gas_abc');
    expect(client.session()).toBeNull();
  });

  it('puts the session and resume point in stream URLs', () => {
    const client = new GatewayClient({ slug: 'demo', baseUrl: '' });
    client.setSession(SESSION);
    expect(client.turnStreamUrl('cnv_1', 'run_1')).toBe('/v1.0/apps/demo/conversations/cnv_1/turns/run_1/stream?session=gas_abc');
    expect(client.turnStreamUrl('cnv_1', 'run_1', 7)).toBe('/v1.0/apps/demo/conversations/cnv_1/turns/run_1/stream?session=gas_abc&afterSequence=7');
    expect(client.fileStreamUrl('cnv_1')).toBe('/v1.0/apps/demo/conversations/cnv_1/files/stream?session=gas_abc');
  });

  it('builds the file routes with path and version', async () => {
    const fetchImpl = mockFetch({
      'GET /v1.0/apps/demo/conversations/cnv_1/files': { fileCount: 0, totalBytes: 0, files: [] },
      'GET /v1.0/apps/demo/conversations/cnv_1/files/versions': [],
      'POST /v1.0/apps/demo/conversations/cnv_1/files/download-url': { url: 'https://x/d', expiresUtc: '2099-01-01T00:00:00Z' }
    });
    const client = new GatewayClient({ slug: 'demo', fetchImpl, baseUrl: '' });
    client.setSession(SESSION);
    await client.files('cnv_1');
    await client.fileVersions('cnv_1', 'out/report.md');
    const link = await client.downloadUrl('cnv_1', 'out/report.md', 2);
    expect(fetchImpl.calls[1].url).toBe('/v1.0/apps/demo/conversations/cnv_1/files/versions?path=out%2Freport.md');
    expect(fetchImpl.calls[2].url).toBe('/v1.0/apps/demo/conversations/cnv_1/files/download-url?path=out%2Freport.md&version=2');
    expect(link.url).toBe('https://x/d');
  });

  it('resolves the logo URL against the API origin', () => {
    const client = new GatewayClient({ slug: 'demo', baseUrl: 'https://api.example.com' });
    expect(client.logoUrl({ logoUrl: '/v1.0/apps/demo/logo' })).toBe('https://api.example.com/v1.0/apps/demo/logo');
    expect(client.logoUrl({})).toBeNull();
  });
});
