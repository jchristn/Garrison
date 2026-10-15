import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import CopyButton from './CopyButton';
import { tip } from './Tooltip';
import { SIGNATURE_FORMAT, WEBHOOK_HEADERS } from '../utils/triggers';

/**
 * Shows a webhook signing secret exactly once (P12.5, P12.14): the server returns it only from create and rotate-secret
 * and never again, and the dashboard does not keep it. For a trigger it also shows the webhook URL to send to.
 */
export default function SigningSecretModal({ secret, name, url, onClose }) {
  const { t } = useTranslation();
  return (
    <Modal
      open
      onClose={onClose}
      title={t('components.signingSecret.title')}
      headerMeta={name}
      footer={
        <button type="button" className="button-primary" onClick={onClose} data-testid="signing-secret-done" {...tip(t('tips.signingSecret.done'))}>
          {t('components.signingSecret.done')}
        </button>
      }
    >
      <div className="warning-banner" role="note" data-testid="signing-secret-warning">{t('components.signingSecret.warning')}</div>
      <div className="field">
        <label {...tip(t('tips.signingSecret.secret'))}>{t('components.signingSecret.secret')}</label>
        <div className="secret-row">
          <code data-testid="signing-secret-value">{secret || '-'}</code>
          {secret && <CopyButton value={secret} tipText={t('tips.signingSecret.copy')} />}
        </div>
      </div>
      {url && (
        <div className="field">
          <label {...tip(t('tips.signingSecret.url'))}>{t('components.signingSecret.url')}</label>
          <div className="secret-row">
            <code data-testid="signing-secret-url">{url}</code>
            <CopyButton value={url} tipText={t('tips.signingSecret.copyUrl')} />
          </div>
        </div>
      )}
      <p className="field-hint">{t('components.signingSecret.scheme', { header: WEBHOOK_HEADERS.signature, format: SIGNATURE_FORMAT, delivery: WEBHOOK_HEADERS.delivery })}</p>
    </Modal>
  );
}
