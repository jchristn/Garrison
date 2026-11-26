import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';
import { tip } from './Tooltip';
import { RefreshIcon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../utils/errors';
import { formatNumber } from '../i18n/formatters';
import { notifyMemoryChanged, scopeText } from '../utils/memory';

/**
 * Confirm, then delete one memory entry (AA4.13). The delete carries the version the person saw, so an entry an agent
 * rewrote in the meantime is not removed: the server answers 409 MemoryVersionConflict, the dialog says so and offers
 * Reload, which reads the entry again so the person can decide on what it holds now. An entry already gone (404) is
 * reported and the page reloads.
 */
export default function DeleteMemoryModal({ entry, names = {}, onClose, onDone }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [current, setCurrent] = useState(entry);
  const [error, setError] = useState(null);
  const [conflict, setConflict] = useState(false);
  const [reloading, setReloading] = useState(false);
  const [reloaded, setReloaded] = useState(false);
  const scope = scopeText(t, current.scopeKind, current.scopeId, names);

  const submit = async () => {
    setError(null);
    try {
      await apiClient.deleteMemoryEntry(tenantId, current.id, current.version);
      addToast({ type: 'success', message: t('memory.toasts.deleted', { key: current.key }) });
      notifyMemoryChanged();
      onDone?.();
    } catch (e) {
      if (e?.code === 'MemoryVersionConflict') {
        setConflict(true);
        setReloaded(false);
        setError(t('memory.errors.conflict', { version: formatNumber(current.version ?? 0, {}, i18n.language) }));
      } else if (e?.status === 404) {
        setError(t('memory.errors.gone'));
        notifyMemoryChanged();
      } else {
        setError(errorMessage(t, e));
      }
    }
  };

  const reload = async () => {
    setReloading(true);
    try {
      const fresh = await apiClient.getMemoryEntry(tenantId, current.id);
      setCurrent(fresh);
      setConflict(false);
      setReloaded(true);
      setError(null);
      notifyMemoryChanged();
    } catch (e) {
      setError(e?.status === 404 ? t('memory.errors.gone') : errorMessage(t, e));
      if (e?.status === 404) notifyMemoryChanged();
    } finally {
      setReloading(false);
    }
  };

  return (
    <ConfirmModal
      open
      danger
      title={t('memory.deleteTitle')}
      message={t('memory.deleteMessage', { key: current.key, scope })}
      confirmLabel={t('common.actions.delete')}
      confirmTip={t('tips.memory.actions.confirmDelete')}
      error={error}
      onCancel={onClose}
      onConfirm={submit}
      details={
        <div className="memory-delete-details" data-testid="memory-delete">
          <p className="text-muted memory-delete-version" data-testid="memory-delete-version">
            {t(reloaded ? 'memory.deleteReloaded' : 'memory.deleteVersion', { version: formatNumber(current.version ?? 0, {}, i18n.language) })}
          </p>
          {conflict && (
            <button type="button" className="button-secondary button-sm" onClick={reload} disabled={reloading} data-testid="memory-delete-reload" {...tip(t('tips.memory.actions.reload'))}>
              <RefreshIcon /> {t('memory.actions.reload')}
            </button>
          )}
        </div>
      }
    />
  );
}
