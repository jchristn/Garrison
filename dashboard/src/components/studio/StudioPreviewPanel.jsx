import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import CodeBlock from '../CodeBlock';
import { tip } from '../Tooltip';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { errorMessage } from '../../utils/errors';
import { enumLabel } from '../../utils/enums';
import { formatBytes, formatNumber } from '../../i18n/formatters';
import { compilePreviewBody, compilePreviewSummary } from '../../utils/studio';

/**
 * Compile preview before deploy (AD9.3): pick a deployment and, optionally, an agent revision (a draft one included)
 * and an environment (the agent's deployment there is compiled instead), then see the exact command line, the paths
 * where the revision's assets are placed, and the file space mount. Secret values are redacted by the server.
 */
export default function StudioPreviewPanel({ deployments, blocked = '' }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const lng = i18n.language;
  const [form, setForm] = useState({ deploymentId: '', agentRevisionId: '', environment: '', input: 'Hello from the compile preview.' });
  const [revisions, setRevisions] = useState([]);
  const [environments, setEnvironments] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const deployment = (deployments || []).find((d) => d.id === form.deploymentId) || null;
  const agentId = deployment?.agentId || null;

  useEffect(() => {
    if (!apiClient?.getEnvironments) return;
    apiClient
      .getEnvironments(tenantId)
      .then((r) => setEnvironments((r?.environments || []).map((e) => e.name)))
      .catch(() => setEnvironments([]));
  }, [apiClient, tenantId]);

  useEffect(() => {
    if (!apiClient || !agentId) {
      setRevisions([]);
      return;
    }
    apiClient
      .listAgentRevisions(tenantId, agentId)
      .then((r) => setRevisions([...(r.items || [])].sort((a, b) => (b.number ?? 0) - (a.number ?? 0))))
      .catch(() => setRevisions([]));
  }, [apiClient, tenantId, agentId]);

  const compile = async () => {
    if (!deployment || blocked) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await apiClient.compileDeploymentPreview(tenantId, deployment.id, compilePreviewBody(form)));
    } catch (e) {
      setError(e);
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  const summary = result ? compilePreviewSummary(result) : null;
  const compiledName = summary?.deploymentId ? (deployments || []).find((d) => d.id === summary.deploymentId)?.name || summary.deploymentId : null;

  const select = (key, label, options, noneLabel) => (
    <div className="field">
      <label htmlFor={`studio-preview-${key}`} {...tip(t(`tips.studio.preview.${key}`))}>
        {label}
      </label>
      <select
        id={`studio-preview-${key}`}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value, ...(key === 'deploymentId' ? { agentRevisionId: '' } : {}) })}
        data-testid={`studio-preview-${key}`}
        {...tip(t(`tips.studio.preview.${key}`))}
      >
        <option value="">{noneLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <section className="panel studio-preview" aria-label={t('components.studio.preview.title')} data-testid="studio-preview">
      <h3 className="section-title" {...tip(t('tips.studio.preview.title'))}>
        {t('components.studio.preview.title')}
      </h3>
      <p className="text-muted">{t('components.studio.preview.intro')}</p>
      <div className="form-grid">
        {select(
          'deploymentId',
          t('components.studio.preview.deployment'),
          (deployments || []).map((d) => ({ value: d.id, label: d.name })),
          t('components.studio.preview.chooseDeployment')
        )}
        {select(
          'agentRevisionId',
          t('components.studio.preview.revision'),
          revisions.map((r) => ({ value: r.id, label: t('components.studio.preview.revisionOption', { number: r.number, state: enumLabel(t, 'agentRevisionState', r.state) }) })),
          t('components.studio.preview.deploymentRevision')
        )}
        {select(
          'environment',
          t('components.studio.preview.environment'),
          environments.map((e) => ({ value: e, label: e })),
          t('components.studio.preview.deploymentEnvironment')
        )}
        <div className="field">
          <label htmlFor="studio-preview-input" {...tip(t('tips.studio.preview.input'))}>
            {t('components.studio.preview.input')}
          </label>
          <input id="studio-preview-input" value={form.input} onChange={(e) => setForm({ ...form, input: e.target.value })} {...tip(t('tips.studio.preview.input'))} />
        </div>
      </div>
      <div className="flex gap-sm items-center">
        <button
          type="button"
          className="button-primary"
          onClick={compile}
          disabled={busy || !deployment}
          aria-disabled={blocked ? 'true' : undefined}
          data-testid="studio-preview-compile"
          {...tip(blocked || t(deployment ? 'tips.studio.preview.compile' : 'tips.studio.preview.compileNoDeployment'))}
        >
          {busy ? t('components.compilePreview.compiling') : t('components.compilePreview.compile')}
        </button>
      </div>
      {error && (
        <div className="error-banner" role="alert" data-testid="studio-preview-error">
          {errorMessage(t, error)}
        </div>
      )}
      {summary && (
        <div className="flex flex-col gap-md studio-preview-result" data-testid="studio-preview-result">
          {(compiledName || summary.agentRevisionId) && (
            <div className="text-muted" data-testid="studio-preview-compiled">
              {t('components.studio.preview.compiled', { deployment: compiledName || '-', revision: summary.agentRevisionId || t('components.studio.preview.deploymentRevision') })}
            </div>
          )}
          <h4 className="section-title" {...tip(t('tips.studio.preview.commandLine'))}>
            {t('components.compilePreview.commandLine')}
          </h4>
          <div data-testid="studio-preview-command">
            <CodeBlock value={summary.commandLine} />
          </div>
          <h4 className="section-title" {...tip(t('tips.studio.preview.assets'))}>
            {t('components.studio.preview.assets', { total: summary.assets.length })}
          </h4>
          {summary.assets.length === 0 ? (
            <div className="text-muted">{t('components.studio.preview.noAssets')}</div>
          ) : (
            <div className="table-scroll">
              <table className="data-table" data-testid="studio-preview-assets">
                <thead>
                  <tr>
                    {['path', 'asset', 'kind', 'version', 'size'].map((c) => (
                      <th key={c} scope="col" {...tip(t(`tips.studio.preview.columns.${c}`))}>
                        {t(`components.studio.preview.columns.${c}`)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.assets.map((a) => (
                    <tr key={`${a.path}-${a.assetName}`}>
                      <td>
                        <code>{a.path}</code>
                      </td>
                      <td>{a.assetName}</td>
                      <td>{enumLabel(t, 'agentAssetKind', a.kind)}</td>
                      <td className="right">{formatNumber(a.version ?? 1, {}, lng)}</td>
                      <td className="right">{formatBytes(a.sizeBytes, lng)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <h4 className="section-title" {...tip(t('tips.studio.preview.fileSpace'))}>
            {t('components.studio.preview.fileSpace')}
          </h4>
          {summary.fileSpace ? (
            <div data-testid="studio-preview-file-space">
              {t('components.studio.preview.fileSpaceMount', {
                path: summary.fileSpace.mountPath,
                files: formatNumber(summary.fileSpace.files, {}, lng),
                maxFiles: summary.fileSpace.maxFiles === null ? '-' : formatNumber(summary.fileSpace.maxFiles, {}, lng),
                maxBytes: summary.fileSpace.maxFileBytes === null ? '-' : formatBytes(summary.fileSpace.maxFileBytes, lng)
              })}
            </div>
          ) : (
            <div className="text-muted" data-testid="studio-preview-file-space">
              {t('components.studio.preview.noFileSpace')}
            </div>
          )}
          <div className="field-hint">{t('components.studio.preview.redacted')}</div>
        </div>
      )}
    </section>
  );
}
