import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { tip } from './Tooltip';

/** Confirmation dialog. Set `danger` for destructive actions. `details` renders below the message (lists of affected records). */
export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = false,
  confirmTip,
  cancelTip,
  details,
  onConfirm,
  onCancel
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    try {
      setBusy(true);
      await onConfirm?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      size="small"
      title={title || t('components.confirm.title')}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onCancel} disabled={busy} {...tip(cancelTip || t('tips.confirm.cancel'))}>
            {cancelLabel || t('common.actions.cancel')}
          </button>
          <button
            type="button"
            className={danger ? 'button-danger' : 'button-primary'}
            onClick={handleConfirm}
            disabled={busy}
            {...tip(confirmTip || t(danger ? 'tips.confirm.danger' : 'tips.confirm.confirm'))}
          >
            {confirmLabel || t('common.actions.confirm')}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 'var(--font-size-sm)' }}>{message || t('components.confirm.message')}</p>
      {details}
    </Modal>
  );
}
