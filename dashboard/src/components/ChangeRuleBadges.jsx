import { Badge } from './StatusBadge';
import { proposalDecisionTone, ruleStatusTone } from '../utils/changeRules';

/** Change rule status pill: Active (in force), Inactive (switched off), or Expired. */
export function ChangeRuleStatusBadge({ status, t }) {
  if (!status) return '-';
  return (
    <Badge tone={ruleStatusTone(status)} tip={t(`tips.changeRules.status.${status}`)}>
      {t(`changeRules.status.${status}`)}
    </Badge>
  );
}

/**
 * Proposal decision pill: applied by rule, approved by a person, needs approval, denied, lapsed, or still being drafted
 * by the executive (see proposalDecision).
 */
export function ProposalDecisionBadge({ decision, t }) {
  if (!decision) return '-';
  return (
    <Badge tone={proposalDecisionTone(decision)} tip={t(`tips.orgProposals.decision.${decision}`)}>
      {t(`orgProposals.decision.${decision}`)}
    </Badge>
  );
}
