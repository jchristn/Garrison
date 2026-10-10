import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import CodeBlock from '../components/CodeBlock';
import ConfirmModal from '../components/ConfirmModal';
import ResourceView from '../components/ResourceView';
import Tabs from '../components/Tabs';
import { Badge } from '../components/StatusBadge';
import { ErrorBanner } from '../components/States';
import { UploadIcon, DownloadIcon } from '../components/Icons';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { SAMPLE_MANIFEST } from '../utils/constants';
import { errorMessage } from '../utils/errors';
import { formatRelativeTime } from '../i18n/formatters';
import Explainer from '../components/Explainer';
import { tip } from '../components/Tooltip';
import { resourceTip, enumTip } from '../utils/tips';

const RESULT_TONE = { Created: 'success', Updated: 'info', Unchanged: 'neutral', Failed: 'danger', Validated: 'neutral' };

const appliesConfig = {
  id: 'manifestApplies',
  api: { list: (c, tenant, p) => c.listManifestApplies(tenant, p), create: null, update: null, remove: null },
  canDuplicate: false,
  isEditable: () => false,
  columns: ({ t, i18n }) => [
    { key: 'createdUtc', tip: resourceTip(t, 'manifestApplies', 'createdUtc'), label: t('resources.manifestApplies.columns.createdUtc'), render: (r) => formatRelativeTime(r.createdUtc, i18n.language), pinned: true, sortable: true },
    { key: 'principalName', tip: resourceTip(t, 'manifestApplies', 'principalName'), label: t('resources.manifestApplies.columns.principalName'), render: (r) => r.principalName || '-' },
    { key: 'dryRun', tip: resourceTip(t, 'manifestApplies', 'dryRun'), label: t('resources.manifestApplies.columns.dryRun'), render: (r) => (r.dryRun ? t('common.boolean.yes') : t('common.boolean.no')) },
    { key: 'counts', tip: resourceTip(t, 'manifestApplies', 'counts'), label: t('resources.manifestApplies.columns.counts'), render: (r) => t('views.manifests.counts', { created: r.createdCount ?? 0, updated: r.updatedCount ?? 0, unchanged: r.unchangedCount ?? 0, failed: r.failedCount ?? 0 }) }
  ],
  fields: (_d, { t }) => [
    {
      name: 'items',
      type: 'objectList',
      label: t('views.manifests.results'),
      tip: t('tips.views.manifests.results'),
      fields: [
        { name: 'kind', type: 'text', label: t('views.manifests.kind'), tip: t('tips.views.manifests.kind') },
        { name: 'name', type: 'text', label: t('views.manifests.name'), tip: t('tips.views.manifests.name') },
        { name: 'result', type: 'text', label: t('views.manifests.result'), tip: t('tips.views.manifests.result') },
        { name: 'message', type: 'text', label: t('views.manifests.message'), tip: t('tips.views.manifests.message') }
      ]
    }
  ]
};

/** Apply and export configuration as code: paste or upload YAML, dry run, apply, review per-document results. */
export default function ManifestsView() {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const [tab, setTab] = useState('apply');
  const [text, setText] = useState(SAMPLE_MANIFEST);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [exported, setExported] = useState(null);
  const fileRef = useRef(null);

  const run = async (dryRun) => {
    setBusy(true);
    setError(null);
    try {
      const r = await apiClient.applyManifest(tenantId, text, dryRun);
      setResult({ ...r, dryRun });
      addToast({ type: 'success', message: dryRun ? t('views.manifests.validated') : t('views.manifests.applied') });
    } catch (e) {
      setError(e);
      if (e?.body && typeof e.body === 'object' && (e.body.items || e.body.results)) setResult({ ...e.body, dryRun });
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  };

  const doExport = async () => {
    try {
      const r = await apiClient.exportManifests(tenantId);
      setExported(typeof r === 'string' ? r : r?.content || r?.yaml || JSON.stringify(r, null, 2));
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    }
  };

  const download = () => {
    const blob = new Blob([exported || ''], { type: 'application/yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `garrison-${tenantId}.yaml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const items = result?.items || result?.results || [];

  return (
    <div>
      <PageHeader title={t('views.manifests.title')} subtitle={t('views.manifests.subtitle')} />
      <Explainer topic="manifests" />
      <Tabs
        label={t('views.manifests.title')}
        active={tab}
        onChange={setTab}
        tabs={[
          { id: 'apply', label: t('views.manifests.applyTab'), tip: t('tips.views.manifests.tabs.apply') },
          { id: 'export', label: t('views.manifests.exportTab'), tip: t('tips.views.manifests.tabs.export') },
          { id: 'history', label: t('views.manifests.historyTab'), tip: t('tips.views.manifests.tabs.history') }
        ]}
      />
      {tab === 'apply' && (
        <div className="panel flex-col gap-md">
          <div className="flex gap-sm items-center wrap">
            <button type="button" className="button-secondary" onClick={() => fileRef.current?.click()} {...tip(t('tips.views.manifests.upload'))}>
              <UploadIcon size={14} /> {t('views.manifests.upload')}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".yaml,.yml,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (f) setText(await f.text());
                e.target.value = '';
              }}
            />
            <button type="button" className="button-secondary" onClick={() => setText(SAMPLE_MANIFEST)} {...tip(t('tips.views.manifests.loadSample'))}>
              {t('views.manifests.loadSample')}
            </button>
          </div>
          <label htmlFor="manifest-text" className="section-title" {...tip(t('tips.views.manifests.document'))}>
            {t('views.manifests.document')}
          </label>
          <textarea id="manifest-text" {...tip(t('tips.views.manifests.document'))} className="monospace template-textarea" rows={18} spellCheck={false} value={text} onChange={(e) => setText(e.target.value)} />
          {error && <ErrorBanner message={errorMessage(t, error)} />}
          <div className="flex gap-sm">
            <button type="button" className="button-secondary" onClick={() => run(true)} disabled={busy || !text.trim()} data-testid="manifest-dryrun" {...tip(t('tips.views.manifests.dryRun'))}>
              {t('views.manifests.dryRun')}
            </button>
            <button type="button" className="button-primary" onClick={() => setConfirm(true)} disabled={busy || !text.trim()} data-testid="manifest-apply" {...tip(t('tips.views.manifests.apply'))}>
              {t('views.manifests.apply')}
            </button>
          </div>
          {result && (
            <div>
              <h3 className="section-title">{result.dryRun ? t('views.manifests.dryRunResults') : t('views.manifests.results')}</h3>
              {items.length === 0 ? (
                <CodeBlock value={result} prettyJson />
              ) : (
                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th scope="col" {...tip(t('tips.views.manifests.kind'))}>{t('views.manifests.kind')}</th>
                        <th scope="col" {...tip(t('tips.views.manifests.name'))}>{t('views.manifests.name')}</th>
                        <th scope="col" {...tip(t('tips.views.manifests.result'))}>{t('views.manifests.result')}</th>
                        <th scope="col" {...tip(t('tips.views.manifests.message'))}>{t('views.manifests.message')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((it, i) => (
                        <tr key={i}>
                          <td>{it.kind}</td>
                          <td>
                            <code>{it.name}</code>
                          </td>
                          <td>
                            <Badge tone={RESULT_TONE[it.result] || 'neutral'} tip={enumTip(t, 'manifestApplyResult', it.result)}>{t(`enums.manifestApplyResult.${it.result}`, { defaultValue: it.result })}</Badge>
                          </td>
                          <td>{it.message || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {tab === 'export' && (
        <div className="panel flex-col gap-md">
          <p className="text-muted">{t('views.manifests.exportHelp')}</p>
          <div className="flex gap-sm">
            <button type="button" className="button-primary" onClick={doExport} {...tip(t('tips.views.manifests.export'))}>
              {t('views.manifests.export')}
            </button>
            {exported && (
              <button type="button" className="button-secondary" onClick={download} {...tip(t('tips.views.manifests.download'))}>
                <DownloadIcon size={14} /> {t('views.manifests.download')}
              </button>
            )}
          </div>
          {exported && <CodeBlock value={exported} />}
        </div>
      )}
      {tab === 'history' && <ResourceView config={appliesConfig} />}
      <ConfirmModal open={confirm} title={t('views.manifests.confirmTitle')} message={t('views.manifests.confirmMessage')} confirmLabel={t('views.manifests.apply')} confirmTip={t('tips.views.manifests.confirmApply')} onConfirm={() => run(false)} onCancel={() => setConfirm(false)} />
    </div>
  );
}
