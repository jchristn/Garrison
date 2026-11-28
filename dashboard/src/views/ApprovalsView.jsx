import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ResourceView from '../components/ResourceView';
import { tip } from '../components/Tooltip';
import { usePendingApprovals } from '../context/ApprovalsContext';
import { pathFor } from '../config/navConfig';
import { approvalsConfig } from './runConfigs';

/**
 * UXP1-S012: the sidebar badge counts tool calls and pipeline stage reviews together, but this tab lists only tool
 * calls. When stage reviews wait, say so above the table and link to them.
 */
function StageReviewsWaiting() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { reviewsPending } = usePendingApprovals();
  if (!(reviewsPending > 0)) return null;
  const to = pathFor('pipelineReviews');
  return (
    <div className="info-banner approvals-reviews-waiting" role="status" data-testid="approvals-reviews-waiting">
      <span>{t('views.approvals.reviewsWaiting', { count: reviewsPending })}</span>{' '}
      <a
        href={to}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
          e.preventDefault();
          navigate(to);
        }}
        data-testid="approvals-reviews-link"
        {...tip(t('tips.views.approvals.reviewsWaiting'))}
      >
        {t('views.approvals.openReviews')}
      </a>
    </div>
  );
}

/** Approvals inbox (P12.3): tool calls waiting for a person, and the history of every decision. */
const config = { ...approvalsConfig, intro: () => <StageReviewsWaiting /> };

export default function ApprovalsView() {
  return <ResourceView config={config} />;
}
