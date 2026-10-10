import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import JsonViewerModal from '../components/JsonViewerModal';
import LanguageSelector from '../components/LanguageSelector';
import { LoadingState, ErrorBanner, EmptyState } from '../components/States';
import { Badge } from '../components/StatusBadge';
import { EyeIcon, EyeOffIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ApiClient from '../utils/api';
import { normalizeSettings, groupSettings, clampSetting } from '../utils/settings';
import { errorMessage } from '../utils/errors';

function SecretInput({ id, value, isSet, onChange, disabled, t }) {
  const [reveal, setReveal] = useState(false);
  return (
    <div className="password-wrap">
      <input id={id} type={reveal ? 'text' : 'password'} value={value ?? ''} disabled={disabled} placeholder={isSet ? t('views.settings.secretSet') : t('views.settings.secretNotSet')} onChange={(e) => onChange(e.target.value)} autoComplete="new-password" />
      <button type="button" className="icon-button" onClick={() => setReveal((v) => !v)} aria-label={reveal ? t('common.actions.hide') : t('common.actions.reveal')} title={reveal ? t('common.actions.hide') : t('common.actions.reveal')}>
        {reveal ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

/** Form-based server and cluster settings with sources, live versus restart-required badges, and Restart Server. */
export default function SettingsView() {
  const { t } = useTranslation();
  const { apiClient, serverUrl, principal } = useAuth();
  const { addToast } = useToast();
  const [fields, setFields] = useState(null);
  const [raw, setRaw] = useState(null);
  const [edits, setEdits] = useState({});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [restartPending, setRestartPending] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [confirmRestart, setConfirmRestart] = useState(false);
  const [jsonOpen, setJsonOpen] = useState(false);
  const [dbTest, setDbTest] = useState(null);
  const canEdit = !!principal?.isAdmin;

  const load = useCallback(() => {
    if (!apiClient) return;
    apiClient
      .getSettings()
      .then((r) => {
        setRaw(r);
        setFields(normalizeSettings(r));
        setRestartPending((prev) => prev || !!r?.restartPending);
        setEdits({});
        setErrors({});
        setError(null);
      })
      .catch(setError);
  }, [apiClient]);

  useEffect(load, [load]);

  const groups = useMemo(() => groupSettings(fields || []), [fields]);
  const dirty = Object.keys(edits).length > 0;

  const setValue = (f, v) => setEdits((prev) => ({ ...prev, [f.path]: f.type === 'number' || f.type === 'integer' ? clampSetting(f, v) : v }));

  const save = async () => {
    const local = {};
    for (const f of fields || []) {
      if (!(f.path in edits)) continue;
      const v = edits[f.path];
      if (f.type === 'number' || f.type === 'integer') {
        if (v === '' || v === null || Number.isNaN(Number(v))) local[f.path] = t('views.settings.invalidNumber');
      }
    }
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    const values = {};
    for (const [path, v] of Object.entries(edits)) {
      const f = fields.find((x) => x.path === path);
      if (f?.isSecret && !v) continue;
      values[path] = v;
    }
    setSaving(true);
    try {
      const result = await apiClient.updateSettings({ values });
      const needsRestart = result?.restartRequired ?? Object.keys(values).some((p) => fields.find((f) => f.path === p)?.applyMode === 'RestartRequired');
      if (needsRestart) setRestartPending(true);
      addToast({ type: 'success', message: needsRestart ? t('views.settings.savedRestart') : t('views.settings.savedLive') });
      load();
    } catch (e) {
      if (e?.fields) setErrors(e.fields);
      addToast({ type: 'error', message: errorMessage(t, e) });
    } finally {
      setSaving(false);
    }
  };

  const restart = async () => {
    setConfirmRestart(false);
    setRestarting(true);
    try {
      await apiClient.restartServer();
    } catch {
      /* the connection may drop as the server exits */
    }
    const probe = new ApiClient(serverUrl, null);
    const started = Date.now();
    await new Promise((r) => setTimeout(r, 1500));
    for (;;) {
      try {
        await probe.healthCheck();
        break;
      } catch {
        if (Date.now() - started > 180000) {
          addToast({ type: 'error', message: t('views.settings.restartTimeout') });
          setRestarting(false);
          return;
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
    setRestarting(false);
    setRestartPending(false);
    addToast({ type: 'success', message: t('views.settings.restarted') });
    load();
  };

  const testDb = async () => {
    setDbTest({ busy: true });
    try {
      const body = {};
      for (const f of fields || []) if (f.path.startsWith('Database.')) body[f.path.slice(9).charAt(0).toLowerCase() + f.path.slice(10)] = f.path in edits ? edits[f.path] : f.value;
      const r = await apiClient.testDatabaseConnection(body);
      setDbTest({ ok: r?.ok ?? true, message: r?.message });
    } catch (e) {
      setDbTest({ ok: false, message: errorMessage(t, e) });
    }
  };

  if (error && !fields) {
    return (
      <div>
        <PageHeader title={t('views.settings.title')} subtitle={t('views.settings.subtitle')} />
        <ErrorBanner message={errorMessage(t, error)} onRetry={load} />
        <EmptyState title={t('views.settings.unavailableTitle')} body={t('views.settings.unavailableBody')} />
      </div>
    );
  }
  if (!fields) return <LoadingState />;

  return (
    <div className={restarting ? 'is-restarting' : ''}>
      <PageHeader
        title={t('views.settings.title')}
        subtitle={t('views.settings.subtitle')}
        actions={
          <>
            <LanguageSelector />
            <button type="button" className="button-secondary" onClick={() => setJsonOpen(true)}>
              {t('common.actions.viewJson')}
            </button>
            {canEdit && (
              <button type="button" className="button-danger" onClick={() => setConfirmRestart(true)} disabled={restarting} data-testid="restart-server">
                {t('views.settings.restart')}
              </button>
            )}
            {canEdit && (
              <button type="button" className="button-primary" onClick={save} disabled={!dirty || saving || restarting} data-testid="save-settings">
                {saving ? t('common.generic.saving') : t('common.actions.save')}
              </button>
            )}
          </>
        }
      />
      {!canEdit && <div className="warning-banner">{t('views.settings.readOnly')}</div>}
      {restartPending && !restarting && <div className="warning-banner" role="status">{t('views.settings.restartBanner')}</div>}
      {restarting && (
        <div className="info-banner" role="status">
          <span className="loading-spinner small" /> {t('views.settings.restarting')}
        </div>
      )}
      {Object.keys(errors).length > 0 && <div className="error-banner">{t('common.errors.fixFields')}</div>}

      {groups.map((g) => (
        <fieldset key={g.name} className="panel settings-group">
          <legend className="section-title">{t(`views.settings.groups.${g.name}`, { defaultValue: g.name })}</legend>
          <div className="form-grid">
            {g.fields.map((f) => {
              const id = `setting-${f.path}`;
              const value = f.path in edits ? edits[f.path] : f.isSecret ? '' : f.value;
              const disabled = !canEdit || !f.editable || restarting;
              const label = t(`views.settings.fields.${f.path}`, { defaultValue: f.label || f.path });
              return (
                <div key={f.path} className={`field ${errors[f.path] ? 'has-error' : ''} ${f.type === 'list' ? 'span-full' : ''}`}>
                  <label htmlFor={id} className="settings-label">
                    <span>{label}</span>
                    <span className="settings-badges">
                      <Badge tone={f.applyMode === 'Live' ? 'success' : 'warning'}>{f.applyMode === 'Live' ? t('views.settings.live') : t('views.settings.restartRequired')}</Badge>
                      <Badge>{t(`views.settings.sources.${f.source}`, { defaultValue: f.source })}</Badge>
                    </span>
                  </label>
                  {f.type === 'boolean' ? (
                    <input id={id} type="checkbox" checked={!!value} disabled={disabled} onChange={(e) => setValue(f, e.target.checked)} />
                  ) : f.isSecret ? (
                    <SecretInput id={id} value={value} isSet={f.isSet} disabled={disabled} onChange={(v) => setValue(f, v)} t={t} />
                  ) : f.options ? (
                    <select id={id} value={value ?? ''} disabled={disabled} onChange={(e) => setValue(f, e.target.value)}>
                      {f.options.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : f.type === 'number' || f.type === 'integer' ? (
                    <input id={id} type="number" min={f.min ?? undefined} max={f.max ?? undefined} value={value ?? ''} disabled={disabled} onChange={(e) => setValue(f, e.target.value === '' ? '' : Number(e.target.value))} />
                  ) : f.type === 'list' ? (
                    <textarea id={id} className="monospace" rows={3} value={(Array.isArray(value) ? value : []).join('\n')} disabled={disabled} onChange={(e) => setValue(f, e.target.value.split('\n'))} />
                  ) : (
                    <input id={id} type="text" value={value ?? ''} disabled={disabled} onChange={(e) => setValue(f, e.target.value)} />
                  )}
                  {(f.min !== undefined && f.min !== null) || (f.max !== undefined && f.max !== null) ? <div className="field-hint">{t('views.settings.range', { min: f.min ?? '-', max: f.max ?? '-' })}</div> : null}
                  {!f.editable && <div className="field-hint">{t(`views.settings.lockedBy.${f.source}`, { defaultValue: t('views.settings.lockedBy.other') })}</div>}
                  {errors[f.path] && <div className="field-error">{errors[f.path]}</div>}
                </div>
              );
            })}
          </div>
          {g.name === 'Database' && canEdit && (
            <div className="settings-panel-actions">
              <button type="button" className="button-secondary button-sm" onClick={testDb} disabled={dbTest?.busy}>
                {dbTest?.busy ? t('views.settings.testing') : t('views.settings.testDatabase')}
              </button>
              {dbTest && !dbTest.busy && <Badge tone={dbTest.ok ? 'success' : 'danger'}>{dbTest.ok ? t('views.settings.dbOk') : dbTest.message || t('views.settings.dbFailed')}</Badge>}
            </div>
          )}
        </fieldset>
      ))}

      <ConfirmModal open={confirmRestart} danger title={t('views.settings.restartConfirmTitle')} message={t('views.settings.restartConfirmMessage')} confirmLabel={t('views.settings.restart')} onConfirm={restart} onCancel={() => setConfirmRestart(false)} />
      <JsonViewerModal open={jsonOpen} value={raw} onClose={() => setJsonOpen(false)} />
    </div>
  );
}
