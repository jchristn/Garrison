import { isConnection, listRuntimeProfiles } from '../utils/runtimeProfiles';
import ResourceView from '../components/ResourceView';
import FormFields from '../components/FormFields';
import { enumLabel } from '../utils/enums';
import HarnessRuntimeFields from '../components/HarnessRuntimeFields';
import { harnessProfilesConfig } from './resourceConfigs';
import { inferenceEndpointErrors } from '../utils/inferenceEndpoints';

async function profilePage(client, tenant, params) {
  const rows = await listRuntimeProfiles(client, tenant, params);
  const items = rows.filter((p) => isConnection(p) && (!params.harnessType || p.harnessType === params.harnessType));
  const pageNumber = params.pageNumber || 1, pageSize = params.pageSize || 25;
  return { items: items.slice((pageNumber - 1) * pageSize, pageNumber * pageSize), totalCount: items.length, pageNumber, pageSize, endOfResults: pageNumber * pageSize >= items.length };
}

const connections = {
  ...harnessProfilesConfig,
  steps: undefined,
  explainer: false,
  labels: { title: 'runtime.title', subtitle: 'runtime.sharedHint', add: 'runtime.add', create: 'runtime.create', edit: 'runtime.edit', view: 'runtime.view', emptyTitle: 'runtime.emptyTitle', emptyBody: 'runtime.configureFirst' },
  api: { ...harnessProfilesConfig.api, list: (client, tenant, params) => profilePage(client, tenant, params) },
  loadOptions: async ({ apiClient, tenantId }) => {
    const [profiles, secrets] = await Promise.all([listRuntimeProfiles(apiClient, tenantId), apiClient.listSecrets(tenantId, { pageSize: 1000, pageNumber: 1 })]);
    return { templates: profiles.filter((p) => p.active !== false && p.isBuiltIn), secrets: secrets.items || [] };
  },
  columns: (ctx) => {
    const { t } = ctx;
    const base = harnessProfilesConfig.columns(ctx);
    return [base.find((c) => c.key === 'name'), base.find((c) => c.key === 'harnessType'),
      { key: 'connectionTarget', label: t('runtime.connection'), tip: t('runtime.pickConnection'), render: (r) => r.runtimeConfiguration?.inferenceEndpoint?.baseUrl || r.runtimeConfiguration?.endpointName || r.executable || '-' },
      { key: 'connectionModel', label: t('views.agentWizard.access.model'), tip: t('inference.modelHint'), render: (r) => r.runtimeConfiguration?.model || '-' },
      { key: 'connectionAuthentication', label: t('inference.authentication'), tip: t('inference.hint'), render: (r) => r.runtimeConfiguration?.inferenceEndpoint ? t(`inference.auth.${r.runtimeConfiguration.inferenceEndpoint.authenticationType}`) : '-' },
      ...base.filter((c) => ['id', 'createdUtc'].includes(c.key))];
  },
  blank: () => ({ ...harnessProfilesConfig.blank(), runtimeConfiguration: {} }),
  fields: (d, ctx) => { const { t, options } = ctx; return [
    { name: 'name', type: 'text', label: t('resources.harnessProfiles.fields.name'), required: true, tip: t('runtime.sharedHint') },
    { name: 'template', type: 'custom', label: t('runtime.harness'), tip: t('runtime.harness'), render: (data, { onChange, disabled }) => <label className="field span-full">{t('runtime.harness')}<select id="runtime-template" value={data.templateId || ''} disabled={disabled} onChange={(e) => { const base = (options.templates || []).find((p) => p.id === e.target.value); if (e.target.value === 'custom') { onChange({ ...harnessProfilesConfig.blank(), id: data.id, tenantId: data.tenantId, createdUtc: data.createdUtc, name: data.name, templateId: 'custom', runtimeConfiguration: {} }); return; } if (base) onChange({ ...base, id: data.id, name: data.name, tenantId: data.tenantId, createdUtc: data.createdUtc, isBuiltIn: false, isProtected: false, builtInKey: null, templateId: base.id, runtimeConfiguration: {} }); }}><option value="">{d.executable ? d.harnessType === 'ProviderApi' ? t('runtime.apiType') : enumLabel(t, 'harnessType', d.harnessType) : t('runtime.chooseHarness')}</option>{(options.templates || []).map((p) => <option value={p.id} key={p.id}>{p.isBuiltIn ? p.harnessType === 'ProviderApi' ? t('runtime.apiType') : enumLabel(t, 'harnessType', p.harnessType) : p.name}</option>)}<option value="custom">{t('runtime.customHarness')}</option></select></label> },
    ...((d.executable || d.templateId === 'custom') ? [{ name: 'runtimeConfiguration', type: 'custom', label: t('runtime.connection'), tip: t('runtime.sharedHint'), render: (data, { onChange, disabled, errors }) => data.runtimeConfiguration == null ? <p className="field-hint">{t('runtime.launchDefaults')}</p> : <HarnessRuntimeFields profile={data} value={data.runtimeConfiguration} onChange={(runtimeConfiguration) => onChange({ ...data, runtimeConfiguration })} secrets={options.secrets} disabled={disabled} errors={errors} /> }] : []),
    { name: 'launchSettings', type: 'custom', label: t('runtime.advancedLaunch'), tip: t('runtime.advancedLaunch'), render: (data, { onChange, disabled, errors }) => <details className="connection-advanced" open={data.templateId === 'custom' || Boolean(errors.template)}><summary>{t('runtime.advancedLaunch')}</summary><FormFields fields={harnessProfilesConfig.fields(data, ctx).filter((f) => !['name', 'description', 'active', 'harnessType'].includes(f.name))} data={data} onChange={onChange} disabled={disabled} errors={errors} idPrefix="connection-advanced" /></details> },
    { name: 'active', type: 'checkbox' , label: t('resources.harnessProfiles.fields.active'), tip: t('runtime.sharedHint') }
  ]; },
  validate: (d, t) => ({ ...(!d.name ? { name: t('common.errors.required') } : {}), ...(!d.executable ? { template: t('runtime.chooseHarness') } : {}), ...(d.runtimeConfiguration != null && d.harnessType === 'ProviderApi' ? Object.fromEntries(Object.entries(inferenceEndpointErrors(d.runtimeConfiguration?.inferenceEndpoint, d.runtimeConfiguration?.model, t)).map(([key, value]) => [`runtimeConfiguration.${key}`, value])) : {}), ...(d.runtimeConfiguration != null && d.harnessType === 'Mux' && (!d.runtimeConfiguration?.endpointName?.trim() || d.runtimeConfiguration.endpointName.includes('://')) ? { runtimeConfiguration: t('views.agentWizard.access.needEndpoint') } : {}) }),
  toBody: (d) => { const { templateId: _template, ...body } = d; return harnessProfilesConfig.toBody(body); }
};

/** A single registry of configured harnesses and HTTP endpoints. Launch details stay inside each connection. */
export default function HarnessProfilesView() {
  return <ResourceView config={connections} />;
}
