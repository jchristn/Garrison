import { holds, loadCallerPermissions } from './apps';
import { enumLabel } from './enums';

/**
 * The tooltip explaining a missing permission, or '' when the caller holds it (or it cannot be known: the server then
 * decides). Used by the write actions of the Autonomy pages (UT-03), which stay visible but aria-disabled for callers
 * without the permission, the way Freeze is. `extra` passes `resourceId` or `anyResource` on to `holds`.
 */
export function permissionDenied(t, permissions, resourceType, operation, extra = {}) {
  if (holds(permissions, resourceType, operation, extra)) return '';
  return t('tips.permissions.denied', { operation: enumLabel(t, 'operationType', operation), resource: enumLabel(t, 'resourceType', resourceType) });
}

/**
 * Props for a button that a missing permission disables: aria-disabled (not disabled, so its tooltip still shows) and
 * a data-denied marker. Spread them with `tip(denied || usualTip)` and guard the click with `!denied`.
 */
export function deniedProps(denied) {
  return denied ? { 'aria-disabled': 'true', 'data-denied': 'true' } : {};
}

const ACTION_OPERATIONS = { create: 'Create', update: 'Update', delete: 'Delete' };

/**
 * A ResourceView `deniedReason` for one resource type: the add button needs Create, Edit needs Update, and Delete
 * needs Delete, each on the row when there is one.
 */
export function deniedReasonFor(resourceType) {
  return (action, row, { t, lookups }) => permissionDenied(t, lookups?.permissions, resourceType, ACTION_OPERATIONS[action] || 'Update', { resourceId: row?.id || null });
}

/** The caller's permissions as a lookups entry ({ permissions }), null when they cannot be read. */
export async function permissionsLookup({ apiClient, tenantId, principal }) {
  const permissions = await loadCallerPermissions(apiClient, tenantId, principal).catch(() => null);
  return { permissions };
}
