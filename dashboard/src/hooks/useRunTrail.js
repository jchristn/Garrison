import { useCallback, useEffect, useRef, useState } from 'react';
import useAutoRefresh from './useAutoRefresh';
import { isTrailLive } from '../utils/trailLayout';

/** Seconds between refreshes while any node of the trail is still running (LP-011). */
export const TRAIL_LIVE_REFRESH_SECONDS = 5;

/**
 * Load a run's activity trail (LP2.1) and keep it fresh through the shared auto-refresh control (LP-011): the interval
 * starts at 5 seconds while any node is running and turns off once every node is terminal. A choice the person makes
 * in the control is kept until the run changes. Returns { trail, error, loading, reload, autoRefresh, setAutoRefresh,
 * live }. A failed refresh keeps the last trail and sets `error`.
 */
export default function useRunTrail(apiClient, tenantId, runId, { includeEffects = true } = {}) {
  const [trail, setTrail] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefreshState] = useState(0);
  const chosen = useRef(false);
  const seq = useRef(0);

  const reload = useCallback(() => {
    if (!apiClient || !runId) return Promise.resolve(null);
    const mine = ++seq.current;
    setLoading(true);
    return apiClient
      .getRunTrail(tenantId, runId, { includeEffects })
      .then((result) => {
        if (mine !== seq.current) return null;
        setTrail(result || null);
        setError(null);
        if (!chosen.current) setAutoRefreshState(isTrailLive(result) ? TRAIL_LIVE_REFRESH_SECONDS : 0);
        return result;
      })
      .catch((e) => {
        if (mine === seq.current) setError(e);
        return null;
      })
      .finally(() => {
        if (mine === seq.current) setLoading(false);
      });
  }, [apiClient, tenantId, runId, includeEffects]);

  useEffect(() => {
    chosen.current = false;
    setTrail(null);
    setError(null);
    reload();
  }, [reload]);

  const setAutoRefresh = useCallback((seconds) => {
    chosen.current = true;
    setAutoRefreshState(Number(seconds) || 0);
  }, []);

  useAutoRefresh(reload, autoRefresh);

  return { trail, error, loading, reload, autoRefresh, setAutoRefresh, live: isTrailLive(trail) };
}
