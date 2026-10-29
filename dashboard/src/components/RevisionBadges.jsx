import { Badge } from './StatusBadge';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { environmentOf, revisionPin } from '../utils/revisions';

/** Revision state pill: Draft (warning) or Published (success). */
export function RevisionStateBadge({ state, t }) {
  if (!state) return '-';
  return (
    <Badge tone={state === 'Published' ? 'success' : 'warning'} tip={enumTip(t, 'agentRevisionState', state)}>
      {enumLabel(t, 'agentRevisionState', state)}
    </Badge>
  );
}

/** A deployment's environment as a pill (dev when unset). */
export function EnvironmentBadge({ deployment, environment, t }) {
  const name = environment || environmentOf(deployment);
  return (
    <Badge tone={name === 'prod' ? 'info' : 'neutral'} tip={t('tips.resources.deployments.environmentBadge', { environment: name })}>
      {name}
    </Badge>
  );
}

/** A deployment's revision pin: "Latest" when it follows the latest published revision, else the pinned number. */
export function RevisionPinBadge({ deployment, numbers, t }) {
  const pin = revisionPin(deployment, numbers);
  if (!pin.pinned) {
    return <Badge tip={t('tips.resources.deployments.followsLatest')}>{t('resources.deployments.latest')}</Badge>;
  }
  const label = pin.number !== null ? t('components.revisions.number', { number: pin.number }) : pin.id;
  return (
    <Badge tone="info" tip={t('tips.resources.deployments.pinnedRevision', { revision: label })}>
      <span data-pin={pin.number ?? pin.id}>{label}</span>
    </Badge>
  );
}

/** Promotion kind pill (Promotion or Rollback). */
export function PromotionKindBadge({ kind, t }) {
  if (!kind) return '-';
  return (
    <Badge tone={kind === 'Rollback' ? 'warning' : 'info'} tip={enumTip(t, 'promotionKind', kind)}>
      {enumLabel(t, 'promotionKind', kind)}
    </Badge>
  );
}

/** Promotion outcome pill (Applied or Rolled back). */
export function PromotionOutcomeBadge({ outcome, t }) {
  if (!outcome) return '-';
  return (
    <Badge tone={outcome === 'RolledBack' ? 'neutral' : 'success'} tip={enumTip(t, 'promotionOutcome', outcome)}>
      {enumLabel(t, 'promotionOutcome', outcome)}
    </Badge>
  );
}
