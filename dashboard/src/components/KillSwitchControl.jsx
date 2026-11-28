import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';
import { Badge } from './StatusBadge';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import useCallerPermissions from '../hooks/useCallerPermissions';
import { FREEZE_LIMITS } from '../utils/constants';
import { errorMessage } from '../utils/errors';
import { FREEZES_CHANGED_EVENT, freezeDenied, notifyFreezesChanged, reasonError } from '../utils/freezes';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters';

/**
 * The tenant's autonomy kill switch (AA3), on Settings and the Home Autonomy card: its state, who changed it and why,
 * and a button that turns it on or off after a confirmation with an optional reason. While it is on no keeper tick
 * starts and keeper runs are refused; ordinary invocations keep working. Hidden when the caller cannot read it (403)
 * or the server has no kill switch route (404). `compact` drops the explanation for the Home card.
 */
export default function KillSwitchControl({ compact = false }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const permissions = useCallerPermissions();
  const [state, setState] = useState(undefined);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState(null);
  const lng = i18n.language;

  const load = useCallback(() => {
    if (!apiClient?.getKillSwitch || !tenantId) return;
    apiClient
      .getKillSwitch(tenantId)
      .then(setState)
      .catch((e) => setState((prev) => (e?.status === 403 || e?.status === 404 ? null : prev)));
  }, [apiClient, tenantId]);

  useEffect(() => {
    load();
    window.addEventListener(FREEZES_CHANGED_EVENT, load);
    return () => window.removeEventListener(FREEZES_CHANGED_EVENT, load);
  }, [load]);

  if (!state) return null;
  const on = !!state.enabled;
  const denied = freezeDenied(t, permissions, 'Update');

  const submit = async () => {
    const tooLong = reasonError(t, reason, FREEZE_LIMITS.reasonMax);
    if (tooLong) return setError(tooLong);
    setError(null);
    try {
      const next = await apiClient.setKillSwitch(tenantId, { enabled: !on, reason: reason.trim() || null });
      setState(next);
      setConfirming(false);
      addToast({ type: on ? 'success' : 'warning', message: t(on ? 'freezes.killSwitch.toasts.off' : 'freezes.killSwitch.toasts.on') });
      notifyFreezesChanged();
    } catch (e) {
      setError(errorMessage(t, e));
    }
  };

  return (
    <div className={`kill-switch ${on ? 'kill-switch-on' : ''} ${compact ? 'kill-switch-compact' : 'panel'}`} data-testid="kill-switch" data-tour="kill-switch" data-enabled={on ? 'true' : 'false'}>
      <div className="kill-switch-head">
        <span className="kill-switch-title" {...tip(t('tips.freezes.killSwitch.title'))}>
          {t('freezes.killSwitch.title')}
        </span>
        <Badge tone={on ? 'danger' : 'success'} tip={t(on ? 'tips.freezes.killSwitch.on' : 'tips.freezes.killSwitch.off')}>
          {t(on ? 'freezes.killSwitch.on' : 'freezes.killSwitch.off')}
        </Badge>
        <button
          type="button"
          className={on ? 'button-secondary button-sm' : 'button-danger button-sm'}
          aria-disabled={denied ? 'true' : undefined}
          onClick={() => {
            if (denied) return;
            setReason('');
            setError(null);
            setConfirming(true);
          }}
          data-testid="kill-switch-toggle"
          {...tip(denied || t(on ? 'tips.freezes.killSwitch.turnOff' : 'tips.freezes.killSwitch.turnOn'))}
        >
          {t(on ? 'freezes.killSwitch.turnOff' : 'freezes.killSwitch.turnOn')}
        </button>
      </div>
      {!compact && <p className="text-muted kill-switch-help">{t('freezes.killSwitch.help')}</p>}
      {on && (state.changedByName || state.changedUtc) && (
        <p className="kill-switch-meta" data-testid="kill-switch-meta">
          <span {...tip(state.changedUtc ? formatDateTime(state.changedUtc, lng) : '')}>
            {t('freezes.killSwitch.changedBy', { who: state.changedByName || '-', when: state.changedUtc ? formatRelativeTime(state.changedUtc, lng) : '-' })}
          </span>
          {state.reason && <span> {t('freezes.bannerReason', { reason: state.reason })}</span>}
        </p>
      )}
      <ConfirmModal
        open={confirming}
        danger={!on}
        title={t(on ? 'freezes.killSwitch.offTitle' : 'freezes.killSwitch.onTitle')}
        message={t(on ? 'freezes.killSwitch.offMessage' : 'freezes.killSwitch.onMessage')}
        confirmLabel={t(on ? 'freezes.killSwitch.turnOff' : 'freezes.killSwitch.turnOn')}
        confirmTip={t(on ? 'tips.freezes.killSwitch.turnOff' : 'tips.freezes.killSwitch.turnOn')}
        error={error}
        onCancel={() => setConfirming(false)}
        onConfirm={submit}
        details={
          <div className="field">
            <label htmlFor="kill-switch-reason" {...tip(t('tips.freezes.fields.reason'))}>
              {t('freezes.fields.reason')}
            </label>
            <textarea id="kill-switch-reason" rows={3} maxLength={FREEZE_LIMITS.reasonMax} value={reason} onChange={(e) => setReason(e.target.value)} data-testid="kill-switch-reason" {...tip(t('tips.freezes.fields.reason'))} />
          </div>
        }
      />
    </div>
  );
}
