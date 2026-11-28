import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import CodeBlock from './CodeBlock';
import { ErrorBanner } from './States';
import TableFrame from './TableFrame';
import usePageSizePref from '../hooks/usePageSizePref';
import { tip } from './Tooltip';
import { NotificationDeliveryStatusBadge } from './TriggerBadges';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { ENUMS } from '../utils/constants';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { errorMessage } from '../utils/errors';
import { prettyPayload } from '../utils/triggers';
import { formatDateTime, formatNumber, formatRelativeTime, truncate } from '../i18n/formatters';

const TABLE_ID = 'notification-deliveries';

/** One delivery's fields and payload, used by the delivery log and the test result. */
export function DeliveryDetail({ delivery, t, lng }) {
  if (!delivery) return null;
  const item = (key, value) => (
    <div className="detail-item" key={key}>
      <div className="detail-item-label" {...tip(t(`tips.resources.notifications.deliveries.${key}`))}>{t(`resources.notifications.deliveries.${key}`)}</div>
      <div className="detail-item-value">{value ?? '-'}</div>
    </div>
  );
  const when = (v) => (v ? formatDateTime(v, lng) : '-');
  return (
    <div data-testid="delivery-detail">
      <div className="detail-grid">
        {item('event', <span {...tip(enumTip(t, 'notificationEvent', delivery.event))}>{enumLabel(t, 'notificationEvent', delivery.event)}</span>)}
        {item('status', <NotificationDeliveryStatusBadge status={delivery.status} t={t} />)}
        {item('attempts', `${formatNumber(delivery.attempts ?? 0, {}, lng)} / ${formatNumber(delivery.maxAttempts ?? 0, {}, lng)}`)}
        {item('lastStatusCode', delivery.lastStatusCode ?? '-')}
        {item('lastError', delivery.lastError || '-')}
        {item('lastAttemptUtc', when(delivery.lastAttemptUtc))}
        {item('nextAttemptUtc', when(delivery.nextAttemptUtc))}
        {item('deliveredUtc', when(delivery.deliveredUtc))}
        {item('id', <code>{delivery.id}</code>)}
      </div>
      <div className="field">
        <label {...tip(t('tips.resources.notifications.deliveries.payload'))}>{t('resources.notifications.deliveries.payload')}</label>
        <CodeBlock value={prettyPayload(delivery.payload)} />
      </div>
    </div>
  );
}

/**
 * Delivery log of one notification endpoint (P12.14): newest first, filterable by status. Selecting a row shows its
 * payload, attempts, and last error.
 */
export default function NotificationDeliveriesModal({ endpoint, onClose }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const lng = i18n.language;
  const [status, setStatus] = useState('');
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = usePageSizePref(TABLE_ID, 50);
  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setError(null);
    apiClient
      .listNotificationDeliveries(tenantId, endpoint.id, { status: status || undefined, pageNumber, pageSize })
      .then(setPage)
      .catch((e) => setError(e));
  }, [apiClient, tenantId, endpoint.id, status, pageNumber, pageSize]);
  useEffect(load, [load]);

  const select = (d) => {
    apiClient
      .getNotificationDelivery(tenantId, endpoint.id, d.id)
      .then(setSelected)
      .catch(() => setSelected(d));
  };
  const items = page?.items || [];
  const when = (v) => (v ? <span {...tip(formatDateTime(v, lng))}>{formatRelativeTime(v, lng)}</span> : '-');
  const col = (key, extra) => ({ key, label: t(`resources.notifications.deliveries.${key}`), tip: t(`tips.resources.notifications.deliveries.${key}`), ...extra });
  const columns = [
    col('createdUtc', {
      pinned: true,
      cellClass: 'nowrap',
      render: (d) => (
        <button type="button" className="button-link" onClick={() => select(d)} {...tip(t('tips.notificationDeliveries.open'))}>
          {formatRelativeTime(d.createdUtc, lng)}
        </button>
      )
    }),
    col('event', { render: (d) => <span {...tip(enumTip(t, 'notificationEvent', d.event))}>{enumLabel(t, 'notificationEvent', d.event)}</span> }),
    col('status', { render: (d) => <NotificationDeliveryStatusBadge status={d.status} t={t} /> }),
    col('attempts', { cellClass: 'right', render: (d) => `${formatNumber(d.attempts ?? 0, {}, lng)} / ${formatNumber(d.maxAttempts ?? 0, {}, lng)}` }),
    col('lastStatusCode', { cellClass: 'right', defaultHidden: true, render: (d) => d.lastStatusCode ?? '-' }),
    col('lastError', { render: (d) => (d.lastError ? <span {...tip(d.lastError)}>{truncate(d.lastError, 60)}</span> : '-') }),
    col('nextAttemptUtc', { cellClass: 'nowrap', defaultHidden: true, render: (d) => when(d.nextAttemptUtc) }),
    col('deliveredUtc', { cellClass: 'nowrap', render: (d) => when(d.deliveredUtc) })
  ];

  return (
    <Modal
      open
      size="xlarge"
      onClose={onClose}
      title={t('components.notificationDeliveries.title')}
      headerMeta={endpoint.name}
      footer={
        <>
          <button type="button" className="button-primary" onClick={onClose} {...tip(t('tips.modal.close'))}>
            {t('common.actions.close')}
          </button>
        </>
      }
    >
      <div className="filter-inline">
        <label className="filter-select" {...tip(t('tips.filters.deliveryStatus'))}>
          <span className="sr-only">{t('resources.notifications.deliveries.status')}</span>
          <select aria-label={t('resources.notifications.deliveries.status')} value={status} data-testid="deliveries-status" onChange={(e) => {
              setStatus(e.target.value);
              setPageNumber(1);
            }} {...tip(t('tips.filters.deliveryStatus'))}>
            <option value="">{t('resources.notifications.deliveries.status')}: {t('common.generic.all')}</option>
            {ENUMS.notificationDeliveryStatus.map((o) => (
              <option key={o} value={o}>
                {enumLabel(t, 'notificationDeliveryStatus', o)}
              </option>
            ))}
          </select>
        </label>
        {page && <span className="text-muted">{t('components.notificationDeliveries.count', { count: page.totalCount ?? items.length, shown: formatNumber(items.length, {}, lng) })}</span>}
      </div>
      {error && <ErrorBanner message={errorMessage(t, error)} onRetry={load} />}
      {!page && !error && <p>{t('common.generic.loading')}</p>}
      {page && (
        <TableFrame
          tableId={TABLE_ID}
          columns={columns}
          items={items}
          compact
          testId="deliveries-table"
          rowProps={(d) => ({ 'data-delivery': d.id, className: selected?.id === d.id ? 'is-selected' : '' })}
          emptyMessage={t('components.notificationDeliveries.empty')}
          onRowClick={select}
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
      {selected && (
        <div className="form-section">
          <div className="form-section-title" {...tip(t('tips.notificationDeliveries.detail'))}>{t('components.notificationDeliveries.detail')}</div>
          <DeliveryDetail delivery={selected} t={t} lng={lng} />
        </div>
      )}
    </Modal>
  );
}
