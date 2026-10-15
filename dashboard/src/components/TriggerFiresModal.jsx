import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { ErrorBanner } from './States';
import { tip } from './Tooltip';
import { TriggerFireOutcomeBadge } from './TriggerBadges';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { pathFor } from '../config/navConfig';
import { ENUMS } from '../utils/constants';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { errorMessage } from '../utils/errors';
import { formatDateTime, formatNumber, formatRelativeTime, truncate } from '../i18n/formatters';

const PAGE = 50;

/**
 * Fire history of one trigger (P12.5): newest first, filterable by outcome, with links to the run or pipeline run each
 * fire started and the error of failed and skipped fires.
 */
export default function TriggerFiresModal({ triggerId, triggerName, onClose }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const navigate = useNavigate();
  const lng = i18n.language;
  const [outcome, setOutcome] = useState('');
  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);
  const [name, setName] = useState(triggerName || '');

  const load = useCallback(() => {
    setError(null);
    apiClient
      .listTriggerFires(tenantId, triggerId, { outcome: outcome || undefined, pageNumber: 1, pageSize: PAGE })
      .then(setPage)
      .catch((e) => setError(e));
  }, [apiClient, tenantId, triggerId, outcome]);
  useEffect(load, [load]);
  useEffect(() => {
    if (name || !triggerId) return undefined;
    let active = true;
    apiClient.getTrigger(tenantId, triggerId).then((r) => active && setName(r?.name || '')).catch(() => {});
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, triggerId, name]);

  const open = (path) => {
    onClose();
    navigate(path);
  };
  const th = (key) => (
    <th key={key} {...tip(t(`tips.resources.triggers.fires.${key}`))}>
      {t(`resources.triggers.fires.${key}`)}
    </th>
  );
  const items = page?.items || [];

  return (
    <Modal
      open
      size="xlarge"
      onClose={onClose}
      title={t('components.triggerFires.title')}
      headerMeta={name || triggerId}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={load} {...tip(t('tips.triggerFires.refresh'))}>
            {t('components.table.refresh')}
          </button>
          <button type="button" className="button-primary" onClick={onClose} {...tip(t('tips.modal.close'))}>
            {t('common.actions.close')}
          </button>
        </>
      }
    >
      <div className="filter-inline">
        <label className="filter-select" {...tip(t('tips.filters.outcome'))}>
          <span className="sr-only">{t('resources.triggers.fires.outcome')}</span>
          <select aria-label={t('resources.triggers.fires.outcome')} value={outcome} data-testid="trigger-fires-outcome" onChange={(e) => setOutcome(e.target.value)} {...tip(t('tips.filters.outcome'))}>
            <option value="">{t('resources.triggers.fires.outcome')}: {t('common.generic.all')}</option>
            {ENUMS.triggerFireOutcome.map((o) => (
              <option key={o} value={o}>
                {enumLabel(t, 'triggerFireOutcome', o)}
              </option>
            ))}
          </select>
        </label>
        {page && <span className="text-muted">{t('components.triggerFires.count', { count: page.totalCount ?? items.length, shown: formatNumber(items.length, {}, lng) })}</span>}
      </div>
      {error && <ErrorBanner message={errorMessage(t, error)} onRetry={load} />}
      {!page && !error && <p>{t('common.generic.loading')}</p>}
      {page && items.length === 0 && <p className="text-muted" data-testid="trigger-fires-empty">{t('components.triggerFires.empty')}</p>}
      {items.length > 0 && (
        <table className="data-table compact" data-testid="trigger-fires-table">
          <thead>
            <tr>{['firedUtc', 'source', 'outcome', 'started', 'deliveryId', 'error'].map(th)}</tr>
          </thead>
          <tbody>
            {items.map((f) => (
              <tr key={f.id} data-fire={f.id}>
                <td className="nowrap">
                  <span {...tip(formatDateTime(f.firedUtc, lng))}>{formatRelativeTime(f.firedUtc, lng)}</span>
                  {f.source === 'Cron' && f.scheduledUtc && <div className="text-muted">{t('components.triggerFires.scheduled', { time: formatDateTime(f.scheduledUtc, lng) })}</div>}
                </td>
                <td>
                  <span {...tip(enumTip(t, 'triggerFireSource', f.source))}>{enumLabel(t, 'triggerFireSource', f.source)}</span>
                </td>
                <td>
                  <TriggerFireOutcomeBadge outcome={f.outcome} t={t} />
                </td>
                <td>
                  {f.runId ? (
                    <button type="button" className="button-link" onClick={() => open(pathFor('runs', f.runId))} {...tip(t('tips.triggerFire.openRun'))}>
                      <code>{f.runId}</code>
                    </button>
                  ) : f.pipelineRunId ? (
                    <button type="button" className="button-link" onClick={() => open(pathFor('pipelineRuns', f.pipelineRunId))} {...tip(t('tips.triggerFire.openPipelineRun'))}>
                      <code>{f.pipelineRunId}</code>
                    </button>
                  ) : (
                    '-'
                  )}
                </td>
                <td className="cell-id">{f.deliveryId || '-'}</td>
                <td>{f.errorCode ? <span {...tip(f.errorMessage || f.errorCode)}>{`${f.errorCode}: ${truncate(f.errorMessage || '', 80)}`}</span> : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Modal>
  );
}
