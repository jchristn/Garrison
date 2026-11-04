import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip.jsx';
import { BackIcon, DownloadIcon } from './Icons.jsx';
import Markdown from './Markdown.jsx';
import { formatBytes } from '../i18n/formatters.js';
import { errorText } from '../utils/errors.js';
import { PREVIEW_MAX_BYTES, blobBytes, decodeText, imageType, prettyJson, previewKind } from '../utils/filePreview.js';

// One file of the conversation shown in the files panel, so it can be reviewed without downloading it: Markdown
// rendered, JSON indented, other text as it is, images as images. Files the browser cannot show here (PDF, Office
// documents, archives) and files over 5 MiB are offered as a download. The view reloads when the agent writes a new
// version. Links in a Markdown file to other files of the conversation open them here.
export default function FileViewer({ client, conversationId, file, path, filePaths, onOpen, onBack, onDownload }) {
  const { t } = useTranslation();
  const [state, setState] = useState({ loading: true, error: null, kind: null, text: null, imageUrl: null });
  const version = file ? file.currentVersion : null;
  const size = file ? Number(file.sizeBytes) || 0 : 0;
  const kind = previewKind(path);
  const tooLarge = size > PREVIEW_MAX_BYTES;

  useEffect(() => {
    if (kind === 'binary' || tooLarge) {
      setState({ loading: false, error: null, kind: 'none', text: null, imageUrl: null });
      return undefined;
    }
    let cancelled = false;
    let imageUrl = null;
    setState((s) => ({ ...s, loading: true, error: null }));
    client
      .readFileBlob(conversationId, path)
      .then(async (blob) => {
        if (cancelled) return;
        if (kind === 'image') {
          const typed = blob.type && blob.type.startsWith('image/') ? blob : new Blob([blob], { type: imageType(path) || 'application/octet-stream' });
          imageUrl = URL.createObjectURL(typed);
          setState({ loading: false, error: null, kind: 'image', text: null, imageUrl });
          return;
        }
        const text = decodeText(await blobBytes(blob));
        if (cancelled) return;
        if (text === null) setState({ loading: false, error: null, kind: 'none', text: null, imageUrl: null });
        else if (kind === 'markdown') setState({ loading: false, error: null, kind: 'markdown', text, imageUrl: null });
        else if (kind === 'json') setState({ loading: false, error: null, kind: 'text', text: prettyJson(text, path), imageUrl: null });
        else setState({ loading: false, error: null, kind: 'text', text, imageUrl: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ loading: false, error: err, kind: null, text: null, imageUrl: null });
      });
    return () => {
      cancelled = true;
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [client, conversationId, path, version, kind, tooLarge]);

  return (
    <section className="file-viewer" aria-label={path} data-testid="file-viewer" data-path={path}>
      <div className="file-viewer-header">
        <button type="button" className="icon-button small" onClick={onBack} aria-label={t('files.back')} {...tip(t('tips.backToFiles'))} data-testid="file-viewer-back">
          <BackIcon />
        </button>
        <div className="file-info">
          <span className="file-path">{path}</span>
          {file ? (
            <span className="file-meta">
              <span>{t('files.version', { number: file.currentVersion })}</span>
              <span aria-hidden="true">·</span>
              <span>{formatBytes(size)}</span>
            </span>
          ) : null}
        </div>
        <button type="button" className="icon-button small" onClick={() => onDownload(path)} aria-label={`${t('files.download')}: ${path}`} {...tip(t('tips.download'))} data-testid="file-viewer-download">
          <DownloadIcon />
        </button>
      </div>
      <div className="file-viewer-body">
        {state.loading ? <div className="spinner" role="status" aria-label={t('common.loading')} /> : null}
        {state.error ? (
          <p className="notice notice-error" role="alert">
            {t('files.viewError')} {errorText(t, state.error)}
          </p>
        ) : null}
        {!state.loading && state.kind === 'none' ? (
          <p className="empty-text" data-testid="file-viewer-unavailable">
            {tooLarge ? t('files.previewTooLarge', { size: formatBytes(size) }) : t('files.previewUnavailable')}
          </p>
        ) : null}
        {!state.loading && state.kind === 'markdown' ? (
          <div className="file-viewer-markdown" data-testid="file-viewer-markdown">
            <Markdown text={state.text} filePaths={filePaths} onFile={onOpen} />
          </div>
        ) : null}
        {!state.loading && state.kind === 'text' ? (
          <pre className="file-viewer-text" data-testid="file-viewer-text">
            {state.text}
          </pre>
        ) : null}
        {!state.loading && state.kind === 'image' ? <img className="file-viewer-image" src={state.imageUrl} alt={path} data-testid="file-viewer-image" /> : null}
      </div>
    </section>
  );
}
