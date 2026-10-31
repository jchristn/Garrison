import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip.jsx';
import { PencilIcon, PlusIcon, TrashIcon } from './Icons.jsx';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters.js';
import { errorText } from '../utils/errors.js';
import { CONVERSATION_SORTS, conversationTitle, filterConversations, sortConversations } from '../utils/lists.js';
import { STORAGE_KEYS, readStorage, writeStorage } from '../utils/storage.js';

// The signed-in user's conversations in this app, plus "New conversation". The list filters by name and sorts by
// latest activity, oldest first, or name; each conversation can be renamed in place or deleted after a confirmation.
// `onRename(id, title)` and `onDelete(id)` return promises; their errors show on the conversation.
export default function ConversationList({ conversations, error, selectedId, onSelect, onNew, onRename, onDelete }) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState(() => {
    const saved = readStorage(STORAGE_KEYS.conversationSort);
    return CONVERSATION_SORTS.includes(saved) ? saved : 'recent';
  });
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');
  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(null);
  const [itemError, setItemError] = useState(null);
  const untitled = (c) => t('conversations.untitled', { date: formatDateTime(c.createdUtc) });
  const shown = sortConversations(filterConversations(conversations || [], filter, untitled), sort, untitled);

  const changeSort = (value) => {
    setSort(value);
    writeStorage(STORAGE_KEYS.conversationSort, value);
  };
  const startRename = (c) => {
    setEditing(c.id);
    setDraft(conversationTitle(c, untitled));
    setConfirming(null);
    setItemError(null);
  };
  const saveRename = async (c) => {
    const title = draft.trim();
    if (!title || title === conversationTitle(c, untitled)) {
      setEditing(null);
      return;
    }
    setBusy(c.id);
    try {
      await onRename(c.id, title);
      setEditing(null);
      setItemError(null);
    } catch (err) {
      setItemError({ id: c.id, err });
    } finally {
      setBusy(null);
    }
  };
  const remove = async (c) => {
    setBusy(c.id);
    try {
      await onDelete(c.id);
      setConfirming(null);
      setItemError(null);
    } catch (err) {
      setItemError({ id: c.id, err });
    } finally {
      setBusy(null);
    }
  };

  return (
    <nav className="conversation-list" aria-label={t('conversations.title')}>
      <div className="conversation-list-header">
        <h2>{t('conversations.title')}</h2>
      </div>
      <button type="button" className="button primary block new-conversation" onClick={onNew} {...tip(t('tips.newConversation'))} data-testid="new-conversation">
        <PlusIcon />
        <span>{t('conversations.new')}</span>
      </button>
      <div className="list-controls">
        <input
          type="search"
          className="list-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t('conversations.filter')}
          aria-label={t('conversations.filter')}
          data-testid="conversation-filter"
          {...tip(t('tips.conversationFilter'))}
        />
        <select className="list-sort" value={sort} onChange={(e) => changeSort(e.target.value)} aria-label={t('conversations.sort')} data-testid="conversation-sort" {...tip(t('tips.conversationSort'))}>
          {CONVERSATION_SORTS.map((s) => (
            <option key={s} value={s}>
              {t(`conversations.sorts.${s}`)}
            </option>
          ))}
        </select>
      </div>
      {error ? (
        <p className="notice notice-error" role="alert">
          {t('conversations.loadError')} {errorText(t, error)}
        </p>
      ) : null}
      {!error && conversations && !conversations.length ? <p className="empty-text">{t('conversations.empty')}</p> : null}
      {!error && conversations && conversations.length > 0 && !shown.length ? <p className="empty-text">{t('conversations.noMatch')}</p> : null}
      <ul>
        {shown.map((c) => {
          const title = conversationTitle(c, untitled);
          const selected = c.id === selectedId;
          const failure = itemError && itemError.id === c.id ? itemError.err : null;
          return (
            <li key={c.id} className="conversation-row" data-testid="conversation-row">
              {editing === c.id ? (
                <form
                  className="conversation-rename"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveRename(c);
                  }}
                >
                  <input
                    autoFocus
                    value={draft}
                    maxLength={200}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setEditing(null);
                    }}
                    aria-label={t('conversations.renameLabel')}
                    disabled={busy === c.id}
                    data-testid="conversation-rename-input"
                    {...tip(t('tips.conversationRenameInput'))}
                  />
                  <button type="submit" className="button primary small" disabled={busy === c.id || !draft.trim()} data-testid="conversation-rename-save" {...tip(t('tips.conversationRenameSave'))}>
                    {t('conversations.save')}
                  </button>
                  <button type="button" className="button ghost small" onClick={() => setEditing(null)} {...tip(t('tips.conversationRenameCancel'))}>
                    {t('conversations.cancel')}
                  </button>
                </form>
              ) : (
                <div className={`conversation-item ${selected ? 'is-selected' : ''}`}>
                  <button type="button" className="conversation-open" aria-current={selected ? 'page' : undefined} onClick={() => onSelect(c.id)} {...tip(t('tips.conversation'))} data-testid="conversation-item">
                    <span className="conversation-title">{title}</span>
                    <span className="conversation-meta">
                      {c.busy ? <span className="badge badge-working">{t('conversations.working')}</span> : null}
                      <span>{t('conversations.messages', { count: c.turnCount || 0 })}</span>
                      <span aria-hidden="true">·</span>
                      <time dateTime={c.lastActivityUtc || c.createdUtc}>{formatRelativeTime(c.lastActivityUtc || c.createdUtc)}</time>
                    </span>
                  </button>
                  <span className="conversation-actions">
                    <button type="button" className="icon-button small" onClick={() => startRename(c)} aria-label={t('conversations.rename', { title })} data-testid="conversation-rename" {...tip(t('tips.conversationRename'))}>
                      <PencilIcon />
                    </button>
                    <button
                      type="button"
                      className="icon-button small"
                      onClick={() => {
                        setConfirming(c.id);
                        setEditing(null);
                        setItemError(null);
                      }}
                      disabled={c.busy}
                      aria-label={t('conversations.delete', { title })}
                      data-testid="conversation-delete"
                      {...tip(t(c.busy ? 'tips.conversationDeleteBusy' : 'tips.conversationDelete'))}
                    >
                      <TrashIcon />
                    </button>
                  </span>
                </div>
              )}
              {confirming === c.id ? (
                <div className="conversation-confirm" role="alert" data-testid="conversation-confirm">
                  <span>{t('conversations.confirmDelete', { title })}</span>
                  <span className="conversation-confirm-actions">
                    <button type="button" className="button danger small" onClick={() => remove(c)} disabled={busy === c.id} data-testid="conversation-delete-confirm" {...tip(t('tips.conversationDeleteConfirm'))}>
                      {t('conversations.deleteConfirm')}
                    </button>
                    <button type="button" className="button ghost small" onClick={() => setConfirming(null)} {...tip(t('tips.conversationDeleteCancel'))}>
                      {t('conversations.cancel')}
                    </button>
                  </span>
                </div>
              ) : null}
              {failure ? (
                <p className="notice notice-error small" role="alert">
                  {errorText(t, failure)}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
