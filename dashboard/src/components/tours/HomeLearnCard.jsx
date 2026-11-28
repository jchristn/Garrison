import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { DASHBOARD_BASE } from '../../config/navConfig';
import { STORAGE_KEYS } from '../../utils/constants';
import { readUserFlag, writeUserFlag } from '../../utils/tours';
import { tip } from '../Tooltip';

/**
 * First run (LP4.8): a person who skipped the setup wizard sees this one card on Home, pointing to the Learn page.
 * Dismissing it is saved for this person in this tenant, so it never comes back for them.
 */
export default function HomeLearnCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { principal } = useAuth();
  const { tenantId } = useApp();
  const [dismissed, setDismissed] = useState(() => readUserFlag(STORAGE_KEYS.learnCardDismissed, principal, tenantId));
  const skipped = readUserFlag(STORAGE_KEYS.setupSkipped, principal, tenantId);
  if (!skipped || dismissed) return null;

  const dismiss = () => {
    writeUserFlag(STORAGE_KEYS.learnCardDismissed, principal, tenantId, true);
    setDismissed(true);
  };

  return (
    <section className="callout home-learn-card" aria-labelledby="home-learn-title" data-testid="home-learn-card">
      <div>
        <strong id="home-learn-title">{t('tours.homeCard.title')}</strong>
        <p className="text-muted">{t('tours.homeCard.body')}</p>
      </div>
      <div className="flex gap-sm">
        <button type="button" className="button-ghost" onClick={dismiss} data-testid="home-learn-dismiss" {...tip(t('tips.tours.homeCardDismiss'))}>
          {t('tours.homeCard.dismiss')}
        </button>
        <button type="button" className="button-primary" onClick={() => navigate(`${DASHBOARD_BASE}/learn`)} data-testid="home-learn-open" {...tip(t('tips.tours.homeCardOpen'))}>
          {t('tours.homeCard.open')}
        </button>
      </div>
    </section>
  );
}
