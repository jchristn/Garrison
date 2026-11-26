import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { FREEZE_LIMITS } from '../utils/constants';
import { errorMessage } from '../utils/errors';
import { freezeTargetText, notifyFreezesChanged, reasonError } from '../utils/freezes';

/**
 * Confirm, then lift an active freeze (AA3). New runs in scope are accepted again; a frozen keeper becomes Active with
 * its next wake spread over a short window. A freeze someone else already lifted answers 409 FreezeLifted, which is
 * shown in the dialog.
 */
export default function LiftFreezeModal({ freeze, onClose, onDone }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const target = freezeTargetText(t, freeze);

  const submit = async () => {
    const tooLong = reasonError(t, reason, FREEZE_LIMITS.reasonMax);
    if (tooLong) return setError(tooLong);
    setError(null);
    try {
      const lifted = await apiClient.liftFreeze(tenantId, freeze.id, { reason: reason.trim() || null });
      addToast({ type: 'success', message: t('freezes.toasts.lifted', { target }) });
      notifyFreezesChanged();
      onDone?.(lifted);
    } catch (e) {
      setError(errorMessage(t, e));
      if (e?.code === 'FreezeLifted') notifyFreezesChanged();
    }
  };

  return (
    <ConfirmModal
      open
      title={t('freezes.liftTitle')}
      message={freeze?.targetKind === 'Mandate' ? t('freezes.liftKeeperMessage', { target }) : t('freezes.liftMessage', { target })}
      confirmLabel={t('freezes.actions.lift')}
      confirmTip={t('tips.freezes.actions.lift')}
      error={error}
      onCancel={onClose}
      onConfirm={submit}
      details={
        <div className="field" data-testid="lift-form">
          <label htmlFor="lift-reason" {...tip(t('tips.freezes.fields.liftReason'))}>
            {t('freezes.fields.liftReason')}
          </label>
          <textarea id="lift-reason" rows={3} maxLength={FREEZE_LIMITS.reasonMax} value={reason} onChange={(e) => setReason(e.target.value)} data-testid="lift-reason" {...tip(t('tips.freezes.fields.liftReason'))} />
        </div>
      }
    />
  );
}
