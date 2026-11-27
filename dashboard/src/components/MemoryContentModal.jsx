import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import Modal from './Modal';
import CopyButton from './CopyButton';
import CopyableId from './CopyableId';
import { Badge } from './StatusBadge';
import { EmptyNote, ErrorBanner, LoadingState } from './States';
import { tip } from './Tooltip';
import { TrashIcon } from './Icons';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { errorMessage } from '../utils/errors';
import { formatBytes, formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { isExpired, scopeText, writerRunPath, writerText } from '../utils/memory';

/**
 * One memory entry (AA4.13): its provenance (scope, key, category, tags, version, size, who wrote it and from which
 * run, when it was written, read, and expires) and its text. The text is data an agent or a person saved, so it is
 * shown as plain preformatted text, never rendered as HTML or Markdown. 409 MemoryDisabled (agent memory turned off on
 * the server) is explained in place of the text. `deleteDenied` is the missing permission's explanation, which keeps
 * Delete visible but disabled.
 */
export default function MemoryContentModal({ entry, names = {}, agents = {}, deleteDenied = '', onDelete, onClose }) {
  const { t, i18n } = useTranslation();
  const { apiClient } = useAuth();
  const { tenantId } = useApp();
  const lng = i18n.language;
  const [content, setContent] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const shown = content?.entry || entry;

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiClient
      .getMemoryContent(tenantId, entry.id)
      .then(setContent)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [apiClient, tenantId, entry.id]);
  useEffect(load, [load]);

  const when = (value) => (value ? <span {...tip(formatDateTime(value, lng))}>{formatRelativeTime(value, lng)}</span> : '-');
  const item = (key, value, span = false) => (
    <div className={`detail-item ${span ? 'detail-item-span' : ''}`} key={key}>
      <div className="detail-item-label" {...tip(t(`tips.resources.memory.${key}`))}>
        {t(`resources.memory.columns.${key}`)}
      </div>
      <div className="detail-item-value">{value ?? '-'}</div>
    </div>
  );
  const runPath = writerRunPath(shown);
  const value = content?.value ?? '';

  return (
    <Modal
      open
      size="large"
      onClose={onClose}
      title={t('memory.viewer.title')}
      headerMeta={<CopyableId value={shown.id} max={32} copyTip={t('tips.copy.id')} />}
      footer={
        <>
          {onDelete && (
            <button type="button" className="button-danger" aria-disabled={deleteDenied ? 'true' : undefined} onClick={() => !deleteDenied && onDelete(shown)} data-testid="memory-viewer-delete" {...tip(deleteDenied || t('tips.memory.actions.delete'))}>
              <TrashIcon size={14} /> {t('common.actions.delete')}
            </button>
          )}
          <button type="button" className="button-primary" onClick={onClose} {...tip(t('tips.modal.close'))}>
            {t('common.actions.close')}
          </button>
        </>
      }
    >
      <div data-testid="memory-viewer">
        <div className="detail-grid">
          {item(
            'key',
            <span className="memory-key-cell">
              <code className="cell-id">{shown.key}</code>
              {shown.legacy && <Badge tone="warning" tip={t('tips.memory.legacy')}>{t('memory.legacy')}</Badge>}
            </span>,
            true
          )}
          {item('scope', scopeText(t, shown.scopeKind, shown.scopeId, names))}
          {item('category', shown.category || '-')}
          {item('tags', (shown.tags || []).length ? shown.tags.join(', ') : '-')}
          {item('version', formatNumber(shown.version ?? 0, {}, lng))}
          {item('bytes', formatBytes(shown.bytes ?? 0, lng))}
          {item('writer', writerText(shown, agents) || '-')}
          {item('writerRunId', runPath ? <Link to={runPath} onClick={onClose} {...tip(t('tips.memory.actions.openRun'))}><code>{shown.writerRunId}</code></Link> : '-')}
          {item('lastUpdateUtc', when(shown.lastUpdateUtc))}
          {item('lastReadUtc', shown.lastReadUtc ? when(shown.lastReadUtc) : t('memory.neverRead'))}
          {item('expiresUtc', shown.expiresUtc ? <span className={isExpired(shown) ? 'text-danger' : ''}>{when(shown.expiresUtc)}</span> : t('memory.noExpiry'))}
          {item('createdUtc', when(shown.createdUtc))}
          {item('sha256', shown.sha256 ? <code className="cell-id memory-hash">{shown.sha256}</code> : '-', true)}
        </div>
        <div className="details-section">
          <div className="details-section-title" {...tip(t('tips.memory.viewer.content'))}>
            {t('memory.viewer.content')}
          </div>
          <p className="memory-untrusted" data-testid="memory-untrusted">
            {t('memory.viewer.untrusted')}
          </p>
          {loading ? (
            <LoadingState label={t('memory.viewer.loading')} />
          ) : error ? (
            <ErrorBanner message={error?.code === 'MemoryDisabled' ? t('errorCodes.MemoryDisabled') : errorMessage(t, error)} onRetry={error?.code === 'MemoryDisabled' ? undefined : load} />
          ) : value === '' ? (
            <EmptyNote>{t('memory.viewer.empty')}</EmptyNote>
          ) : (
            <div className="code-block memory-content">
              <div className="code-block-toolbar">
                <CopyButton value={value} tipText={t('tips.memory.viewer.copy')} testId="memory-content-copy" />
              </div>
              <pre data-testid="memory-content">{value}</pre>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
