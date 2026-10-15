// Blocked queued runs (G-15): the server sets run.blockedReason (NoReadyWorker, NoCapableWorker, NoMatchingPool, or
// NoIsolatingWorker for an Untrusted run no Ready worker can isolate, P11.14, or a run whose deployment has an egress
// allowlist no Ready worker can enforce, P11.15) on a Queued run that no Ready worker can take right now, and the
// overview counts them in blockedRuns.

import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Badge } from './StatusBadge';
import { tip } from './Tooltip';
import { pathFor } from '../config/navConfig';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';

/** The run's blocked reason, or null when it is not a blocked queued run. */
export function blockedReasonOf(run) {
  return run && run.status === 'Queued' && run.blockedReason ? run.blockedReason : null;
}

/** Warning badge for a blocked queued run; its tooltip explains the reason and what to do. Renders nothing otherwise. */
export function BlockedBadge({ run, reason, t }) {
  const r = reason || blockedReasonOf(run);
  if (!r) return null;
  return (
    <span className="blocked-badge" data-blocked={r}>
      <Badge tone="warning" tip={enumTip(t, 'runBlockedReason', r)}>
        {'⚠'} {enumLabel(t, 'runBlockedReason', r)}
      </Badge>
    </span>
  );
}

/**
 * Translation key of the explanation for a blocked reason. NoIsolatingWorker has two causes: an Untrusted run that needs
 * Container isolation, and a run that needs egress control because its deployment has an egress allowlist (P11.15).
 */
export function blockedReasonTextKey(run, reason) {
  if (reason === 'NoIsolatingWorker' && run?.requiredCapabilities?.egressControl) return 'components.blocked.reasons.NoIsolatingWorkerEgress';
  return `components.blocked.reasons.${reason}`;
}

/** Run detail notice: what the blocked reason means and where to fix it. */
export function BlockedRunNotice({ run }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const reason = blockedReasonOf(run);
  if (!reason) return null;
  const harness = enumLabel(t, 'harnessType', run.harnessType);
  return (
    <div className="warning-banner blocked-notice" role="status" data-testid="blocked-notice" {...tip(t('tips.blocked.panel'))}>
      <div className="blocked-notice-text">
        <div className="blocked-notice-title">
          <strong>{t('components.blocked.title')}</strong> <BlockedBadge reason={reason} t={t} />
        </div>
        <p>{t('components.blocked.body')}</p>
        <p>{t(blockedReasonTextKey(run, reason), { harness })}</p>
        <p className="text-muted">{t('components.blocked.failNote')}</p>
      </div>
      <div className="blocked-notice-actions">
        <button type="button" className="button-secondary button-sm" onClick={() => navigate(pathFor('nodes'))} {...tip(t('tips.blocked.openFleet'))}>
          {t('components.blocked.openFleet')}
        </button>
        {run.agentId && (
          <button type="button" className="button-secondary button-sm" onClick={() => navigate(pathFor('agents', run.agentId))} {...tip(t('tips.blocked.openAgent'))}>
            {t('components.blocked.openAgent')}
          </button>
        )}
      </div>
    </div>
  );
}

/** Home and Queue banner: how many queued runs are blocked, with a link to the queued runs. */
export function BlockedRunsBanner({ count }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  if (!count) return null;
  return (
    <div className="warning-banner" role="status" data-testid="blocked-banner" {...tip(t('tips.blocked.homeBanner'))}>
      <span>
        {'⚠'} {t('components.blocked.homeBanner', { count })}
      </span>
      <button type="button" className="button-secondary button-sm" onClick={() => navigate(pathFor('runs', null, { status: 'Queued' }))} {...tip(t('tips.blocked.showRuns'))}>
        {t('components.blocked.showRuns')}
      </button>
    </div>
  );
}
