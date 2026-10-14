import { Badge } from './StatusBadge';
import { tip } from './Tooltip';
import { pipelineRunStatusTone, pipelineStageStatusTone, pipelineReviewStatusTone, pipelineReviewDecisionTone } from '../utils/constants';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';

/** Pipeline run status pill (Running, AwaitingReview, Cancelling, Succeeded, Failed, Cancelled, TimedOut). */
export function PipelineRunStatusBadge({ status, t }) {
  if (!status) return '-';
  return (
    <Badge tone={pipelineRunStatusTone(status)} tip={enumTip(t, 'pipelineRunStatus', status)}>
      {enumLabel(t, 'pipelineRunStatus', status)}
    </Badge>
  );
}

/** Pipeline run outcome as translated text with its explanation; a dash for None. */
export function PipelineRunOutcome({ outcome, t }) {
  if (!outcome || outcome === 'None') return '-';
  return <span {...tip(enumTip(t, 'pipelineRunOutcome', outcome))}>{enumLabel(t, 'pipelineRunOutcome', outcome)}</span>;
}

/** Pipeline stage status pill (Pending, Running, AwaitingReview, Succeeded, Failed, Cancelled). */
export function PipelineStageStatusBadge({ status, t }) {
  if (!status) return '-';
  return (
    <Badge tone={pipelineStageStatusTone(status)} tip={enumTip(t, 'pipelineStageStatus', status)}>
      {enumLabel(t, 'pipelineStageStatus', status)}
    </Badge>
  );
}

/** Stage review status pill (Pending, Approved, ChangesRequested, Rejected, Expired, Cancelled). */
export function PipelineReviewStatusBadge({ status, t }) {
  if (!status) return '-';
  return (
    <Badge tone={pipelineReviewStatusTone(status)} tip={enumTip(t, 'pipelineReviewStatus', status)}>
      {enumLabel(t, 'pipelineReviewStatus', status)}
    </Badge>
  );
}

/** Stage review decision pill (Approve, RequestChanges, Reject); a dash while the review is pending. */
export function PipelineReviewDecisionBadge({ decision, t }) {
  if (!decision) return '-';
  return (
    <Badge tone={pipelineReviewDecisionTone(decision)} tip={enumTip(t, 'pipelineReviewDecision', decision)}>
      {enumLabel(t, 'pipelineReviewDecision', decision)}
    </Badge>
  );
}
