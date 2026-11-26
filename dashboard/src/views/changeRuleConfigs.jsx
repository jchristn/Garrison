// ResourceView configuration for change rules (AA8.12, Autonomy > Change rules): what a person pre-approves for the
// executives of an organization. Re-exported by resourceConfigs.jsx so the configuration-wide tests (tooltips, i18n
// keys, enum labels) cover it.

import CopyableId from '../components/CopyableId';
import { ChangeRuleStatusBadge } from '../components/ChangeRuleBadges';
import { tip } from '../components/Tooltip';
import { CHANGE_RULE_LIMITS, ENUMS } from '../utils/constants';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatRelativeTime, truncate } from '../i18n/formatters';
import { copyToClipboard } from '../utils/clipboard';
import { enumLabel } from '../utils/enums';
import { resourceTip, optionalText } from '../utils/tips';
import { treeOrder } from '../utils/organizations';
import { blankChangeRule, blankLimit, changeRuleFieldError, changeRuleFormErrors, changeRuleFormToBody, changeRuleToForm, limitLabel, limitNamesFor, limitText, ruleStatus } from '../utils/changeRules';

const ID = 'changeRules';

function col(t, key, render, extra = {}) {
  return { key, label: t(`resources.${ID}.columns.${key}`), tip: resourceTip(t, ID, key), render, ...extra };
}

function field(t, name, type, extra = {}) {
  const hint = optionalText(t, `resources.${ID}.hints.${name}`, extra.hintValues);
  return { name, type, label: t(`resources.${ID}.fields.${name}`), hint: hint || undefined, tip: resourceTip(t, ID, name), ...extra };
}

function sub(t, name, type, extra = {}) {
  return { name, type, label: t(`resources.${ID}.fields.${name}`), tip: t(`tips.resources.${ID}.${name}`), ...extra };
}

const safeList = (promise) => promise.then((r) => r.items || []).catch(() => []);
const when = (value, lng) => (value ? <span {...tip(formatDateTime(value, lng))}>{formatRelativeTime(value, lng)}</span> : '-');
const classNames = (t, r) => (r.classes || []).map((c) => enumLabel(t, 'changeClass', c.class)).join(', ');

/** Copy a rule's ID and say whether the browser allowed it. */
async function copyId(ctx, id) {
  const ok = await copyToClipboard(id);
  ctx.addToast?.({ type: ok ? 'success' : 'error', message: ctx.t(ok ? 'changeRules.toasts.copied' : 'tips.copy.failed') });
}

/** The units of the organization a form picked, root first, indented under their parents. */
function unitOptions(options, organizationId) {
  const org = (options?.organizations || []).find((o) => o.id === organizationId);
  return treeOrder(org?.units || []).map(({ unit, depth }) => ({ value: unit.id, label: `${'  '.repeat(Math.min(depth, 6))}${unit.name}` }));
}

/**
 * Change rules (AA8.12): rules a person writes so that routine changes an executive proposes inside its subtree apply
 * at once. Each rule names an organization, the unit whose subtree it covers, the classes of change it allows, and
 * optional limits on those changes (how many of a class one proposal may hold, and bounds on wake tuning and deployment
 * weight). A proposal applies by rule only when rules cover every one of its changes; anything else waits for a person
 * on the organization's Proposals tab. Agents cannot write rules (403 RulesArePeopleOnly).
 */
export const changeRulesConfig = {
  id: ID,
  explainer: 'changeRules',
  formSize: 'large',
  autoRefresh: 30,
  search: true,
  urlFilters: ['organization', 'activeOnly'],
  api: {
    list: (c, tenant, p) => c.listChangeRules(tenant, p),
    create: (c, tenant, b) => c.createChangeRule(tenant, b),
    update: (c, tenant, id, b) => c.updateChangeRule(tenant, id, b),
    remove: (c, tenant, id) => c.deleteChangeRule(tenant, id)
  },
  filters: [
    {
      name: 'organization',
      label: (t) => t(`resources.${ID}.columns.organization`),
      options: (lookups, filters) => [...new Set([...Object.keys(lookups?.organizations || {}), ...(filters?.organization ? [filters.organization] : [])])],
      optionLabel: (o, _t, lookups) => lookups?.organizations?.[o] || o
    },
    { name: 'activeOnly', label: (t) => t(`resources.${ID}.filters.activeOnly`), options: ['true'], optionLabel: (_o, t) => t(`resources.${ID}.filters.inForce`) }
  ],
  // Organization names for the filter.
  loadLookups: async ({ apiClient, tenantId }) => {
    const organizations = await safeList(apiClient.listOrganizations(tenantId, { pageNumber: 1, pageSize: 1000 }));
    return { organizations: Object.fromEntries(organizations.map((o) => [o.id, o.name])) };
  },
  // Organizations with their units, for the organization and unit pickers.
  loadOptions: async ({ apiClient, tenantId }) => {
    const organizations = await safeList(apiClient.listOrganizations(tenantId, { pageNumber: 1, pageSize: 1000 }));
    const full = await Promise.all(organizations.slice(0, 200).map((o) => apiClient.getOrganization(tenantId, o.id).catch(() => ({ ...o, units: [] }))));
    return { organizations: full };
  },
  canDuplicate: true,
  bulkDelete: false,
  blank: () => blankChangeRule(),
  toForm: (r) => changeRuleToForm(r),
  toDuplicate: (r) => {
    const form = changeRuleToForm(r);
    delete form.id;
    return { ...form, name: `${form.name}-copy`.slice(0, CHANGE_RULE_LIMITS.nameMax) };
  },
  toBody: (d) => changeRuleFormToBody(d),
  validate: (d, t, ctx) => {
    const e = changeRuleFormErrors(d, t);
    // A unit picked before the organization changed no longer belongs to the rule's organization.
    const units = unitOptions(ctx?.options, d?.organizationId);
    if (!e.unitId && d?.unitId && ctx?.options?.organizations && !units.some((u) => u.value === d.unitId)) e.unitId = t('changeRules.form.errors.unit');
    return e;
  },
  fieldErrorSpecial: (t) => (_key, code) => changeRuleFieldError(t, code),
  columns: ({ t, i18n }) => {
    const lng = i18n.language;
    return [
      col(t, 'name', (r) => <strong>{r.name}</strong>, { sortable: true, pinned: true }),
      col(t, 'status', (r) => <ChangeRuleStatusBadge status={ruleStatus(r)} t={t} />, { csv: (r) => ruleStatus(r) }),
      col(t, 'organization', (r) => r.organizationName || r.organizationId || '-', { csv: (r) => r.organizationName || r.organizationId || '' }),
      col(t, 'unit', (r) => r.unitName || r.unitId || '-', { csv: (r) => r.unitName || r.unitId || '' }),
      col(t, 'classes', (r) => <span className="change-rule-classes">{classNames(t, r) || '-'}</span>, { csv: (r) => classNames(t, r) }),
      col(
        t,
        'limits',
        (r) =>
          (r.limits || []).length ? (
            <ul className="change-rule-limits">
              {r.limits.map((l) => (
                <li key={`${l.class}/${l.name}`}>{limitText(t, l, lng)}</li>
              ))}
            </ul>
          ) : (
            <span className="text-muted">{t(`resources.${ID}.noLimits`)}</span>
          ),
        { csv: (r) => (r.limits || []).map((l) => limitText(t, l, lng)).join('; ') }
      ),
      col(t, 'expiresUtc', (r) => (r.expiresUtc ? when(r.expiresUtc, lng) : <span className="text-muted">{t(`resources.${ID}.noExpiry`)}</span>), { cellClass: 'nowrap', csv: (r) => r.expiresUtc || '' }),
      col(t, 'createdByName', (r) => r.createdByName || '-', { defaultHidden: true, csv: (r) => r.createdByName || '' }),
      col(t, 'description', (r) => (r.description ? <span {...tip(r.description)}>{truncate(r.description, 80)}</span> : '-'), { defaultHidden: true, csv: (r) => r.description || '' }),
      col(t, 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' }),
      col(t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
    ];
  },
  fields: (d, ctx) => {
    const { t, options, mode } = ctx;
    const L = CHANGE_RULE_LIMITS;
    const organizations = options?.organizations || [];
    const orgOptions = organizations.map((o) => ({ value: o.id, label: o.name }));
    // An existing rule's organization stays listed even before the pick lists load.
    if (d?.organizationId && !orgOptions.some((o) => o.value === d.organizationId)) orgOptions.push({ value: d.organizationId, label: d.organizationName || d.organizationId });
    const classes = (d?.classes || []).length ? d.classes : [];
    return [
      field(t, 'organizationId', 'select', { options: orgOptions, noneLabel: t(`resources.${ID}.chooseOrganization`), readOnly: mode !== 'create' }),
      field(t, 'unitId', 'select', { options: unitOptions(options, d?.organizationId), noneLabel: t(`resources.${ID}.chooseUnit`) }),
      field(t, 'name', 'text', { required: true, placeholder: 'routine-wake-tuning', hintValues: { max: L.nameMax } }),
      field(t, 'description', 'textarea', { rows: 2, hintValues: { max: L.descriptionMax } }),
      field(t, 'classes', 'multiselect', { options: ENUMS.changeClass.map((value) => ({ value, label: enumLabel(t, 'changeClass', value) })) }),
      field(t, 'limits', 'objectList', {
        hintValues: { max: L.limitsMax },
        addLabel: t(`resources.${ID}.addLimit`),
        fields: [
          sub(t, 'limitClass', 'select', { name: 'class', required: true, options: (classes.length ? classes : ENUMS.changeClass).map((value) => ({ value, label: enumLabel(t, 'changeClass', value) })), default: () => blankLimit(classes).class }),
          sub(t, 'limitName', 'select', { name: 'name', required: true, options: (row) => limitNamesFor(row?.class).map((value) => ({ value, label: limitLabel(t, value) })), default: 'count' }),
          sub(t, 'minimum', 'number', { min: 0, step: 'any' }),
          sub(t, 'maximum', 'number', { min: 0, step: 'any' })
        ],
        // A new class keeps the limit name only when that class accepts it.
        rowAdjust: (next, previous) => (previous && next.class !== previous.class && !limitNamesFor(next.class).includes(next.name) ? { ...next, name: 'count' } : next)
      }),
      field(t, 'active', 'checkbox'),
      field(t, 'expiresUtc', 'datetime', { futureOnly: true })
    ];
  },
  rowActions: (r, ctx) => [
    { label: ctx.t('changeRules.actions.openOrganization'), tip: ctx.t('tips.changeRules.actions.openOrganization'), hidden: !r.organizationId, onClick: () => ctx.navigate(pathFor('organizations', r.organizationId)) },
    { label: ctx.t('changeRules.actions.copyId'), tip: ctx.t('tips.changeRules.actions.copyId'), onClick: () => copyId(ctx, r.id) }
  ]
};
