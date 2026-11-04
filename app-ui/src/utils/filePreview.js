// How the file viewer shows a file from the conversation's file space: Markdown rendered, JSON indented, other text
// as it is, images as images. Anything else (PDF, Office documents, archives) is offered as a download, because the
// app's Content-Security-Policy does not allow embedding documents and the browser cannot render them inline anyway.

/** Largest file the viewer loads, in bytes (5 MiB). Bigger files are offered as a download. */
export const PREVIEW_MAX_BYTES = 5 * 1024 * 1024;

const MARKDOWN = ['md', 'markdown', 'mdx'];
const JSON_EXT = ['json', 'jsonl', 'ndjson', 'geojson'];
const IMAGES = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml', ico: 'image/x-icon', avif: 'image/avif' };
const TEXT = [
  'txt', 'text', 'log', 'csv', 'tsv', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf', 'env', 'xml', 'html', 'htm', 'css', 'scss',
  'js', 'mjs', 'cjs', 'jsx', 'ts', 'tsx', 'py', 'rb', 'go', 'rs', 'java', 'kt', 'cs', 'c', 'h', 'cpp', 'hpp', 'swift', 'php',
  'sh', 'bash', 'zsh', 'ps1', 'bat', 'sql', 'graphql', 'proto', 'tex', 'bib', 'rst', 'adoc', 'srt', 'vtt', 'diff', 'patch'
];
const BINARY = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'zip', 'gz', 'tgz', 'tar', '7z', 'rar', 'exe', 'dll', 'so', 'bin', 'mp3', 'mp4', 'mov', 'wav', 'ogg', 'webm', 'woff', 'woff2', 'ttf', 'otf', 'epub'];

/** The lower-case extension of a path's file name, or an empty string. */
export function extensionOf(path) {
  const name = String(path || '').split('/').pop() || '';
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/**
 * What the viewer does with a file, from its name: 'markdown', 'json', 'text', 'image', 'binary' (offer a download),
 * or 'unknown' (load it and show it as text when it decodes cleanly).
 */
export function previewKind(path) {
  const ext = extensionOf(path);
  if (MARKDOWN.includes(ext)) return 'markdown';
  if (JSON_EXT.includes(ext)) return 'json';
  if (IMAGES[ext]) return 'image';
  if (TEXT.includes(ext)) return 'text';
  if (BINARY.includes(ext)) return 'binary';
  return 'unknown';
}

/** The image MIME type for a path, or null. */
export function imageType(path) {
  return IMAGES[extensionOf(path)] || null;
}

/** True when a file can be shown in the viewer at its size. */
export function canPreview(file) {
  if (!file) return false;
  if (previewKind(file.path) === 'binary') return false;
  return !(Number(file.sizeBytes) > PREVIEW_MAX_BYTES);
}

/** UTF-8 text from bytes, or null when they are not text (a NUL byte or invalid UTF-8). */
export function decodeText(bytes) {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  if (view.includes(0)) return null;
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(view);
  } catch {
    return null;
  }
}

/** JSON indented for reading (each line of JSON Lines on its own); the text unchanged when it does not parse. */
export function prettyJson(text, path) {
  const ext = extensionOf(path);
  if (ext === 'jsonl' || ext === 'ndjson') {
    return text
      .split('\n')
      .map((line) => {
        try {
          return line.trim() ? JSON.stringify(JSON.parse(line), null, 2) : line;
        } catch {
          return line;
        }
      })
      .join('\n');
  }
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

/** The bytes of a Blob, with a FileReader fallback for browsers (and test DOMs) without Blob.arrayBuffer. */
export function blobBytes(blob) {
  if (blob && typeof blob.arrayBuffer === 'function') return blob.arrayBuffer().then((b) => new Uint8Array(b));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}
