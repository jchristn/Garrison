import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ApiClient from '../utils/api';
import { STORAGE_KEYS, customServerAllowed, defaultServerUrl, resolveServerUrl } from '../utils/constants';

const AuthContext = createContext(null);

/**
 * Authentication and session provider. Owns the ApiClient, server URL, token, the resolved principal (from
 * GET /v1.0/token/details), and the theme. Restores a saved session on load. The server is always resolveServerUrl():
 * the configured API URL or the page origin, or a remembered override only while the override is available, so a
 * stale remembered URL can never redirect the session.
 */
export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [apiClient, setApiClient] = useState(null);
  const [serverUrl, setServerUrl] = useState('');
  const [token, setToken] = useState('');
  const [principal, setPrincipal] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem(STORAGE_KEYS.theme) || 'light');

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedUrl = resolveServerUrl();
    const savedToken = localStorage.getItem(STORAGE_KEYS.token);
    if (!savedToken) {
      setIsLoading(false);
      return;
    }
    const client = new ApiClient(savedUrl, savedToken);
    client
      .getTokenDetails()
      .then((p) => {
        if (!p) throw new Error('invalid');
        setServerUrl(savedUrl);
        setToken(savedToken);
        setApiClient(client);
        setPrincipal(p);
        setIsAuthenticated(true);
      })
      .catch(() => {
        localStorage.removeItem(STORAGE_KEYS.token);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const logout = useCallback(() => {
    if (apiClient) apiClient.revokeToken().catch(() => {});
    localStorage.removeItem(STORAGE_KEYS.token);
    setToken('');
    setApiClient(null);
    setPrincipal(null);
    setIsAuthenticated(false);
  }, [apiClient]);

  useEffect(() => {
    const handler = () => logout();
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [logout]);

  /**
   * Log in. mode 'password' uses { tenantId, email, password }; mode 'key' uses { accessKey, secretKey }. url is the
   * server typed on the sign-in page; it is used only while the override is available (customServerAllowed()), and
   * the default server is used otherwise.
   */
  const login = useCallback(async (url, mode, creds) => {
    const base = ((customServerAllowed() && url) || defaultServerUrl()).replace(/\/$/, '');
    const temp = new ApiClient(base, null);
    const result =
      mode === 'password'
        ? await temp.loginWithPassword(creds.tenantId, creds.email, creds.password)
        : await temp.loginWithKey(creds.accessKey, creds.secretKey);
    const newToken = result?.token;
    if (!newToken) throw new Error('No token returned');

    const client = new ApiClient(base, newToken);
    const p = await client.getTokenDetails();

    // Remember the server only when it is an override the person may choose again; otherwise drop any old entry.
    if (customServerAllowed() && base !== defaultServerUrl()) localStorage.setItem(STORAGE_KEYS.serverUrl, base);
    else localStorage.removeItem(STORAGE_KEYS.serverUrl);
    localStorage.setItem(STORAGE_KEYS.token, newToken);
    setServerUrl(base);
    setToken(newToken);
    setApiClient(client);
    setPrincipal(p);
    setIsAuthenticated(true);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEYS.theme, next);
      return next;
    });
  }, []);

  const value = { isAuthenticated, isLoading, apiClient, serverUrl, token, principal, theme, login, logout, toggleTheme };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;
