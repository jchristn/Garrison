import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';
import AssetUploadPanel from './AssetUploadPanel';
import { Badge } from './StatusBadge';
import { ErrorBanner, LoadingState } from './States';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../utils/errors';
import { enumLabel } from '../utils/enums';
import { enumTip } from '../utils/tips';
import { formatBytes, formatDateTime, formatRelativeTime } from '../i18n/formatters';
import { blobText, fileName, isPreviewable, isSystemPrompt, saveBlob, shortSha } from '../utils/assets';

/**
 * One asset's version history (AD2.8): every version (number, author, change note, total size, created), the files of
 * the selected version (path, media type, size, shortened SHA-256) with Download and a read-only text preview, and the
 * upload panel for a new version. SystemPrompt assets have no files; the dialog points at their prompt template.
 * `onChanged` runs after an upload so the list refreshes the asset's current version.
 */
export default function AgentAssetVersionsModal({ asset, onClose, onChanged }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const lng = i18n.language;
  const [versions, setVersions] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [current, setCurrent] = useState(asset.currentVersion || 0);
  const systemPrompt = isSystemPrompt(asset);

  const load = useCallback(
    (select) => {
      if (!apiClient || !asset?.id) return;
      setError(null);
      apiClient
        .listAgentAssetVersions(tenantId, asset.id)
        .then((r) => {
          const list = [...(Array.isArray(r) ? r : r?.objects || [])].sort((a, b) => (b.number ?? 0) - (a.number ?? 0));
          setVersions(list);
          setSelected((current) => select ?? (list.some((v) => v.number === current) ? current : list[0]?.number ?? null));
        })
        .catch((e) => {
          setVersions([]);
          setError(e);
        });
    },
    [apiClient, tenantId, asset?.id]
  );
  useEffect(() => load(), [load]);

  const version = (versions || []).find((v) => v.number === selected) || null;

  const fetchFile = (file) => apiClient.getAgentAssetFile(tenantId, asset.id, version.number, file.path);

  const download = async (file) => {
    try {
      saveBlob(fileName(file.path), await fetchFile(file));
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    }
  };

  const showPreview = async (file) => {
    setPreview({ path: file.path, number: version.number, text: null, error: null });
    try {
      const blob = await fetchFile(file);
      const text = await blobText(blob);
      setPreview((p) => (p && p.path === file.path ? { ...p, text } : p));
    } catch (e) {
      setPreview((p) => (p && p.path === file.path ? { ...p, error: e } : p));
    }
  };

  const th = (group, key, extra = {}) => (
    <th scope="col" {...extra} {...tip(t(`tips.assets.${group}.${key}`))}>
      {t(`components.assets.${group}.${key}`)}
    </th>
  );

  return (
    <Modal
      open
      size="xlarge"
      onClose={onClose}
      title={t('components.assets.versionsTitle', { name: asset.name })}
      headerMeta={
        <Badge tone="info" tip={enumTip(t, 'agentAssetKind', asset.kind)}>
          {enumLabel(t, 'agentAssetKind', asset.kind)}
        </Badge>
      }
      footer={
        <button type="button" className="button-secondary" onClick={onClose} {...tip(t('tips.modal.close'))}>
          {t('common.actions.close')}
        </button>
      }
    >
      <div className="asset-versions" data-testid="asset-versions">
        {error && <ErrorBanner message={errorMessage(t, error)} onRetry={() => load()} />}
        {systemPrompt && (
          <div className="info-banner" data-testid="asset-system-prompt">
            {t('components.assets.systemPromptNotice')}
          </div>
        )}
        {versions === null ? (
          <LoadingState />
        ) : versions.length === 0 ? (
          <p className="text-muted" data-testid="asset-versions-empty">
            {t('components.assets.noVersions')}
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data-table" data-testid="asset-version-list">
              <thead>
                <tr>
                  {th('versionColumns', 'number')}
                  {th('versionColumns', 'author')}
                  {th('versionColumns', 'changeNote')}
                  {th('versionColumns', 'totalBytes')}
                  {th('versionColumns', 'createdUtc')}
                  {th('versionColumns', 'actions', { className: 'right' })}
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id || v.number} data-version={v.number} className={v.number === selected ? 'is-selected' : ''}>
                    <td>
                      <strong>{t('resources.agentAssets.version', { number: v.number })}</strong>{' '}
                      {v.number === current && (
                        <Badge tone="success" tip={t('tips.assets.current')}>
                          {t('components.assets.current')}
                        </Badge>
                      )}
                    </td>
                    <td>{v.authorName || '-'}</td>
                    <td>{v.changeNote || '-'}</td>
                    <td>{formatBytes(v.totalBytes, lng)}</td>
                    <td>
                      <span {...tip(formatDateTime(v.createdUtc, lng))}>{formatRelativeTime(v.createdUtc, lng)}</span>
                    </td>
                    <td className="right">
                      <button
                        type="button"
                        className="button-ghost button-sm"
                        onClick={() => {
                          setSelected(v.number);
                          setPreview(null);
                        }}
                        aria-pressed={v.number === selected}
                        data-testid="asset-version-files"
                        {...tip(t('tips.assets.showFiles'))}
                      >
                        {t('components.assets.showFiles')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {version && (
          <div data-testid="asset-version-detail" data-version={version.number}>
            <h3 className="section-title">{t('components.assets.filesTitle', { number: version.number })}</h3>
            {(version.files || []).length === 0 ? (
              <p className="text-muted">{t('components.assets.noFiles')}</p>
            ) : (
              <div className="table-scroll">
                <table className="data-table" data-testid="asset-file-list">
                  <thead>
                    <tr>
                      {th('fileColumns', 'path')}
                      {th('fileColumns', 'mediaType')}
                      {th('fileColumns', 'sizeBytes')}
                      {th('fileColumns', 'sha256')}
                      {th('fileColumns', 'actions', { className: 'right' })}
                    </tr>
                  </thead>
                  <tbody>
                    {version.files.map((f) => (
                      <tr key={f.path} data-file={f.path}>
                        <td>
                          <code>{f.path}</code>
                        </td>
                        <td>{f.mediaType || '-'}</td>
                        <td>{formatBytes(f.sizeBytes, lng)}</td>
                        <td>
                          <code className="cell-id" {...tip(t('tips.assets.sha256Full', { sha: f.sha256 }))}>
                            {shortSha(f.sha256)}
                          </code>
                        </td>
                        <td className="right">
                          <span className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                            {isPreviewable(f) && (
                              <button type="button" className="button-ghost button-sm" onClick={() => showPreview(f)} data-testid="asset-file-preview-button" {...tip(t('tips.assets.preview'))}>
                                {t('components.assets.preview')}
                              </button>
                            )}
                            <button type="button" className="button-ghost button-sm" onClick={() => download(f)} data-testid="asset-file-download" {...tip(t('tips.assets.download'))}>
                              {t('components.assets.download')}
                            </button>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {preview && (
          <div className="asset-preview" data-testid="asset-file-preview" data-path={preview.path}>
            <h3 className="section-title">{t('components.assets.previewTitle', { path: preview.path, number: preview.number })}</h3>
            {preview.error ? <ErrorBanner message={errorMessage(t, preview.error)} /> : preview.text === null ? <LoadingState /> : preview.text ? (
              <div className="code-block">
                <pre data-testid="asset-file-preview-text">{preview.text}</pre>
              </div>
            ) : (
              <p className="text-muted">{t('components.assets.emptyFile')}</p>
            )}
          </div>
        )}

        {!systemPrompt && (
          <AssetUploadPanel
            asset={asset}
            onUploaded={(res) => {
              if (res?.version?.number) setCurrent(res.version.number);
              load(res?.version?.number ?? null);
              setPreview(null);
              onChanged?.();
            }}
          />
        )}
      </div>
    </Modal>
  );
}
