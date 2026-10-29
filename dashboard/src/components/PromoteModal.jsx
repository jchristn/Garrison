import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { ErrorBanner } from './States';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { errorMessage, errorDetail } from '../utils/errors';
import { environmentNames, nextEnvironment, promotionBody, promotionErrors, publishedRevisions, skipsEnvironments } from '../utils/revisions';

function FieldError({ message }) {
  if (!message) return null;
  return (
    <div className="field-error" role="alert">
      {message}
    </div>
  );
}

/**
 * Promote an agent revision to the next environment (AD1.9). The source environment is required; the target defaults
 * to the environment after it, and a target that skips one needs Allow skipping. The revision defaults to the one the
 * source environment runs. Server refusals (PromotionOrderViolation, NoTargetDeployments, 403 without Execute on
 * Promotion for the target, and so on) show in the dialog as translated messages.
 */
export default function PromoteModal({ initial = {}, onClose, onPromoted }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [agents, setAgents] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [revisions, setRevisions] = useState([]);
  const [form, setForm] = useState({ agentId: initial.agentId || '', sourceEnvironment: initial.sourceEnvironment || '', targetEnvironment: '', agentRevisionId: '', allowSkip: false, note: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!apiClient) return;
    apiClient
      .listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((r) => setAgents(r.items || []))
      .catch(() => setAgents([]));
    apiClient
      .getEnvironments(tenantId)
      .then((r) => setEnvironments(r?.environments || []))
      .catch(() => setEnvironments([]));
  }, [apiClient, tenantId]);

  useEffect(() => {
    if (!apiClient || !form.agentId) {
      setRevisions([]);
      return undefined;
    }
    let active = true;
    apiClient
      .listAgentRevisions(tenantId, form.agentId)
      .then((r) => active && setRevisions(publishedRevisions(r.items || [])))
      .catch(() => active && setRevisions([]));
    return () => {
      active = false;
    };
  }, [apiClient, tenantId, form.agentId]);

  const names = environmentNames(environments, [form.sourceEnvironment]);
  const source = form.sourceEnvironment || '';
  const next = source ? nextEnvironment(environments, source) : '';
  const target = form.targetEnvironment || next;
  const skips = !!source && !!target && skipsEnvironments(environments, source, target);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const submit = async () => {
    const found = promotionErrors(form, environments, t);
    setErrors(found);
    setError(null);
    if (Object.keys(found).length) return;
    setBusy(true);
    try {
      const record = await apiClient.promote(tenantId, promotionBody(form, environments));
      addToast({ type: 'success', message: t('components.promote.promoted', { target: record?.targetEnvironment || target, deployments: (record?.items || []).length }) });
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
      onClose={onClose}
      title={t('components.promote.title')}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.close'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={submit} disabled={busy} data-testid="promote-submit" {...tip(t('tips.promote.submit'))}>
            {busy ? t('components.promote.promoting') : t('components.promote.submit')}
          </button>
        </>
      }
    >
      {error && (
        <div data-testid="promote-error">
          <ErrorBanner message={`${errorMessage(t, error)} ${errorDetail(t, error)}`.trim()} />
        </div>
      )}
      <p className="field-hint">{t('components.promote.intro')}</p>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="promote-agent" {...tip(t('tips.promote.agent'))}>{t('components.promote.agent')}</label>
          <select id="promote-agent" value={form.agentId} onChange={(e) => set({ agentId: e.target.value, agentRevisionId: '' })} {...tip(t('tips.promote.agent'))}>
            <option value="">-</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
            {form.agentId && !agents.some((a) => a.id === form.agentId) && <option value={form.agentId}>{form.agentId}</option>}
          </select>
          <FieldError message={errors.agentId} />
        </div>
        <div className="field">
          <label htmlFor="promote-revision" {...tip(t('tips.promote.revision'))}>{t('components.promote.revision')}</label>
          <select id="promote-revision" value={form.agentRevisionId} onChange={(e) => set({ agentRevisionId: e.target.value })} {...tip(t('tips.promote.revision'))}>
            <option value="">{t('components.promote.revisionFromSource')}</option>
            {revisions.map((r) => (
              <option key={r.id} value={r.id}>
                {t('components.revisions.number', { number: r.number })}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="promote-source" {...tip(t('tips.promote.source'))}>{t('components.promote.source')}</label>
          <select id="promote-source" value={source} onChange={(e) => set({ sourceEnvironment: e.target.value, targetEnvironment: '', allowSkip: false })} {...tip(t('tips.promote.source'))}>
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
          <label htmlFor="promote-target" {...tip(t('tips.promote.target'))}>{t('components.promote.target')}</label>
          <select id="promote-target" value={form.targetEnvironment} onChange={(e) => set({ targetEnvironment: e.target.value })} {...tip(t('tips.promote.target'))}>
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
            <input id="promote-allow-skip" type="checkbox" checked={form.allowSkip} onChange={(e) => set({ allowSkip: e.target.checked })} {...tip(t('tips.promote.allowSkip'))} />
            <label htmlFor="promote-allow-skip" {...tip(t('tips.promote.allowSkip'))}>{t('components.promote.allowSkip')}</label>
            <div className="field-hint span-full">{t('components.promote.skipWarning', { source, target })}</div>
            <FieldError message={errors.allowSkip} />
          </div>
        )}
        <div className="field span-full">
          <label htmlFor="promote-note" {...tip(t('tips.promote.note'))}>{t('components.promote.note')}</label>
          <textarea id="promote-note" rows={2} maxLength={2000} value={form.note} placeholder={t('components.promote.notePlaceholder')} onChange={(e) => set({ note: e.target.value })} {...tip(t('tips.promote.note'))} />
        </div>
      </div>
    </Modal>
  );
}
