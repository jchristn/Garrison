// The guided tour engine's plain functions (LP4.5, LP4.6): per-user completion, route placeholders, waiting for a
// step's target, placing the step card inside the viewport in either direction, and the sample data a tour can offer.
// Kept free of React so vitest can drive them directly.

import { ARCHITECT_AGENT_NAME, STORAGE_KEYS, TOUR_TARGET_POLL_MS, TOUR_TARGET_TIMEOUT_MS } from './constants';
import { GERBIL_MANIFEST, SITE_RELIABILITY_MANIFEST } from './orgTemplateManifests';
import { templateContents } from './orgTemplates';

/** The example a tour offers when the tenant lacks what it needs (LP4.6), applied through the manifest apply route. */
export const TOUR_EXAMPLES = {
  gerbil: { id: 'gerbil', manifest: GERBIL_MANIFEST, source: 'examples/autonomous/gerbil' },
  siteReliability: { id: 'siteReliability', manifest: SITE_RELIABILITY_MANIFEST, source: 'examples/autonomous/site-reliability-org' }
};

/** What an example's manifest holds, as [{ kind, name }] in document order. */
export function exampleContents(exampleId) {
  return templateContents(TOUR_EXAMPLES[exampleId]?.manifest || '');
}

/**
 * A storage key that belongs to one person in one tenant: `<base>:<tenant>:<principal>`. The principal is its ID, or
 * its name when the server sent no ID, or `anonymous`.
 */
export function userStorageKey(base, principal, tenantId = '') {
  const tenant = tenantId || principal?.tenantId || 'default';
  const who = principal?.principalId || principal?.principalName || 'anonymous';
  return `${base}:${tenant}:${who}`;
}

function readItem(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage unavailable (private mode, quota): the state simply does not persist.
  }
}

/** The tour IDs this person has finished. */
export function readCompletedTours(principal, tenantId) {
  const raw = readItem(userStorageKey(STORAGE_KEYS.toursDone, principal, tenantId));
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Record that this person finished a tour, and return the new list. */
export function markTourCompleted(principal, tenantId, tourId) {
  const list = readCompletedTours(principal, tenantId);
  if (!list.includes(tourId)) list.push(tourId);
  writeItem(userStorageKey(STORAGE_KEYS.toursDone, principal, tenantId), JSON.stringify(list));
  return list;
}

/** A per-user true or false flag (the skipped wizard, the dismissed Home card). */
export function readUserFlag(base, principal, tenantId) {
  return readItem(userStorageKey(base, principal, tenantId)) === 'true';
}

/** Set a per-user flag. */
export function writeUserFlag(base, principal, tenantId, value = true) {
  writeItem(userStorageKey(base, principal, tenantId), value ? 'true' : 'false');
}

const PLACEHOLDER = /\{([a-z]+)\}/g;

/** The record placeholders a route uses, such as ['run']. */
export function routePlaceholders(route) {
  return [...String(route || '').matchAll(PLACEHOLDER)].map((m) => m[1]);
}

/** The placeholders any step of a tour uses, each once. */
export function tourPlaceholders(tour) {
  return [...new Set((tour?.steps || []).flatMap((s) => routePlaceholders(s.route)))];
}

/** The route with its placeholders filled from `records`, or null when one of them has no record. */
export function fillRoute(route, records = {}) {
  let missing = false;
  const out = String(route || '').replace(PLACEHOLDER, (_, name) => {
    const value = records?.[name];
    if (!value) {
      missing = true;
      return '';
    }
    return encodeURIComponent(value);
  });
  return missing ? null : out;
}

/** The CSS selector of a step's target. */
export function targetSelector(target) {
  return `[data-tour="${String(target).replace(/["\\]/g, '\\$&')}"]`;
}

/** True when an element takes up space on the page (a hidden tab or a collapsed panel does not). */
export function isShown(el) {
  if (!el || !el.isConnected) return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 || r.height > 0;
}

/**
 * Wait until `selector` matches a shown element, polling every `pollMs`, for at most `timeoutMs` (minimum 250).
 * Resolves with the element, or null on timeout or when `isCancelled()` turns true.
 */
export function waitForTarget(selector, { timeoutMs = TOUR_TARGET_TIMEOUT_MS, pollMs = TOUR_TARGET_POLL_MS, isShownFn = isShown, isCancelled = () => false, root = typeof document !== 'undefined' ? document : null } = {}) {
  const limit = Math.max(250, Number(timeoutMs) || TOUR_TARGET_TIMEOUT_MS);
  const started = Date.now();
  return new Promise((resolve) => {
    const look = () => {
      if (isCancelled()) return resolve(null);
      const el = root ? [...root.querySelectorAll(selector)].find((x) => isShownFn(x)) : null;
      if (el) return resolve(el);
      if (Date.now() - started >= limit) return resolve(null);
      setTimeout(look, pollMs);
      return undefined;
    };
    look();
  });
}

/** The step card's width: 340px, or the viewport less both margins when that is narrower (down to 390px screens). */
export function tourCardWidth(viewportWidth, margin = 16) {
  return Math.max(200, Math.min(340, viewportWidth - margin * 2));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, Math.max(min, max)));
}

/**
 * Where the step card goes: { top, left, width } in viewport pixels, always `margin` inside the viewport.
 *
 * - Without a target the card is centered.
 * - A tall target (more than 60% of the viewport, like the sidebar) gets the card beside it, on its inline-end side:
 *   to the right in left-to-right layouts and to the left in right-to-left ones, when it fits.
 * - Otherwise the card goes below the target, or above it when there is no room below, or at the bottom of the
 *   viewport when neither fits. It lines up with the target's inline-start edge (left in LTR, right in RTL).
 */
export function placeTourCard({ rect, cardHeight = 200, viewport, rtl = false, gap = 12, margin = 16 }) {
  const vw = viewport.width;
  const vh = viewport.height;
  const width = tourCardWidth(vw, margin);
  const height = Math.min(cardHeight, vh - margin * 2);
  const maxLeft = vw - margin - width;
  const maxTop = vh - margin - height;
  if (!rect) return { top: clamp((vh - height) / 2, margin, maxTop), left: clamp((vw - width) / 2, margin, maxLeft), width };

  if (rect.height > vh * 0.6) {
    const beside = rtl ? rect.left - gap - width : rect.right + gap;
    if (beside >= margin && beside <= maxLeft) return { top: clamp(rect.top, margin, maxTop), left: beside, width };
  }

  const left = clamp(rtl ? rect.right - width : rect.left, margin, maxLeft);
  const below = rect.bottom + gap;
  if (below + height <= vh - margin) return { top: below, left, width };
  const above = rect.top - gap - height;
  if (above >= margin) return { top: above, left, width };
  return { top: maxTop, left, width };
}

const asItems = (r) => (Array.isArray(r) ? r : r?.items || []);

/**
 * Whether the tenant already has what a tour needs: at least one agent other than the seeded agent architect, run,
 * keeper, or organization. A failed read counts as having them, so an error never pushes an apply on anyone.
 */
export async function tenantHas(apiClient, tenantId, needs) {
  try {
    if (needs === 'agents') {
      const r = await apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 2 });
      return asItems(r).some((a) => a?.name !== ARCHITECT_AGENT_NAME) || (r?.totalCount ?? 0) > asItems(r).length;
    }
    const list = { runs: 'listRuns', keepers: 'listMandates', organizations: 'listOrganizations' }[needs];
    if (!list || typeof apiClient[list] !== 'function') return true;
    const r = await apiClient[list](tenantId, { pageNumber: 1, pageSize: 1 });
    return asItems(r).length > 0 || (r?.totalCount ?? 0) > 0;
  } catch {
    return true;
  }
}

/** The organization a tour should open: a live one first, preferring the examples' names, else the first. */
export function pickOrganization(items) {
  const list = asItems(items);
  const live = list.filter((o) => o?.status !== 'Retired');
  const named = live.find((o) => o.name === 'site-reliability-org') || live.find((o) => o.name === 'gerbil-org');
  return named || live.find((o) => o.currentRevisionId) || live[0] || null;
}

/**
 * Fill the placeholders a tour uses from the tenant's own records: the newest run, an organization and its root unit,
 * and the first keeper. A placeholder with no record stays missing, and its steps are skipped with a note.
 */
export async function resolveTourRecords(apiClient, tenantId, tour) {
  const wanted = tourPlaceholders(tour);
  const records = {};
  const settle = (p) => Promise.resolve(p).then((v) => v, () => null);
  if (wanted.includes('run')) {
    const r = await settle(apiClient.listRuns?.(tenantId, { pageNumber: 1, pageSize: 1 }));
    records.run = asItems(r)[0]?.id || null;
  }
  if (wanted.includes('keeper')) {
    const r = await settle(apiClient.listMandates?.(tenantId, { pageNumber: 1, pageSize: 1 }));
    records.keeper = asItems(r)[0]?.id || null;
  }
  if (wanted.includes('organization') || wanted.includes('unit')) {
    const r = await settle(apiClient.listOrganizations?.(tenantId, { pageNumber: 1, pageSize: 50 }));
    const org = pickOrganization(r);
    records.organization = org?.id || null;
    if (org && wanted.includes('unit')) {
      const full = await settle(apiClient.getOrganization?.(tenantId, org.id));
      const units = full?.units || [];
      records.unit = (units.find((u) => !u.parentUnitId) || units[0])?.name || null;
    }
  }
  return records;
}

/** True when the person asked for less motion; smooth scrolling is then off. */
export function prefersReducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
