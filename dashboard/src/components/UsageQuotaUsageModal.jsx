import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Modal from './Modal';
import { ErrorBanner } from './States';
import { tip } from './Tooltip';
import { errorMessage } from '../utils/errors';
import { formatNumber, formatCurrency, formatDateTime } from '../i18n/formatters';

/** Daily UTC usage and explicit missing-cost coverage. */
export default function UsageQuotaUsageModal({ quota, tenantId, onClose }) {
  const { apiClient } = useAuth();
  const { t, i18n } = useTranslation();
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let active = true;
    apiClient.getUsageQuotaUsage(tenantId, quota.id).then((value) => active && setUsage(value)).catch((e) => active && setError(e));
    return () => { active = false; };
  }, [apiClient, tenantId, quota.id]);
  const keys = ['windowStartUtc', 'windowEndUtc', 'runsUsed', 'tokensUsed', 'costUsd', 'unknownCostRuns', 'activeRuns'];
  const render = (key) => key.endsWith('Utc') ? formatDateTime(usage[key], i18n.language) : key === 'costUsd' ? formatCurrency(usage[key], i18n.language) : formatNumber(usage[key], i18n.language);
  return (
    <Modal open title={t('resources.usageQuotas.actions.usage')} headerMeta={quota.name} onClose={onClose} footer={<button type="button" className="button-secondary" onClick={onClose} {...tip(t('tips.modal.close'))}>{t('common.actions.close')}</button>}>
      {error && <ErrorBanner message={errorMessage(t, error)} />}
      {!usage && !error && <p>{t('common.generic.loading')}</p>}
      {usage && <>
        {!usage.costAccountingComplete && <p className="state-block state-warning" data-testid="quota-cost-incomplete">{t('resources.usageQuotas.incomplete', { count: usage.unknownCostRuns })}</p>}
        <div className="detail-grid" data-testid="quota-usage">
          {keys.map((key) => <div className="detail-item" key={key} data-usage={key}><div className="detail-item-label" {...tip(t(`tips.resources.usageQuotas.usage.${key}`))}>{t(`resources.usageQuotas.usage.${key}`)}</div><div className="detail-item-value">{render(key)}</div></div>)}
        </div>
      </>}
    </Modal>
  );
}
