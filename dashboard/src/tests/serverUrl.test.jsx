// Which server the console signs in to: the configured API URL or the page origin, the "Use a different server"
// override (only in a development build or with allowCustomServer from /config.js), stale remembered URLs, the
// read-only server in the sign-in footer, and Server in use on System > About.
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import i18n from '../i18n';
import AuthContext, { AuthProvider } from '../context/AuthContext';
import Login from '../components/Login';
import ServerInfoView from '../views/ServerInfoView';
import { STORAGE_KEYS, customServerAllowed, defaultServerUrl, isHttpUrl, resolveServerUrl, storedServerUrl } from '../utils/constants';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const OTHER = 'http://127.0.0.1:9700';
const flush = () =>
  act(async () => {
    await new Promise((r) => setTimeout(r, 0));
  });
const q = (sel) => document.body.querySelector(sel);

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

let mounted = [];
beforeEach(() => {
  window.GARRISON_CONFIG = { apiUrl: '', allowCustomServer: false };
  localStorage.clear();
});
afterEach(() => {
  for (const { root, container } of mounted) {
    act(() => root.unmount());
    container.remove();
  }
  mounted = [];
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  window.GARRISON_CONFIG = { apiUrl: '', allowCustomServer: false };
  localStorage.clear();
});

function mount(element) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(<MemoryRouter>{element}</MemoryRouter>);
  });
  mounted.push({ root, container });
  return container;
}

function type(el, value) {
  act(() => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

function click(el) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

/** A fetch stub that answers sign-in and token details and records every URL it was called with. */
function stubFetch() {
  const calls = [];
  const fetchStub = vi.fn(async (url) => {
    calls.push(String(url));
    const body = String(url).endsWith('/v1.0/token/details') ? { principalName: 'admin@garrison', tenantId: 'default', isAdmin: true } : { token: 'tok_1' };
    return new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });
  });
  vi.stubGlobal('fetch', fetchStub);
  return calls;
}

async function signIn() {
  type(q('#password'), 'password');
  await act(async () => {
    q('form.login-form').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
  await flush();
}

describe('server URL helpers', () => {
  it('uses the configured API URL, else the page origin', () => {
    window.GARRISON_CONFIG = { apiUrl: 'https://api.example.com/' };
    expect(defaultServerUrl()).toBe('https://api.example.com');
    window.GARRISON_CONFIG = { apiUrl: '' };
    expect(defaultServerUrl()).toBe(window.location.origin);
  });

  it('allows the override in a development build, or when /config.js says so', () => {
    expect(customServerAllowed(true)).toBe(true);
    expect(customServerAllowed(false)).toBe(false);
    window.GARRISON_CONFIG = { apiUrl: '', allowCustomServer: true };
    expect(customServerAllowed(false)).toBe(true);
    window.GARRISON_CONFIG = { apiUrl: '', allowCustomServer: 'true' };
    expect(customServerAllowed(false)).toBe(false);
  });

  it('ignores and removes a remembered URL when the override is not available', () => {
    localStorage.setItem(STORAGE_KEYS.serverUrl, OTHER);
    expect(storedServerUrl(false)).toBe('');
    expect(localStorage.getItem(STORAGE_KEYS.serverUrl)).toBeNull();
    localStorage.setItem(STORAGE_KEYS.serverUrl, OTHER);
    expect(resolveServerUrl(false)).toBe(window.location.origin);
  });

  it('keeps a remembered URL while the override is available, and drops one that is not http', () => {
    window.GARRISON_CONFIG = { apiUrl: '', allowCustomServer: true };
    localStorage.setItem(STORAGE_KEYS.serverUrl, `${OTHER}/`);
    expect(resolveServerUrl(false)).toBe(OTHER);
    localStorage.setItem(STORAGE_KEYS.serverUrl, 'javascript:alert(1)');
    expect(storedServerUrl(false)).toBe('');
    expect(localStorage.getItem(STORAGE_KEYS.serverUrl)).toBeNull();
    expect(isHttpUrl('https://x.example')).toBe(true);
    expect(isHttpUrl('ftp://x.example')).toBe(false);
  });
});

describe('sign-in page', () => {
  it('has no server field or override link by default and signs in to the page origin', async () => {
    vi.stubEnv('DEV', false);
    localStorage.setItem(STORAGE_KEYS.serverUrl, OTHER);
    const calls = stubFetch();
    mount(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );
    await flush();
    expect(q('#serverUrl')).toBeNull();
    expect(q('[data-testid="login-use-different-server"]')).toBeNull();
    expect(q('[data-testid="login-server"]').textContent).toContain(window.location.origin);
    expect(localStorage.getItem(STORAGE_KEYS.serverUrl)).toBeNull();
    await signIn();
    expect(calls.length).toBeGreaterThan(0);
    for (const url of calls) expect(url.startsWith(`${window.location.origin}/v1.0/`)).toBe(true);
    expect(localStorage.getItem(STORAGE_KEYS.serverUrl)).toBeNull();
  });

  it('restores a session against the default server, not a stale remembered one', async () => {
    vi.stubEnv('DEV', false);
    localStorage.setItem(STORAGE_KEYS.serverUrl, OTHER);
    localStorage.setItem(STORAGE_KEYS.token, 'tok_old');
    const calls = stubFetch();
    mount(
      <AuthProvider>
        <span />
      </AuthProvider>
    );
    await flush();
    expect(calls).toEqual([`${window.location.origin}/v1.0/token/details`]);
  });

  it('with allowCustomServer, the link reveals the field and the typed server is used and remembered', async () => {
    vi.stubEnv('DEV', false);
    window.GARRISON_CONFIG = { apiUrl: '', allowCustomServer: true };
    const calls = stubFetch();
    mount(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );
    expect(q('#serverUrl')).toBeNull();
    click(q('[data-testid="login-use-different-server"]'));
    expect(q('#serverUrl').value).toBe(window.location.origin);
    type(q('#serverUrl'), `${OTHER}/`);
    expect(q('[data-testid="login-server"]').textContent).toContain(OTHER);
    await signIn();
    expect(calls[0]).toBe(`${OTHER}/v1.0/token`);
    expect(localStorage.getItem(STORAGE_KEYS.serverUrl)).toBe(OTHER);
  });

  it('Use the default server hides the field again', () => {
    vi.stubEnv('DEV', false);
    window.GARRISON_CONFIG = { apiUrl: '', allowCustomServer: true };
    localStorage.setItem(STORAGE_KEYS.serverUrl, OTHER);
    mount(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );
    expect(q('#serverUrl').value).toBe(OTHER);
    click(q('[data-testid="login-use-default-server"]'));
    expect(q('#serverUrl')).toBeNull();
    expect(q('[data-testid="login-server"]').textContent).toContain(window.location.origin);
  });

  it('always offers the override in a development build', () => {
    vi.stubEnv('DEV', true);
    mount(
      <AuthProvider>
        <Login />
      </AuthProvider>
    );
    expect(q('[data-testid="login-use-different-server"]')).not.toBeNull();
  });
});

describe('System > About', () => {
  it('shows the server in use', async () => {
    const apiClient = { getServerInfo: () => Promise.resolve({ version: '0.2.0' }), healthCheck: () => Promise.resolve({ status: 'healthy' }) };
    mount(
      <AuthContext.Provider value={{ apiClient, serverUrl: 'https://garrison.example.com', principal: { tenantId: 'default' } }}>
        <ServerInfoView />
      </AuthContext.Provider>
    );
    await flush();
    expect(q('[data-testid="about-server-in-use"]').textContent).toBe('https://garrison.example.com');
    expect(document.body.textContent).toContain('Server in use');
  });
});
