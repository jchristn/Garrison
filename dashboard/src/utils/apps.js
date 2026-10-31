// Agentic apps (AD6): helpers shared by the Apps tab, its editor, graph, delegation, revisions, and promotion dialogs,
// and their tests. Plain functions (no JSX) so Node-based tests can import them.

import { nextEnvironment, skipsEnvironments } from './revisions';

/** Who may use an app's chat UI. AppUsers is the server default. */
export const APP_AUTH_MODES = ['TenantUsers', 'AppUsers', 'Anonymous'];

/** App name: 1 to 64 lowercase letters, digits, and hyphens, starting and ending with a letter or digit. */
export const APP_NAME_PATTERN = /^[a-z0-9]([a-z0-9-]{0,62}[a-z0-9])?$/;

/** URL slug: 2 to 63 lowercase letters, digits, and hyphens, starting with a letter or digit. */
export const APP_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/;

/** Branding color: #RRGGBB. */
export const APP_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/** Limits the server enforces on an app. */
export const APP_LIMITS = { members: 100, description: 4000, displayName: 128, welcomeText: 4000, role: 256, changeNote: 2000 };

/** Validation field codes the server sends for apps, translated under common.fieldCodes. */
export const APP_FIELD_CODES = [
  'InvalidName',
  'InvalidSlug',
  'UnknownAgent',
  'DuplicateMember',
  'EntryNotMember',
  'EdgeNotMember',
  'SelfEdge',
  'AppGraphCycle',
  'UnreachableMember',
  'UnknownEnvironment',
  'InvalidEntryDeployment',
  'DuplicateEnvironment',
  'InvalidColor',
  'UnknownAsset',
  'Required',
  'TooMany'
];

/** The URL of an app's chat UI, served next to the dashboard: {origin}/apps/{slug}/. '' without a slug. */
export function appUrl(origin, slug) {
  const s = String(slug || '').trim();
  if (!s) return '';
  return `${String(origin || '').replace(/\/+$/, '')}/apps/${encodeURIComponent(s)}/`;
}

/** The slug an app is reached at: its own slug, or its name when the slug is left empty (the server default). */
export function effectiveSlug(app) {
  return String(app?.slug || '').trim() || String(app?.name || '').trim();
}

/**
 * Who can sign in to the app UI, as a key under sign-in explanations: TenantUsers, AppUsers, Anonymous, or
 * AnonymousDisabled (Anonymous chosen without anonymousEnabled, so only signed-in users get in).
 */
export function signInKey(app) {
  const mode = app?.authMode || 'AppUsers';
  if (mode === 'Anonymous') return app?.anonymousEnabled ? 'Anonymous' : 'AnonymousDisabled';
  return APP_AUTH_MODES.includes(mode) ? mode : 'AppUsers';
}

/** The app's branding colors, in the order the form shows them. */
export const APP_COLOR_FIELDS = ['primaryColor', 'accentColor', 'headerColor', 'backgroundColor', 'agentBubbleColor', 'conversationListColor', 'composerColor', 'filesColor'];

/** The color the app chat uses (light theme) when a branding color is left empty. Mirrors app-ui/src/utils/branding.js. */
export const APP_DEFAULT_COLORS = {
  primaryColor: '#0F766E',
  accentColor: '#B45309',
  backgroundColor: '#F8FAFC',
  headerColor: '#FFFFFF',
  agentBubbleColor: '#FFFFFF',
  conversationListColor: '#FFFFFF',
  composerColor: '#FFFFFF',
  filesColor: '#FFFFFF'
};

/** Typefaces of the app chat (AppFontEnum). */
export const APP_FONTS = ['System', 'Sans', 'Serif', 'Rounded', 'Mono'];

/** A blank app for the create form. */
export function blankApp() {
  return {
    name: '',
    slug: '',
    description: '',
    entryAgentId: '',
    members: [],
    edges: [],
    environments: [],
    liveEnvironment: 'dev',
    authMode: 'AppUsers',
    anonymousEnabled: false,
    showOperatorDetail: false,
    displayName: '',
    logoAssetId: '',
    primaryColor: '',
    accentColor: '',
    backgroundColor: '',
    headerColor: '',
    agentBubbleColor: '',
    conversationListColor: '',
    composerColor: '',
    filesColor: '',
    fontFamily: 'System',
    faviconAssetId: '',
    welcomeText: '',
    active: true
  };
}

/** An app as the form edits it: every list present, nulls as empty strings. */
export function appToForm(app) {
  const a = app || {};
  const text = (v) => (v === null || v === undefined ? '' : String(v));
  return {
    ...blankApp(),
    ...a,
    slug: text(a.slug),
    description: text(a.description),
    entryAgentId: text(a.entryAgentId),
    displayName: text(a.displayName),
    logoAssetId: text(a.logoAssetId),
    primaryColor: text(a.primaryColor),
    accentColor: text(a.accentColor),
    backgroundColor: text(a.backgroundColor),
    headerColor: text(a.headerColor),
    agentBubbleColor: text(a.agentBubbleColor),
    conversationListColor: text(a.conversationListColor),
    composerColor: text(a.composerColor),
    filesColor: text(a.filesColor),
    fontFamily: a.fontFamily || 'System',
    faviconAssetId: text(a.faviconAssetId),
    welcomeText: text(a.welcomeText),
    liveEnvironment: a.liveEnvironment || 'dev',
    authMode: a.authMode || 'AppUsers',
    anonymousEnabled: !!a.anonymousEnabled,
    showOperatorDetail: !!a.showOperatorDetail,
    active: a.active !== false,
    members: (a.members || []).map((m) => ({ agentId: text(m.agentId), role: text(m.role) })),
    edges: (a.edges || []).map((e) => ({ callerAgentId: text(e.callerAgentId), calleeAgentId: text(e.calleeAgentId), fanOutAllowed: e.fanOutAllowed !== false })),
    environments: (a.environments || []).map((e) => ({ environment: text(e.environment), deploymentId: text(e.deploymentId) }))
  };
}

/** A copy for Duplicate: no identity, revision, or slug (slugs are unique across the cluster). */
export function appDuplicate(app) {
  const form = appToForm(app);
  for (const key of ['id', 'tenantId', 'latestPublishedRevisionId', 'createdUtc', 'lastUpdateUtc']) delete form[key];
  form.name = form.name ? `${form.name}-copy`.slice(0, 64) : '';
  form.slug = '';
  return form;
}

/** Body for POST or PUT /apps: trimmed text, empty optional values as null, empty list rows dropped. */
export function appToBody(form) {
  const d = form || {};
  const trim = (v) => String(v ?? '').trim();
  const optional = (v) => (trim(v) ? trim(v) : null);
  return {
    name: trim(d.name),
    slug: trim(d.slug) || trim(d.name),
    description: optional(d.description),
    entryAgentId: trim(d.entryAgentId),
    members: (d.members || []).filter((m) => trim(m.agentId)).map((m) => ({ agentId: trim(m.agentId), role: optional(m.role) })),
    edges: (d.edges || [])
      .filter((e) => trim(e.callerAgentId) || trim(e.calleeAgentId))
      .map((e) => ({ callerAgentId: trim(e.callerAgentId), calleeAgentId: trim(e.calleeAgentId), fanOutAllowed: e.fanOutAllowed !== false })),
    environments: (d.environments || []).filter((e) => trim(e.environment)).map((e) => ({ environment: trim(e.environment), deploymentId: optional(e.deploymentId) })),
    liveEnvironment: trim(d.liveEnvironment) || 'dev',
    authMode: APP_AUTH_MODES.includes(d.authMode) ? d.authMode : 'AppUsers',
    anonymousEnabled: !!d.anonymousEnabled,
    showOperatorDetail: !!d.showOperatorDetail,
    displayName: optional(d.displayName),
    logoAssetId: optional(d.logoAssetId),
    primaryColor: optional(d.primaryColor),
    accentColor: optional(d.accentColor),
    backgroundColor: optional(d.backgroundColor),
    headerColor: optional(d.headerColor),
    agentBubbleColor: optional(d.agentBubbleColor),
    conversationListColor: optional(d.conversationListColor),
    composerColor: optional(d.composerColor),
    filesColor: optional(d.filesColor),
    fontFamily: APP_FONTS.includes(d.fontFamily) && d.fontFamily !== 'System' ? d.fontFamily : null,
    faviconAssetId: optional(d.faviconAssetId),
    welcomeText: d.welcomeText && String(d.welcomeText).trim() ? String(d.welcomeText) : null,
    active: d.active !== false
  };
}

/** Member agent IDs in order, without blanks. */
export function memberIds(app) {
  return (app?.members || []).map((m) => m.agentId).filter(Boolean);
}

/** Edges between members, without blanks or self edges (the shape the graph and checks work on). */
function usableEdges(app) {
  const members = new Set(memberIds(app));
  return (app?.edges || []).filter((e) => e.callerAgentId && e.calleeAgentId && e.callerAgentId !== e.calleeAgentId && members.has(e.callerAgentId) && members.has(e.calleeAgentId));
}

/** True when the edges between members form a cycle. */
export function hasCycle(app) {
  const edges = usableEdges(app);
  const out = new Map();
  for (const e of edges) out.set(e.callerAgentId, [...(out.get(e.callerAgentId) || []), e.calleeAgentId]);
  const state = new Map();
  const visit = (id) => {
    if (state.get(id) === 1) return true;
    if (state.get(id) === 2) return false;
    state.set(id, 1);
    for (const next of out.get(id) || []) if (visit(next)) return true;
    state.set(id, 2);
    return false;
  };
  return memberIds(app).some((id) => visit(id));
}

/** Members the entry agent cannot reach through edges (the entry itself is always reachable). */
export function unreachableMembers(app) {
  const entry = app?.entryAgentId;
  const ids = memberIds(app);
  if (!entry || !ids.includes(entry)) return [];
  const seen = new Set([entry]);
  const queue = [entry];
  const edges = usableEdges(app);
  while (queue.length) {
    const id = queue.shift();
    for (const e of edges) {
      if (e.callerAgentId === id && !seen.has(e.calleeAgentId)) {
        seen.add(e.calleeAgentId);
        queue.push(e.calleeAgentId);
      }
    }
  }
  return ids.filter((id) => !seen.has(id));
}

/**
 * Client-side checks for the app form, keyed like the server's field errors (name, slug, members, members[i].agentId,
 * entryAgentId, edges, edges[i].callerAgentId, edges[i], environments, primaryColor, accentColor) and worded like the
 * translated field codes, so a mistake reads the same whether the browser or the server finds it. `nameOf(id)` names
 * an agent in the unreachable message.
 */
export function appErrors(form, t, nameOf = (id) => id) {
  const d = form || {};
  const e = {};
  const code = (field, c, values) => {
    if (!e[field]) e[field] = t(`common.fieldCodes.${c}`, values);
  };
  const name = String(d.name || '').trim();
  if (!name) e.name = t('common.errors.required');
  else if (!APP_NAME_PATTERN.test(name)) code('name', 'InvalidName');
  const slug = String(d.slug || '').trim() || name;
  if (slug && !APP_SLUG_PATTERN.test(slug)) code('slug', 'InvalidSlug');
  if (String(d.description || '').length > APP_LIMITS.description) code('description', 'TooLong');
  if (String(d.displayName || '').length > APP_LIMITS.displayName) code('displayName', 'TooLong');
  if (String(d.welcomeText || '').length > APP_LIMITS.welcomeText) code('welcomeText', 'TooLong');
  for (const key of APP_COLOR_FIELDS) {
    const v = String(d[key] || '').trim();
    if (v && !APP_COLOR_PATTERN.test(v)) code(key, 'InvalidColor');
  }

  const members = d.members || [];
  if (!members.some((m) => m.agentId)) code('members', 'Required');
  if (members.length > APP_LIMITS.members) code('members', 'TooMany');
  const seen = new Set();
  members.forEach((m, i) => {
    if (!m.agentId) e[`members[${i}].agentId`] = t('common.errors.required');
    else if (seen.has(m.agentId)) code('members', 'DuplicateMember');
    seen.add(m.agentId);
    if (String(m.role || '').length > APP_LIMITS.role) e[`members[${i}].role`] = t('common.fieldCodes.TooLong');
  });

  const ids = new Set(memberIds(d));
  if (!d.entryAgentId || !ids.has(d.entryAgentId)) code('entryAgentId', 'EntryNotMember');
  (d.edges || []).forEach((edge, i) => {
    if (!edge.callerAgentId || !ids.has(edge.callerAgentId)) code(`edges[${i}].callerAgentId`, 'EdgeNotMember');
    if (!edge.calleeAgentId || !ids.has(edge.calleeAgentId)) code(`edges[${i}].calleeAgentId`, 'EdgeNotMember');
    if (edge.callerAgentId && edge.callerAgentId === edge.calleeAgentId) code(`edges[${i}]`, 'SelfEdge');
  });
  if (Object.keys(e).length === 0) {
    if (hasCycle(d)) code('edges', 'AppGraphCycle');
    const unreachable = unreachableMembers(d);
    if (unreachable.length) e.edges = t('common.fieldCodes.UnreachableMemberNamed', { names: unreachable.map(nameOf).join(', ') });
  }

  const envs = (d.environments || []).map((x) => x.environment).filter(Boolean);
  if (new Set(envs).size !== envs.length) code('environments', 'DuplicateEnvironment');
  return e;
}

/**
 * The server message for UnreachableMember names the members ("...through edges: writer, editor."); this pulls the
 * names out so the translated message can repeat them. Returns '' when the message does not carry them.
 */
export function unreachableNames(message) {
  const m = /:\s*(.+?)\.?$/.exec(String(message || ''));
  return m ? m[1].trim() : '';
}

/**
 * Layout for the read-only app graph: members in layers by the longest call path from the entry agent (the entry in
 * layer 0), members the entry cannot reach in a final layer marked unreachable, and the edges between members. Safe on
 * graphs with cycles (relaxation stops after one pass per member). Positions are in abstract units: x is the layer,
 * y the row within it. Returns { nodes: [{ id, layer, row, entry, unreachable }], edges: [{ from, to, fanOutAllowed, depth? }],
 * layers, rows }; an edge keeps the delegation depth the studio graph sends (AD7.10).
 */
export function layoutAppGraph(app) {
  const ids = [...new Set(memberIds(app))];
  const edges = usableEdges(app);
  const entry = ids.includes(app?.entryAgentId) ? app.entryAgentId : null;
  const unreachable = new Set(entry ? unreachableMembers(app) : ids.filter((id, i) => i > 0));
  const root = entry || ids[0] || null;
  const depth = new Map();
  if (root) depth.set(root, 0);
  for (let pass = 0; pass < ids.length; pass++) {
    let changed = false;
    for (const e of edges) {
      if (!depth.has(e.callerAgentId) || unreachable.has(e.calleeAgentId)) continue;
      const next = depth.get(e.callerAgentId) + 1;
      if (next < ids.length && next > (depth.get(e.calleeAgentId) ?? -1)) {
        depth.set(e.calleeAgentId, next);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const reachedLayers = depth.size ? Math.max(...depth.values()) + 1 : 0;
  const nodes = [];
  const rowsPerLayer = new Map();
  const place = (id, layer, flags) => {
    const row = rowsPerLayer.get(layer) || 0;
    rowsPerLayer.set(layer, row + 1);
    nodes.push({ id, layer, row, entry: id === entry, unreachable: !!flags.unreachable });
  };
  for (const id of ids) if (depth.has(id) && !unreachable.has(id)) place(id, depth.get(id), {});
  const lost = ids.filter((id) => !nodes.some((n) => n.id === id));
  for (const id of lost) place(id, reachedLayers, { unreachable: true });
  const layers = reachedLayers + (lost.length ? 1 : 0);
  const rows = Math.max(0, ...rowsPerLayer.values());
  return { nodes, edges: edges.map((e) => ({ from: e.callerAgentId, to: e.calleeAgentId, fanOutAllowed: e.fanOutAllowed !== false, ...(e.depth !== undefined ? { depth: e.depth } : {}) })), layers, rows };
}

/** Deployments of the entry agent in one environment: the choices for that environment's entry deployment. */
export function entryDeployments(deployments, entryAgentId, environment) {
  if (!entryAgentId) return [];
  return (deployments || []).filter((d) => d.agentId === entryAgentId && (d.environment || 'dev') === (environment || 'dev'));
}

/** App revisions newest first, from GET .../revisions (an array, or { items }). */
export function sortAppRevisions(list) {
  const items = Array.isArray(list) ? list : list?.items || list?.objects || [];
  return [...items].sort((a, b) => (b.number ?? 0) - (a.number ?? 0));
}

/** The app's latest published revision: the one it names, else the newest published, else null. */
export function latestAppRevision(revisions, app) {
  const list = sortAppRevisions(revisions);
  if (app?.latestPublishedRevisionId) {
    const named = list.find((r) => r.id === app.latestPublishedRevisionId);
    if (named) return named;
  }
  return list.find((r) => r.state === 'Published') || null;
}

/** Body for POST /apps/{id}/promote from the dialog state; the target and revision only when chosen. */
export function appPromotionBody(form, environments) {
  const body = { sourceEnvironment: form.sourceEnvironment };
  const target = form.targetEnvironment || nextEnvironment(environments, form.sourceEnvironment);
  if (target) body.targetEnvironment = target;
  if (form.appRevision) body.appRevision = String(form.appRevision);
  if (target && skipsEnvironments(environments, form.sourceEnvironment, target) && form.allowSkip) body.allowSkip = true;
  const note = String(form.note || '').trim();
  if (note) body.note = note;
  return body;
}

/** Client-side checks for the app promote dialog. Returns { field: message } (empty when valid). */
export function appPromotionErrors(form, environments, t) {
  const e = {};
  if (!form.sourceEnvironment) e.sourceEnvironment = t('common.errors.required');
  const target = form.targetEnvironment || nextEnvironment(environments, form.sourceEnvironment);
  if (form.sourceEnvironment && !target) e.targetEnvironment = t('components.promote.errors.noNext');
  else if (target && target === form.sourceEnvironment) e.targetEnvironment = t('components.promote.errors.sameEnvironment');
  else if (target && skipsEnvironments(environments, form.sourceEnvironment, target) && !form.allowSkip) e.allowSkip = t('components.promote.errors.needsSkip');
  if (String(form.note || '').length > APP_LIMITS.changeNote) e.note = t('common.fieldCodes.TooLong');
  return e;
}

/** Counts for the delegation summary: members, drifting members, drafts written, and members skipped. */
export function delegationSummary(plan) {
  const members = plan?.members || [];
  return {
    members: members.length,
    drifting: members.filter((m) => m.drift).length,
    drafts: members.filter((m) => m.draftRevisionNumber !== null && m.draftRevisionNumber !== undefined && !m.skippedReason).length,
    skipped: members.filter((m) => !!m.skippedReason).length
  };
}

/**
 * Whether the caller holds an operation on a resource type, from GET users/{id}/permissions (grants with
 * permissionType, resourceTypes, operations, scope, resourceId). Mirrors the server: administrators hold everything;
 * a matching Deny wins over any Permit; All matches every type and operation; Write implies Create, Update, and
 * Delete; a Resource-scoped grant counts only for its resource, or for any resource when `anyResource` is set (used
 * for Promotion before the target environment is chosen). Returns true when the permissions are unknown (null), so
 * the server stays the judge and nothing is disabled by mistake.
 */
export function holds(permissions, resourceType, operation, { resourceId = null, anyResource = false } = {}) {
  if (!permissions) return true;
  if (permissions.isAdmin || permissions.isTenantAdmin) return true;
  const grants = permissions.grants || permissions.effectiveGrants || [];
  const typeMatches = (g) => (g.resourceTypes || []).some((x) => x === 'All' || x === resourceType);
  const opMatches = (g) =>
    (g.operations || g.operationTypes || []).some((x) => x === 'All' || x === operation || (x === 'Write' && ['Create', 'Update', 'Delete'].includes(operation)));
  const scopeMatches = (g) => (g.scope || 'Tenant') !== 'Resource' || anyResource || (!!resourceId && g.resourceId === resourceId);
  const matching = grants.filter((g) => typeMatches(g) && opMatches(g) && scopeMatches(g));
  if (matching.some((g) => g.permissionType === 'Deny' && (g.scope || 'Tenant') !== 'Resource')) return false;
  if (resourceId && matching.some((g) => g.permissionType === 'Deny' && g.resourceId === resourceId)) return false;
  return matching.some((g) => (g.permissionType || 'Permit') === 'Permit');
}

/**
 * The caller's effective permissions for `holds`, or null when they cannot be read (the server then decides alone).
 * Administrators need no lookup. Users read their own (GET users/{id}/permissions); credentials read theirs when the
 * server lets them.
 */
export async function loadCallerPermissions(apiClient, tenantId, principal) {
  if (!principal) return null;
  if (principal.isAdmin || principal.isTenantAdmin) return { isAdmin: !!principal.isAdmin, isTenantAdmin: !!principal.isTenantAdmin, grants: [] };
  try {
    if (principal.principalType === 'Credential' && principal.credentialId && apiClient?.getCredentialPermissions) return await apiClient.getCredentialPermissions(tenantId, principal.credentialId);
    if (principal.userId && apiClient?.getUserPermissions) return await apiClient.getUserPermissions(tenantId, principal.userId);
  } catch {
    return null;
  }
  return null;
}

// ---------------------------------------------------------------- environments and promotion (AD9.6)

/**
 * What one deployment contributes to an environment: its name, the revision it pins (null when it follows the latest
 * published revision), and its environment overrides (name, value, and whether the value is a secret reference).
 */
export function deploymentPinView(deployment, numbers = {}) {
  const revisionId = deployment?.agentRevisionId || null;
  return {
    deploymentId: deployment?.id || '',
    name: deployment?.name || deployment?.id || '',
    active: deployment?.active !== false,
    revisionId,
    revisionNumber: revisionId && numbers[revisionId] !== undefined ? numbers[revisionId] : null,
    overrides: (deployment?.environmentOverrides || [])
      .filter((o) => o && o.name)
      .map((o) => ({ name: o.name, value: o.isSecret ? null : o.valueTemplate ?? '', isSecret: !!o.isSecret }))
      .sort((a, b) => a.name.localeCompare(b.name))
  };
}

/**
 * The per-environment view of an app: one row per member (the entry agent first), each with the member's deployments
 * per environment name. `deployments` is every deployment the caller can read; `numbers` maps revision IDs to numbers.
 */
export function environmentMatrix(app, deployments, environmentList, numbers = {}) {
  const ids = memberIds(app);
  const ordered = app?.entryAgentId && ids.includes(app.entryAgentId) ? [app.entryAgentId, ...ids.filter((id) => id !== app.entryAgentId)] : ids;
  const names = Object.fromEntries((app?.members || []).filter((m) => m.agentName).map((m) => [m.agentId, m.agentName]));
  return ordered.map((agentId) => {
    const cells = {};
    for (const env of environmentList) cells[env] = [];
    for (const d of deployments || []) {
      if (d.agentId !== agentId) continue;
      const env = d.environment || 'dev';
      if (!cells[env]) cells[env] = [];
      cells[env].push(deploymentPinView(d, numbers));
    }
    for (const env of Object.keys(cells)) cells[env].sort((a, b) => a.name.localeCompare(b.name));
    return { agentId, name: names[agentId] || agentId, entry: agentId === app?.entryAgentId, cells };
  });
}

/** A comparable signature of an environment cell: the pins and overrides, ignoring deployment names. */
function cellSignature(cell) {
  const pins = [...new Set((cell || []).map((d) => d.revisionId || 'latest'))].sort();
  const overrides = [...new Set((cell || []).flatMap((d) => d.overrides.map((o) => `${o.name}=${o.isSecret ? '(secret)' : o.value}`)))].sort();
  return JSON.stringify({ pins, overrides });
}

/**
 * How a member differs between two environments: 'Missing' when the target has no deployment of it (a promotion would
 * fail with NoTargetDeployments), 'Same' when the pinned revisions and the overrides match, else 'Differs'. A row also
 * says which of the two parts differ: { status, revisions, overrides }.
 */
export function compareEnvironments(row, source, target) {
  const from = row?.cells?.[source] || [];
  const to = row?.cells?.[target] || [];
  if (!to.length) return { status: 'Missing', revisions: false, overrides: false };
  const a = JSON.parse(cellSignature(from));
  const b = JSON.parse(cellSignature(to));
  const revisions = JSON.stringify(a.pins) !== JSON.stringify(b.pins);
  const overrides = JSON.stringify(a.overrides) !== JSON.stringify(b.overrides);
  return { status: revisions || overrides ? 'Differs' : 'Same', revisions, overrides };
}

/** Promotion records of one app, newest first (the server already sorts; this keeps the order stable). */
export function sortPromotions(records) {
  const list = Array.isArray(records) ? records : records?.items || records?.objects || [];
  return [...list].sort((a, b) => String(b.createdUtc || '').localeCompare(String(a.createdUtc || '')));
}

/** True when the caller may promote to (or roll back in) `environment`: Execute on Promotion for that environment. */
export function canPromoteTo(permissions, environment) {
  if (!environment) return true;
  return holds(permissions, 'Promotion', 'Execute', { resourceId: environment });
}

/** Names of the apps a studio draft builds: its target app first, then its AgenticApp items in draft order, once each. */
export function draftAppNames(draft) {
  const names = (draft?.items || []).filter((i) => i.kind === 'AgenticApp' && i.operation !== 'Delete').map((i) => i.name);
  return [...new Set([draft?.targetApp, ...names].filter(Boolean))];
}
