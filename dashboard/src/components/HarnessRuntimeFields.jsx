import { modelExample } from '../utils/agentWizard';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FormField } from './FormFields';
import InferenceEndpointFields from './InferenceEndpointFields';
import { blankInferenceEndpoint } from '../utils/inferenceEndpoints';
import { pathFor } from '../config/navConfig';

/** Connection settings are edited only on the shared runtime profile. */
export default function HarnessRuntimeFields({ profile, value, onChange, disabled, secrets = [], errors = {} }) {
  const { t } = useTranslation();
  const runtime = value || {};
  const update = (patch) => onChange({ ...runtime, ...patch });
  return <div className="harness-runtime-fields span-full">
    <p className="field-hint">{t('runtime.sharedHint')}</p>
    <div className="form-grid">
      {profile.harnessType === 'Mux' ? <FormField id="runtime-endpoint-name" field={{ type: 'text', label: t('views.agentWizard.access.muxEndpoint'), placeholder: 'local', required: true, tip: t('views.agentWizard.access.muxHint') }} error={errors['runtimeConfiguration.endpointName'] || errors.runtimeConfiguration} value={runtime.endpointName || ''} onChange={(endpointName) => update({ endpointName, model: null, credentialSecretId: null, inferenceEndpoint: null })} disabled={disabled} /> : <FormField id="runtime-model" field={{ type: 'text', label: t('views.agentWizard.access.model'), placeholder: modelExample(profile.harnessType), hint: ['Pi', 'OpenCode'].includes(profile.harnessType) ? t('views.agentWizard.access.providerModelHint') : undefined, required: profile.harnessType === 'ProviderApi', tip: t('inference.modelHint') }} error={errors['runtimeConfiguration.model']} value={runtime.model || ''} onChange={(model) => update({ model, endpointName: null })} disabled={disabled} />}
      {!['Mux', 'ProviderApi'].includes(profile.harnessType) && <FormField id="runtime-cli-secret" field={{ type: 'select', options: secrets.filter((s) => s.active !== false).map((s) => ({ value: s.id, label: `${s.name} (${s.kind})` })), label: t('inference.secret'), tip: t('inference.secret') }} value={runtime.credentialSecretId || ''} onChange={(credentialSecretId) => update({ credentialSecretId })} disabled={disabled} />}
    </div>
    {profile.harnessType === 'ProviderApi' && <InferenceEndpointFields value={runtime.inferenceEndpoint || blankInferenceEndpoint()} onChange={(inferenceEndpoint) => update({ inferenceEndpoint, credentialSecretId: null, endpointName: null })} disabled={disabled} errors={Object.fromEntries(Object.entries(errors).map(([key, text]) => [key.replace('runtimeConfiguration.', ''), text]))} idPrefix="runtime-inference" />}
  </div>;
}

/** Referencing forms link to the central editor instead of copying endpoint settings. */
export function HarnessRuntimeSummary({ profile, showManage = true }) {
  const { t } = useTranslation();
  if (!profile) return showManage ? <Link target="_blank" rel="noopener noreferrer" to={pathFor('harnessProfiles')}>{t('runtime.configureFirst')}</Link> : <p className="field-hint">{t('runtime.configureFirst')}</p>;
  const runtime = profile.runtimeConfiguration || {};
  return <div className="info-banner span-full"><strong>{profile.name}</strong><p>{runtime.inferenceEndpoint ? `${runtime.inferenceEndpoint.protocol} · ${runtime.inferenceEndpoint.baseUrl} · ${runtime.model} · ${t(`inference.auth.${runtime.inferenceEndpoint.authenticationType}`)}` : runtime.endpointName || runtime.model || profile.harnessType}</p>{showManage && <Link target="_blank" rel="noopener noreferrer" to={pathFor('harnessProfiles', null, { search: profile.name })}>{t('runtime.manage')}</Link>}</div>;
}
