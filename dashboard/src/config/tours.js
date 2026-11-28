// Guided tours (LP-009, LP4.5 to LP4.7). A tour is data: a list of steps, each naming the route it opens, the
// data-tour target it points at, and the catalog keys of its title and body. The engine (components/tours) navigates to
// the route, waits for the target, skips a missing one with a note, and saves completion per tour per user.
//
// Fields:
//   tour:  { id, sample?, steps }
//          sample: { needs, example } offers to load an example when the tenant has none of `needs` (LP4.6).
//          needs is 'agents', 'runs', 'trails' (a run that is a hop of a longer request), 'keepers', or
//          'organizations'; example is a key of TOUR_EXAMPLES in
//          utils/tours.js ('gerbil' or 'siteReliability').
//   step:  { id, route, target, title, body, phone? }
//          route is a dashboard path. {run}, {organization}, {unit}, and {keeper} are filled from the tenant's own
//          records when the tour starts (the newest run, or for needs 'trails' the newest hop run, an organization and
//          its root unit, a keeper). A step whose
//          placeholder has no record is skipped with a note.
//          target is the value of a data-tour attribute on the page; the engine looks for [data-tour="<target>"].
//          phone: { target, title, body } is what the step shows below 768 pixels, where the trail shows only its list
//          and the organization designer lists units instead of drawing the canvas, so the wide target is not shown.
//          Its strings are <ns>.steps.<id>.phone.title and .body.
//
// This module is plain data (no JSX) so Node tests and the e2e specs can import it.

/** The catalog namespace of a tour's own strings: tours.<camelCase id>. */
export function tourNamespace(tourId) {
  return `tours.${String(tourId).replace(/-([a-z])/g, (_, c) => c.toUpperCase())}`;
}

function step(tourId, id, route, target, phoneTarget) {
  const ns = tourNamespace(tourId);
  const out = { id, route, target, title: `${ns}.steps.${id}.title`, body: `${ns}.steps.${id}.body` };
  if (phoneTarget) out.phone = { target: phoneTarget, title: `${ns}.steps.${id}.phone.title`, body: `${ns}.steps.${id}.phone.body` };
  return out;
}

function tour(id, sample, steps) {
  return { id, sample, steps: steps.map(([stepId, route, target, phoneTarget]) => step(id, stepId, route, target, phoneTarget)) };
}

/** The viewport query below which a step uses its phone variant. */
export const TOUR_PHONE_QUERY = '(max-width: 767px)';

/** The step as shown at this width: its phone variant on a phone when it has one, otherwise the step itself. */
export function stepForViewport(s, phone) {
  return phone && s?.phone ? { ...s, ...s.phone } : s;
}

/** The seven tours in the order the Learn page and the tour list show them. */
export const TOURS = [
  tour('first-look', null, [
    ['sidebar', '/dashboard/home', 'sidebar'],
    ['topbar', '/dashboard/home', 'topbar'],
    ['kpis', '/dashboard/home', 'kpis'],
    ['invoke', '/dashboard/home', 'nav-invoke'],
    ['autonomy', '/dashboard/home', 'nav-autonomy'],
    ['organizations', '/dashboard/home', 'nav-organizations'],
    ['help', '/dashboard/home', 'sidebar-help']
  ]),
  tour('run-an-agent', { needs: 'agents', example: 'gerbil' }, [
    ['connections', '/dashboard/connections', 'resource-harnessProfiles'],
    ['agents', '/dashboard/agents', 'resource-agents'],
    ['deployments', '/dashboard/agents?tab=deployments', 'resource-deployments'],
    ['invoke', '/dashboard/invoke', 'invoke-form'],
    ['run', '/dashboard/runs/{run}', 'run-header'],
    ['trail', '/dashboard/runs/{run}', 'run-tab-trail']
  ]),
  // Follow a request needs a request that crossed agents (UXP1-S010): it opens the newest run that is a hop of one, and
  // offers the site reliability example, whose keepers message each other, when the tenant has none.
  tour('follow-a-request', { needs: 'trails', example: 'siteReliability' }, [
    // Below 768 pixels the trail shows only its list, and says so in a note (UXP1-V040); the step points at that note.
    ['views', '/dashboard/runs/{run}?tab=trail', 'trail-views', 'trail-narrow-note'],
    ['summary', '/dashboard/runs/{run}?tab=trail', 'trail-summary'],
    ['steps', '/dashboard/runs/{run}?tab=trail', 'trail-steps'],
    ['drawer', '/dashboard/runs/{run}?tab=trail&step={run}', 'trail-drawer'],
    ['actions', '/dashboard/runs/{run}?tab=trail&step={run}', 'trail-actions']
  ]),
  tour('build-a-team', { needs: 'organizations', example: 'siteReliability' }, [
    // Below 768 pixels Design lists the units as cards instead of the canvas; the first four steps point at that list,
    // the Add unit button, a keeper on a card, and a card's budget bar.
    ['canvas', '/dashboard/organizations/{organization}?tab=design&unit={unit}', 'org-canvas', 'org-design-list'],
    ['palette', '/dashboard/organizations/{organization}?tab=design&unit={unit}', 'org-palette', 'org-design-add-unit'],
    // UXP1-S026: panel= opens the unit's Keepers and Budget tabs, so each step shows the tab it describes.
    ['keepers', '/dashboard/organizations/{organization}?tab=design&unit={unit}&panel=keepers', 'org-unit-keepers', 'org-card-keeper'],
    ['budget', '/dashboard/organizations/{organization}?tab=design&unit={unit}&panel=budget', 'org-unit-budget', 'org-card-budget'],
    ['publish', '/dashboard/organizations/{organization}?tab=design&unit={unit}', 'org-publish']
  ]),
  tour('keep-it-safe', { needs: 'keepers', example: 'gerbil' }, [
    ['killSwitch', '/dashboard/home', 'kill-switch'],
    ['freezes', '/dashboard/autonomy?tab=freezes', 'resource-freezes'],
    ['spendCaps', '/dashboard/keepers/{keeper}', 'keeper-limits'],
    ['changeRules', '/dashboard/organizations?tab=change-rules', 'resource-changeRules'],
    ['approvals', '/dashboard/approvals', 'resource-approvals']
  ]),
  // LP4.11 (UXP1-S009): what a keeper is and what it leaves behind, on the Autonomy hub and one keeper's page.
  tour('agents-on-their-own', { needs: 'keepers', example: 'gerbil' }, [
    ['keepers', '/dashboard/autonomy?tab=keepers', 'resource-keepers'],
    ['schedule', '/dashboard/keepers/{keeper}', 'keeper-limits'],
    ['ticks', '/dashboard/keepers/{keeper}', 'keeper-ticks'],
    ['revisions', '/dashboard/keepers/{keeper}', 'keeper-revisions'],
    ['messages', '/dashboard/autonomy?tab=messages', 'resource-messages'],
    ['memory', '/dashboard/autonomy?tab=memory', 'resource-memory'],
    ['escalations', '/dashboard/autonomy?tab=escalations', 'resource-escalations']
  ]),
  tour('watch-an-organization', { needs: 'organizations', example: 'siteReliability' }, [
    ['board', '/dashboard/board/{organization}', 'board-chart'],
    ['attention', '/dashboard/board/{organization}', 'board-attention'],
    ['performance', '/dashboard/performance/{organization}', 'performance-units'],
    ['reports', '/dashboard/autonomy?tab=reports', 'resource-reports'],
    ['escalations', '/dashboard/autonomy?tab=escalations', 'resource-escalations']
  ])
];

/**
 * The tour each hub's "?" button starts (LP4.7). `tabs` picks a different tour for one tab of the hub. A hub that is
 * not listed has no tour and shows no button.
 */
export const HUB_TOURS = {
  home: { tour: 'first-look' },
  invoke: { tour: 'run-an-agent' },
  agents: { tour: 'run-an-agent' },
  connections: { tour: 'run-an-agent' },
  runs: { tour: 'follow-a-request' },
  organizations: { tour: 'build-a-team', tabs: { board: 'watch-an-organization', performance: 'watch-an-organization', 'change-rules': 'keep-it-safe' } },
  autonomy: { tour: 'agents-on-their-own', tabs: { freezes: 'keep-it-safe' } },
  approvals: { tour: 'keep-it-safe' }
};

/** A tour by ID, or null. */
export function findTour(tourId) {
  return TOURS.find((x) => x.id === tourId) || null;
}

/** The tour a hub's "?" button starts on one of its tabs (the tab slug), or null when the hub has none. */
export function hubTourFor(hubKey, tabSlug = null) {
  const entry = HUB_TOURS[hubKey];
  if (!entry) return null;
  return (tabSlug && entry.tabs?.[tabSlug]) || entry.tour;
}
