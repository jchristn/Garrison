// Single source of truth for dashboard navigation.
//
// The sidebar renders NAV_SECTIONS. Each section holds hubs (sidebar items). A hub is either a
// standalone page (`page`) or a tabbed page (`tabs`), where the active tab lives in `?tab=`.
// Every page that existed before the hubs keeps its slug: it is the tab key, the legacy URL
// `/dashboard/<slug>` replace-redirects to its hub and tab, and detail routes such as
// `/dashboard/runs/<id>` keep working.
//
// Fields:
//   section: { key (i18n nav.sections.<key>), items }
//   hub:     { key (i18n nav.hubs.<key>.label/.tip, data-nav), slug, icon (name in components/Icons),
//              page? (standalone page id), tabs? (array of pages) }
//   page:    { id (view id and i18n nav.items.<id>), slug (URL segment and tab key), requires?, detail? }
//   A standalone page with `detail: true` also owns `/dashboard/<slug>/<id>` (for example an approval).
//
// requires: undefined (everyone), 'admin' (system or tenant admin), 'systemAdmin'.
// Client-side gating is UX only; the server enforces authorization.
// This module is plain data (no JSX) so Node-based tests can import it.

export const DASHBOARD_BASE = '/dashboard';
export const TAB_PARAM = 'tab';

export const NAV_SECTIONS = [
  {
    key: 'operate',
    items: [
      { key: 'home', slug: 'home', icon: 'HomeIcon', page: { id: 'home', slug: 'home' } },
      { key: 'invoke', slug: 'invoke', icon: 'SendIcon', page: { id: 'invoke', slug: 'invoke' } },
      {
        key: 'runs',
        slug: 'runs',
        icon: 'RunsIcon',
        tabs: [
          { id: 'runs', slug: 'runs', detail: true },
          { id: 'conversations', slug: 'conversations', detail: true },
          { id: 'queue', slug: 'queue' }
        ]
      },
      // Permission approvals (P12.3): the inbox of tool calls waiting for a person, with a pending-count badge.
      { key: 'approvals', slug: 'approvals', icon: 'ShieldCheckIcon', page: { id: 'approvals', slug: 'approvals', detail: true } },
      { key: 'analytics', slug: 'analytics', icon: 'ChartIcon', page: { id: 'analytics', slug: 'analytics' } },
      {
        key: 'agents',
        slug: 'agents',
        icon: 'BotIcon',
        tabs: [
          { id: 'agents', slug: 'agents', detail: true },
          { id: 'deployments', slug: 'deployments' }
        ]
      }
    ]
  },
  {
    key: 'platform',
    items: [
      {
        key: 'configuration',
        slug: 'configuration',
        icon: 'FileCodeIcon',
        tabs: [
          { id: 'harnessProfiles', slug: 'harness-profiles' },
          { id: 'promptTemplates', slug: 'prompt-templates', detail: true },
          { id: 'mcpServers', slug: 'mcp-servers' },
          { id: 'secrets', slug: 'secrets' },
          { id: 'workspaces', slug: 'workspaces' },
          { id: 'artifactStores', slug: 'artifact-stores' },
          { id: 'modelPrices', slug: 'model-prices' },
          { id: 'usageQuotas', slug: 'usage-quotas' },
          { id: 'manifests', slug: 'manifests' }
        ]
      },
      {
        key: 'fleet',
        slug: 'fleet',
        icon: 'CpuIcon',
        tabs: [
          { id: 'nodes', slug: 'nodes' },
          { id: 'controlNodes', slug: 'control-plane' },
          { id: 'nodePools', slug: 'node-pools', requires: 'systemAdmin' }
        ]
      }
    ]
  },
  {
    key: 'administration',
    items: [
      {
        key: 'access',
        slug: 'access',
        icon: 'UsersIcon',
        tabs: [
          { id: 'tenants', slug: 'tenants', requires: 'systemAdmin' },
          { id: 'users', slug: 'users', requires: 'admin' },
          { id: 'credentials', slug: 'credentials', requires: 'admin' },
          { id: 'roles', slug: 'roles', requires: 'admin' },
          { id: 'assignments', slug: 'assignments', requires: 'admin' }
        ]
      },
      {
        key: 'monitoring',
        slug: 'monitoring',
        icon: 'ActivityIcon',
        tabs: [
          { id: 'requests', slug: 'requests' },
          { id: 'audit', slug: 'audit' },
          { id: 'explorer', slug: 'explorer' }
        ]
      },
      {
        key: 'system',
        slug: 'system',
        icon: 'SettingsIcon',
        tabs: [
          { id: 'settings', slug: 'settings', requires: 'admin' },
          { id: 'serverInfo', slug: 'server-info' }
        ]
      }
    ]
  }
];

/** Every hub (sidebar item), in sidebar order. */
export const HUBS = NAV_SECTIONS.flatMap((section) => section.items.map((hub) => ({ ...hub, section: section.key })));

/** Every page (standalone page or hub tab) with its hub key and, for tabs, its tab key. */
export const PAGES = HUBS.flatMap((hub) =>
  hub.tabs
    ? hub.tabs.map((tab, index) => ({ ...tab, hub: hub.key, tab: tab.slug, defaultTab: index === 0 }))
    : [{ ...hub.page, hub: hub.key, tab: null, defaultTab: true }]
);

/** Find a hub by key. */
export function findHub(key) {
  return HUBS.find((hub) => hub.key === key) || null;
}

/** Find a hub by its URL slug. */
export function hubBySlug(slug) {
  return HUBS.find((hub) => hub.slug === slug) || null;
}

/** Find a page by id. */
export function findPage(id) {
  return PAGES.find((page) => page.id === id) || null;
}

/** Find a page by its (pre-hub) URL slug. */
export function pageBySlug(slug) {
  return PAGES.find((page) => page.slug === slug) || null;
}

/** Find the page that owns detail routes (`/dashboard/<slug>/<id>`) for a slug. */
export function detailPageBySlug(slug) {
  return PAGES.find((page) => page.detail && page.slug === slug) || null;
}

function withQuery(path, params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== '') search.append(key, value);
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * URL for a page id. With a record id, the detail route (`/dashboard/<slug>/<id>`); otherwise the
 * hub URL with `?tab=` (omitted for the hub's default tab). `query` adds extra parameters.
 */
export function pathFor(id, recordId, query) {
  const page = findPage(id);
  if (!page) return withQuery(`${DASHBOARD_BASE}/${id}`, query);
  if (recordId) return withQuery(`${DASHBOARD_BASE}/${page.slug}/${encodeURIComponent(recordId)}`, query);
  const hub = findHub(page.hub);
  const params = {};
  if (page.tab && !page.defaultTab) params[TAB_PARAM] = page.tab;
  return withQuery(`${DASHBOARD_BASE}/${hub.slug}`, { ...params, ...(query || {}) });
}

/** Pre-hub routes that redirect to a hub and tab. A tab whose slug is its hub's slug needs none. */
export const LEGACY_REDIRECTS = PAGES.filter((page) => page.tab && page.slug !== findHub(page.hub).slug).map((page) => ({
  from: page.slug,
  to: `${DASHBOARD_BASE}/${findHub(page.hub).slug}`,
  tab: page.tab
}));

/** True when a hub owns the current pathname (its own URL, or a detail route of one of its tabs). */
export function hubIsActive(hub, pathname) {
  const slugs = [hub.slug, ...(hub.tabs || []).filter((tab) => tab.detail).map((tab) => tab.slug)];
  return slugs.some((slug) => {
    const base = `${DASHBOARD_BASE}/${slug}`;
    return pathname === base || pathname.startsWith(`${base}/`);
  });
}

/** The hub that owns a pathname, or null. */
export function hubForPath(pathname) {
  return HUBS.find((hub) => hubIsActive(hub, pathname)) || null;
}
