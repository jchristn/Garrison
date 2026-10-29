// Agent assets (AD2): versioned system prompts, skills, reference files, and document templates that agent revisions
// pin. Helpers shared by the Assets page, the version and upload dialog, the asset pins editor, and their tests.

import { fieldErrorMessages } from './errors';

/** Asset kinds, in the order the form lists them. */
export const ASSET_KINDS = ['SystemPrompt', 'Skill', 'ReferenceFile', 'DocumentTemplate'];

/** Error codes the server answers with 413 when an upload passes a limit, and the setting that sets each limit. */
export const ASSET_LIMIT_SETTINGS = {
  AssetFileTooLarge: 'Assets.MaxFileBytes',
  AssetVersionTooLarge: 'Assets.MaxVersionBytes',
  AssetTooManyFiles: 'Assets.MaxFilesPerVersion'
};

/** Characters of a SHA-256 digest shown in tables (the full digest is in the tooltip). */
export const SHA_PREFIX_LENGTH = 12;

/** True for assets that take their content from a prompt template and have no files. */
export function isSystemPrompt(asset) {
  return asset?.kind === 'SystemPrompt';
}

/** A SHA-256 digest shortened for a table cell. */
export function shortSha(sha) {
  const text = String(sha || '');
  return text.length > SHA_PREFIX_LENGTH ? `${text.slice(0, SHA_PREFIX_LENGTH)}...` : text;
}

const TEXT_MEDIA_TYPES = ['application/json', 'application/yaml', 'application/x-yaml', 'text/yaml', 'application/xml'];
const TEXT_EXTENSIONS = ['.md', '.txt', '.json', '.yaml', '.yml', '.csv', '.xml', '.html', '.css', '.js', '.ts', '.py', '.sh', '.toml', '.ini'];

/** True when a version file can be previewed as text: text/*, JSON, YAML, or XML media types (or a text extension). */
export function isPreviewable(file) {
  const type = String(file?.mediaType || '').toLowerCase().split(';')[0].trim();
  if (type.startsWith('text/') || TEXT_MEDIA_TYPES.includes(type) || type.endsWith('+json') || type.endsWith('+yaml')) return true;
  if (type && type !== 'application/octet-stream') return false;
  const path = String(file?.path || '').toLowerCase();
  return TEXT_EXTENSIONS.some((ext) => path.endsWith(ext));
}

/** The last segment of a path, used as the download file name. */
export function fileName(path) {
  const parts = String(path || '').split('/');
  return parts[parts.length - 1] || 'file';
}

/** Base64 content of a data URL ("data:...;base64,XXXX"), or '' when there is none. */
export function dataUrlBase64(dataUrl) {
  const text = String(dataUrl || '');
  const i = text.indexOf(',');
  return i >= 0 ? text.slice(i + 1) : '';
}

/**
 * Read a browser File as an upload entry: { path, mediaType, sizeBytes, contentBase64 }. The path starts as the
 * file's relative path (folder uploads) or its name, and the caller may edit it before the upload.
 * @param {File} file
 * @returns {Promise<{path:string, mediaType:string, sizeBytes:number, contentBase64:string}>}
 */
export function readUploadFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ path: file.webkitRelativePath || file.name, mediaType: file.type || '', sizeBytes: file.size, contentBase64: dataUrlBase64(reader.result) });
    reader.onerror = () => reject(reader.error || new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/** Body for POST /agent-assets/{id}/versions: trimmed paths, media types only when known, and an optional change note. */
export function uploadBody(files, changeNote) {
  const body = {
    files: (files || []).map((f) => {
      const out = { path: String(f.path || '').trim(), contentBase64: f.contentBase64 || '' };
      if (f.mediaType) out.mediaType = f.mediaType;
      return out;
    })
  };
  const note = String(changeNote || '').trim();
  if (note) body.changeNote = note;
  return body;
}

/** Client-side checks before an upload: at least one file, and every path present and unique. Returns { index: message }. */
export function uploadFileErrors(files, t) {
  const errors = {};
  const seen = new Set();
  (files || []).forEach((f, i) => {
    const path = String(f.path || '').trim();
    if (!path) errors[i] = t('common.errors.required');
    else if (seen.has(path)) errors[i] = t('components.assets.duplicatePath');
    seen.add(path);
  });
  return errors;
}

/** The setting that limits a 413 upload: the error body's setting, the code's known setting, or one named in the message. */
export function limitSetting(err) {
  if (!err || err.status !== 413) return '';
  const body = err.body && typeof err.body === 'object' ? err.body : {};
  if (body.setting) return body.setting;
  if (ASSET_LIMIT_SETTINGS[err.code]) return ASSET_LIMIT_SETTINGS[err.code];
  const m = /\((Assets\.[A-Za-z]+)\)/.exec(String(body.message || err.message || ''));
  return m ? m[1] : '';
}

/**
 * Per-file messages from a 400 upload refusal: { index: message } for keys like files[2].path, translated through the
 * field codes (InvalidAssetPath, MacroFormatRefused) and falling back to the server's text.
 */
export function uploadFieldErrors(t, err) {
  const fields = fieldErrorMessages(t, err);
  const out = {};
  for (const [key, message] of Object.entries(fields || {})) {
    const m = /^files\[(\d+)\]/.exec(key);
    if (!m) continue;
    const i = Number(m[1]);
    out[i] = out[i] ? `${out[i]} ${message}` : message;
  }
  return out;
}

/** Messages for fields of a 400 refusal that are not about one file (for example files or changeNote), keyed by field. */
export function uploadOtherErrors(t, err) {
  const fields = fieldErrorMessages(t, err);
  return Object.fromEntries(Object.entries(fields || {}).filter(([key]) => !/^files\[\d+\]/.test(key)));
}

/** Asset pins of a revision, normalized to [{ assetId, version }] with version null meaning "current". */
export function revisionPins(revision) {
  return (revision?.assetPins || []).filter((p) => p && p.assetId).map((p) => ({ assetId: p.assetId, version: p.version === undefined || p.version === null || p.version === '' ? null : Number(p.version) }));
}

/** Pins with an asset chosen and each asset listed once (the first pin of an asset wins). */
export function cleanPins(pins) {
  const seen = new Set();
  const out = [];
  for (const p of pins || []) {
    if (!p?.assetId || seen.has(p.assetId)) continue;
    seen.add(p.assetId);
    out.push({ assetId: p.assetId, version: p.version === undefined || p.version === null || p.version === '' ? null : Number(p.version) });
  }
  return out;
}

/** True when two pin lists pin the same assets at the same versions, in any order. */
export function samePins(a, b) {
  const key = (list) => cleanPins(list).map((p) => `${p.assetId}@${p.version ?? ''}`).sort().join('|');
  return key(a) === key(b);
}

/** Revision fields the server owns; a draft body never sends them. */
const SERVER_FIELDS = ['id', 'tenantId', 'agentId', 'number', 'state', 'contentHash', 'authorUserId', 'authorName', 'publishedByUserId', 'publishedByName', 'publishedUtc', 'createdUtc', 'lastUpdateUtc'];

/**
 * Body for POST /agents/{id}/revisions that saves `pins` as the draft's asset pins: the complete content of
 * `revision` (the open draft, or the published revision a new draft starts from) with only assetPins changed. The
 * change note is kept for a draft and dropped when starting from a published revision.
 */
export function draftBody(revision, pins) {
  const body = { ...(revision || {}) };
  for (const key of SERVER_FIELDS) delete body[key];
  if (revision?.state !== 'Draft') delete body.changeNote;
  body.assetPins = cleanPins(pins).map((p) => ({ assetId: p.assetId, version: p.version }));
  return body;
}

/** Text for one pin: "name v2" or "name (current)"; the asset ID stands in for an unknown name. */
export function pinLabel(t, pin, names = {}) {
  const name = names[pin?.assetId] || pin?.assetId || '';
  return pin?.version ? t('components.assets.pinVersion', { name, version: pin.version }) : t('components.assets.pinCurrent', { name });
}

/** Text of a Blob (Blob.text where available, FileReader otherwise). */
export function blobText(blob) {
  if (typeof blob?.text === 'function') return blob.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error || new Error('Could not read the file'));
    reader.readAsText(blob);
  });
}

/** Save a downloaded file through a temporary object URL (kept here so the assets chunk does not import the views). */
export function saveBlob(name, blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Asset name by ID, from a list of assets. */
export function assetNames(assets) {
  return Object.fromEntries((assets || []).map((a) => [a.id, a.name]));
}
