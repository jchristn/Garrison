import { Badge } from './StatusBadge';
import { mandateStatusTone, tickOutcomeTone } from '../utils/constants';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';

/** Keeper (mandate) status pill: Draft, Active, Paused, Frozen, CapReached, or Retired. */
export function MandateStatusBadge({ status, t }) {
  if (!status) return '-';
  return (
    <Badge tone={mandateStatusTone(status)} tip={enumTip(t, 'mandateStatus', status)}>
      {enumLabel(t, 'mandateStatus', status)}
    </Badge>
  );
}

/** Keeper tick outcome pill (Quiet, Acted, Attention, Escalated, Failed, Skipped, Unreported); a dash when there is none. */
export function TickOutcomeBadge({ outcome, t }) {
  if (!outcome) return '-';
  return (
    <Badge tone={tickOutcomeTone(outcome)} tip={enumTip(t, 'tickOutcome', outcome)}>
      {enumLabel(t, 'tickOutcome', outcome)}
    </Badge>
  );
}
