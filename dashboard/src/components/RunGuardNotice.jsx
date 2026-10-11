import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { tip } from './Tooltip';
import { pathFor } from '../config/navConfig';
import { useAuth } from '../context/AuthContext';
import { guardOutcome } from '../utils/runGuards';
import { translateServerText } from '../utils/serverText';
import { formatNumber } from '../i18n/formatters';

/**
 * Explains a run that a run guard stopped (P3.15): which guard tripped and what it saw, that the partial output was
 * kept, and (when `detailed`) how to tune the limits on the deployment. Renders nothing for any other run.
 */
export default function RunGuardNotice({ run, detailed = false, deploymentName = null, testId = 'run-guard-notice' }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { principal } = useAuth();
  const outcome = guardOutcome(run);
  if (!outcome) return null;
  const chars = (run.resultText || '').length;
  return (
    <div className="warning-banner guard-notice" role="note" data-testid={testId} data-outcome={outcome}>
      <strong className="guard-notice-title">{t(`views.runGuard.titles.${outcome}`)}</strong>
      <p>{t(`views.runGuard.bodies.${outcome}`)}</p>
      {run.errorMessage && (
        <p data-testid="run-guard-reason">{t('views.runGuard.detected', { reason: translateServerText(t, run.errorMessage), interpolation: { escapeValue: false } })}</p>
      )}
      <p>{chars > 0 ? t('views.runGuard.partialKept', { chars: formatNumber(chars, {}, i18n.language) }) : t('views.runGuard.noPartial')}</p>
      {detailed && (
        <>
          <p>{deploymentName ? t('views.runGuard.tune', { deployment: deploymentName, interpolation: { escapeValue: false } }) : t('views.runGuard.tuneAny')}</p>
          <div className="flex gap-sm">
            <button type="button" className="button-secondary button-sm" onClick={() => navigate(pathFor('deployments'))} data-testid="run-guard-deployments" {...tip(t('tips.views.runGuard.openDeployments'))}>
              {t('views.runGuard.openDeployments')}
            </button>
            {principal?.isAdmin && (
              <button type="button" className="button-secondary button-sm" onClick={() => navigate(pathFor('settings'))} data-testid="run-guard-settings" {...tip(t('tips.views.runGuard.openSettings'))}>
                {t('views.runGuard.openSettings')}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
