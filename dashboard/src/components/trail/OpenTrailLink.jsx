import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { tip } from '../Tooltip';
import { trailPath } from './trailParts';

/**
 * "Open trail" (LP2.8): a link to a run's activity trail with one step selected (`step`, a record ID on the trail
 * such as a message, report, escalation, or approval), so the trail opens with that step's drawer. Renders nothing
 * without a run. A modified click opens the trail in a new tab as a plain link would.
 */
export default function OpenTrailLink({ runId, step = null, testId = 'open-trail', className = 'trail-open-link' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  if (!runId) return null;
  const href = trailPath(runId, step);
  return (
    <a
      href={href}
      className={className}
      data-testid={testId}
      data-trail-run={runId}
      {...tip(t('tips.trail.openTrail'))}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        navigate(href);
      }}
    >
      {t('trail.openTrail')}
    </a>
  );
}
