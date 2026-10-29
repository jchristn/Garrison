import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip.jsx';
import { CloseIcon, DownloadIcon, HistoryIcon } from './Icons.jsx';
import FileVersionsDialog from './FileVersionsDialog.jsx';
import { formatBytes, formatRelativeTime } from '../i18n/formatters.js';
import { downloadFile } from '../utils/download.js';
import { errorText } from '../utils/errors.js';

// The conversation's file space (AD6.9): every file the agent wrote, live as files change, with download and
// version history. Files that changed while the panel was open carry a "New" badge.
export default function FilePanel({ client, conversationId, files, onClose }) {
  const { t } = useTranslation();
  const [versionsOf, setVersionsOf] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const list = files.listing && Array.isArray(files.listing.files) ? files.listing.files.filter((f) => !f.deleted) : [];
  const sorted = [...list].sort((a, b) => a.path.localeCompare(b.path));

  const download = async (path, version) => {
    setDownloadError(null);
    try {
      await downloadFile(client, conversationId, path, version);
    } catch (err) {
      setDownloadError(err);
    }
  };

  return (
    <aside className="file-panel" aria-labelledby="file-panel-title" data-testid="file-panel">
      <div className="file-panel-header">
        <h2 id="file-panel-title">{t('files.title')}</h2>
        <button type="button" className="icon-button" onClick={onClose} aria-label={t('files.close')} {...tip(t('tips.closeFiles'))}>
          <CloseIcon />
        </button>
      </div>
      {!conversationId ? <p className="empty-text">{t('files.noConversation')}</p> : null}
      {conversationId && files.loading ? <div className="spinner" role="status" aria-label={t('common.loading')} /> : null}
      {files.error ? (
        <p className="notice notice-error" role="alert">
          {t('files.loadError')} {errorText(t, files.error)}
        </p>
      ) : null}
      {downloadError ? (
        <p className="notice notice-error" role="alert">
          {t('files.downloadFailed')} {errorText(t, downloadError)}
        </p>
      ) : null}
      {conversationId && files.listing ? (
        <p className="file-summary">{t('files.summary', { count: sorted.length, size: formatBytes(files.listing.totalBytes || 0) })}</p>
      ) : null}
      {conversationId && files.listing && !sorted.length ? <p className="empty-text">{t('files.empty')}</p> : null}
      <ul className="file-list" aria-live="polite">
        {sorted.map((f) => (
          <li key={f.path} className="file-item" data-testid="file-item" data-path={f.path}>
            <div className="file-info">
              <span className="file-path">{f.path}</span>
              <span className="file-meta">
                {files.fresh.includes(f.path) ? <span className="badge badge-new">{t('files.newBadge')}</span> : null}
                <span>{t('files.version', { number: f.currentVersion })}</span>
                <span aria-hidden="true">·</span>
                <span>{formatBytes(f.sizeBytes)}</span>
                <span aria-hidden="true">·</span>
                <time dateTime={f.lastUpdateUtc}>{t('files.updated', { when: formatRelativeTime(f.lastUpdateUtc) })}</time>
              </span>
            </div>
            <div className="file-actions">
              <button type="button" className="icon-button" onClick={() => setVersionsOf(f)} aria-label={`${t('files.versions')}: ${f.path}`} {...tip(t('tips.versions'))} data-testid="file-versions">
                <HistoryIcon />
              </button>
              <button type="button" className="icon-button" onClick={() => download(f.path)} aria-label={`${t('files.download')}: ${f.path}`} {...tip(t('tips.download'))} data-testid="file-download">
                <DownloadIcon />
              </button>
            </div>
          </li>
        ))}
      </ul>
      {versionsOf ? <FileVersionsDialog client={client} conversationId={conversationId} file={versionsOf} onDownload={download} onClose={() => setVersionsOf(null)} /> : null}
    </aside>
  );
}
