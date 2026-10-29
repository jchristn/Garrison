import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ErrorBanner } from './States';
import { tip } from './Tooltip';
import { TrashIcon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { errorMessage, errorDetail } from '../utils/errors';
import { translateServerText } from '../utils/serverText';
import { formatBytes } from '../i18n/formatters';
import { limitSetting, readUploadFile, uploadBody, uploadFieldErrors, uploadFileErrors, uploadOtherErrors } from '../utils/assets';

let nextKey = 0;

/**
 * Upload a new version of an asset (AD2.8): pick one or more files (read in the browser as base64), edit each file's
 * path inside the asset, add a change note, and send them as one version. The result says whether the server created
 * a new version (201) or returned the current one because the files are identical (200). Size and count refusals (413)
 * name the setting that sets the limit; path refusals (400) show under the file they are about.
 */
export default function AssetUploadPanel({ asset, onUploaded }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [files, setFiles] = useState([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const [error, setError] = useState(null);
  const [fileErrors, setFileErrors] = useState({});
  const [result, setResult] = useState(null);

  const pick = async (e) => {
    const list = Array.from(e.target.files || []);
    e.target.value = '';
    if (!list.length) return;
    setReading(true);
    setError(null);
    try {
      const read = await Promise.all(list.map(readUploadFile));
      setFiles((prev) => [...prev, ...read.map((f) => ({ ...f, key: ++nextKey }))]);
      setResult(null);
    } catch (err) {
      setError(err);
    } finally {
      setReading(false);
    }
  };

  const setPath = (key, path) => setFiles((prev) => prev.map((f) => (f.key === key ? { ...f, path } : f)));
  const remove = (key) => {
    setFiles((prev) => prev.filter((f) => f.key !== key));
    setFileErrors({});
  };

  const upload = async () => {
    const local = uploadFileErrors(files, t);
    setFileErrors(local);
    setError(null);
    setResult(null);
    if (Object.keys(local).length) return;
    setBusy(true);
    try {
      const res = await apiClient.uploadAgentAssetVersion(tenantId, asset.id, uploadBody(files, note));
      setResult({ created: res.created, number: res.version?.number ?? null });
      setFiles([]);
      setNote('');
      onUploaded?.(res);
    } catch (err) {
      setError(err);
      setFileErrors(uploadFieldErrors(t, err));
    } finally {
      setBusy(false);
    }
  };

  // A 413 keeps the server's own text (it names the file, the sizes, and the setting), translated when it is known.
  const setting = limitSetting(error);
  const other = error ? Object.values(uploadOtherErrors(t, error)) : [];
  const errorText = error
    ? [error.status === 413 && typeof error.body?.message === 'string' ? translateServerText(t, error.body.message) : errorMessage(t, error), setting ? t('components.assets.limitSetting', { setting }) : '', ...other, errorDetail(t, error)].filter(Boolean).join(' ')
    : '';

  return (
    <div className="asset-upload" data-testid="asset-upload">
      <h3 className="section-title">{t('components.assets.uploadTitle')}</h3>
      <p className="field-hint">{t('components.assets.uploadHint')}</p>
      {error && <div data-testid="asset-upload-error"><ErrorBanner message={errorText} /></div>}
      {result && (
        <div className="info-banner" data-testid="asset-upload-result" data-created={result.created ? 'true' : 'false'}>
          {result.created ? t('components.assets.uploadCreated', { number: result.number }) : t('components.assets.uploadUnchanged', { number: result.number })}
        </div>
      )}
      <div className="field">
        <label htmlFor="asset-upload-files" {...tip(t('tips.assets.files'))}>{t('components.assets.files')}</label>
        <input id="asset-upload-files" type="file" multiple onChange={pick} disabled={busy || reading} data-testid="asset-upload-input" {...tip(t('tips.assets.files'))} />
      </div>
      {files.length > 0 && (
        <div className="table-scroll">
          <table className="data-table" data-testid="asset-upload-files">
            <thead>
              <tr>
                <th scope="col" {...tip(t('tips.assets.uploadColumns.path'))}>{t('components.assets.uploadColumns.path')}</th>
                <th scope="col" {...tip(t('tips.assets.uploadColumns.mediaType'))}>{t('components.assets.uploadColumns.mediaType')}</th>
                <th scope="col" {...tip(t('tips.assets.uploadColumns.size'))}>{t('components.assets.uploadColumns.size')}</th>
                <th scope="col" className="right" {...tip(t('tips.assets.uploadColumns.actions'))}>{t('components.assets.uploadColumns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f, i) => (
                <tr key={f.key} data-upload-file={i}>
                  <td>
                    <input
                      type="text"
                      className={`monospace ${fileErrors[i] ? 'has-error' : ''}`}
                      value={f.path}
                      maxLength={512}
                      onChange={(e) => setPath(f.key, e.target.value)}
                      aria-label={t('components.assets.uploadColumns.path')}
                      aria-invalid={fileErrors[i] ? 'true' : undefined}
                      data-testid="asset-upload-path"
                      {...tip(t('tips.assets.path'))}
                    />
                    {fileErrors[i] && (
                      <div className="field-error" role="alert" data-testid="asset-upload-file-error">
                        {fileErrors[i]}
                      </div>
                    )}
                  </td>
                  <td>{f.mediaType || <span className="text-muted">{t('components.assets.mediaTypeGuessed')}</span>}</td>
                  <td>{formatBytes(f.sizeBytes, i18n.language)}</td>
                  <td className="right">
                    <button type="button" className="button-ghost button-sm" onClick={() => remove(f.key)} aria-label={t('components.assets.removeFile')} data-testid="asset-upload-remove" {...tip(t('tips.assets.removeFile'))}>
                      <TrashIcon size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="field">
        <label htmlFor="asset-upload-note" {...tip(t('tips.assets.changeNote'))}>{t('components.assets.changeNote')}</label>
        <textarea id="asset-upload-note" rows={2} maxLength={2000} value={note} placeholder={t('components.assets.changeNotePlaceholder')} onChange={(e) => setNote(e.target.value)} data-testid="asset-upload-note" {...tip(t('tips.assets.changeNote'))} />
      </div>
      <div className="flex gap-sm">
        <button type="button" className="button-primary" onClick={upload} disabled={busy || reading || files.length === 0} data-testid="asset-upload-submit" {...tip(t('tips.assets.upload'))}>
          {busy ? t('components.assets.uploading') : t('components.assets.upload')}
        </button>
      </div>
    </div>
  );
}
