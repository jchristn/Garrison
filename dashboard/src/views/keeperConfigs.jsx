// ResourceView configuration for keepers (AA1.16, Autonomy > Keepers). A keeper is a mandate: the standing job an agent
// keeps on a wake schedule. Re-exported by resourceConfigs.jsx so the configuration-wide tests (tooltips, i18n keys,
// enum labels) cover it.

import CopyableId from '../components/CopyableId';
import { MandateStatusBadge, TickOutcomeBadge } from '../components/KeeperBadges';
import { Badge } from '../components/StatusBadge';
import { tip } from '../components/Tooltip';
import { ENUMS, MANDATE_LIMITS, ESCALATION_TARGET_KINDS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatNumber, formatRelativeTime, truncate } from '../i18n/formatters';
import { errorMessage } from '../utils/errors';
import { resourceTip, optionalText } from '../utils/tips';
import { enumLabel } from '../utils/enums';
import { loadCallerPermissions } from '../utils/apps';
import { permissionDenied } from '../utils/permissions';
import { blankKeeper, keeperToForm, keeperToBody, keeperDuplicate, keeperErrors, formatInterval, canPause, canResume, canWake } from '../utils/keepers';

const ID = 'keepers';

function col(t, key, render, extra = {}) {
  return { key, label: t(`resources.${ID}.columns.${key}`), tip: resourceTip(t, ID, key), render, ...extra };
}

function field(t, name, type, extra = {}) {
  const hint = optionalText(t, `resources.${ID}.hints.${name}`, extra.hintValues);
  const out = { name, type, label: t(`resources.${ID}.fields.${name}`), hint: hint || undefined, tip: resourceTip(t, ID, name), ...extra };
  if (Array.isArray(out.fields)) out.fields = out.fields.map((f) => ({ ...f, label: f.label || t(`resources.${ID}.fields.${name}Items.${f.name}`), tip: f.tip || resourceTip(t, ID, `${name}Items.${f.name}`) }));
  return out;
}

function section(t, name, extra = {}) {
  const hint = optionalText(t, `resources.${ID}.sectionHints.${name}`);
  return { name: `section_${name}`, type: 'section', label: t(`resources.${ID}.sections.${name}`), hint: hint || undefined, tip: resourceTip(t, ID, `sections.${name}`), ...extra };
}

const safeList = (promise) => promise.then((r) => r.items || []).catch(() => []);
const when = (value, lng) => (value ? <span {...tip(formatDateTime(value, lng))}>{formatRelativeTime(value, lng)}</span> : '-');
const enumOpts = (t, group, values) => values.map((v) => ({ value: v, label: enumLabel(t, group, v) }));

/** Run Pause, Resume, or Wake now on a keeper and report the result as a toast. */
async function perform(ctx, record, action) {
  const { t } = ctx;
  try {
    if (action === 'pause') await ctx.apiClient.pauseMandate(ctx.tenantId, record.id);
    else if (action === 'resume') await ctx.apiClient.resumeMandate(ctx.tenantId, record.id);
    else await ctx.apiClient.wakeMandate(ctx.tenantId, record.id);
    ctx.addToast({ type: 'success', message: t(`resources.${ID}.toasts.${action}`, { name: record.name }) });
    ctx.reload?.();
  } catch (e) {
    ctx.addToast({ type: 'error', message: errorMessage(t, e) });
  }
}

/**
 * The revision fields: what the keeper keeps (objective, healthy, autonomy, escalation policy, direction, signals), its
 * wake schedule, and its budgets. The create form shows them (`visible` true); Edit hides them, since a revision changes
 * through New revision on the keeper's page, which uses them with the change note.
 */
export function keeperRevisionFields(t, visible = true, withNote = false) {
  const show = { showIf: () => visible };
  const L = MANDATE_LIMITS;
  const backoff = (x) => visible && x?.wakeMode !== 'Fixed';
  return [
    section(t, 'mandate', show),
    field(t, 'objective', 'textarea', { required: true, rows: 4, ...show }),
    field(t, 'healthyDefinition', 'textarea', { rows: 3, ...show }),
    field(t, 'autonomy', 'textarea', { rows: 3, ...show }),
    field(t, 'escalationPolicy', 'textarea', { rows: 2, ...show }),
    // AA2: who the keeper's escalations go to when it names no target, and where a timed-out escalation goes up to.
    field(t, 'escalationTargetKind', 'select', { options: enumOpts(t, 'escalationTargetKind', ESCALATION_TARGET_KINDS), noneLabel: t(`resources.${ID}.noEscalationTarget`), ...show }),
    field(t, 'escalationTargetId', 'text', { placeholder: t(`resources.${ID}.escalationTargetPlaceholder`), showIf: (x) => visible && !!x?.escalationTargetKind }),
    field(t, 'direction', 'textarea', { rows: 2, ...show }),
    field(t, 'signals', 'objectList', {
      ...show,
      addLabel: t(`resources.${ID}.addSignal`),
      fields: [
        { name: 'name', type: 'text', placeholder: t(`resources.${ID}.signalNamePlaceholder`) },
        { name: 'description', type: 'text' }
      ]
    }),
    section(t, 'schedule', show),
    field(t, 'wakeMode', 'select', { required: true, options: enumOpts(t, 'wakeMode', ENUMS.wakeMode), ...show }),
    field(t, 'minIntervalSeconds', 'number', { required: true, min: L.interval.min, max: L.interval.max, hintValues: L.interval, ...show }),
    field(t, 'maxIntervalSeconds', 'number', { min: L.interval.min, max: L.interval.max, hintValues: L.interval, showIf: backoff }),
    field(t, 'backoffFactor', 'number', { min: L.backoffFactor.min, max: L.backoffFactor.max, step: 0.1, hintValues: L.backoffFactor, showIf: backoff }),
    field(t, 'jitterPercent', 'number', { min: L.jitterPercent.min, max: L.jitterPercent.max, hintValues: L.jitterPercent, ...show }),
    section(t, 'budgets', show),
    field(t, 'budgetPerTickUsd', 'number', { min: 0, step: 0.01, ...show }),
    field(t, 'budgetPerDayUsd', 'number', { min: 0, step: 0.01, ...show }),
    field(t, 'maxTokensPerTick', 'number', { min: 0, ...show }),
    ...(withNote ? [field(t, 'changeNote', 'textarea', { rows: 2, ...show })] : [])
  ];
}

/**
 * Keepers (AA1.16): mandates an agent keeps on a wake schedule. Creating one publishes its first revision and starts
 * its schedule. Edit changes the name, description, and deployment; the objective and schedule change through New
 * revision on the keeper's page. Row actions pause, resume, wake now, and list the keeper's runs.
 */
export const keepersConfig = {
  id: ID,
  explainer: 'keepers',
  formSize: 'large',
  autoRefresh: 30,
  urlFilters: ['status', 'agentId'],
  api: {
    list: (c, tenant, p) => c.listMandates(tenant, p),
    create: (c, tenant, b) => c.createMandate(tenant, b),
    update: (c, tenant, id, b) => c.updateMandate(tenant, id, b),
    remove: (c, tenant, id) => c.deleteMandate(tenant, id)
  },
  detailPath: (r) => pathFor('keepers', r.id),
  filters: [
    { name: 'status', label: (t) => t(`resources.${ID}.columns.status`), options: ENUMS.mandateStatus, enumGroup: 'mandateStatus' },
    {
      name: 'agentId',
      label: (t) => t(`resources.${ID}.columns.agent`),
      options: (lookups, filters) => [...new Set([...Object.keys(lookups?.agents || {}), ...(filters?.agentId ? [filters.agentId] : [])])],
      optionLabel: (o, _t, lookups) => lookups?.agents?.[o] || o
    }
  ],
  // Agent and deployment names for the table, and the caller's permissions (UT-03: denied actions stay disabled).
  loadLookups: async ({ apiClient, tenantId, principal }) => {
    const [agents, deployments, permissions] = await Promise.all([
      safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })),
      safeList(apiClient.listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 })),
      loadCallerPermissions(apiClient, tenantId, principal).catch(() => null)
    ]);
    return { agents: Object.fromEntries(agents.map((a) => [a.id, a.displayName || a.name])), deployments: Object.fromEntries(deployments.map((x) => [x.id, x.name])), permissions };
  },
  deniedReason: (action, row, { t, lookups }) => {
    const op = action === 'create' ? 'Create' : action === 'delete' ? 'Delete' : 'Update';
    return permissionDenied(t, lookups?.permissions, 'Mandate', op, { resourceId: row?.id || null });
  },
  // Hosted agents and their active deployments: keepers cannot run on remote agents or inactive deployments.
  loadOptions: async ({ apiClient, tenantId }) => {
    const [agents, deployments] = await Promise.all([safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })), safeList(apiClient.listDeployments(tenantId, { pageNumber: 1, pageSize: 1000 }))]);
    return { agents: agents.filter((a) => a.kind !== 'Remote'), deployments: deployments.filter((x) => x.active !== false) };
  },
  blank: () => blankKeeper(),
  toForm: (r) => keeperToForm(r),
  toDuplicate: (r) => keeperDuplicate(r),
  toBody: (d, mode) => keeperToBody(d, mode),
  validate: (d, t) => keeperErrors(d, t, d?.id ? 'edit' : 'create'),
  // 409 NameConflict belongs on the name field with keeper wording (the shared text describes capabilities).
  errorFields: (e, t) => (e?.code === 'NameConflict' ? { name: t(`resources.${ID}.errors.nameTaken`) } : null),
  columns: ({ t, i18n, lookups }) => {
    const lng = i18n.language;
    const agentName = (r) => lookups?.agents?.[r.agentId] || r.agentId;
    const deploymentName = (r) => lookups?.deployments?.[r.deploymentId] || r.deploymentId;
    return [
      col(t, 'name', (r) => <strong>{r.name}</strong>, { sortable: true, pinned: true }),
      col(t, 'status', (r) => (
        <span className="inline-meta">
          <MandateStatusBadge status={r.status} t={t} />
          {r.activeRunId && <Badge tone="info" tip={t(`tips.resources.${ID}.ticking`)}>{t(`resources.${ID}.ticking`)}</Badge>}
        </span>
      ), { csv: (r) => r.status || '' }),
      col(t, 'agent', (r) => agentName(r) || '-', { csv: (r) => agentName(r) || '' }),
      col(t, 'deployment', (r) => deploymentName(r) || '-', { csv: (r) => deploymentName(r) || '' }),
      col(t, 'nextWakeUtc', (r) => (r.status === 'Active' && r.nextWakeUtc ? when(r.nextWakeUtc, lng) : '-'), { cellClass: 'nowrap', csv: (r) => r.nextWakeUtc || '' }),
      col(t, 'currentIntervalSeconds', (r) => formatInterval(t, r.currentIntervalSeconds), { cellClass: 'nowrap', csv: (r) => r.currentIntervalSeconds ?? '' }),
      col(t, 'lastTick', (r) =>
        r.lastTickUtc ? (
          <span className="inline-meta">
            {when(r.lastTickUtc, lng)} <TickOutcomeBadge outcome={r.lastTickOutcome} t={t} />
          </span>
        ) : (
          <span className="text-muted">{t(`resources.${ID}.neverTicked`)}</span>
        ),
      { cellClass: 'nowrap', csv: (r) => `${r.lastTickUtc || ''} ${r.lastTickOutcome || ''}`.trim() }),
      col(t, 'tickCount', (r) => formatNumber(r.tickCount ?? 0, {}, lng), { cellClass: 'right', defaultHidden: true, csv: (r) => r.tickCount ?? 0 }),
      col(t, 'currentRevisionNumber', (r) => (r.currentRevisionNumber ? formatNumber(r.currentRevisionNumber, {}, lng) : '-'), { cellClass: 'right', defaultHidden: true, csv: (r) => r.currentRevisionNumber ?? '' }),
      col(t, 'runAs', (r) => (r.runAsName || r.runAsId ? `${r.runAsName || r.runAsId} (${enumLabel(t, 'principalType', r.runAsType)})` : '-'), { defaultHidden: true, csv: (r) => r.runAsName || r.runAsId || '' }),
      col(t, 'description', (r) => (r.description ? <span {...tip(r.description)}>{truncate(r.description, 80)}</span> : '-'), { defaultHidden: true, csv: (r) => r.description || '' }),
      col(t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true }),
      col(t, 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' })
    ];
  },
  fields: (d, ctx) => {
    const { t, options, mode } = ctx;
    const agents = options?.agents || [];
    const deployments = (options?.deployments || []).filter((x) => !d?.agentId || x.agentId === d.agentId);
    return [
      field(t, 'name', 'text', { required: true, placeholder: 'inbox-keeper' }),
      field(t, 'description', 'textarea', { rows: 2 }),
      field(t, 'agentId', 'select', { required: true, options: agents.map((a) => ({ value: a.id, label: a.displayName || a.name })), readOnly: mode !== 'create' }),
      field(t, 'deploymentId', 'select', { required: true, options: deployments.map((x) => ({ value: x.id, label: x.name })) }),
      ...keeperRevisionFields(t, mode === 'create')
    ];
  },
  // Shown when editing: only the name, description, and deployment change here, and the editor becomes the run-as
  // principal.
  formNotice: (d, { t }) =>
    d?.id ? (
      <div className="info-banner" role="status" data-testid="keeper-edit-notice">
        {t(`resources.${ID}.editNotice`, { name: d.runAsName || d.runAsId || '-' })}
      </div>
    ) : null,
  rowActions: (r, ctx) => {
    const denied = permissionDenied(ctx.t, ctx.lookups?.permissions, 'Mandate', 'Execute', { resourceId: r.id });
    const execute = (action) => ({ label: ctx.t(`resources.${ID}.actions.${action}`), tip: denied || ctx.t(`tips.resources.${ID}.actions.${action}`), disabled: !!denied, onClick: () => perform(ctx, r, action) });
    return [
      { ...execute('pause'), hidden: !canPause(r) },
      { ...execute('resume'), hidden: !canResume(r) },
      { ...execute('wake'), hidden: !canWake(r) },
      { label: ctx.t(`resources.${ID}.actions.runs`), tip: ctx.t(`tips.resources.${ID}.actions.runs`), onClick: () => ctx.navigate(pathFor('runs', null, { mandateId: r.id })) }
    ];
  }
};
