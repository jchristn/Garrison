import { Badge } from './StatusBadge';
import { triggerFireOutcomeTone, notificationDeliveryStatusTone } from '../utils/constants';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';

/** Trigger fire outcome pill (Started, Failed, Skipped); a dash when the trigger has not fired. */
export function TriggerFireOutcomeBadge({ outcome, t }) {
  if (!outcome) return '-';
  return (
    <Badge tone={triggerFireOutcomeTone(outcome)} tip={enumTip(t, 'triggerFireOutcome', outcome)}>
      {enumLabel(t, 'triggerFireOutcome', outcome)}
    </Badge>
  );
}

/** Notification delivery status pill (Pending, Delivering, Succeeded, Failed). */
export function NotificationDeliveryStatusBadge({ status, t }) {
  if (!status) return '-';
  return (
    <Badge tone={notificationDeliveryStatusTone(status)} tip={enumTip(t, 'notificationDeliveryStatus', status)}>
      {enumLabel(t, 'notificationDeliveryStatus', status)}
    </Badge>
  );
}
