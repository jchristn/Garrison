// Route metadata: drives the sidebar, page titles, role gating, and the view registry.
// Each item: { id (i18n key under nav.items), slug (URL segment), requires? ('admin' | 'systemAdmin') }.

export const NAV_GROUPS = [
  { id: 'start', items: [{ id: 'home', slug: 'home' }, { id: 'invoke', slug: 'invoke' }] },
  {
    id: 'operate',
    items: [
      { id: 'runs', slug: 'runs' },
      { id: 'queue', slug: 'queue' },
      { id: 'nodes', slug: 'nodes' },
      { id: 'nodePools', slug: 'node-pools', requires: 'systemAdmin' }
    ]
  },
  {
    id: 'configure',
    items: [
      { id: 'agents', slug: 'agents' },
      { id: 'deployments', slug: 'deployments' },
      { id: 'harnessProfiles', slug: 'harness-profiles' },
      { id: 'promptTemplates', slug: 'prompt-templates' },
      { id: 'mcpServers', slug: 'mcp-servers' },
      { id: 'secrets', slug: 'secrets' },
      { id: 'workspaces', slug: 'workspaces' },
      { id: 'artifactStores', slug: 'artifact-stores' },
      { id: 'manifests', slug: 'manifests' }
    ]
  },
  {
    id: 'observe',
    items: [
      { id: 'requests', slug: 'requests' },
      { id: 'audit', slug: 'audit' },
      { id: 'explorer', slug: 'explorer' }
    ]
  },
  {
    id: 'administration',
    items: [
      { id: 'tenants', slug: 'tenants', requires: 'systemAdmin' },
      { id: 'users', slug: 'users', requires: 'admin' },
      { id: 'credentials', slug: 'credentials', requires: 'admin' },
      { id: 'roles', slug: 'roles', requires: 'admin' },
      { id: 'assignments', slug: 'assignments', requires: 'admin' }
    ]
  },
  {
    id: 'system',
    items: [
      { id: 'settings', slug: 'settings', requires: 'admin' },
      { id: 'serverInfo', slug: 'server-info' }
    ]
  }
];

export const ROUTES = NAV_GROUPS.flatMap((g) => g.items.map((it) => ({ ...it, group: g.id })));

/** Find route metadata by URL slug. */
export function routeBySlug(slug) {
  return ROUTES.find((r) => r.slug === slug) || ROUTES[0];
}

/** URL for a route id, optionally with a record id. */
export function pathFor(id, recordId) {
  const route = ROUTES.find((r) => r.id === id);
  const slug = route ? route.slug : id;
  return recordId ? `/dashboard/${slug}/${encodeURIComponent(recordId)}` : `/dashboard/${slug}`;
}
