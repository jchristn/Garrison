import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { ErrorBanner } from './States';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { errorMessage, errorDetail } from '../utils/errors';
import { environmentNames, nextEnvironment, skipsEnvironments } from '../utils/revisions';
import { appPromotionBody, appPromotionErrors, holds } from '../utils/apps';

function FieldError({ message }) {
  if (!message) return null;
  return (
    <div className="field-error" role="alert">
      {message}
    </div>
  );
}

/**
 * Promote an app (AD6.4): every member's pinned revision of a published app revision moves to every deployment of that
 * member in the target environment, in one transaction. The source environment is required; the target defaults to
 * the next one, and a target that skips one needs Allow skipping. Refusals stay in the dialog as translated messages,
 * among them 409 NoTargetDeployments naming the member that has no deployment there (nothing moves) and 403 without
 * Execute on Promotion for the target. `permissions` warns before submitting when the caller cannot promote to the
 * chosen target.
 */
export default function AgenticAppPromoteModal({ app, revisions = [], permissions = null, onClose, onPromoted }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const published = revisions.filter((r) => r.state === 'Published');
  const [environments, setEnvironments] = useState([]);
  const [form, setForm] = useState({ sourceEnvironment: app?.liveEnvironment || 'dev', targetEnvironment: '', appRevision: '', allowSkip: false, note: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!apiClient?.getEnvironments) return;
    apiClient
      .getEnvironments(tenantId)
      .then((r) => setEnvironments(r?.environments || []))
      .catch(() => setEnvironments([]));
  }, [apiClient, tenantId]);

  const names = environmentNames(environments, [form.sourceEnvironment]);
  const source = form.sourceEnvironment || '';
  const next = source ? nextEnvironment(environments, source) : '';
  const target = form.targetEnvironment || next;
  const skips = !!source && !!target && skipsEnvironments(environments, source, target);
  const targetDenied = target && !holds(permissions, 'Promotion', 'Execute', { resourceId: target });
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    const found = appPromotionErrors(form, environments, t);
    setErrors(found);
    setError(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const record = await apiClient.promoteApp(tenantId, app.id, appPromotionBody(form, environments));
      addToast({ type: 'success', message: t('components.apps.promote.promoted', { target: record?.targetEnvironment || target, deployments: (record?.items || []).length }) });
      onPromoted?.(record);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={() => !busy && onClose()}
      title={t('components.apps.promote.title')}
      headerMeta={<code className="cell-id">{app?.name}</code>}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.close'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={submit} disabled={busy} data-testid="app-promote-submit" {...tip(t('tips.apps.promote.submit'))}>
            {busy ? t('components.promote.promoting') : t('components.promote.submit')}
          </button>
        </>
      }
    >
      {error && (
        <div data-testid="app-promote-error">
          <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} />
        </div>
      )}
      <p className="field-hint">{t('components.apps.promote.intro')}</p>
      {targetDenied && (
        <div className="warning-banner" role="status" data-testid="app-promote-denied">
          {t('components.apps.promote.denied', { target })}
        </div>
      )}
      <div className="form-grid">
        <div className="field">
          <label htmlFor="app-promote-revision" {...tip(t('tips.apps.promote.revision'))}>{t('components.apps.promote.revision')}</label>
          <select id="app-promote-revision" value={form.appRevision} onChange={(e) => set({ appRevision: e.target.value })} {...tip(t('tips.apps.promote.revision'))}>
            <option value="">{t('components.apps.promote.latestRevision')}</option>
            {published.map((r) => (
              <option key={r.id} value={String(r.number)}>
                {t('components.revisions.number', { number: r.number })}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="app-promote-source" {...tip(t('tips.apps.promote.source'))}>{t('components.promote.source')}</label>
          <select id="app-promote-source" value={source} onChange={(e) => set({ sourceEnvironment: e.target.value, targetEnvironment: '', allowSkip: false })} {...tip(t('tips.apps.promote.source'))}>
            <option value="">-</option>
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
          <FieldError message={errors.sourceEnvironment} />
        </div>
        <div className="field">
          <label htmlFor="app-promote-target" {...tip(t('tips.apps.promote.target'))}>{t('components.promote.target')}</label>
          <select id="app-promote-target" value={form.targetEnvironment} onChange={(e) => set({ targetEnvironment: e.target.value })} {...tip(t('tips.apps.promote.target'))}>
            <option value="">{t('components.promote.targetNext', { name: next || '-' })}</option>
            {names
              .filter((n) => n !== source)
              .map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
          </select>
          <FieldError message={errors.targetEnvironment} />
        </div>
        {skips && (
          <div className="field field-checkbox span-full">
            <input id="app-promote-allow-skip" type="checkbox" checked={form.allowSkip} onChange={(e) => set({ allowSkip: e.target.checked })} {...tip(t('tips.promote.allowSkip'))} />
            <label htmlFor="app-promote-allow-skip" {...tip(t('tips.promote.allowSkip'))}>{t('components.promote.allowSkip')}</label>
            <div className="field-hint span-full">{t('components.promote.skipWarning', { source, target })}</div>
            <FieldError message={errors.allowSkip} />
          </div>
        )}
        <div className="field span-full">
          <label htmlFor="app-promote-note" {...tip(t('tips.promote.note'))}>{t('components.promote.note')}</label>
          <textarea id="app-promote-note" rows={2} maxLength={2000} value={form.note} placeholder={t('components.promote.notePlaceholder')} onChange={(e) => set({ note: e.target.value })} {...tip(t('tips.promote.note'))} />
          <FieldError message={errors.note} />
        </div>
      </div>
    </Modal>
  );
}
