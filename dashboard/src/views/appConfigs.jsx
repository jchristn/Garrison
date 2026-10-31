// ResourceView configuration for agentic apps (AD6.11): Agents > Apps. Re-exported by resourceConfigs.jsx so the
// configuration-wide tests (tooltips, i18n keys, enum labels) cover it.

import CopyableId from '../components/CopyableId';
import { Badge, ActiveBadge } from '../components/StatusBadge';
import { EnvironmentBadge } from '../components/RevisionBadges';
import { tip } from '../components/Tooltip';
import AgenticAppGraph from '../components/AgenticAppGraph';
import AgenticAppShare from '../components/AgenticAppShare';
import AgenticAppDelegationModal from '../components/AgenticAppDelegationModal';
import AgenticAppRevisionsModal from '../components/AgenticAppRevisionsModal';
import AgenticAppReleaseModal from '../components/AgenticAppReleaseModal';
import { formatDateTime, formatNumber, formatRelativeTime, truncate } from '../i18n/formatters';
import { resourceTip, enumTip, optionalText } from '../utils/tips';
import { enumLabel, enumOptions } from '../utils/enums';
import { environmentNames } from '../utils/revisions';
import { APP_AUTH_MODES, APP_COLOR_FIELDS, APP_DEFAULT_COLORS, APP_FONTS, appDuplicate, appErrors, appToBody, appToForm, blankApp, entryDeployments, holds, loadCallerPermissions, memberIds, unreachableNames } from '../utils/apps';

const ID = 'apps';

function col(t, key, render, extra = {}) {
  return { key, label: t(`resources.${ID}.columns.${key}`), tip: resourceTip(t, ID, key), render, ...extra };
}

function field(t, name, type, extra = {}) {
  const hint = optionalText(t, `resources.${ID}.hints.${name}`);
  const out = { name, type, label: t(`resources.${ID}.fields.${name}`), hint: hint || undefined, tip: resourceTip(t, ID, name), ...extra };
  if (Array.isArray(out.fields)) out.fields = out.fields.map((f) => ({ ...f, label: f.label || t(`resources.${ID}.fields.${name}Items.${f.name}`), tip: f.tip || resourceTip(t, ID, `${name}Items.${f.name}`) }));
  return out;
}

const safeList = (promise) => promise.then((r) => r.items || []).catch(() => []);
const when = (value, lng) => (value ? <span {...tip(formatDateTime(value, lng))}>{formatRelativeTime(value, lng)}</span> : '-');

/** Agent name by ID: the lookup, the name the server sent with the member, or the ID. */
function agentNamer(agents = {}, app = null) {
  const sent = Object.fromEntries((app?.members || []).filter((m) => m.agentName).map((m) => [m.agentId, m.agentName]));
  return (id) => agents[id] || sent[id] || id;
}

/** Agents, agent names, and the caller's permissions (so missing permissions disable actions with a reason). */
async function appLookups({ apiClient, tenantId, principal }) {
  const [agents, permissions] = await Promise.all([safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })), loadCallerPermissions(apiClient, tenantId, principal)]);
  return { agents: Object.fromEntries(agents.map((a) => [a.id, a.name])), permissions };
}

/**
 * The explanation of a missing permission, or '' when the caller holds it (or it cannot be known). Shared by the
 * add button, Edit, Delete, and the delegation, revision, publish, and promote actions.
 */
export function appDenied(t, permissions, resourceType, operation, extra = {}) {
  if (holds(permissions, resourceType, operation, extra)) return '';
  return t('tips.apps.denied', { operation: enumLabel(t, 'operationType', operation), resource: enumLabel(t, 'resourceType', resourceType) });
}

/** Missing-permission explanations for the actions of one app. */
function deniedFor(t, permissions, app) {
  const id = app?.id || null;
  return {
    update: appDenied(t, permissions, 'AgenticApp', 'Update', { resourceId: id }),
    take: appDenied(t, permissions, 'AgenticApp', 'Update', { resourceId: id }),
    publish: appDenied(t, permissions, 'AgenticApp', 'Execute', { resourceId: id }),
    promote: appDenied(t, permissions, 'Promotion', 'Execute', { anyResource: true })
  };
}

/** Members as select options, named. */
function memberOptions(d, nameOf) {
  return memberIds(d).map((id) => ({ value: id, label: nameOf(id) }));
}

/**
 * Agentic apps (AD6): a group of agents behind one chat UI at /apps/{slug}/. The editor has five steps: the app,
 * members and the call graph (with a read-only graph), environments and the live one, who may use the app (with the
 * shareable URL), and branding. Row actions show the delegation the graph implies and the app's revisions, from which
 * revisions are taken, published, and promoted, and the app's environments (pins and overrides per environment, the
 * difference between two, Promote, and the promotion history with Rollback, AD9.6). Actions the caller lacks the permission for stay visible but disabled,
 * with the missing permission in the tooltip.
 */
export const appsConfig = {
  id: ID,
  // An empty list points to Agent Studio as well as to Add (AD12.12).
  studioEmptyState: true,
  formSize: 'xlarge',
  api: {
    list: (c, tenant, p) => c.listApps(tenant, p),
    create: (c, tenant, b) => c.createApp(tenant, b),
    update: (c, tenant, id, b) => c.updateApp(tenant, id, b),
    remove: (c, tenant, id) => c.deleteApp(tenant, id)
  },
  steps: ['general', 'members', 'environments', 'access', 'branding'],
  defaultSort: 'name',
  defaultSortDir: 'asc',
  loadLookups: appLookups,
  // Pick lists: agents for members, deployments for the entry deployment per environment, the tenant's environments,
  // and agent assets for the logo.
  loadOptions: async ({ apiClient, tenantId }) => {
    const page = { pageNumber: 1, pageSize: 1000 };
    const [agents, deployments, assets, environments] = await Promise.all([
      safeList(apiClient.listAgents(tenantId, page)),
      safeList(apiClient.listDeployments(tenantId, page)),
      apiClient.listAgentAssets ? safeList(apiClient.listAgentAssets(tenantId, page)) : Promise.resolve([]),
      apiClient.getEnvironments ? apiClient.getEnvironments(tenantId).then((r) => r?.environments || []).catch(() => []) : Promise.resolve([])
    ]);
    return { agents, deployments, assets, environments };
  },
  blank: () => blankApp(),
  toForm: (r) => appToForm(r),
  toDuplicate: (r) => appDuplicate(r),
  toBody: (d) => appToBody(d),
  validate: (d, t) => appErrors(d, t),
  deniedReason: (action, row, { t, lookups }) => {
    const operation = { create: 'Create', update: 'Update', delete: 'Delete' }[action];
    return operation ? appDenied(t, lookups?.permissions, 'AgenticApp', operation, { resourceId: row?.id || null }) : '';
  },
  // UnreachableMember from the server names the members; keep the names in the translated message.
  fieldErrorSpecial: (t) => (_key, code, message) => {
    if (code !== 'UnreachableMember') return null;
    const names = unreachableNames(message);
    return names ? t('common.fieldCodes.UnreachableMemberNamed', { names }) : null;
  },
  // 409 refusals that belong to one field.
  errorFields: (e, t) => {
    if (e?.code === 'AppSlugTaken') return { slug: t('errorCodes.AppSlugTaken') };
    if (e?.code === 'NameConflict') return { name: t('resources.apps.errors.nameTaken') };
    return null;
  },
  columns: ({ t, i18n, lookups = {} }) => {
    const lng = i18n.language;
    return [
      col(t, 'name', (r) => <strong>{r.name}</strong>, { sortable: true, pinned: true }),
      col(t, 'url', (r) => <AgenticAppShare app={r} compact />, { csv: (r) => `/apps/${r.slug || r.name}/` }),
      col(t, 'entryAgentId', (r) => (r.entryAgentId ? agentNamer(lookups.agents, r)(r.entryAgentId) : '-'), { csv: (r) => agentNamer(lookups.agents, r)(r.entryAgentId) }),
      col(
        t,
        'members',
        (r) => {
          const nameOf = agentNamer(lookups.agents, r);
          const names = memberIds(r).map(nameOf);
          return <span {...tip(t('tips.resources.apps.membersCell', { names: names.join(', ') || '-' }))}>{formatNumber(names.length, {}, lng)}</span>;
        },
        { cellClass: 'right', csv: (r) => (r.members || []).length }
      ),
      col(t, 'liveEnvironment', (r) => <EnvironmentBadge environment={r.liveEnvironment || 'dev'} t={t} />, { csv: (r) => r.liveEnvironment || 'dev' }),
      col(t, 'authMode', (r) => <Badge tone={r.authMode === 'Anonymous' ? 'warning' : 'neutral'} tip={enumTip(t, 'appAuthMode', r.authMode || 'AppUsers')}>{enumLabel(t, 'appAuthMode', r.authMode || 'AppUsers')}</Badge>, { csv: (r) => r.authMode || 'AppUsers' }),
      col(t, 'active', (r) => <ActiveBadge active={r.active !== false} activeLabel={t('common.generic.active')} inactiveLabel={t('common.generic.inactive')} tip={t(r.active !== false ? 'tips.resources.apps.activeBadge' : 'tips.resources.apps.inactiveBadge')} />),
      col(t, 'description', (r) => (r.description ? <span {...tip(r.description)}>{truncate(r.description, 80)}</span> : '-'), { defaultHidden: true, csv: (r) => r.description || '' }),
      col(t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true }),
      col(t, 'lastUpdateUtc', (r) => when(r.lastUpdateUtc, lng), { defaultHidden: true, cellClass: 'nowrap', csv: (r) => r.lastUpdateUtc || '' }),
      col(t, 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' })
    ];
  },
  fields: (d, { t, options = {} }) => {
    const data = d || {};
    const agents = options.agents || [];
    const known = Object.fromEntries(agents.map((a) => [a.id, a.name]));
    const nameOf = agentNamer(known, data);
    const members = memberOptions(data, nameOf);
    const envNames = environmentNames(options.environments, [data.liveEnvironment, ...(data.environments || []).map((e) => e.environment)]);
    const choose = t('resources.apps.chooseAgent');
    const keep = (list, value) => (value && !list.some((o) => o.value === value) ? [...list, { value, label: nameOf(value) }] : list);
    return [
      field(t, 'name', 'text', { required: true, step: 0, placeholder: 'research' }),
      field(t, 'displayName', 'text', { step: 0, placeholder: t('resources.apps.displayNamePlaceholder') }),
      field(t, 'slug', 'text', { step: 0, placeholder: data.name || 'research' }),
      field(t, 'description', 'textarea', { step: 0, rows: 2 }),
      field(t, 'active', 'checkbox', { step: 0 }),
      field(t, 'members', 'objectList', {
        step: 1,
        addLabel: t('resources.apps.addMember'),
        fields: [
          { name: 'agentId', type: 'select', noneLabel: choose, options: (row) => keep(agents.map((a) => ({ value: a.id, label: a.name })), row?.agentId) },
          { name: 'role', type: 'text', placeholder: t('resources.apps.rolePlaceholder') }
        ]
      }),
      field(t, 'entryAgentId', 'select', { step: 1, required: false, noneLabel: t('resources.apps.chooseEntry'), options: keep(members, data.entryAgentId) }),
      field(t, 'edges', 'objectList', {
        step: 1,
        addLabel: t('resources.apps.addEdge'),
        rowAdjust: (next, previous) => (previous ? next : { ...next, fanOutAllowed: true }),
        fields: [
          { name: 'callerAgentId', type: 'select', noneLabel: choose, options: (row) => keep(members, row?.callerAgentId) },
          { name: 'calleeAgentId', type: 'select', noneLabel: choose, options: (row) => keep(members, row?.calleeAgentId) },
          { name: 'fanOutAllowed', type: 'checkbox' }
        ]
      }),
      {
        ...field(t, 'graph', 'custom', { step: 1 }),
        render: (current) => <AgenticAppGraph app={current} nameOf={nameOf} />
      },
      field(t, 'environments', 'objectList', {
        step: 2,
        addLabel: t('resources.apps.addEnvironment'),
        fields: [
          { name: 'environment', type: 'select', required: true, options: () => envNames.map((n) => ({ value: n, label: n })) },
          {
            name: 'deploymentId',
            type: 'select',
            noneLabel: t('resources.apps.noEntryDeployment'),
            options: (row) => {
              const list = entryDeployments(options.deployments, data.entryAgentId, row?.environment).map((x) => ({ value: x.id, label: x.name }));
              return row?.deploymentId && !list.some((o) => o.value === row.deploymentId) ? [...list, { value: row.deploymentId, label: row.deploymentId }] : list;
            }
          }
        ]
      }),
      field(t, 'liveEnvironment', 'select', { step: 2, required: true, options: envNames.map((n) => ({ value: n, label: n })) }),
      field(t, 'authMode', 'select', { step: 3, required: true, options: enumOptions(t, 'appAuthMode', APP_AUTH_MODES) }),
      field(t, 'anonymousEnabled', 'checkbox', { step: 3 }),
      field(t, 'showOperatorDetail', 'checkbox', { step: 3 }),
      {
        ...field(t, 'share', 'custom', { step: 3 }),
        render: (current) => (
          <div>
            <div className="form-section-title" {...tip(resourceTip(t, ID, 'share'))}>
              {t('resources.apps.fields.share')}
            </div>
            <AgenticAppShare app={current} />
          </div>
        )
      },
      field(t, 'logoAssetId', 'select', {
        step: 4,
        noneLabel: t('resources.apps.noLogo'),
        options: [
          ...(options.assets || []).map((a) => ({ value: a.id, label: a.name })),
          ...(data.logoAssetId && !(options.assets || []).some((a) => a.id === data.logoAssetId) ? [{ value: data.logoAssetId, label: data.logoAssetId }] : [])
        ]
      }),
      field(t, 'faviconAssetId', 'select', {
        step: 4,
        noneLabel: t('resources.apps.faviconFromLogo'),
        options: [
          ...(options.assets || []).map((a) => ({ value: a.id, label: a.name })),
          ...(data.faviconAssetId && !(options.assets || []).some((a) => a.id === data.faviconAssetId) ? [{ value: data.faviconAssetId, label: data.faviconAssetId }] : [])
        ]
      }),
      // Each color shows the one the chat uses when it is left empty, so the swatch matches what people see.
      ...APP_COLOR_FIELDS.map((key) => field(t, key, 'color', { step: 4, defaultColor: APP_DEFAULT_COLORS[key], placeholder: t('resources.apps.defaultColor', { color: APP_DEFAULT_COLORS[key] }) })),
      field(t, 'fontFamily', 'select', { step: 4, options: enumOptions(t, 'appFont', APP_FONTS) }),
      field(t, 'welcomeText', 'textarea', { step: 4, rows: 3 })
    ];
  },
  // The view dialog leads with the graph and the shareable URL.
  viewExtra: (d, { t, lookups = {}, options = {} }) => {
    const known = { ...Object.fromEntries((options.agents || []).map((a) => [a.id, a.name])), ...(lookups.agents || {}) };
    return (
      <div className="app-view" data-testid="app-view">
        <AgenticAppShare app={d} />
        <div className="form-section-title" {...tip(t('tips.apps.graph'))}>
          {t('resources.apps.fields.graph')}
        </div>
        <AgenticAppGraph app={d} nameOf={agentNamer(known, d)} />
      </div>
    );
  },
  rowActions: (r, ctx) => {
    const permissions = ctx.lookups?.permissions || null;
    const denied = deniedFor(ctx.t, permissions, r);
    const nameOf = agentNamer(ctx.lookups?.agents || {}, r);
    return [
      {
        label: ctx.t('resources.apps.actions.delegation'),
        tip: ctx.t('tips.resources.apps.actions.delegation'),
        onClick: () => ctx.setExtraModal(<AgenticAppDelegationModal app={r} deniedTip={denied.update} onClose={() => ctx.setExtraModal(null)} />)
      },
      {
        label: ctx.t('resources.apps.actions.revisions'),
        tip: ctx.t('tips.resources.apps.actions.revisions'),
        onClick: () =>
          ctx.setExtraModal(<AgenticAppRevisionsModal app={r} denied={denied} permissions={permissions} nameOf={nameOf} onClose={() => ctx.setExtraModal(null)} onChanged={() => ctx.reload()} />)
      },
      {
        label: ctx.t('resources.apps.actions.environments'),
        tip: ctx.t('tips.resources.apps.actions.environments'),
        onClick: () => ctx.setExtraModal(<AgenticAppReleaseModal app={r} permissions={permissions} onClose={() => ctx.setExtraModal(null)} onChanged={() => ctx.reload()} />)
      }
    ];
  }
};
