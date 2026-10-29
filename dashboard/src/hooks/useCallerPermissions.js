import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { loadCallerPermissions } from '../utils/apps';

/**
 * The signed-in caller's effective permissions for `holds` (GET users/{id}/permissions; administrators skip the call),
 * or null while loading or when they cannot be read, so nothing is disabled by mistake and the server decides.
 */
export default function useCallerPermissions() {
  const { apiClient, principal } = useAuth();
  const { tenantId } = useApp();
  const [permissions, setPermissions] = useState(null);
  useEffect(() => {
    let cancelled = false;
    loadCallerPermissions(apiClient, tenantId, principal)
      .then((p) => !cancelled && setPermissions(p))
      .catch(() => !cancelled && setPermissions(null));
    return () => {
      cancelled = true;
    };
  }, [apiClient, tenantId, principal]);
  return permissions;
}
