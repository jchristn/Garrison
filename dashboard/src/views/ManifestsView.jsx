import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';
import CodeBlock from '../components/CodeBlock';
import ConfirmModal from '../components/ConfirmModal';
import ResourceView from '../components/ResourceView';
import Tabs from '../components/Tabs';
import ManifestResults from '../components/ManifestResults';
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
import { resourceTip } from '../utils/tips';
import { downloadText } from '../utils/exporters';
import { EXPORT_KINDS, parseResourceSelectors, invalidResourceSelectors, bundleFileName, bundleRequirements } from '../utils/manifestBundles';


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
  fields: () => [],
  // Per-item results with field-level changes (M1-14).
  viewExtra: (d, { t }) => (
    <div className="flex-col gap-sm">
      <h3 className="section-title" {...tip(t('tips.views.manifests.results'))}>
        {t('views.manifests.results')}
      </h3>
      <ManifestResults items={d.items || []} testId="manifest-apply-items" />
    </div>
  )
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
  // P12.21 bundle selection: everything, or chosen kinds and Kind/name resources, optionally with what they reference.
  const [scope, setScope] = useState('all');
  const [kinds, setKinds] = useState([]);
  const [resourceText, setResourceText] = useState('');
  const [followReferences, setFollowReferences] = useState(true);
  const [includeBuiltIn, setIncludeBuiltIn] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(null);
  const resources = parseResourceSelectors(resourceText);
  const badSelectors = invalidResourceSelectors(resources);
  const selectionEmpty = scope === 'selected' && kinds.length === 0 && resources.length === 0;
  const requirements = exported ? bundleRequirements(exported) : null;
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
    if (badSelectors.length || selectionEmpty) return;
    setExporting(true);
    setExportError(null);
    try {
      const selection = scope === 'all' ? { includeBuiltIn } : { kinds, resources, followReferences, includeBuiltIn };
      const r = await apiClient.exportManifests(tenantId, selection);
      setExported(typeof r === 'string' ? r : JSON.stringify(r, null, 2));
    } catch (e) {
      setExported(null);
      setExportError(e);
    } finally {
      setExporting(false);
    }
  };

  const download = () => downloadText(bundleFileName(tenantId), exported || '', 'application/yaml;charset=utf-8');
  const toggleKind = (kind, on) => setKinds((prev) => (on ? [...prev.filter((k) => k !== kind), kind] : prev.filter((k) => k !== kind)));

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
                <ManifestResults items={items} />
              )}
            </div>
          )}
        </div>
      )}
      {tab === 'export' && (
        <div className="panel flex-col gap-md" data-testid="manifest-export">
          <p className="text-muted">{t('views.manifests.exportHelp')}</p>
          <div className="flex gap-md items-center wrap" role="radiogroup" aria-label={t('views.manifests.bundle.scope')}>
            <label className="flex gap-sm items-center" {...tip(t('tips.views.manifests.bundle.scopeAll'))}>
              <input type="radio" name="bundle-scope" value="all" checked={scope === 'all'} onChange={() => setScope('all')} data-testid="bundle-scope-all" {...tip(t('tips.views.manifests.bundle.scopeAll'))} />
              {t('views.manifests.bundle.scopeAll')}
            </label>
            <label className="flex gap-sm items-center" {...tip(t('tips.views.manifests.bundle.scopeSelected'))}>
              <input type="radio" name="bundle-scope" value="selected" checked={scope === 'selected'} onChange={() => setScope('selected')} data-testid="bundle-scope-selected" {...tip(t('tips.views.manifests.bundle.scopeSelected'))} />
              {t('views.manifests.bundle.scopeSelected')}
            </label>
          </div>
          {scope === 'selected' && (
            <div className="flex-col gap-sm" data-testid="bundle-selection">
              <div className="section-title" {...tip(t('tips.views.manifests.bundle.kinds'))}>{t('views.manifests.bundle.kinds')}</div>
              <div className="flex gap-md wrap">
                {EXPORT_KINDS.map((kind) => (
                  <label key={kind} className="flex gap-sm items-center" {...tip(t('tips.views.manifests.bundle.kind', { kind }))}>
                    <input type="checkbox" checked={kinds.includes(kind)} onChange={(e) => toggleKind(kind, e.target.checked)} data-testid={`bundle-kind-${kind}`} {...tip(t('tips.views.manifests.bundle.kind', { kind }))} />
                    <code>{kind}</code>
                  </label>
                ))}
              </div>
              <div className={`field ${badSelectors.length ? 'has-error' : ''}`}>
                <label htmlFor="bundle-resources" {...tip(t('tips.views.manifests.bundle.resources'))}>{t('views.manifests.bundle.resources')}</label>
                <textarea id="bundle-resources" className="monospace" rows={4} spellCheck={false} value={resourceText} onChange={(e) => setResourceText(e.target.value)} placeholder={'Agent/triage\nPipeline/release'} data-testid="bundle-resources" {...tip(t('tips.views.manifests.bundle.resources'))} />
                <div className="field-hint">{t('views.manifests.bundle.resourcesHint')}</div>
                {badSelectors.length > 0 && (
                  <div className="field-error" role="alert" data-testid="bundle-resources-error">
                    {t('views.manifests.bundle.invalidSelectors', { entries: badSelectors.join(', ') })}
                  </div>
                )}
              </div>
              <label className="flex gap-sm items-center" {...tip(t('tips.views.manifests.bundle.followReferences'))}>
                <input type="checkbox" checked={followReferences} onChange={(e) => setFollowReferences(e.target.checked)} data-testid="bundle-follow-references" {...tip(t('tips.views.manifests.bundle.followReferences'))} />
                {t('views.manifests.bundle.followReferences')}
              </label>
            </div>
          )}
          <label className="flex gap-sm items-center" {...tip(t('tips.views.manifests.bundle.includeBuiltIn'))}>
            <input type="checkbox" checked={includeBuiltIn} onChange={(e) => setIncludeBuiltIn(e.target.checked)} data-testid="bundle-include-builtin" {...tip(t('tips.views.manifests.bundle.includeBuiltIn'))} />
            {t('views.manifests.bundle.includeBuiltIn')}
          </label>
          <div className="flex gap-sm">
            <button type="button" className="button-primary" onClick={doExport} disabled={exporting || badSelectors.length > 0 || selectionEmpty} data-testid="manifest-export-run" {...tip(t('tips.views.manifests.export'))}>
              {exporting ? t('views.manifests.bundle.exporting') : t('views.manifests.export')}
            </button>
            {exported && (
              <button type="button" className="button-secondary" onClick={download} data-testid="manifest-export-download" {...tip(t('tips.views.manifests.download'))}>
                <DownloadIcon size={14} /> {t('views.manifests.download')}
              </button>
            )}
          </div>
          {exportError && <ErrorBanner message={errorMessage(t, exportError)} />}
          {requirements && (
            <div className={requirements.secrets.length || requirements.artifactStores.length ? 'warning-banner' : 'info-banner'} role="note" data-testid="bundle-requirements">
              {requirements.secrets.length === 0 && requirements.artifactStores.length === 0 ? (
                <span>{t('views.manifests.bundle.noSecrets')}</span>
              ) : (
                <div className="flex-col gap-sm">
                  {requirements.secrets.length > 0 && (
                    <div>
                      <div>{t('views.manifests.bundle.requiredSecrets')}</div>
                      <ul data-testid="bundle-required-secrets">
                        {requirements.secrets.map((x) => (
                          <li key={x.name}>
                            <code>{x.name}</code>
                            {x.kind ? ` (${x.kind})` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {requirements.artifactStores.length > 0 && (
                    <div>
                      <div>{t('views.manifests.bundle.requiredArtifactStores')}</div>
                      <ul>
                        {requirements.artifactStores.map((x) => (
                          <li key={x}>
                            <code>{x}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {exported && <CodeBlock value={exported} />}
        </div>
      )}
      {tab === 'history' && <ResourceView config={appliesConfig} />}
      <ConfirmModal open={confirm} title={t('views.manifests.confirmTitle')} message={t('views.manifests.confirmMessage')} confirmLabel={t('views.manifests.apply')} confirmTip={t('tips.views.manifests.confirmApply')} onConfirm={() => run(false)} onCancel={() => setConfirm(false)} />
    </div>
  );
}
