import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { orgUnitIndex } from '../utils/organizations';

/** The most organizations read to find units: one list call, then one read per organization (UXP1-S004). */
export const ORG_UNIT_INDEX_LIMIT = 25;

/**
 * The units of the tenant's organizations (working trees), each with its organization's ID and name, so a page can
 * name and link a unit it only knows by ID, or find an agent's or a keeper's units. Null while loading; an empty list
 * when the caller cannot read organizations or `enabled` is false. Reads at most ORG_UNIT_INDEX_LIMIT organizations.
 */
export default function useOrgUnitIndex(enabled = true) {
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [units, setUnits] = useState(null);
  useEffect(() => {
    if (!enabled || !apiClient || typeof apiClient.listOrganizations !== 'function' || typeof apiClient.getOrganization !== 'function') {
      setUnits([]);
      return undefined;
    }
    let active = true;
    setUnits(null);
    Promise.resolve(apiClient.listOrganizations(tenantId, { pageNumber: 1, pageSize: ORG_UNIT_INDEX_LIMIT }))
      .then((r) => Promise.all((r?.items || []).slice(0, ORG_UNIT_INDEX_LIMIT).map((o) => Promise.resolve(apiClient.getOrganization(tenantId, o.id)).catch(() => null))))
      .then((orgs) => active && setUnits(orgUnitIndex(orgs)))
      .catch(() => active && setUnits([]));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, enabled]);
  return units;
}
