import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { tip } from './Tooltip';
import { EVAL_LIMITS } from '../utils/constants';
import { errorMessage, errorDetail } from '../utils/errors';

/**
 * Confirm a stop with an optional reason (AA9.15): cancelling an eval run, stopping a shadow trial, or aborting a
 * canary release. onConfirm(reason) returns a promise; a refusal shows in the dialog and keeps it open.
 */
export default function EvalReasonModal({ title, message, confirmLabel, confirmTip, onConfirm, onClose, testId = 'eval-reason' }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm(reason.trim() || null);
    } catch (e) {
      setError(`${errorMessage(t, e)} ${errorDetail(t, e)}`.trim());
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={() => !busy && onClose?.()}
      size="small"
      title={title}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-danger" onClick={submit} disabled={busy} data-testid={`${testId}-confirm`} {...tip(confirmTip)}>
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex-col gap-md" data-testid={testId}>
        <p>{message}</p>
        <div className="field">
          <label htmlFor={`${testId}-text`} {...tip(t('tips.evals.reason'))}>
            {t('evals.reason.label')}
          </label>
          <textarea id={`${testId}-text`} rows={3} maxLength={EVAL_LIMITS.reasonMax} value={reason} disabled={busy} placeholder={t('evals.reason.placeholder')} onChange={(e) => setReason(e.target.value)} data-testid={`${testId}-text`} {...tip(t('tips.evals.reason'))} />
        </div>
        {error && (
          <div className="error-banner" role="alert">
            {error}
          </div>
        )}
      </div>
    </Modal>
  );
}
