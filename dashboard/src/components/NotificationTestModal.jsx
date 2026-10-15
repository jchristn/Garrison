import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { ErrorBanner } from './States';
import { tip } from './Tooltip';
import { DeliveryDetail } from './NotificationDeliveriesModal';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { errorMessage, errorDetail } from '../utils/errors';

/**
 * Send a test notification (P12.14) and show the delivery after its first attempt: Succeeded when the endpoint
 * answered 2xx, Pending with the error when a retryable failure schedules another attempt, or Failed.
 */
export default function NotificationTestModal({ endpoint, onClose }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [delivery, setDelivery] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    apiClient
      .testNotificationEndpoint(tenantId, endpoint.id)
      .then((d) => active && setDelivery(d))
      .catch((e) => active && setError(e));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, endpoint.id]);

  const outcome = delivery ? (delivery.status === 'Succeeded' ? 'succeeded' : delivery.status === 'Failed' ? 'failed' : 'pending') : null;
  return (
    <Modal
      open
      size="large"
      onClose={onClose}
      title={t('components.notificationTest.title')}
      headerMeta={endpoint.name}
      footer={
        <button type="button" className="button-primary" onClick={onClose} {...tip(t('tips.modal.close'))}>
          {t('common.actions.close')}
        </button>
      }
    >
      {error && <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} />}
      {!delivery && !error && <p data-testid="notification-test-sending">{t('components.notificationTest.sending')}</p>}
      {delivery && (
        <>
          <div className={outcome === 'succeeded' ? 'info-banner' : 'warning-banner'} role="status" data-testid="notification-test-result" data-outcome={outcome}>
            {t(`components.notificationTest.${outcome}`)}
          </div>
          <DeliveryDetail delivery={delivery} t={t} lng={i18n.language} />
        </>
      )}
    </Modal>
  );
}
