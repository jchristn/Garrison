import StudioLink from './studio/StudioLink';
import { Badge } from './StatusBadge';
import { CanaryStatusBadge, EvalRunStatusBadge, EvalVerdictBadge, ShadowTrialStatusBadge } from './EvalBadges';
import { tip } from './Tooltip';
import { pathFor } from '../config/navConfig';
import { formatDateTime, formatNumber, formatPercent, formatRelativeTime } from '../i18n/formatters';

/** A score in 0 to 1 as a percent, or '-'. */
const percent = (v, lng) => (v == null ? '-' : formatPercent(v * 100, lng, { alreadyPercent: true, digits: 0 }));

/**
 * The evidence behind an executive's proposal (AA9.10, shown on the board in AA10.4): the eval runs, shadow trials, and
 * canary releases of the proposed agents since the proposal's content last changed. Eval runs started before the last
 * change are marked stale (`current` false). With `showEmpty`, a proposal without evidence says so; otherwise nothing
 * renders.
 */
export default function ProposalEvidence({ evidence, t, lng, showEmpty = false }) {
  const evals = evidence?.evalRuns || [];
  const shadows = evidence?.shadowTrials || [];
  const canaries = evidence?.canaryReleases || [];
  const when = (v) => (v ? <span {...tip(formatDateTime(v, lng))}>{formatRelativeTime(v, lng)}</span> : '-');
  if (!evals.length && !shadows.length && !canaries.length) {
    return showEmpty ? (
      <p className="text-muted" data-testid="proposal-evidence-empty">
        {t('board.evidence.empty')}
      </p>
    ) : null;
  }
  return (
    <section className="proposal-evidence" aria-label={t('board.evidence.title')} data-testid="proposal-evidence">
      <div className="form-section-title" {...tip(t('tips.board.evidence.title'))}>
        {t('board.evidence.title')}
      </div>
      {evidence?.contentChangedUtc && <p className="text-muted">{t('board.evidence.since', { when: formatDateTime(evidence.contentChangedUtc, lng) })}</p>}
      {evals.length > 0 && (
        <ul className="plain-list proposal-evidence-list" aria-label={t('board.evidence.evalRuns')} data-testid="proposal-evidence-evals">
          {evals.map((e) => (
            <li key={e.evalRunId} data-eval-run={e.evalRunId}>
              <StudioLink to={pathFor('evalRuns', e.evalRunId)} testId="proposal-evidence-eval" tipText={t('tips.board.evidence.openEvalRun')}>
                {t('board.evidence.evalSet', { name: e.setName, version: e.setVersion })}
              </StudioLink>{' '}
              <EvalRunStatusBadge status={e.status} t={t} /> <EvalVerdictBadge run={e} t={t} />{' '}
              <span className="text-muted">
                {t('board.evidence.evalScore', { score: percent(e.score, lng), threshold: percent(e.threshold, lng), done: formatNumber(e.completedCases, {}, lng), total: formatNumber(e.totalCases, {}, lng) })}
              </span>{' '}
              {e.current === false && (
                <Badge tone="warning" tip={t('tips.board.evidence.stale')}>
                  {t('board.evidence.stale')}
                </Badge>
              )}{' '}
              <span className="text-muted">{when(e.completedUtc || e.createdUtc)}</span>
            </li>
          ))}
        </ul>
      )}
      {shadows.length > 0 && (
        <ul className="plain-list proposal-evidence-list" aria-label={t('board.evidence.shadowTrials')} data-testid="proposal-evidence-shadows">
          {shadows.map((s) => (
            <li key={s.shadowTrialId} data-shadow-trial={s.shadowTrialId}>
              <StudioLink to={pathFor('shadowTrials', s.shadowTrialId)} testId="proposal-evidence-shadow" tipText={t('tips.board.evidence.openShadowTrial')}>
                {t('board.evidence.shadow', { name: s.name || s.candidateDeploymentName || s.candidateDeploymentId })}
              </StudioLink>{' '}
              <ShadowTrialStatusBadge status={s.status} t={t} />{' '}
              <span className="text-muted">
                {t('board.evidence.shadowCounts', { agreed: formatNumber(s.agreedCount, {}, lng), compared: formatNumber(s.comparedCount, {}, lng), diverged: formatNumber(s.divergedCount, {}, lng), failures: formatNumber(s.candidateFailureCount, {}, lng) })}
              </span>
            </li>
          ))}
        </ul>
      )}
      {canaries.length > 0 && (
        <ul className="plain-list proposal-evidence-list" aria-label={t('board.evidence.canaryReleases')} data-testid="proposal-evidence-canaries">
          {canaries.map((c) => (
            <li key={c.canaryReleaseId} data-canary={c.canaryReleaseId}>
              <StudioLink to={pathFor('canaryReleases', c.canaryReleaseId)} testId="proposal-evidence-canary" tipText={t('tips.board.evidence.openCanary')}>
                {t('board.evidence.canary', { name: c.candidateDeploymentName || c.candidateDeploymentId })}
              </StudioLink>{' '}
              <CanaryStatusBadge status={c.status} t={t} />{' '}
              <span className="text-muted">{t('board.evidence.canaryStep', { step: formatNumber(Math.min(c.currentStepIndex + 1, c.stepCount), {}, lng), total: formatNumber(c.stepCount, {}, lng) })}</span>
              {c.rollbackReason && <span className="text-danger"> {t('board.evidence.rollback', { reason: c.rollbackReason })}</span>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
