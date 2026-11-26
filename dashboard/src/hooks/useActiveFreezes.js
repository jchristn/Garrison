import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { FREEZES_CHANGED_EVENT } from '../utils/freezes';

const POLL_MS = 30000;

/**
 * The tenant's active freezes (AA3), re-read every 30 seconds and whenever a freeze or the kill switch changes on this
 * page or over the freezes channel. `readable` turns false for good when the caller may not read freezes (403) or the
 * server has no freeze routes (404); then `freezes` stays empty and nothing is shown.
 */
export default function useActiveFreezes() {
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [freezes, setFreezes] = useState([]);
  const [readable, setReadable] = useState(true);

  const reload = useCallback(() => {
    if (!apiClient?.listFreezes || !tenantId || !readable) return;
    apiClient
      .listFreezes(tenantId, { active: true, pageNumber: 1, pageSize: 1000 })
      .then((page) => setFreezes(page.items || []))
      .catch((e) => {
        if (e?.status === 403 || e?.status === 404) setReadable(false);
        setFreezes([]);
      });
  }, [apiClient, tenantId, readable]);

  useEffect(() => {
    reload();
    const timer = setInterval(reload, POLL_MS);
    window.addEventListener(FREEZES_CHANGED_EVENT, reload);
    return () => {
      clearInterval(timer);
      window.removeEventListener(FREEZES_CHANGED_EVENT, reload);
    };
  }, [reload]);

  return { freezes, readable, reload };
}
