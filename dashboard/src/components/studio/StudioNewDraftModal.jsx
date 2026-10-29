import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal';
import { ErrorBanner } from '../States';
import { tip } from '../Tooltip';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { errorMessage } from '../../utils/errors';

/**
 * Start a studio draft (AD7.10): a title, and optionally an existing app to start from (the server exports the app with
 * everything it references, one item per document). `onCreated(draft)` receives the new draft.
 */
export default function StudioNewDraftModal({ onClose, onCreated }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [title, setTitle] = useState('');
  const [fromApp, setFromApp] = useState('');
  const [apps, setApps] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!apiClient?.listApps) return;
    apiClient
      .listApps(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => setApps(r.items || []))
      .catch(() => setApps([]));
  }, [apiClient, tenantId]);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const body = {};
      if (title.trim()) body.title = title.trim();
      if (fromApp) body.fromApp = fromApp;
      const created = await apiClient.createStudioDraft(tenantId, body);
      onCreated?.(created);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      size="medium"
      onClose={onClose}
      title={t('components.studio.newDraft.title')}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={submit} disabled={busy} data-testid="studio-new-draft-create" {...tip(t('tips.studio.newDraft.create'))}>
            {busy ? t('components.studio.newDraft.creating') : t('components.studio.newDraft.create')}
          </button>
        </>
      }
    >
      <p className="text-muted">{t('components.studio.newDraft.intro')}</p>
      <div className="field">
        <label htmlFor="studio-draft-title" {...tip(t('tips.studio.newDraft.titleField'))}>
          {t('components.studio.newDraft.titleField')}
        </label>
        <input
          id="studio-draft-title"
          value={title}
          maxLength={256}
          placeholder={t('components.studio.newDraft.titlePlaceholder')}
          onChange={(e) => setTitle(e.target.value)}
          data-testid="studio-draft-title"
          {...tip(t('tips.studio.newDraft.titleField'))}
        />
      </div>
      <div className="field">
        <label htmlFor="studio-draft-from-app" {...tip(t('tips.studio.newDraft.fromApp'))}>
          {t('components.studio.newDraft.fromApp')}
        </label>
        <select id="studio-draft-from-app" value={fromApp} onChange={(e) => setFromApp(e.target.value)} data-testid="studio-draft-from-app" {...tip(t('tips.studio.newDraft.fromApp'))}>
          <option value="">{t('components.studio.newDraft.emptyDraft')}</option>
          {apps.map((a) => (
            <option key={a.id} value={a.name}>
              {a.name}
            </option>
          ))}
        </select>
        <div className="field-hint">{t('components.studio.newDraft.fromAppHint')}</div>
      </div>
      {error && <ErrorBanner message={errorMessage(t, error)} />}
    </Modal>
  );
}
