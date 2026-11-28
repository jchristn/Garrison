import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip';
import { UploadIcon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { errorMessage } from '../utils/errors';
import { readUploadFile, uploadBody } from '../utils/assets';

/** Image types an app image may be: what browsers show in an <img> under the image's Content-Security-Policy. */
export const APP_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon'];

/** Asset names: lowercase letters, digits, and hyphens, at most 64 characters. */
export function appImageAssetName(appName, role, now = Date.now()) {
  const base = String(appName || 'app')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'app';
  return `${base}-${role}-${now.toString(36)}`.slice(0, 64);
}

const cache = new Map();

/**
 * The first image of an asset's current version as an object URL, for the preview. Null while it loads, when the
 * asset has no image, or when the caller cannot read it. Results are cached per asset for this page.
 */
export function useAssetImage(assetId, localUrl = null) {
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const [url, setUrl] = useState(() => (assetId ? cache.get(assetId) || null : null));
  useEffect(() => {
    if (localUrl || !assetId) {
      setUrl(null);
      return undefined;
    }
    if (cache.has(assetId)) {
      setUrl(cache.get(assetId));
      return undefined;
    }
    let cancelled = false;
    setUrl(null);
    const load = async () => {
      if (!apiClient?.getAgentAsset || !apiClient.getAgentAssetVersion || !apiClient.getAgentAssetFile) return null;
      const asset = await apiClient.getAgentAsset(tenantId, assetId);
      if (!asset?.currentVersion) return null;
      const version = await apiClient.getAgentAssetVersion(tenantId, assetId, asset.currentVersion);
      const file = (version?.files || []).find((f) => String(f.mediaType || '').startsWith('image/') || /\.(png|jpe?g|gif|webp|svg|ico)$/i.test(String(f.path || '')));
      if (!file) return null;
      const blob = await apiClient.getAgentAssetFile(tenantId, assetId, asset.currentVersion, file.path);
      return blob && typeof URL !== 'undefined' && URL.createObjectURL ? URL.createObjectURL(blob) : null;
    };
    load()
      .then((value) => {
        if (value) cache.set(assetId, value);
        if (!cancelled) setUrl(value);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [apiClient, tenantId, assetId, localUrl]);
  return localUrl || url;
}

/**
 * One app image (logo, favicon, or agent avatar, LP8.4): pick an existing asset, or upload an image right here. An
 * upload creates a new reference-file asset named after the app and the role, uploads the image as its first version,
 * selects it, and reloads the asset list. The thumbnail shows the image the app page will use.
 */
export default function AgenticAppImageField({ id, role, label, tipText, hint, value, onChange, assets = [], noneLabel, appName, disabled = false, error = null, onUploaded, onPreview }) {
  const { t } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploaded, setUploaded] = useState(null);
  const [localUrl, setLocalUrl] = useState(null);
  const shown = useAssetImage(value, uploaded && uploaded.id === value ? localUrl : null);

  useEffect(() => {
    if (onPreview) onPreview(shown || null);
  }, [shown, onPreview]);

  const options = [...assets.map((a) => ({ value: a.id, label: a.name })), ...(value && !assets.some((a) => a.id === value) ? [{ value, label: uploaded?.id === value ? uploaded.name : value }] : [])];

  const pick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploadError(null);
    if (!APP_IMAGE_TYPES.includes(String(file.type || '').toLowerCase())) {
      setUploadError(t('components.appAppearance.image.notImage'));
      return;
    }
    setBusy(true);
    try {
      const read = await readUploadFile(file);
      const name = appImageAssetName(appName, role);
      const asset = await apiClient.createAgentAsset(tenantId, { name, kind: 'ReferenceFile', description: t('components.appAppearance.image.assetDescription', { app: appName || name, role: label }), tags: ['app-appearance'] });
      await apiClient.uploadAgentAssetVersion(tenantId, asset.id, uploadBody([read], null));
      setLocalUrl(`data:${read.mediaType || 'image/png'};base64,${read.contentBase64}`);
      setUploaded({ id: asset.id, name: asset.name || name });
      onChange(asset.id);
      if (onUploaded) onUploaded(asset);
    } catch (err) {
      setUploadError(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`field appearance-image ${error ? 'has-error' : ''}`} data-field={id.replace(/^apps-/, '')}>
      <label htmlFor={id} {...tip(tipText)}>
        {label}
      </label>
      <div className="appearance-image-row">
        <span className={`appearance-thumb appearance-thumb-${role}`} aria-hidden="true">
          {shown ? <img src={shown} alt="" data-testid={`${id}-thumb`} /> : null}
        </span>
        <select id={id} value={value || ''} disabled={disabled || busy} onChange={(e) => onChange(e.target.value)} data-testid={id} {...tip(tipText)}>
          <option value="">{noneLabel}</option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <button type="button" className="button-secondary button-sm appearance-upload" disabled={disabled || busy || !apiClient?.createAgentAsset} onClick={() => input.current && input.current.click()} data-testid={`${id}-upload`} {...tip(t('tips.appAppearance.upload', { field: label }))}>
          <UploadIcon size={14} /> {busy ? t('components.appAppearance.image.uploading') : t('components.appAppearance.image.upload')}
        </button>
        <input ref={input} type="file" accept={APP_IMAGE_TYPES.join(',')} hidden onChange={pick} data-testid={`${id}-file`} aria-label={t('components.appAppearance.image.upload')} />
      </div>
      {hint ? <div className="field-hint">{hint}</div> : null}
      {uploaded && uploaded.id === value ? (
        <div className="field-hint" role="status" data-testid={`${id}-uploaded`}>
          {t('components.appAppearance.image.uploaded', { name: uploaded.name })}
        </div>
      ) : null}
      {uploadError || error ? (
        <div className="field-error" role="alert" data-testid={`${id}-error`}>
          {uploadError || error}
        </div>
      ) : null}
    </div>
  );
}
