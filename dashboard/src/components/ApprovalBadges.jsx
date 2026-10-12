import { Badge } from './StatusBadge';
import { approvalStatusTone, approvalActionTone } from '../utils/constants';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';

/** Approval status pill (Pending, Approved, Denied, Expired, Cancelled) with a translated label and tooltip. */
export function ApprovalStatusBadge({ status, t }) {
  if (!status) return '-';
  return (
    <Badge tone={approvalStatusTone(status)} tip={enumTip(t, 'approvalStatus', status)}>
      {enumLabel(t, 'approvalStatus', status)}
    </Badge>
  );
}

/** Decision pill (Allow or Deny); a dash while the approval is still pending. */
export function ApprovalDecisionBadge({ decision, t }) {
  if (!decision) return '-';
  return (
    <Badge tone={approvalActionTone(decision)} tip={enumTip(t, 'approvalDecision', decision)}>
      {enumLabel(t, 'approvalDecision', decision)}
    </Badge>
  );
}

/** Rule action pill (Allow, Deny, Ask), used by the rule tester. */
export function ApprovalActionBadge({ action, t }) {
  if (!action) return '-';
  return (
    <Badge tone={approvalActionTone(action)} tip={enumTip(t, 'approvalRuleAction', action)}>
      {enumLabel(t, 'approvalRuleAction', action)}
    </Badge>
  );
}

/** "Awaiting approval" pill for a run that has tool calls waiting for a person; nothing otherwise. */
export function AwaitingApprovalBadge({ run, t }) {
  if (!run?.awaitingApproval) return null;
  const count = run.pendingApprovals || 1;
  return (
    <span data-testid="awaiting-approval-badge">
      <Badge tone="warning" tip={t('tips.approvals.awaiting', { count })}>
        {t('components.approvals.awaiting')}
      </Badge>
    </span>
  );
}
