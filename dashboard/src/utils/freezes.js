// Brakes (AA3): freezes stop new runs of an agent, deployment, keeper, or app, and the autonomy kill switch stops every
// keeper tick in the tenant. Helpers shared by the Freezes page, the freeze and lift dialogs, the frozen banners, and
// the kill switch control.

import { pathFor } from '../config/navConfig';
import { enumLabel } from './enums';
import { holds } from './apps';

export { FREEZES_CHANGED_EVENT, notifyFreezesChanged } from './freezeEvents';

/** True for the kill switch's freeze (target kind TenantAutonomy). */
export function isKillSwitch(freeze) {
  return freeze?.targetKind === 'TenantAutonomy';
}

/** True while the freeze is in force (not lifted). */
export function isActive(freeze) {
  return !!freeze && freeze.active !== false && !freeze.liftedUtc;
}

/** The active freeze placed directly on one target, or null. */
export function freezeOn(freezes, kind, id) {
  if (!id) return null;
  return (freezes || []).find((f) => isActive(f) && f.targetKind === kind && f.targetId === id) || null;
}

/**
 * The active freezes that stop any of `targets` ([{ kind, id }]), the target's own freeze first. With `killSwitch`,
 * an active kill switch is included too (it stops keeper ticks).
 */
export function freezesFor(freezes, targets, { killSwitch = false } = {}) {
  const out = [];
  for (const target of targets || []) {
    const found = freezeOn(freezes, target.kind, target.id);
    if (found && !out.includes(found)) out.push(found);
  }
  if (killSwitch) {
    const kill = (freezes || []).find((f) => isActive(f) && isKillSwitch(f));
    if (kill) out.push(kill);
  }
  return out;
}

/** Active freezes keyed by target kind, then target ID, for list pages that mark frozen rows. */
export function freezeIndex(freezes) {
  const index = {};
  for (const f of freezes || []) {
    if (!isActive(f)) continue;
    index[f.targetKind] = index[f.targetKind] || {};
    index[f.targetKind][f.targetId] = f;
  }
  return index;
}

/** What a freeze stops, for messages: "Agent echo-agent", or "The kill switch" for TenantAutonomy. */
export function freezeTargetText(t, freeze) {
  if (isKillSwitch(freeze)) return t('freezes.killSwitchTarget');
  const name = freeze?.targetName || freeze?.targetId || '';
  return `${enumLabel(t, 'freezeTargetKind', freeze?.targetKind)} ${name}`.trim();
}

/** The dashboard page of a freeze's target, or null (the kill switch and organization targets have none). */
export function freezeTargetPath(freeze) {
  const id = freeze?.targetId;
  if (!id) return null;
  switch (freeze.targetKind) {
    case 'Agent':
      return pathFor('agents', id);
    case 'Mandate':
      return pathFor('keepers', id);
    case 'Deployment':
      return pathFor('deployments', null, { search: freeze.targetName || id });
    case 'App':
      return pathFor('apps', null, { search: freeze.targetName || id });
    default:
      return null;
  }
}

/**
 * The tooltip explaining a missing permission, or '' when the caller holds it (or it cannot be known: the server then
 * decides). Freezing needs Create on Freeze; lifting and the kill switch need Update.
 */
export function freezeDenied(t, permissions, operation) {
  if (holds(permissions, 'Freeze', operation)) return '';
  return t('tips.freezes.denied', { operation: enumLabel(t, 'operationType', operation) });
}

/** Validation of a freeze, lift, or kill switch reason: '' when valid. */
export function reasonError(t, reason, max) {
  return (reason || '').length > max ? t('freezes.errors.reasonMax', { max }) : '';
}
