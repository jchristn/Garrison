import { Badge } from './StatusBadge';
import { reportHealthTone, reportIssueSeverityTone } from '../utils/constants';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';

/** Report health pill: Healthy, Degraded, Unhealthy, or Unknown. */
export function ReportHealthBadge({ health, t }) {
  if (!health) return '-';
  return (
    <Badge tone={reportHealthTone(health)} tip={enumTip(t, 'reportHealth', health)}>
      {enumLabel(t, 'reportHealth', health)}
    </Badge>
  );
}

/** Report issue severity pill: Low, Medium, or High. */
export function ReportIssueSeverityBadge({ severity, t }) {
  if (!severity) return '-';
  return (
    <Badge tone={reportIssueSeverityTone(severity)} tip={enumTip(t, 'reportIssueSeverity', severity)}>
      {enumLabel(t, 'reportIssueSeverity', severity)}
    </Badge>
  );
}
