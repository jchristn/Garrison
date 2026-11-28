import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { ErrorBanner } from './States';
import TableFrame from './TableFrame';
import usePageSizePref from '../hooks/usePageSizePref';
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

const TABLE_ID = 'trigger-fires';

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
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = usePageSizePref(TABLE_ID, 50);
  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);
  const [name, setName] = useState(triggerName || '');

  const load = useCallback(() => {
    setError(null);
    apiClient
      .listTriggerFires(tenantId, triggerId, { outcome: outcome || undefined, pageNumber, pageSize })
      .then(setPage)
      .catch((e) => setError(e));
  }, [apiClient, tenantId, triggerId, outcome, pageNumber, pageSize]);
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
  const items = page?.items || [];
  const col = (key, extra) => ({ key, label: t(`resources.triggers.fires.${key}`), tip: t(`tips.resources.triggers.fires.${key}`), ...extra });
  const columns = [
    col('firedUtc', {
      pinned: true,
      cellClass: 'nowrap',
      render: (f) => (
        <>
          <span {...tip(formatDateTime(f.firedUtc, lng))}>{formatRelativeTime(f.firedUtc, lng)}</span>
          {f.source === 'Cron' && f.scheduledUtc && <div className="text-muted">{t('components.triggerFires.scheduled', { time: formatDateTime(f.scheduledUtc, lng) })}</div>}
        </>
      )
    }),
    col('source', { render: (f) => <span {...tip(enumTip(t, 'triggerFireSource', f.source))}>{enumLabel(t, 'triggerFireSource', f.source)}</span> }),
    col('outcome', { render: (f) => <TriggerFireOutcomeBadge outcome={f.outcome} t={t} /> }),
    col('started', {
      render: (f) =>
        f.runId ? (
          <button type="button" className="button-link" onClick={() => open(pathFor('runs', f.runId))} {...tip(t('tips.triggerFire.openRun'))}>
            <code>{f.runId}</code>
          </button>
        ) : f.pipelineRunId ? (
          <button type="button" className="button-link" onClick={() => open(pathFor('pipelineRuns', f.pipelineRunId))} {...tip(t('tips.triggerFire.openPipelineRun'))}>
            <code>{f.pipelineRunId}</code>
          </button>
        ) : (
          '-'
        )
    }),
    col('deliveryId', { cellClass: 'cell-id', defaultHidden: true, render: (f) => f.deliveryId || '-' }),
    col('error', { render: (f) => (f.errorCode ? <span {...tip(f.errorMessage || f.errorCode)}>{`${f.errorCode}: ${truncate(f.errorMessage || '', 80)}`}</span> : '-') })
  ];

  return (
    <Modal
      open
      size="xlarge"
      onClose={onClose}
      title={t('components.triggerFires.title')}
      headerMeta={name || triggerId}
      footer={
        <>
          <button type="button" className="button-primary" onClick={onClose} {...tip(t('tips.modal.close'))}>
            {t('common.actions.close')}
          </button>
        </>
      }
    >
      <div className="filter-inline">
        <label className="filter-select" {...tip(t('tips.filters.outcome'))}>
          <span className="sr-only">{t('resources.triggers.fires.outcome')}</span>
          <select aria-label={t('resources.triggers.fires.outcome')} value={outcome} data-testid="trigger-fires-outcome" onChange={(e) => {
              setOutcome(e.target.value);
              setPageNumber(1);
            }} {...tip(t('tips.filters.outcome'))}>
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
      {page && (
        <TableFrame
          tableId={TABLE_ID}
          columns={columns}
          items={items}
          compact
          testId="trigger-fires-table"
          rowProps={(f) => ({ 'data-fire': f.id })}
          emptyMessage={t('components.triggerFires.empty')}
          totalRecords={page.totalCount ?? items.length}
          pageNumber={pageNumber}
          pageSize={pageSize}
          onPageChange={setPageNumber}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPageNumber(1);
          }}
          onRefresh={load}
        />
      )}
    </Modal>
  );
}
