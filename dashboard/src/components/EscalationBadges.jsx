import { Badge } from './StatusBadge';
import { escalationStatusTone, escalationSeverityTone } from '../utils/constants';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';

/** Escalation status pill: Open, Answered, Expired, Cancelled, or Withdrawn; Open and passed up reads "Escalated". */
export function EscalationStatusBadge({ escalation, status, t }) {
  const value = status || escalation?.status;
  if (!value) return '-';
  if (value === 'Open' && escalation?.escalatedToId) {
    return (
      <Badge tone="info" tip={t('tips.components.escalations.passedUp')}>
        {t('components.escalations.passedUp')}
      </Badge>
    );
  }
  return (
    <Badge tone={escalationStatusTone(value)} tip={enumTip(t, 'escalationStatus', value)}>
      {enumLabel(t, 'escalationStatus', value)}
    </Badge>
  );
}

/** Escalation severity pill: Info, Warning, or Urgent. */
export function EscalationSeverityBadge({ severity, t }) {
  if (!severity) return '-';
  return (
    <Badge tone={escalationSeverityTone(severity)} tip={enumTip(t, 'escalationSeverity', severity)}>
      {enumLabel(t, 'escalationSeverity', severity)}
    </Badge>
  );
}
