import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import CodeBlock from './CodeBlock';
import { ErrorBanner } from './States';
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

const PAGE = 50;

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
  const [page, setPage] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    setError(null);
    apiClient
      .listNotificationDeliveries(tenantId, endpoint.id, { status: status || undefined, pageNumber: 1, pageSize: PAGE })
      .then(setPage)
      .catch((e) => setError(e));
  }, [apiClient, tenantId, endpoint.id, status]);
  useEffect(load, [load]);

  const select = (d) => {
    apiClient
      .getNotificationDelivery(tenantId, endpoint.id, d.id)
      .then(setSelected)
      .catch(() => setSelected(d));
  };
  const th = (key) => (
    <th key={key} {...tip(t(`tips.resources.notifications.deliveries.${key}`))}>
      {t(`resources.notifications.deliveries.${key}`)}
    </th>
  );
  const items = page?.items || [];
  const when = (v) => (v ? <span {...tip(formatDateTime(v, lng))}>{formatRelativeTime(v, lng)}</span> : '-');

  return (
    <Modal
      open
      size="xlarge"
      onClose={onClose}
      title={t('components.notificationDeliveries.title')}
      headerMeta={endpoint.name}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={load} {...tip(t('tips.notificationDeliveries.refresh'))}>
            {t('components.table.refresh')}
          </button>
          <button type="button" className="button-primary" onClick={onClose} {...tip(t('tips.modal.close'))}>
            {t('common.actions.close')}
          </button>
        </>
      }
    >
      <div className="filter-inline">
        <label className="filter-select" {...tip(t('tips.filters.deliveryStatus'))}>
          <span className="sr-only">{t('resources.notifications.deliveries.status')}</span>
          <select aria-label={t('resources.notifications.deliveries.status')} value={status} data-testid="deliveries-status" onChange={(e) => setStatus(e.target.value)} {...tip(t('tips.filters.deliveryStatus'))}>
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
      {page && items.length === 0 && <p className="text-muted" data-testid="deliveries-empty">{t('components.notificationDeliveries.empty')}</p>}
      {items.length > 0 && (
        <table className="data-table compact" data-testid="deliveries-table">
          <thead>
            <tr>{['createdUtc', 'event', 'status', 'attempts', 'lastStatusCode', 'lastError', 'nextAttemptUtc', 'deliveredUtc'].map(th)}</tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} data-delivery={d.id} className={selected?.id === d.id ? 'selected' : ''}>
                <td className="nowrap">
                  <button type="button" className="button-link" onClick={() => select(d)} {...tip(t('tips.notificationDeliveries.open'))}>
                    {formatRelativeTime(d.createdUtc, lng)}
                  </button>
                </td>
                <td>
                  <span {...tip(enumTip(t, 'notificationEvent', d.event))}>{enumLabel(t, 'notificationEvent', d.event)}</span>
                </td>
                <td>
                  <NotificationDeliveryStatusBadge status={d.status} t={t} />
                </td>
                <td className="right">{`${formatNumber(d.attempts ?? 0, {}, lng)} / ${formatNumber(d.maxAttempts ?? 0, {}, lng)}`}</td>
                <td className="right">{d.lastStatusCode ?? '-'}</td>
                <td>{d.lastError ? <span {...tip(d.lastError)}>{truncate(d.lastError, 60)}</span> : '-'}</td>
                <td className="nowrap">{when(d.nextAttemptUtc)}</td>
                <td className="nowrap">{when(d.deliveredUtc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
