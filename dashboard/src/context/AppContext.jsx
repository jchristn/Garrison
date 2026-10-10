import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { STORAGE_KEYS } from '../utils/constants';

const AppContext = createContext(null);

/**
 * Application state beyond authentication: the active tenant (system administrators can switch), the tenant list
 * for the switcher, sidebar collapse, and setup wizard and tour visibility.
 */
export function AppProvider({ children }) {
  const { apiClient, principal } = useAuth();
  const [tenantOverride, setTenantOverride] = useState(() => localStorage.getItem(STORAGE_KEYS.tenant) || '');
  const [tenants, setTenants] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(STORAGE_KEYS.sidebarCollapsed) === 'true');
  const [wizardOpen, setWizardOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);

  const isSystemAdmin = !!principal?.isAdmin;
  const tenantId = (isSystemAdmin && tenantOverride) || principal?.tenantId || tenantOverride || 'default';

  useEffect(() => {
    if (!apiClient || !isSystemAdmin) return;
    apiClient
      .listTenants({ pageNumber: 1, pageSize: 1000 })
      .then((r) => setTenants(r.items || []))
      .catch(() => setTenants([]));
  }, [apiClient, isSystemAdmin]);

  const setTenantId = useCallback((id) => {
    setTenantOverride(id);
    if (id) localStorage.setItem(STORAGE_KEYS.tenant, id);
    else localStorage.removeItem(STORAGE_KEYS.tenant);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((v) => {
      localStorage.setItem(STORAGE_KEYS.sidebarCollapsed, String(!v));
      return !v;
    });
  }, []);

  const value = useMemo(
    () => ({
      tenantId,
      setTenantId,
      tenants,
      isSystemAdmin,
      sidebarCollapsed,
      toggleSidebar,
      wizardOpen,
      setWizardOpen,
      tourOpen,
      setTourOpen
    }),
    [tenantId, setTenantId, tenants, isSystemAdmin, sidebarCollapsed, toggleSidebar, wizardOpen, tourOpen]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}

export default AppContext;
