import { useMemo } from 'react';
import ResourceView from '../components/ResourceView';
import CopyableId from '../components/CopyableId';
import NamedId from '../components/NamedId';
import { formatDateTime, formatNumber } from '../i18n/formatters';
import { errorMessage } from '../utils/errors';
import { resourceTip } from '../utils/tips';

async function download(record, ctx) {
  try {
    const result = await ctx.apiClient.getArtifactDownloadUrl(ctx.tenantId, record.id);
    const link = document.createElement('a');
    link.href = result.url;
    link.download = record.name;
    link.rel = 'noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    ctx.addToast({ type: 'error', message: errorMessage(ctx.t, error) });
  }
}

const config = {
  id: 'artifacts',
  api: {
    list: (client, tenant, params) => client.listArtifacts(tenant, params),
    remove: (client, tenant, id) => client.deleteArtifact(tenant, id)
  },
  urlFilters: ['runId', 'storeId'],
  loadLookups: async ({ apiClient, tenantId }) => {
    const stores = await apiClient.listArtifactStores(tenantId, { pageNumber: 1, pageSize: 1000 }).catch(() => ({ items: [] }));
    return { stores: Object.fromEntries(stores.items.map((s) => [s.id, s.name])) };
  },
  filters: [
    { name: 'runId', type: 'text', label: (t) => t('resources.artifacts.fields.runId') },
    { name: 'storeId', type: 'text', label: (t) => t('resources.artifacts.fields.artifactStoreId') }
  ],
  columns: ({ t, i18n, lookups }) => [
    { key: 'name', label: t('resources.artifacts.columns.name'), tip: resourceTip(t, 'artifacts', 'name'), render: (r) => <code>{r.name}</code> },
    { key: 'runId', label: t('resources.artifacts.columns.runId'), tip: resourceTip(t, 'artifacts', 'runId'), render: (r) => <CopyableId value={r.runId} /> },
    { key: 'artifactStoreId', label: t('resources.artifacts.columns.artifactStoreId'), tip: resourceTip(t, 'artifacts', 'artifactStoreId'), render: (r) => <NamedId id={r.artifactStoreId} name={lookups?.stores?.[r.artifactStoreId]} /> },
    { key: 'mediaType', label: t('resources.artifacts.columns.mediaType'), tip: resourceTip(t, 'artifacts', 'mediaType'), render: (r) => r.mediaType },
    { key: 'sizeBytes', label: t('resources.artifacts.columns.sizeBytes'), tip: resourceTip(t, 'artifacts', 'sizeBytes'), render: (r) => formatNumber(r.sizeBytes, i18n.language), cellClass: 'right' },
    { key: 'sha256', label: t('resources.artifacts.columns.sha256'), tip: resourceTip(t, 'artifacts', 'sha256'), render: (r) => <CopyableId value={r.sha256} />, defaultHidden: true },
    { key: 'createdUtc', label: t('resources.artifacts.columns.createdUtc'), tip: resourceTip(t, 'artifacts', 'createdUtc'), render: (r) => formatDateTime(r.createdUtc, i18n.language) },
    { key: 'id', label: t('resources.artifacts.columns.id'), tip: resourceTip(t, 'artifacts', 'id'), render: (r) => <CopyableId value={r.id} />, defaultHidden: true }
  ],
  fields: (_data, { t }) => ['name', 'runId', 'artifactStoreId', 'mediaType', 'sizeBytes', 'sha256', 'leaseEpoch', 'repairAttempt'].map((name) => ({ name, type: 'text', label: t(`resources.artifacts.fields.${name}`), tip: resourceTip(t, 'artifacts', name) })),
  rowActions: (record, ctx) => [{ label: ctx.t('resources.artifacts.actions.download'), tip: ctx.t('tips.resources.artifacts.actions.download'), onClick: () => download(record, ctx) }]
};

/** Global artifact browser or the files of one run; metadata queries never download content. */
export default function ArtifactsView({ runId = null }) {
  const scoped = useMemo(() => runId ? {
    ...config,
    urlFilters: [],
    filters: [],
    api: { ...config.api, list: (client, tenant, params) => client.listArtifacts(tenant, { ...params, runId }) }
  } : config, [runId]);
  return <ResourceView config={scoped} />;
}
