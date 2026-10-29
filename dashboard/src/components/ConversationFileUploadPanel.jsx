import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBanner } from './States';
import { tip } from './Tooltip';
import { TrashIcon, UploadIcon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { errorMessage, errorDetail } from '../utils/errors';
import { translateServerText } from '../utils/serverText';
import { formatBytes } from '../i18n/formatters';
import { readUploadFile, uploadFileErrors } from '../utils/assets';
import { baseVersionFor, fileLimitSetting, fileUploadBody, pathFieldError, uploadOutcome } from '../utils/fileSpaces';

let nextKey = 0;

/** One refused upload as text: a 413 keeps the server's own text (it names the file, sizes, and setting), translated when known. */
function refusalText(t, err) {
  const setting = fileLimitSetting(err);
  const main = err.status === 413 && typeof err.body?.message === 'string' ? translateServerText(t, err.body.message) : errorMessage(t, err);
  return [main, setting ? t('components.files.limitSetting', { setting }) : '', errorDetail(t, err)].filter(Boolean).join(' ');
}

/**
 * Upload files into a conversation's shared space (AD3.8): pick one or more files (read in the browser as base64),
 * edit each path, and send them one by one. Each upload carries the listed file's current version as baseVersion
 * (0 for a new path), so a file a turn changed in the meantime is not overwritten: the server keeps the upload under a
 * conflict name and the result says which. Refused files stay in the list with their reason; sent ones leave it.
 */
export default function ConversationFileUploadPanel({ conversationId, files: listed, onUploaded }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [entries, setEntries] = useState([]);
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [readError, setReadError] = useState(null);
  const [rowErrors, setRowErrors] = useState({});
  const [results, setResults] = useState([]);

  const pick = async (e) => {
    const list = Array.from(e.target.files || []);
    e.target.value = '';
    if (!list.length) return;
    setReading(true);
    setReadError(null);
    try {
      const read = await Promise.all(list.map(readUploadFile));
      setEntries((prev) => [...prev, ...read.map((f) => ({ ...f, key: ++nextKey }))]);
      setResults([]);
    } catch (err) {
      setReadError(err);
    } finally {
      setReading(false);
    }
  };

  const setPath = (key, path) => setEntries((prev) => prev.map((f) => (f.key === key ? { ...f, path } : f)));
  const remove = (key) => {
    setEntries((prev) => prev.filter((f) => f.key !== key));
    setRowErrors({});
  };

  const upload = async () => {
    const local = uploadFileErrors(entries, t);
    const byKey = Object.fromEntries(Object.entries(local).map(([i, message]) => [entries[Number(i)].key, message]));
    setRowErrors(byKey);
    setResults([]);
    if (Object.keys(byKey).length) return;
    setBusy(true);
    const done = [];
    const failed = {};
    for (const entry of entries) {
      try {
        const res = await apiClient.uploadConversationFile(tenantId, conversationId, fileUploadBody(entry, baseVersionFor(entry.path, listed)));
        done.push({ key: entry.key, ...uploadOutcome(entry, res), base: baseVersionFor(entry.path, listed) });
      } catch (err) {
        failed[entry.key] = pathFieldError(t, err) || refusalText(t, err);
      }
    }
    setBusy(false);
    setEntries((prev) => prev.filter((f) => failed[f.key]));
    setRowErrors(failed);
    setResults(done);
    if (done.length) onUploaded?.(done);
  };

  const conflicts = results.filter((r) => r.conflict);
  const saved = results.filter((r) => !r.conflict);

  return (
    <div className="asset-upload" data-testid="file-upload">
      <h3 className="section-title">{t('components.files.uploadTitle')}</h3>
      <p className="field-hint">{t('components.files.uploadHint')}</p>
      {readError && <ErrorBanner message={errorMessage(t, readError)} />}
      {saved.length > 0 && (
        <div className="info-banner file-upload-results" role="status" data-testid="file-upload-result">
          {saved.map((r) => (
            <div key={r.key} data-path={r.path}>
              {r.base > 0 ? t('components.files.uploadReplaced', { path: r.path, version: r.version }) : t('components.files.uploadCreated', { path: r.path, version: r.version })}
            </div>
          ))}
        </div>
      )}
      {conflicts.length > 0 && (
        <div className="warning-banner file-upload-results" role="alert" data-testid="file-upload-conflict">
          {conflicts.map((r) => (
            <div key={r.key} data-path={r.path} data-requested-path={r.requestedPath}>
              {t('components.files.uploadConflict', { requested: r.requestedPath, path: r.path })}
            </div>
          ))}
        </div>
      )}
      <div className="field">
        <label htmlFor="file-upload-input" {...tip(t('tips.files.chooseFiles'))}>
          {t('components.files.chooseFiles')}
        </label>
        <input id="file-upload-input" type="file" multiple onChange={pick} disabled={busy || reading} data-testid="file-upload-input" {...tip(t('tips.files.chooseFiles'))} />
      </div>
      {entries.length > 0 && (
        <div className="table-scroll">
          <table className="data-table" data-testid="file-upload-files">
            <thead>
              <tr>
                <th scope="col" {...tip(t('tips.files.uploadColumns.path'))}>{t('components.files.uploadColumns.path')}</th>
                <th scope="col" {...tip(t('tips.files.uploadColumns.replaces'))}>{t('components.files.uploadColumns.replaces')}</th>
                <th scope="col" {...tip(t('tips.files.uploadColumns.size'))}>{t('components.files.uploadColumns.size')}</th>
                <th scope="col" className="right" {...tip(t('tips.files.uploadColumns.actions'))}>{t('components.files.uploadColumns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((f, i) => {
                const base = baseVersionFor(f.path, listed);
                return (
                  <tr key={f.key} data-upload-file={i}>
                    <td>
                      <input
                        type="text"
                        className={`monospace ${rowErrors[f.key] ? 'has-error' : ''}`}
                        value={f.path}
                        maxLength={512}
                        onChange={(e) => setPath(f.key, e.target.value)}
                        aria-label={t('components.files.uploadColumns.path')}
                        aria-invalid={rowErrors[f.key] ? 'true' : undefined}
                        data-testid="file-upload-path"
                        {...tip(t('tips.files.path'))}
                      />
                      {rowErrors[f.key] && (
                        <div className="field-error" role="alert" data-testid="file-upload-error">
                          {rowErrors[f.key]}
                        </div>
                      )}
                    </td>
                    <td data-testid="file-upload-base" data-base={base}>
                      {base > 0 ? t('components.files.replacesVersion', { version: base }) : <span className="text-muted">{t('components.files.newFile')}</span>}
                    </td>
                    <td>{formatBytes(f.sizeBytes, i18n.language)}</td>
                    <td className="right">
                      <button type="button" className="button-ghost button-sm" onClick={() => remove(f.key)} aria-label={t('components.files.removeFile')} data-testid="file-upload-remove" {...tip(t('tips.files.removeFile'))}>
                        <TrashIcon size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex gap-sm">
        <button type="button" className="button-primary" onClick={upload} disabled={busy || reading || entries.length === 0} data-testid="file-upload-submit" {...tip(t('tips.files.upload'))}>
          <UploadIcon size={14} /> {busy ? t('components.files.uploading') : t('components.files.upload')}
        </button>
      </div>
    </div>
  );
}
