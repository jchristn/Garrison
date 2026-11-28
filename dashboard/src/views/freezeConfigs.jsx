// ResourceView configuration for freezes (AA3.8, Autonomy > Freezes): brakes that stop new runs of an agent, deployment,
// keeper, or app, and the kill switch that stops every keeper tick. Re-exported by resourceConfigs.jsx so the
// configuration-wide tests (tooltips, i18n keys, enum labels) cover it.

import CopyableId from '../components/CopyableId';
import FreezeDetail from '../components/FreezeDetail';
import FreezeModal from '../components/FreezeModal';
import LiftFreezeModal from '../components/LiftFreezeModal';
import { FreezeStatusBadge } from '../components/FreezeBadges';
import { tip } from '../components/Tooltip';
import { ENUMS } from '../utils/constants';
import { formatDateTime, formatNumber, formatRelativeTime, truncate } from '../i18n/formatters';
import { loadCallerPermissions } from '../utils/apps';
import { resourceTip } from '../utils/tips';
import { enumLabel } from '../utils/enums';
import { FREEZES_CHANGED_EVENT, freezeDenied, freezeIndex, freezeTargetPath, isActive, isKillSwitch } from '../utils/freezes';
import { PlusIcon } from '../components/Icons';

const ID = 'freezes';

function col(t, key, render, extra = {}) {
  return { key, label: t(`resources.${ID}.columns.${key}`), tip: resourceTip(t, ID, key), render, ...extra };
}

const when = (value, lng) => (value ? <span {...tip(formatDateTime(value, lng))}>{formatRelativeTime(value, lng)}</span> : '-');

/** Confirm, then lift a freeze from a list row. */
export function openLift(ctx, freeze) {
  const close = () => ctx.setExtraModal(null);
  ctx.setExtraModal(
    <LiftFreezeModal
      freeze={freeze}
      onClose={close}
      onDone={() => {
        close();
        ctx.reload?.();
      }}
    />
  );
}

/** Pick a target and freeze it, from the list header. */
export function openFreeze(ctx) {
  const close = () => ctx.setExtraModal(null);
  ctx.setExtraModal(
    <FreezeModal
      onClose={close}
      onDone={() => {
        close();
        ctx.reload?.();
      }}
    />
  );
}

/**
 * Freeze or Lift for one row of the Deployments or Apps list (AA3.8): Freeze while the record has no freeze of its own,
 * Lift while it does. `ctx.lookups.freezes` is freezeIndex(active freezes) and `ctx.lookups.permissions` the caller's
 * permissions; without the index (freezes cannot be read) neither shows.
 */
export function freezeRowActions(kind, r, ctx) {
  const index = ctx.lookups?.freezes;
  if (!index) return [];
  const own = index[kind]?.[r.id] || null;
  const close = () => ctx.setExtraModal(null);
  const done = () => {
    close();
    ctx.reload?.();
  };
  const denied = freezeDenied(ctx.t, ctx.lookups?.permissions, own ? 'Update' : 'Create');
  if (own) {
    return [{ label: ctx.t('freezes.actions.lift'), tip: denied || ctx.t('tips.freezes.actions.lift'), disabled: !!denied, onClick: () => ctx.setExtraModal(<LiftFreezeModal freeze={own} onClose={close} onDone={done} />) }];
  }
  return [
    {
      label: ctx.t('freezes.actions.freeze'),
      tip: denied || ctx.t('tips.freezes.actions.freeze'),
      disabled: !!denied,
      danger: true,
      onClick: () => ctx.setExtraModal(<FreezeModal targetKind={kind} targetId={r.id} targetName={r.name} onClose={close} onDone={done} />)
    }
  ];
}

/** Lookups for a list page that marks frozen rows: the active freezes by kind and target, and the caller's permissions. */
export async function freezeLookups(apiClient, tenantId, principal) {
  const [freezes, permissions] = await Promise.all([apiClient.listFreezes ? apiClient.listFreezes(tenantId, { active: true, pageNumber: 1, pageSize: 1000 }).then((p) => p.items || []).catch(() => null) : Promise.resolve(null), loadCallerPermissions(apiClient, tenantId, principal)]);
  return { freezes: freezes ? freezeIndex(freezes) : null, permissions };
}

/** "Agent: echo-agent", or "Kill switch" for the tenant-wide freeze. */
function targetText(t, r) {
  if (isKillSwitch(r)) return t('freezes.killSwitchTarget');
  return `${enumLabel(t, 'freezeTargetKind', r.targetKind)}: ${r.targetName || r.targetId || '-'}`;
}

/**
 * Freezes (AA3.8): active ones first (the server orders them), then the newest. Opens on the active ones. Freeze in the
 * header picks a target; Lift in the row menu confirms first. The kill switch shows here as a TenantAutonomy freeze
 * and is changed on Settings or the Home Autonomy card.
 */
export const freezesConfig = {
  id: ID,
  explainer: 'freezes',
  autoRefresh: 15,
  search: false,
  defaultFilters: { active: 'true' },
  urlFilters: ['active', 'targetKind', 'targetId'],
  lookupsEvents: [FREEZES_CHANGED_EVENT],
  api: {
    list: (c, tenant, p) => c.listFreezes(tenant, p),
    create: null,
    update: null,
    remove: null
  },
  filters: [
    { name: 'active', label: (t) => t(`resources.${ID}.columns.status`), tip: (t) => t('tips.freezes.filters.active'), options: ['true', 'false'], optionLabel: (o, t) => t(o === 'true' ? 'freezes.status.active' : 'freezes.status.lifted') },
    { name: 'targetKind', label: (t) => t(`resources.${ID}.columns.targetKind`), tip: (t) => t('tips.freezes.filters.targetKind'), options: ENUMS.freezeTargetKind.filter((k) => k !== 'OrgUnit' && k !== 'Organization'), enumGroup: 'freezeTargetKind' }
  ],
  // The caller's permissions, so Freeze and Lift are disabled with the reason when they are missing.
  loadLookups: async ({ apiClient, tenantId, principal }) => ({ permissions: await loadCallerPermissions(apiClient, tenantId, principal) }),
  canDuplicate: false,
  isEditable: () => false,
  canDelete: () => false,
  columns: ({ t, i18n }) => {
    const lng = i18n.language;
    return [
      col(t, 'createdUtc', (r) => when(r.createdUtc, lng), { sortable: true, pinned: true, cellClass: 'nowrap', csv: (r) => r.createdUtc || '' }),
      col(t, 'status', (r) => <FreezeStatusBadge freeze={r} t={t} />, { csv: (r) => (isActive(r) ? 'Active' : 'Lifted') }),
      col(t, 'targetKind', (r) => enumLabel(t, 'freezeTargetKind', r.targetKind), { csv: (r) => r.targetKind || '' }),
      col(t, 'target', (r) => (isKillSwitch(r) ? <strong>{t('freezes.killSwitchTarget')}</strong> : <strong>{r.targetName || r.targetId || '-'}</strong>), { csv: (r) => targetText(t, r) }),
      col(t, 'reason', (r) => (r.reason ? <span {...tip(r.reason)}>{truncate(r.reason, 80)}</span> : '-'), { csv: (r) => r.reason || '' }),
      col(t, 'createdBy', (r) => r.createdByName || r.createdById || '-', { csv: (r) => r.createdByName || r.createdById || '' }),
      col(t, 'cancelledRunCount', (r) => (r.cancelActiveRuns ? formatNumber(r.cancelledRunCount || 0, {}, lng) : '-'), { defaultHidden: true, csv: (r) => String(r.cancelledRunCount || 0) }),
      col(t, 'liftedUtc', (r) => when(r.liftedUtc, lng), { cellClass: 'nowrap', csv: (r) => r.liftedUtc || '' }),
      col(t, 'liftedBy', (r) => r.liftedByName || r.liftedById || '-', { defaultHidden: true, csv: (r) => r.liftedByName || r.liftedById || '' }),
      col(t, 'liftReason', (r) => (r.liftReason ? <span {...tip(r.liftReason)}>{truncate(r.liftReason, 80)}</span> : '-'), { defaultHidden: true, csv: (r) => r.liftReason || '' }),
      col(t, 'targetId', (r) => (r.targetId ? <CopyableId value={r.targetId} /> : '-'), { cellClass: 'cell-id', defaultHidden: true }),
      col(t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
    ];
  },
  fields: () => [],
  // The list has no form fields, so the details dialog renders the record itself (UXP1-V004).
  viewExtra: (d) => <FreezeDetail freeze={d} />,
  headerActions: (ctx) => {
    const denied = freezeDenied(ctx.t, ctx.lookups?.permissions, 'Create');
    return (
      <button type="button" className="button-danger" aria-disabled={denied ? 'true' : undefined} onClick={() => !denied && openFreeze(ctx)} data-testid="freezes-add" {...tip(denied || ctx.t('tips.freezes.actions.freezeAny'))}>
        <PlusIcon /> {ctx.t('freezes.actions.freezeAny')}
      </button>
    );
  },
  rowActions: (r, ctx) => {
    const denied = freezeDenied(ctx.t, ctx.lookups?.permissions, 'Update');
    const path = freezeTargetPath(r);
    return [
      { label: ctx.t('freezes.actions.openTarget'), tip: ctx.t('tips.freezes.openTarget'), hidden: !path, onClick: () => ctx.navigate(path) },
      { label: ctx.t('freezes.actions.lift'), tip: denied || ctx.t('tips.freezes.actions.lift'), hidden: !isActive(r) || isKillSwitch(r), disabled: !!denied, onClick: () => openLift(ctx, r) }
    ];
  }
};
