import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FormField } from './FormFields';
import { ErrorBanner } from './States';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { errorMessage } from '../utils/errors';
import { blankInferenceEndpoint, inferenceCredentials, INFERENCE_AUTH_TYPES } from '../utils/inferenceEndpoints';

/** Shared protocol and secret-backed HTTP authentication editor. Plaintext exists only while adding a secret. */
export default function InferenceEndpointFields({ value, onChange, disabled = false, errors = {}, idPrefix = 'inference' }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [secrets, setSecrets] = useState([]);
  const [adding, setAdding] = useState(null);
  const [name, setName] = useState('');
  const [secretValue, setSecretValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const endpoint = value || blankInferenceEndpoint();
  const type = endpoint.authenticationType;
  const update = (patch) => onChange({ ...endpoint, ...patch });
  const load = useCallback(() => {
    if (!apiClient) return;
    apiClient.listSecrets(tenantId, { pageSize: 1000, pageNumber: 1 }).then((r) => setSecrets((r.items || []).filter((s) => s.active !== false && !['GenericFile', 'CodexAuthJson'].includes(s.kind)))).catch(() => setSecrets([]));
  }, [apiClient, tenantId]);
  useEffect(load, [load]);

  const credential = (index, patch) => update({ credentials: endpoint.credentials.map((c, i) => i === index ? { ...c, ...patch } : c) });
  const saveValue = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await apiClient.createSecret(tenantId, { name: name.trim(), kind: type === 'BearerToken' ? 'BearerToken' : 'GenericEnv', value: secretValue, active: true });
      setSecrets((list) => [...list, created]);
      credential(adding, { secretId: created.id });
      setSecretValue('');
      setName('');
      setAdding(null);
      load();
    } catch (e) { setError(e); }
    finally { setBusy(false); }
  };
  const failures = Object.entries(errors).filter(([key]) => key.startsWith('inferenceEndpoint')).map(([, text]) => text);
  return (
    <section className="inference-endpoint span-full" data-testid={`${idPrefix}-endpoint`}>
      <div className="section-title">{t('inference.title')}</div>
      <p className="field-hint">{t('inference.hint')}</p>
      <div className="form-grid">
        <FormField id={`${idPrefix}-protocol`} field={{ type: 'select', required: true, label: t('inference.protocol'), options: [{ value: 'OpenAiCompatible', label: 'OpenAI-compatible' }, { value: 'Ollama', label: 'Ollama API' }], tip: t('inference.protocol') }} value={endpoint.protocol} onChange={(protocol) => update({ protocol })} disabled={disabled} />
        <FormField id={`${idPrefix}-base-url`} field={{ type: 'text', label: t('inference.baseUrl'), required: true, placeholder: endpoint.protocol === 'Ollama' ? 'https://ollama.com' : 'https://api.openai.com/v1', tip: t('inference.hint') }} value={endpoint.baseUrl} onChange={(baseUrl) => update({ baseUrl })} disabled={disabled} />
        <FormField id={`${idPrefix}-authentication`} field={{ type: 'select', required: true, label: t('inference.authentication'), options: INFERENCE_AUTH_TYPES.map((auth) => ({ value: auth, label: t(`inference.auth.${auth}`) })), tip: t('inference.authentication') }} value={type} onChange={(authenticationType) => { setAdding(null); setSecretValue(''); update({ authenticationType, credentials: inferenceCredentials(authenticationType) }); }} disabled={disabled} />
      </div>
      {(endpoint.credentials || []).map((c, i) => (
        <div key={i} className="inference-credential" data-testid={`${idPrefix}-credential-${i}`}>
          <div className="form-grid">
            {['ApiKey', 'Headers', 'QueryString'].includes(type) && <FormField id={`${idPrefix}-name-${i}`} field={{ type: 'text', label: t('inference.name'), required: true, tip: t('inference.name') }} value={c.name} onChange={(name) => credential(i, { name })} disabled={disabled} />}
            {type === 'ApiKey' && <FormField id={`${idPrefix}-location-${i}`} field={{ type: 'select', required: true, label: t('inference.location'), options: [{ value: 'Header', label: t('inference.header') }, { value: 'QueryString', label: t('inference.query') }], tip: t('inference.location') }} value={c.location} onChange={(location) => credential(i, { location })} disabled={disabled} />}
            <FormField id={`${idPrefix}-secret-${i}`} field={{ type: 'select', label: type === 'Basic' ? t(`inference.${c.name}`) : t('inference.secret'), required: true, options: [{ value: '', label: t('common.generic.none') }, ...secrets.map((s) => ({ value: s.id, label: `${s.name} (${s.kind})` })), ...(c.secretId && !secrets.some((s) => s.id === c.secretId) ? [{ value: c.secretId, label: c.secretId }] : [])], tip: t('inference.hint') }} value={c.secretId || ''} onChange={(secretId) => credential(i, { secretId })} disabled={disabled} />
          </div>
          {!disabled && <div className="flex gap-sm">
            <button type="button" className="button-secondary button-sm" onClick={() => { setAdding(i); setName(''); setSecretValue(''); }} {...tip(t('inference.addValue'))}>{t('inference.addValue')}</button>
            {['Headers', 'QueryString'].includes(type) && endpoint.credentials.length > 1 && <button type="button" className="button-secondary button-sm" onClick={() => update({ credentials: endpoint.credentials.filter((_, n) => n !== i) })} {...tip(t('common.actions.remove'))}>{t('common.actions.remove')}</button>}
          </div>}
        </div>
      ))}
      {!disabled && ['Headers', 'QueryString'].includes(type) && <button type="button" className="button-secondary button-sm" onClick={() => update({ credentials: [...endpoint.credentials, { name: '', location: type === 'Headers' ? 'Header' : 'QueryString', secretId: '' }] })} {...tip(t('components.form.addItem'))}>{t('components.form.addItem')}</button>}
      {adding !== null && <div className="wizard-new-secret" data-testid={`${idPrefix}-new-value`}>
        <FormField id={`${idPrefix}-value-name`} field={{ type: 'text', label: t('resources.secrets.fields.name'), required: true, tip: t('resources.secrets.fields.name') }} value={name} onChange={setName} />
        <FormField id={`${idPrefix}-value`} field={{ type: 'password', label: t('inference.value'), required: true, tip: t('inference.value') }} value={secretValue} onChange={setSecretValue} />
        <div className="flex gap-sm">
          <button type="button" className="button-primary" disabled={busy || !name.trim() || !secretValue} onClick={saveValue} data-testid={`${idPrefix}-save-value`} {...tip(t('common.actions.save'))}>{t('common.actions.save')}</button>
          <button type="button" className="button-secondary" disabled={busy} onClick={() => { setAdding(null); setSecretValue(''); }} {...tip(t('common.actions.cancel'))}>{t('common.actions.cancel')}</button>
        </div>
      </div>}
      {failures.length > 0 && <ErrorBanner message={failures.join(' ')} />}
      {error && <ErrorBanner message={errorMessage(t, error)} />}
    </section>
  );
}
