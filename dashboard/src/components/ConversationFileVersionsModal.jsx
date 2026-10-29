import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { Badge } from './StatusBadge';
import { ErrorBanner, LoadingState } from './States';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../utils/errors';
import { pathFor } from '../config/navConfig';
import { formatBytes, formatDateTime, formatRelativeTime } from '../i18n/formatters';
import { blobText, isPreviewable, shortSha } from '../utils/assets';
import { versionWriter } from '../utils/fileSpaces';

/**
 * One shared file's version history (AD3.8): every version newest first (number, size, media type, digest, writer,
 * the run that wrote it, created) with a Download per version and a read-only text preview for text, JSON, YAML, XML,
 * and Markdown. `download(file, version)` is the Files tab's download, so both use the same link route.
 */
export default function ConversationFileVersionsModal({ conversationId, file, download, onClose }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const lng = i18n.language;
  const [versions, setVersions] = useState(null);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);

  const load = useCallback(() => {
    if (!apiClient || !file?.path) return;
    setError(null);
    apiClient
      .listConversationFileVersions(tenantId, conversationId, file.path)
      .then((r) => setVersions([...(Array.isArray(r) ? r : r?.objects || [])].sort((a, b) => (b.number ?? 0) - (a.number ?? 0))))
      .catch((e) => {
        setVersions([]);
        setError(e);
      });
  }, [apiClient, tenantId, conversationId, file?.path]);
  useEffect(() => load(), [load]);

  const showPreview = async (version) => {
    setPreview({ number: version.number, text: null, error: null });
    try {
      const text = await blobText(await apiClient.getConversationFileContent(tenantId, conversationId, file.path, version.number));
      setPreview((p) => (p && p.number === version.number ? { ...p, text } : p));
    } catch (e) {
      setPreview((p) => (p && p.number === version.number ? { ...p, error: e } : p));
    }
  };

  const save = async (version) => {
    try {
      await download(file, version.number);
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    }
  };

  const th = (key, extra = {}) => (
    <th scope="col" {...extra} {...tip(t(`tips.files.versionColumns.${key}`))}>
      {t(`components.files.versionColumns.${key}`)}
    </th>
  );

  return (
    <Modal
      open
      size="xlarge"
      onClose={onClose}
      title={t('components.files.versionsTitle', { path: file.path })}
      headerMeta={
        file.deleted ? (
          <Badge tone="warning" tip={t('tips.files.deleted')}>
            {t('components.files.deleted')}
          </Badge>
        ) : null
      }
      footer={
        <button type="button" className="button-secondary" onClick={onClose} {...tip(t('tips.modal.close'))}>
          {t('common.actions.close')}
        </button>
      }
    >
      <div className="asset-versions" data-testid="file-versions" data-path={file.path}>
        {error && <ErrorBanner message={errorMessage(t, error)} onRetry={load} />}
        {versions === null ? (
          <LoadingState />
        ) : versions.length === 0 ? (
          <p className="text-muted" data-testid="file-versions-empty">
            {t('components.files.noVersions')}
          </p>
        ) : (
          <div className="table-scroll">
            <table className="data-table" data-testid="file-version-list">
              <thead>
                <tr>
                  {th('number')}
                  {th('sizeBytes')}
                  {th('mediaType')}
                  {th('sha256')}
                  {th('writtenBy')}
                  {th('createdUtc')}
                  {th('actions', { className: 'right' })}
                </tr>
              </thead>
              <tbody>
                {versions.map((v) => (
                  <tr key={v.id || v.number} data-version={v.number} className={preview?.number === v.number ? 'is-selected' : ''}>
                    <td>
                      <strong>{t('components.files.version', { number: v.number })}</strong>{' '}
                      {v.number === file.currentVersion && !file.deleted && (
                        <Badge tone="success" tip={t('tips.files.current')}>
                          {t('components.files.current')}
                        </Badge>
                      )}
                    </td>
                    <td>{formatBytes(v.sizeBytes, lng)}</td>
                    <td>{v.mediaType || '-'}</td>
                    <td>
                      <code className="cell-id" {...tip(t('tips.files.sha256Full', { sha: v.sha256 }))}>
                        {shortSha(v.sha256)}
                      </code>
                    </td>
                    <td data-testid="file-version-writer">
                      <span className="inline-meta">
                        <span>{versionWriter(v) || '-'}</span>
                        {v.runId && (
                          <a
                            href={pathFor('runs', v.runId)}
                            data-testid="file-version-run"
                            {...tip(t('tips.files.openRun'))}
                            onClick={(e) => {
                              e.preventDefault();
                              onClose();
                              navigate(pathFor('runs', v.runId));
                            }}
                          >
                            <code>{v.runId}</code>
                          </a>
                        )}
                      </span>
                    </td>
                    <td className="nowrap">
                      <span {...tip(formatDateTime(v.createdUtc, lng))}>{formatRelativeTime(v.createdUtc, lng)}</span>
                    </td>
                    <td className="right">
                      <span className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                        {isPreviewable({ path: file.path, mediaType: v.mediaType }) && (
                          <button type="button" className="button-ghost button-sm" onClick={() => showPreview(v)} aria-pressed={preview?.number === v.number} data-testid="file-version-preview-button" {...tip(t('tips.files.preview'))}>
                            {t('components.files.preview')}
                          </button>
                        )}
                        <button type="button" className="button-ghost button-sm" onClick={() => save(v)} data-testid="file-version-download" {...tip(t('tips.files.downloadVersion'))}>
                          {t('components.files.download')}
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {preview && (
          <div className="asset-preview" data-testid="file-preview" data-version={preview.number}>
            <h3 className="section-title">{t('components.files.previewTitle', { path: file.path, number: preview.number })}</h3>
            {preview.error ? (
              <ErrorBanner message={errorMessage(t, preview.error)} />
            ) : preview.text === null ? (
              <LoadingState />
            ) : preview.text ? (
              <div className="code-block">
                <pre data-testid="file-preview-text">{preview.text}</pre>
              </div>
            ) : (
              <p className="text-muted">{t('components.files.emptyFile')}</p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
