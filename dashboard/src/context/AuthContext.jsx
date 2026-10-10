import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import ApiClient from '../utils/api';
import { STORAGE_KEYS } from '../utils/constants';

const AuthContext = createContext(null);

/**
 * Authentication and session provider. Owns the ApiClient, server URL, token, the resolved principal (from
 * GET /v1.0/token/details), and the theme. Restores a saved session on load.
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
    const savedUrl = localStorage.getItem(STORAGE_KEYS.serverUrl);
    const savedToken = localStorage.getItem(STORAGE_KEYS.token);
    if (!savedUrl || !savedToken) {
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
   * Log in. mode 'password' uses { tenantId, email, password }; mode 'key' uses { accessKey, secretKey }.
   */
  const login = useCallback(async (url, mode, creds) => {
    const base = (url || '').replace(/\/$/, '');
    const temp = new ApiClient(base, null);
    const result =
      mode === 'password'
        ? await temp.loginWithPassword(creds.tenantId, creds.email, creds.password)
        : await temp.loginWithKey(creds.accessKey, creds.secretKey);
    const newToken = result?.token;
    if (!newToken) throw new Error('No token returned');

    const client = new ApiClient(base, newToken);
    const p = await client.getTokenDetails();

    localStorage.setItem(STORAGE_KEYS.serverUrl, base);
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
