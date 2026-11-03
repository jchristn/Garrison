import { listRuntimeProfiles } from '../utils/runtimeProfiles';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ResourceView from '../components/ResourceView';
import Tabs from '../components/Tabs';
import HarnessRuntimeFields from '../components/HarnessRuntimeFields';
import { harnessProfilesConfig } from './resourceConfigs';
import { inferenceEndpointErrors } from '../utils/inferenceEndpoints';

async function profilePage(client, tenant, params, configured) {
  const rows = await listRuntimeProfiles(client, tenant, params);
  const items = rows.filter((p) => Boolean(p.runtimeConfiguration) === configured && (!params.harnessType || p.harnessType === params.harnessType));
  const pageNumber = params.pageNumber || 1, pageSize = params.pageSize || 25;
  return { items: items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize), totalCount: items.length, pageNumber, pageSize, endOfResults: pageNumber * pageSize >= items.length };
}

const templates = { ...harnessProfilesConfig, labels: { title: 'runtime.templates' }, api: { ...harnessProfilesConfig.api, list: (client, tenant, params) => profilePage(client, tenant, params, false) } };

const connections = {
  ...harnessProfilesConfig,
  steps: undefined,
  explainer: false,
  labels: { title: 'runtime.connections', subtitle: 'runtime.sharedHint', add: 'runtime.add', create: 'runtime.create', edit: 'runtime.edit', view: 'runtime.view', emptyTitle: 'runtime.connections', emptyBody: 'runtime.configureFirst' },
  api: { ...harnessProfilesConfig.api, list: (client, tenant, params) => profilePage(client, tenant, params, true) },
  loadOptions: async ({ apiClient, tenantId }) => {
    const [profiles, secrets] = await Promise.all([listRuntimeProfiles(apiClient, tenantId), apiClient.listSecrets(tenantId, { pageSize: 1000, pageNumber: 1 })]);
    return { templates: profiles.filter((p) => p.active !== false && !p.runtimeConfiguration), secrets: secrets.items || [] };
  },
  blank: () => ({ ...harnessProfilesConfig.blank(), runtimeConfiguration: {} }),
  fields: (d, { t, options }) => [
    { name: 'name', type: 'text', label: t('resources.harnessProfiles.fields.name'), required: true, tip: t('runtime.sharedHint') },
    { name: 'template', type: 'custom', label: t('runtime.harness'), tip: t('runtime.harness'), render: (data, { onChange, disabled }) => <label className="field span-full">{t('runtime.harness')}<select id="runtime-template" value={data.templateId || ''} disabled={disabled} onChange={(e) => { const base = (options.templates || []).find((p) => p.id === e.target.value); if (base) onChange({ ...base, id: undefined, name: data.name, tenantId: undefined, isBuiltIn: false, isProtected: false, builtInKey: null, templateId: base.id, runtimeConfiguration: {} }); }}><option value="">{d.executable ? d.harnessType : t('runtime.chooseHarness')}</option>{(options.templates || []).map((p) => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label> },
    ...(d.executable ? [{ name: 'runtimeConfiguration', type: 'custom', label: t('runtime.connection'), tip: t('runtime.sharedHint'), render: (data, { onChange, disabled, errors }) => <HarnessRuntimeFields profile={data} value={data.runtimeConfiguration} onChange={(runtimeConfiguration) => onChange({ ...data, runtimeConfiguration })} secrets={options.secrets} disabled={disabled} errors={errors} /> }] : []),
    { name: 'active', type: 'checkbox', label: t('resources.harnessProfiles.fields.active'), tip: t('runtime.sharedHint') }
  ],
  validate: (d, t) => ({ ...(!d.name ? { name: t('common.errors.required') } : {}), ...(!d.executable ? { template: t('runtime.chooseHarness') } : {}), ...(d.harnessType === 'ProviderApi' ? Object.fromEntries(Object.entries(inferenceEndpointErrors(d.runtimeConfiguration?.inferenceEndpoint, d.runtimeConfiguration?.model, t)).map(([key, value]) => [`runtimeConfiguration.${key}`, value])) : {}), ...(d.harnessType === 'Mux' && (!d.runtimeConfiguration?.endpointName?.trim() || d.runtimeConfiguration.endpointName.includes('://')) ? { runtimeConfiguration: t('views.agentWizard.access.needEndpoint') } : {}) }),
  toBody: (d) => { const { templateId: _template, ...body } = d; return harnessProfilesConfig.toBody(body); }
};

/** One location for saved runtime connections and advanced harness adapter templates. */
export default function HarnessProfilesView() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('connections');
  return <div className="runtime-profile-manager"><Tabs tabs={[{ id: 'connections', label: t('runtime.connections') }, { id: 'templates', label: t('runtime.templates') }]} active={tab} onChange={setTab} label={t('runtime.title')} /><ResourceView key={tab} config={tab === 'connections' ? connections : templates} /></div>;
}
