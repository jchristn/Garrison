import { Badge } from './StatusBadge';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { canaryStatusTone, evalRunStatusTone, evalSetStateTone, resultOutcome, shadowTrialStatusTone, verdictOf } from '../utils/evaluations';

/** Eval set state pill: Draft (editable) or Approved (immutable, may gate). */
export function EvalSetStateBadge({ state, t }) {
  if (!state) return '-';
  return (
    <Badge tone={evalSetStateTone(state)} tip={enumTip(t, 'evalSetState', state)}>
      {enumLabel(t, 'evalSetState', state)}
    </Badge>
  );
}

/** Eval run status pill. */
export function EvalRunStatusBadge({ status, t }) {
  if (!status) return '-';
  return (
    <Badge tone={evalRunStatusTone(status)} tip={enumTip(t, 'evalRunStatus', status)}>
      {enumLabel(t, 'evalRunStatus', status)}
    </Badge>
  );
}

/** Whether an eval run reached its threshold: passed, failed, or no verdict (running, or no threshold). */
export function EvalVerdictBadge({ run, t }) {
  const verdict = verdictOf(run);
  const tone = verdict === 'passed' ? 'success' : verdict === 'failed' ? 'danger' : 'neutral';
  return (
    <Badge tone={tone} tip={t(`tips.evals.verdict.${verdict}`)}>
      {t(`evals.verdict.${verdict}`)}
    </Badge>
  );
}

/** One case result: passed, failed, or errored. */
export function EvalResultBadge({ result, t }) {
  const outcome = resultOutcome(result);
  const tone = outcome === 'passed' ? 'success' : outcome === 'errored' ? 'warning' : 'danger';
  return (
    <Badge tone={tone} tip={t(`tips.evals.outcome.${outcome}`)}>
      {t(`evals.outcome.${outcome}`)}
    </Badge>
  );
}

/** Shadow trial status pill. */
export function ShadowTrialStatusBadge({ status, t }) {
  if (!status) return '-';
  return (
    <Badge tone={shadowTrialStatusTone(status)} tip={enumTip(t, 'shadowTrialStatus', status)}>
      {enumLabel(t, 'shadowTrialStatus', status)}
    </Badge>
  );
}

/** Canary release status pill. */
export function CanaryStatusBadge({ status, t }) {
  if (!status) return '-';
  return (
    <Badge tone={canaryStatusTone(status)} tip={enumTip(t, 'canaryStatus', status)}>
      {enumLabel(t, 'canaryStatus', status)}
    </Badge>
  );
}
