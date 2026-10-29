import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal.jsx';
import { tip } from './Tooltip.jsx';
import { DownloadIcon } from './Icons.jsx';
import { formatBytes, formatDateTime } from '../i18n/formatters.js';
import { errorText } from '../utils/errors.js';

// Every version of one file, newest first, each with its own download.
export default function FileVersionsDialog({ client, conversationId, file, onDownload, onClose }) {
  const { t } = useTranslation();
  const [versions, setVersions] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    client
      .fileVersions(conversationId, file.path)
      .then((list) => !cancelled && setVersions(Array.isArray(list) ? list : []))
      .catch((err) => !cancelled && setError(err));
    return () => {
      cancelled = true;
    };
  }, [client, conversationId, file.path]);

  return (
    <Modal title={t('files.versionsTitle', { path: file.path })} onClose={onClose}>
      {error ? (
        <p className="notice notice-error" role="alert">
          {t('files.versionsError')} {errorText(t, error)}
        </p>
      ) : null}
      {!versions && !error ? <div className="spinner" role="status" aria-label={t('common.loading')} /> : null}
      {versions ? (
        <ul className="version-list" data-testid="version-list">
          {versions.map((v) => (
            <li key={v.number} className="version-item">
              <div className="version-info">
                <strong>{t('files.version', { number: v.number })}</strong>
                {v.number === file.currentVersion ? <span className="badge">{t('files.current')}</span> : null}
                <span className="file-meta">
                  {formatBytes(v.sizeBytes)} · {formatDateTime(v.createdUtc)}
                </span>
                <code className="file-hash">{String(v.sha256 || '').slice(0, 12)}</code>
              </div>
              <button type="button" className="icon-button" onClick={() => onDownload(file.path, v.number)} aria-label={`${t('files.download')} ${t('files.version', { number: v.number })}`} {...tip(t('tips.downloadVersion'))} data-testid="version-download">
                <DownloadIcon />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Modal>
  );
}
