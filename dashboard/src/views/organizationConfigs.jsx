// ResourceView configuration for organizations (AA7.14, Autonomy > Organizations): trees of units with leads, members,
// peer lines, and budgets, versioned by org revisions. Re-exported by resourceConfigs.jsx so the configuration-wide
// tests (tooltips, i18n keys, enum labels) cover it.

import CopyableId from '../components/CopyableId';
import { OrganizationStatusBadge } from '../components/OrganizationBadges';
import { tip } from '../components/Tooltip';
import { ORGANIZATION_LIMITS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatNumber, formatRelativeTime, truncate } from '../i18n/formatters';
import { copyToClipboard } from '../utils/clipboard';
import { resourceTip, optionalText } from '../utils/tips';
import { organizationFormErrors, organizationFormToBody, organizationToForm } from '../utils/organizations';

const ID = 'organizations';

function col(t, key, render, extra = {}) {
  return { key, label: t(`resources.${ID}.columns.${key}`), tip: resourceTip(t, ID, key), render, ...extra };
}

function field(t, name, type, extra = {}) {
  const hint = optionalText(t, `resources.${ID}.hints.${name}`, extra.hintValues);
  return { name, type, label: t(`resources.${ID}.fields.${name}`), hint: hint || undefined, tip: resourceTip(t, ID, name), ...extra };
}

const when = (value, lng) => (value ? <span {...tip(formatDateTime(value, lng))}>{formatRelativeTime(value, lng)}</span> : '-');

/** Copy an organization's ID and say whether the browser allowed it. */
async function copyId(ctx, id) {
  const ok = await copyToClipboard(id);
  ctx.addToast?.({ type: ok ? 'success' : 'error', message: ctx.t(ok ? 'organizations.toasts.copied' : 'tips.copy.failed') });
}

/**
 * Organizations (AA7.14): by name, with status, the live revision number, and when each was created. Create asks for
 * the name, description, and mission and opens the new organization, which starts as Draft with no units; units,
 * budgets, publishing, and rollback live on the organization's page. Edit changes the name, description, and mission.
 * Delete removes the organization with its units, revisions, and unit and organization memory.
 */
export const organizationsConfig = {
  id: ID,
  explainer: 'organizations',
  formSize: 'large',
  autoRefresh: 30,
  search: true,
  api: {
    list: (c, tenant, p) => c.listOrganizations(tenant, p),
    create: (c, tenant, b) => c.createOrganization(tenant, b),
    update: (c, tenant, id, b) => c.updateOrganization(tenant, id, b),
    remove: (c, tenant, id) => c.deleteOrganization(tenant, id)
  },
  detailPath: (r) => pathFor('organizations', r.id),
  canDuplicate: false,
  bulkDelete: false,
  blank: () => organizationToForm(null),
  toForm: (r) => organizationToForm(r),
  toBody: (d) => organizationFormToBody(d),
  validate: (d, t) => organizationFormErrors(d, t),
  // 409 NameConflict belongs on the name field with organization wording.
  errorFields: (e, t) => (e?.code === 'NameConflict' ? { name: t('organizations.errors.NameConflict') } : null),
  afterCreate: (created, ctx) => {
    if (created?.id) ctx.navigate(pathFor('organizations', created.id));
  },
  columns: ({ t, i18n }) => {
    const lng = i18n.language;
    return [
      col(t, 'name', (r) => <strong>{r.name}</strong>, { sortable: true, pinned: true }),
      col(t, 'status', (r) => <OrganizationStatusBadge status={r.status} t={t} />, { csv: (r) => r.status || '' }),
      col(t, 'currentRevisionNumber', (r) => (r.currentRevisionNumber ? formatNumber(r.currentRevisionNumber, {}, lng) : <span className="text-muted">{t('organizations.notPublished')}</span>), { cellClass: 'nowrap', csv: (r) => r.currentRevisionNumber || '' }),
      col(t, 'description', (r) => (r.description ? <span {...tip(r.description)}>{truncate(r.description, 80)}</span> : '-'), { csv: (r) => r.description || '' }),
      col(t, 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' }),
      col(t, 'mission', (r) => (r.mission ? <span {...tip(r.mission)}>{truncate(r.mission, 80)}</span> : '-'), { defaultHidden: true, csv: (r) => r.mission || '' }),
      col(t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
    ];
  },
  fields: (d, ctx) => {
    const { t } = ctx;
    const L = ORGANIZATION_LIMITS;
    return [
      field(t, 'name', 'text', { required: true, placeholder: 'refund-operations', hintValues: { max: L.nameMax } }),
      field(t, 'description', 'textarea', { rows: 2, hintValues: { max: L.descriptionMax } }),
      field(t, 'mission', 'textarea', { rows: 4, hintValues: { max: L.missionMax } })
    ];
  },
  rowActions: (r, ctx) => [
    { label: ctx.t('organizations.actions.open'), tip: ctx.t('tips.organizations.actions.open'), onClick: () => ctx.navigate(pathFor('organizations', r.id)) },
    { label: ctx.t('organizations.actions.copyId'), tip: ctx.t('tips.organizations.actions.copyId'), onClick: () => copyId(ctx, r.id) }
  ]
};
