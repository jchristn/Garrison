// Helpers for performance signals and org-scale brakes (AA11): the performance window, the custom window's checks,
// the chart rows, and the cascade cancel result counts.

import { ORGANIZATION_LIMITS, PERFORMANCE_LIMITS } from './constants';
import { orgDenied } from './organizations';

const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

/** The window choices of the performance page: fixed spans ending now, or a custom range. */
export const PERFORMANCE_WINDOWS = ['24h', '7d', '30d', 'custom'];

const SPANS = { '24h': DAY, '7d': 7 * DAY, '30d': 30 * DAY };

/** The yyyy-mm-dd text of a date in UTC, for a date input. */
export function dateInput(value) {
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

/** A blank custom window: the last 7 days, as date inputs (the end day included). */
export function blankCustomWindow(now = new Date()) {
  return { from: dateInput(new Date(now.getTime() - 7 * DAY)), to: dateInput(now) };
}

/**
 * Field errors of a custom window: both dates, from before to, and a span of at most 90 days (the server's limit).
 * The to date includes the whole day.
 */
export function customWindowErrors(custom, t) {
  const errors = {};
  const from = custom?.from ? new Date(`${custom.from}T00:00:00Z`) : null;
  const to = custom?.to ? new Date(`${custom.to}T00:00:00Z`) : null;
  if (!from || Number.isNaN(from.getTime())) errors.from = t('performance.window.errors.from');
  if (!to || Number.isNaN(to.getTime())) errors.to = t('performance.window.errors.to');
  if (errors.from || errors.to) return errors;
  const end = to.getTime() + DAY;
  if (end <= from.getTime()) errors.to = t('performance.window.errors.order');
  else if (end - from.getTime() > PERFORMANCE_LIMITS.maxSpanDays * DAY) errors.to = t('performance.window.errors.span', { max: PERFORMANCE_LIMITS.maxSpanDays });
  return errors;
}

/**
 * The query of a window choice: { fromUtc, toUtc } as ISO 8601. A fixed span ends at `now`; a custom window runs from
 * the start of its from day to the end of its to day (UTC). Returns null for a custom window with errors.
 */
export function windowQuery(choice, custom, now = new Date()) {
  if (SPANS[choice]) return { fromUtc: new Date(now.getTime() - SPANS[choice]).toISOString(), toUtc: now.toISOString() };
  if (choice !== 'custom') return windowQuery(PERFORMANCE_LIMITS.defaultWindow, custom, now);
  if (Object.keys(customWindowErrors(custom, (k) => k)).length) return null;
  const from = new Date(`${custom.from}T00:00:00Z`);
  const to = new Date(new Date(`${custom.to}T00:00:00Z`).getTime() + DAY);
  return { fromUtc: from.toISOString(), toUtc: to.toISOString() };
}

/**
 * Chart rows from the unit rows: each unit with its success rate (0 to 1, or null) and cost, plus each value as a
 * fraction of the largest so the bars share one scale per measure.
 */
export function chartRows(units) {
  const list = Array.isArray(units) ? units : [];
  const maxCost = Math.max(0, ...list.map((u) => Number(u?.metrics?.costUsd) || 0));
  return list.map((u) => {
    const rate = u?.metrics?.successRate;
    const cost = Number(u?.metrics?.costUsd) || 0;
    return {
      unitId: u.unitId,
      unitName: u.unitName || u.unitId,
      successRate: rate === null || rate === undefined ? null : Math.min(Math.max(Number(rate), 0), 1),
      costUsd: cost,
      costFraction: maxCost > 0 ? cost / maxCost : 0
    };
  });
}

/** The unit's depth in the performance list (0 for the root), from parentUnitId. */
export function unitDepths(units) {
  const byId = new Map((units || []).map((u) => [u.unitId, u]));
  const depth = (u, seen = new Set()) => {
    if (!u?.parentUnitId || seen.has(u.unitId) || !byId.has(u.parentUnitId)) return 0;
    seen.add(u.unitId);
    return 1 + depth(byId.get(u.parentUnitId), seen);
  };
  return Object.fromEntries((units || []).map((u) => [u.unitId, depth(u)]));
}

/** The four counts of a cascade cancel result, in display order. */
export function cascadeCounts(result) {
  return [
    { key: 'runsCancelled', value: Number(result?.runsCancelled) || 0 },
    { key: 'ticksCancelled', value: Number(result?.ticksCancelled) || 0 },
    { key: 'escalationsWithdrawn', value: Number(result?.escalationsWithdrawn) || 0 },
    { key: 'messagesExpired', value: Number(result?.messagesExpired) || 0 }
  ];
}

/** The cascade cancel request body: the trimmed reason, or null for none. */
export function cascadeBody(reason) {
  const text = String(reason || '').trim();
  return { reason: text ? text.slice(0, ORGANIZATION_LIMITS.cascadeReasonMax) : null };
}

/** The trigger editor URL for a new scheduled check (an EvalSet trigger), preset with a deployment when given. */
export function newCheckQuery(deploymentId) {
  return deploymentId ? { new: 'EvalSet', deploymentId } : { new: 'EvalSet' };
}

/** Why the caller cannot cancel everything in a unit (Execute on Organization), or '' when it can. */
export function cascadeDenied(t, permissions) {
  return orgDenied(t, permissions, 'Execute');
}
