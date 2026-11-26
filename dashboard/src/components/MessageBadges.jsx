import { Badge } from './StatusBadge';
import { messageStatusTone, messageUrgencyTone } from '../utils/constants';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';

/** Message status pill: Queued, Delivered, Acknowledged, Expired, or Rejected. */
export function MessageStatusBadge({ status, t }) {
  if (!status) return '-';
  return (
    <Badge tone={messageStatusTone(status)} tip={enumTip(t, 'messageStatus', status)}>
      {enumLabel(t, 'messageStatus', status)}
    </Badge>
  );
}

/** Message urgency pill: Normal or Urgent. */
export function MessageUrgencyBadge({ urgency, t }) {
  if (!urgency) return '-';
  return (
    <Badge tone={messageUrgencyTone(urgency)} tip={enumTip(t, 'messageUrgency', urgency)}>
      {enumLabel(t, 'messageUrgency', urgency)}
    </Badge>
  );
}

/** Why loop guards refused a message: HopLimit, LineRate, ThreadBudget, NoLine, or Frozen. */
export function MessageRejectionBadge({ reason, t }) {
  if (!reason) return '-';
  return (
    <Badge tone="danger" tip={enumTip(t, 'messageRejection', reason)}>
      {enumLabel(t, 'messageRejection', reason)}
    </Badge>
  );
}
