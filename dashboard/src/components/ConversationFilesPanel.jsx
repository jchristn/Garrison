import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';
import ConversationFileVersionsModal from './ConversationFileVersionsModal';
import ConversationFileUploadPanel from './ConversationFileUploadPanel';
import { Badge } from './StatusBadge';
import { EmptyState, ErrorBanner, LoadingState } from './States';
import { DownloadIcon, RefreshIcon, TrashIcon } from './Icons';
import { tip } from './Tooltip';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { errorMessage } from '../utils/errors';
import { formatBytes, formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { fileName, saveBlob } from '../utils/assets';
import { FILES_POLL_MS, filesChannel, isFilesChanged, normalizeListing } from '../utils/fileSpaces';

/**
 * Live updates for one conversation's files over the WebSocket channel conversation-files:{id} (AD3.8). Calls
 * onChanged for every files.changed message (the subscription itself starts with one listing every current file) and
 * returns whether the channel is subscribed; while it is not, the tab polls.
 */
function useFilesChannel(apiClient, conversationId, onChanged) {
  const [live, setLive] = useState(false);
  const handler = useRef(onChanged);
  useEffect(() => {
    handler.current = onChanged;
  }, [onChanged]);
  useEffect(() => {
    if (!apiClient || !conversationId || typeof WebSocket === 'undefined' || typeof apiClient.webSocketUrl !== 'function') return undefined;
    const channel = filesChannel(conversationId);
    let ws;
    try {
      ws = new WebSocket(apiClient.webSocketUrl());
      ws.onopen = () => {
        try {
          ws.send(JSON.stringify({ type: 'subscribe', channel }));
        } catch {
          /* ignore */
        }
      };
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message?.type === 'subscribed' && message.channel === channel) setLive(true);
          else if (message?.type === 'error' && message.channel === channel) setLive(false);
          else if (isFilesChanged(message, conversationId)) handler.current?.(message);
        } catch {
          /* not JSON */
        }
      };
      ws.onclose = () => setLive(false);
      ws.onerror = () => setLive(false);
    } catch {
      setLive(false);
    }
    return () => ws?.close();
  }, [apiClient, conversationId]);
  return live;
}

/**
 * The Files tab of Conversation detail (AD3.8): the conversation's shared file space, which every turn and every agent
 * it delegates to reads and writes. Lists the files (path, version, size, media type, last update) with Versions,
 * Download, and Delete, can show deleted files, and uploads new files or new versions. Refreshes when the
 * conversation-files channel reports a change, and polls every FILES_POLL_MS while the channel is not live.
 */
export default function ConversationFilesPanel({ conversationId }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const { addToast } = useToast();
  const lng = i18n.language;
  const [listing, setListing] = useState(null);
  const [error, setError] = useState(null);
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [versionsFor, setVersionsFor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const unmounted = useRef(false);

  useEffect(() => {
    unmounted.current = false;
    return () => {
      unmounted.current = true;
    };
  }, []);

  const load = useCallback(() => {
    if (!apiClient || !conversationId) return Promise.resolve();
    return apiClient
      .listConversationFiles(tenantId, conversationId, includeDeleted)
      .then((r) => {
        if (unmounted.current) return;
        setListing(normalizeListing(r));
        setError(null);
      })
      .catch((e) => {
        if (unmounted.current) return;
        setError(e);
        setListing((prev) => prev || normalizeListing(null));
      });
  }, [apiClient, tenantId, conversationId, includeDeleted]);

  useEffect(() => {
    load();
  }, [load]);

  const live = useFilesChannel(apiClient, conversationId, load);

  useEffect(() => {
    if (live) return undefined;
    const id = setInterval(load, FILES_POLL_MS);
    return () => clearInterval(id);
  }, [live, load]);

  // Download through a link that needs no credentials (the browser saves it, so large files never pass through the
  // page); the content route is the fallback when the server cannot issue a link.
  const download = useCallback(
    async (file, version) => {
      let url = null;
      try {
        url = (await apiClient.conversationFileDownloadUrl(tenantId, conversationId, file.path, version))?.url || null;
      } catch (e) {
        if (e?.status === 404) throw e;
      }
      if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName(file.path);
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        return;
      }
      saveBlob(fileName(file.path), await apiClient.getConversationFileContent(tenantId, conversationId, file.path, version));
    },
    [apiClient, tenantId, conversationId]
  );

  const downloadCurrent = async (file) => {
    try {
      await download(file);
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    }
  };

  const remove = async () => {
    const file = deleting;
    try {
      await apiClient.deleteConversationFile(tenantId, conversationId, file.path);
      addToast({ type: 'success', message: t('components.files.deletedToast', { path: file.path }) });
    } catch (e) {
      addToast({ type: 'error', message: errorMessage(t, e) });
    } finally {
      setDeleting(null);
      load();
    }
  };

  if (listing === null) return <LoadingState />;

  const files = listing.files;
  const th = (key, extra = {}) => (
    <th scope="col" {...extra} {...tip(t(`tips.files.columns.${key}`))}>
      {t(`components.files.columns.${key}`)}
    </th>
  );

  return (
    <section className="panel conversation-files" aria-label={t('components.files.title')} data-testid="conversation-files">
      <div className="conversation-files-toolbar">
        <h3 className="section-title" {...tip(t('tips.files.summary'))}>
          {t('components.files.summary', { count: formatNumber(listing.fileCount, {}, lng), size: formatBytes(listing.totalBytes, lng) })}
        </h3>
        <span className="flex gap-sm items-center">
          <Badge tone={live ? 'success' : 'neutral'} tip={t(live ? 'tips.files.live' : 'tips.files.polling', { seconds: FILES_POLL_MS / 1000 })}>
            <span data-testid="files-live" data-live={live ? 'true' : 'false'}>
              {live ? t('components.files.live') : t('components.files.polling')}
            </span>
          </Badge>
          <span className="field-checkbox">
            <input id="files-include-deleted" type="checkbox" checked={includeDeleted} onChange={(e) => setIncludeDeleted(e.target.checked)} data-testid="files-include-deleted" {...tip(t('tips.files.includeDeleted'))} />
            <label htmlFor="files-include-deleted" {...tip(t('tips.files.includeDeleted'))}>
              {t('components.files.includeDeleted')}
            </label>
          </span>
          <button type="button" className="button-secondary button-sm" onClick={load} data-testid="files-refresh" {...tip(t('tips.files.refresh'))}>
            <RefreshIcon /> {t('components.files.refresh')}
          </button>
        </span>
      </div>
      {listing.fileSpaceId && (
        <p className="field-hint" data-testid="files-space-id">
          {t('components.files.spaceId', { id: listing.fileSpaceId })}
        </p>
      )}
      {error && <ErrorBanner message={errorMessage(t, error)} onRetry={load} />}

      {files.length === 0 ? (
        <div data-testid="files-empty">
          <EmptyState title={t('components.files.emptyTitle')} body={t(includeDeleted ? 'components.files.emptyBodyDeleted' : 'components.files.emptyBody')} />
        </div>
      ) : (
        <div className="table-scroll">
          <table className="data-table" data-testid="file-list">
            <thead>
              <tr>
                {th('path')}
                {th('currentVersion', { className: 'right' })}
                {th('sizeBytes', { className: 'right' })}
                {th('mediaType')}
                {th('lastUpdateUtc')}
                {th('actions', { className: 'right' })}
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id || f.path} data-file={f.path} data-deleted={f.deleted ? 'true' : 'false'} className={f.deleted ? 'is-deleted' : ''}>
                  <td>
                    <span className="inline-meta">
                      <code>{f.path}</code>
                      {f.deleted && (
                        <Badge tone="warning" tip={t('tips.files.deleted')}>
                          {t('components.files.deleted')}
                        </Badge>
                      )}
                    </span>
                  </td>
                  <td className="right">{t('components.files.version', { number: f.currentVersion })}</td>
                  <td className="right">{formatBytes(f.sizeBytes, lng)}</td>
                  <td>{f.mediaType || '-'}</td>
                  <td className="nowrap">
                    <span {...tip(formatDateTime(f.lastUpdateUtc, lng))}>{formatRelativeTime(f.lastUpdateUtc, lng)}</span>
                  </td>
                  <td className="right">
                    <span className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                      <button type="button" className="button-ghost button-sm" onClick={() => setVersionsFor(f)} data-testid="file-versions-button" {...tip(t('tips.files.versions'))}>
                        {t('components.files.versions')}
                      </button>
                      <button type="button" className="button-ghost button-sm" onClick={() => downloadCurrent(f)} data-testid="file-download" {...tip(t('tips.files.download'))}>
                        <DownloadIcon size={14} /> {t('components.files.download')}
                      </button>
                      {!f.deleted && (
                        <button type="button" className="button-ghost button-sm" onClick={() => setDeleting(f)} data-testid="file-delete" aria-label={t('components.files.deleteLabel', { path: f.path })} {...tip(t('tips.files.delete'))}>
                          <TrashIcon size={14} />
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConversationFileUploadPanel conversationId={conversationId} files={files} onUploaded={() => load()} />

      {versionsFor && <ConversationFileVersionsModal conversationId={conversationId} file={versionsFor} download={download} onClose={() => setVersionsFor(null)} />}
      <ConfirmModal
        open={!!deleting}
        danger
        title={t('components.files.deleteTitle')}
        message={deleting ? t('components.files.confirmDelete', { path: deleting.path }) : ''}
        confirmLabel={t('common.actions.delete')}
        confirmTip={t('tips.files.confirmDelete')}
        onConfirm={remove}
        onCancel={() => setDeleting(null)}
      />
    </section>
  );
}
