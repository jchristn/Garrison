import { useEffect, useState } from 'react';
import { agentSelectLabel } from '../utils/agentLabel';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { ENUMS, REPORT_LIMITS } from '../utils/constants';
import { errorDetail, errorMessageWithDetail } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { blankReport, notifyReportsChanged, reportErrors, reportToBody } from '../utils/reports';

const ENUM_FIELDS = [
  ['kind', 'reportKind'],
  ['health', 'reportHealth'],
  ['audience', 'reportAudience']
];

/**
 * File a report from the dashboard (AA5.10): a title, kind, health, audience, an optional agent to file it for, and a
 * plain-text body. Metrics, issues, and decisions come from runs and the API, not this form. A report cannot be
 * changed once filed. onDone(report) receives the filed report.
 */
export default function FileReportModal({ onClose, onDone }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [form, setForm] = useState(blankReport);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    if (!apiClient?.listAgents) return undefined;
    let cancelled = false;
    apiClient
      .listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })
      .then((page) => !cancelled && setAgents((page.items || []).map((a) => ({ value: a.id, label: agentSelectLabel(a) }))))
      .catch(() => !cancelled && setAgents([]));
    return () => {
      cancelled = true;
    };
  }, [apiClient, tenantId]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((x) => ({ ...x, [key]: undefined }));
  };

  const submit = async () => {
    const found = reportErrors(form, t);
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setError('');
    try {
      const filed = await apiClient.fileReport(tenantId, reportToBody(form));
      addToast({ type: 'success', message: t('reports.toasts.filed', { title: filed?.title || form.title.trim() }) });
      notifyReportsChanged();
      onDone?.(filed || null);
    } catch (e) {
      setError(`${errorMessageWithDetail(t, e)} ${errorDetail(t, e)}`.trim());
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      onClose={() => !busy && onClose?.()}
      size="medium"
      title={t('reports.file.title')}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose} disabled={busy} {...tip(t('tips.modal.cancelForm'))}>
            {t('common.actions.cancel')}
          </button>
          <button type="button" className="button-primary" onClick={submit} disabled={busy} data-testid="report-file-submit" {...tip(t('tips.reports.file.submit'))}>
            {busy ? t('common.generic.saving') : t('reports.actions.file')}
          </button>
        </>
      }
    >
      <div className="flex-col gap-md" data-testid="report-file">
        <p className="text-muted">{t('reports.file.intro')}</p>
        <div className="form-grid">
          <div className="field span-full">
            <label htmlFor="report-title" {...tip(t('tips.reports.file.fields.title'))}>
              {t('reports.file.fields.title')}
            </label>
            <input
              id="report-title"
              type="text"
              maxLength={REPORT_LIMITS.titleMax}
              value={form.title}
              disabled={busy}
              aria-invalid={errors.title ? 'true' : undefined}
              onChange={(e) => set('title', e.target.value)}
              data-testid="report-file-title"
              {...tip(t('tips.reports.file.fields.title'))}
            />
            {errors.title && <div className="field-error">{errors.title}</div>}
          </div>
          {ENUM_FIELDS.map(([name, group]) => (
            <div className="field" key={name}>
              <label htmlFor={`report-${name}`} {...tip(t(`tips.reports.file.fields.${name}`))}>
                {t(`reports.file.fields.${name}`)}
              </label>
              <select id={`report-${name}`} value={form[name]} disabled={busy} onChange={(e) => set(name, e.target.value)} data-testid={`report-file-${name}`} {...tip(t(`tips.reports.file.fields.${name}`))}>
                {ENUMS[group].map((v) => (
                  <option key={v} value={v} {...tip(enumTip(t, group, v))}>
                    {enumLabel(t, group, v)}
                  </option>
                ))}
              </select>
            </div>
          ))}
          <div className="field">
            <label htmlFor="report-agent" {...tip(t('tips.reports.file.fields.agent'))}>
              {t('reports.file.fields.agent')}
            </label>
            <select id="report-agent" value={form.agent} disabled={busy} onChange={(e) => set('agent', e.target.value)} data-testid="report-file-agent" {...tip(t('tips.reports.file.fields.agent'))}>
              <option value="">{t('reports.file.noAgent')}</option>
              {agents.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field span-full">
            <label htmlFor="report-body" {...tip(t('tips.reports.file.fields.body'))}>
              {t('reports.file.fields.body')}
            </label>
            <textarea
              id="report-body"
              rows={6}
              value={form.body}
              disabled={busy}
              aria-invalid={errors.body ? 'true' : undefined}
              onChange={(e) => set('body', e.target.value)}
              data-testid="report-file-body"
              {...tip(t('tips.reports.file.fields.body'))}
            />
            {errors.body && <div className="field-error">{errors.body}</div>}
          </div>
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
