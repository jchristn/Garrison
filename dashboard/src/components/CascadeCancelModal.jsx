import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { ErrorBanner } from './States';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { ORGANIZATION_LIMITS } from '../utils/constants';
import { errorMessage } from '../utils/errors';
import { formatNumber } from '../i18n/formatters';
import { cascadeBody, cascadeCounts } from '../utils/performance';

/**
 * "Cancel everything in this unit" (AA11.4): names the unit and asks for confirmation with an optional reason, then
 * calls POST /organizations/{id}/units/{unitId}/cancel-all and shows how many runs, keeper ticks, escalations, and
 * messages it stopped. The route does not freeze, so the result offers a separate freeze through `onFreeze` when given.
 * unit: { id, name }. onDone(result) runs once the cancel finished; onClose closes the dialog.
 */
export default function CascadeCancelModal({ organizationId, unit, onClose, onDone, onFreeze }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const lng = i18n.language;
  const name = unit?.name || unit?.id || '';

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await apiClient.cancelOrgUnitAll(tenantId, organizationId, unit.id, cascadeBody(reason));
      setResult(r || {});
      addToast({ type: 'success', message: t('cascadeCancel.done', { name }) });
      onDone?.(r);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  const footer = result ? (
    <>
      {onFreeze && (
        <button type="button" className="button-secondary" onClick={() => onFreeze(unit)} data-testid="cascade-cancel-freeze" {...tip(t('tips.cascadeCancel.freeze'))}>
          {t('cascadeCancel.freeze')}
        </button>
      )}
      <button type="button" className="button-primary" onClick={onClose} data-testid="cascade-cancel-close" {...tip(t('tips.modal.close'))}>
        {t('common.actions.close')}
      </button>
    </>
  ) : (
    <>
      <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.confirm.cancel'))}>
        {t('cascadeCancel.keep')}
      </button>
      <button type="button" className="button-danger" onClick={confirm} disabled={busy} data-testid="cascade-cancel-confirm" {...tip(t('tips.cascadeCancel.confirm'))}>
        {busy ? t('cascadeCancel.working') : t('cascadeCancel.confirm')}
      </button>
    </>
  );

  return (
    <Modal open onClose={busy ? () => {} : onClose} size="small" title={t('cascadeCancel.title', { name })} footer={footer}>
      <div data-testid="cascade-cancel-modal">
        {result ? (
          <div data-testid="cascade-cancel-result" role="status">
            <p>{t('cascadeCancel.resultIntro', { name: result.unitName || name })}</p>
            <dl className="cascade-counts">
              {cascadeCounts(result).map((c) => (
                <div key={c.key} className="cascade-count" data-count={c.key}>
                  <dt {...tip(t(`tips.cascadeCancel.counts.${c.key}`))}>{t(`cascadeCancel.counts.${c.key}`)}</dt>
                  <dd>{formatNumber(c.value, {}, lng)}</dd>
                </div>
              ))}
            </dl>
            <p className="text-muted">{t('cascadeCancel.notFrozen')}</p>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 'var(--font-size-sm)' }}>{t('cascadeCancel.message', { name })}</p>
            <div className="field">
              <label htmlFor="cascade-cancel-reason" {...tip(t('tips.cascadeCancel.reason'))}>
                {t('cascadeCancel.reason')}
              </label>
              <input
                id="cascade-cancel-reason"
                value={reason}
                maxLength={ORGANIZATION_LIMITS.cascadeReasonMax}
                disabled={busy}
                onChange={(e) => setReason(e.target.value)}
                placeholder={t('cascadeCancel.reasonPlaceholder')}
                data-testid="cascade-cancel-reason"
                {...tip(t('tips.cascadeCancel.reason'))}
              />
            </div>
            {error && <ErrorBanner message={errorMessage(t, error)} />}
          </>
        )}
      </div>
    </Modal>
  );
}
