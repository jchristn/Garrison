import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { ErrorBanner } from './States';
import { tip } from './Tooltip';

/**
 * Confirmation dialog. Set `danger` for destructive actions. `details` renders below the message (lists of affected
 * records). With `confirmWord` (for example 'delete'), the person must type that word into a box before the confirm
 * button works, so a stray click cannot destroy something that cannot be brought back. `error` shows a message above
 * the buttons and keeps the dialog open.
 */
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
  confirmWord = '',
  error = null,
  onConfirm,
  onCancel
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState('');
  const inputId = useId();
  // Start empty every time the dialog opens.
  useEffect(() => {
    if (open) setTyped('');
  }, [open]);
  const blocked = !!confirmWord && typed.trim() !== confirmWord;

  const handleConfirm = async () => {
    if (blocked) return;
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
            aria-disabled={blocked ? 'true' : undefined}
            data-testid="confirm-button"
            {...tip(blocked ? t('tips.confirm.typeFirst', { word: confirmWord }) : confirmTip || t(danger ? 'tips.confirm.danger' : 'tips.confirm.confirm'))}
          >
            {confirmLabel || t('common.actions.confirm')}
          </button>
        </>
      }
    >
      <p style={{ fontSize: 'var(--font-size-sm)' }}>{message || t('components.confirm.message')}</p>
      {details}
      {confirmWord && (
        <form
          className="field"
          onSubmit={(e) => {
            e.preventDefault();
            handleConfirm();
          }}
        >
          <label htmlFor={inputId} {...tip(t('tips.confirm.typeToConfirm', { word: confirmWord }))}>
            {t('components.confirm.typeToConfirm', { word: confirmWord })}
          </label>
          <input
            id={inputId}
            value={typed}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={confirmWord}
            onChange={(e) => setTyped(e.target.value)}
            data-testid="confirm-word"
            {...tip(t('tips.confirm.typeToConfirm', { word: confirmWord }))}
          />
        </form>
      )}
      {error && <ErrorBanner message={error} />}
    </Modal>
  );
}
