import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { FREEZE_LIMITS, FREEZE_TARGET_KINDS } from '../utils/constants';
import { errorMessage } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { notifyFreezesChanged, reasonError } from '../utils/freezes';

const PAGE = { pageNumber: 1, pageSize: 1000 };

/** Pick-list entries for one target kind: { value, label }. */
async function targetsOf(apiClient, tenantId, kind) {
  const list = {
    Agent: () => apiClient.listAgents(tenantId, PAGE),
    Deployment: () => apiClient.listDeployments(tenantId, PAGE),
    Mandate: () => apiClient.listMandates(tenantId, PAGE),
    App: () => apiClient.listApps(tenantId, PAGE)
  }[kind];
  if (!list) return [];
  const page = await list();
  return (page.items || []).map((r) => ({ value: r.id, label: r.displayName || r.name || r.id }));
}

/**
 * Confirm, then freeze one target (AA3). With `targetKind` and `targetId` the target is fixed (the agent, deployment,
 * keeper, or app page); without them the person picks the kind and the target (the Freezes page). The reason is
 * optional; "Cancel active runs" also cancels the runs already in scope. New runs in scope are refused with 409
 * Frozen until the freeze is lifted.
 */
export default function FreezeModal({ targetKind = null, targetId = null, targetName = null, onClose, onDone }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const fixed = !!(targetKind && targetId);
  const [kind, setKind] = useState(targetKind || 'Agent');
  const [target, setTarget] = useState(targetId || '');
  const [options, setOptions] = useState([]);
  const [reason, setReason] = useState('');
  const [cancelActive, setCancelActive] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (fixed || !apiClient) return undefined;
    let cancelled = false;
    targetsOf(apiClient, tenantId, kind)
      .then((list) => !cancelled && setOptions(list))
      .catch(() => !cancelled && setOptions([]));
    return () => {
      cancelled = true;
    };
  }, [fixed, apiClient, tenantId, kind]);

  const name = fixed ? targetName || targetId : options.find((o) => o.value === target)?.label || target;
  const what = `${enumLabel(t, 'freezeTargetKind', kind)} ${name || ''}`.trim();

  const submit = async () => {
    const tooLong = reasonError(t, reason, FREEZE_LIMITS.reasonMax);
    if (tooLong) return setError(tooLong);
    if (!target) return setError(t('freezes.errors.target'));
    setError(null);
    try {
      const freeze = await apiClient.applyFreeze(tenantId, { targetKind: kind, targetId: target, reason: reason.trim() || null, cancelActiveRuns: cancelActive });
      const cancelled = freeze?.cancelledRunCount || 0;
      addToast({ type: 'success', message: cancelled > 0 ? t('freezes.toasts.frozenCancelled', { target: what, count: cancelled }) : t('freezes.toasts.frozen', { target: what }) });
      notifyFreezesChanged();
      onDone?.(freeze);
    } catch (e) {
      setError(errorMessage(t, e));
    }
  };

  return (
    <ConfirmModal
      open
      danger
      title={t('freezes.freezeTitle')}
      message={fixed ? t('freezes.freezeMessage', { target: what }) : t('freezes.freezePickMessage')}
      confirmLabel={t('freezes.actions.freeze')}
      confirmTip={t('tips.freezes.actions.freeze')}
      error={error}
      onCancel={onClose}
      onConfirm={submit}
      details={
        <div className="form-grid" data-testid="freeze-form">
          {!fixed && (
            <>
              <div className="field">
                <label htmlFor="freeze-kind" {...tip(t('tips.freezes.fields.targetKind'))}>
                  {t('freezes.fields.targetKind')}
                </label>
                <select
                  id="freeze-kind"
                  value={kind}
                  onChange={(e) => {
                    setKind(e.target.value);
                    setTarget('');
                  }}
                  data-testid="freeze-kind"
                  {...tip(t('tips.freezes.fields.targetKind'))}
                >
                  {FREEZE_TARGET_KINDS.map((k) => (
                    <option key={k} value={k} {...tip(enumTip(t, 'freezeTargetKind', k))}>
                      {enumLabel(t, 'freezeTargetKind', k)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="freeze-target" {...tip(t('tips.freezes.fields.target'))}>
                  {t('freezes.fields.target')}
                </label>
                <select id="freeze-target" value={target} onChange={(e) => setTarget(e.target.value)} data-testid="freeze-target" {...tip(t('tips.freezes.fields.target'))}>
                  <option value="">{t('freezes.pickTarget')}</option>
                  {options.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div className="field span-full">
            <label htmlFor="freeze-reason" {...tip(t('tips.freezes.fields.reason'))}>
              {t('freezes.fields.reason')}
            </label>
            <textarea id="freeze-reason" rows={3} maxLength={FREEZE_LIMITS.reasonMax} value={reason} placeholder={t('freezes.reasonPlaceholder')} onChange={(e) => setReason(e.target.value)} data-testid="freeze-reason" {...tip(t('tips.freezes.fields.reason'))} />
          </div>
          <div className="field field-checkbox span-full">
            <input id="freeze-cancel-active" type="checkbox" checked={cancelActive} onChange={(e) => setCancelActive(e.target.checked)} data-testid="freeze-cancel-active" {...tip(t('tips.freezes.fields.cancelActiveRuns'))} />
            <label htmlFor="freeze-cancel-active" {...tip(t('tips.freezes.fields.cancelActiveRuns'))}>
              {t('freezes.fields.cancelActiveRuns')}
            </label>
          </div>
        </div>
      }
    />
  );
}
