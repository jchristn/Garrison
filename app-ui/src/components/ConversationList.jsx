import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip.jsx';
import { PlusIcon } from './Icons.jsx';
import { formatDateTime, formatRelativeTime } from '../i18n/formatters.js';
import { errorText } from '../utils/errors.js';

// The signed-in user's conversations in this app, newest activity first, plus "New conversation".
export default function ConversationList({ conversations, error, selectedId, onSelect, onNew }) {
  const { t } = useTranslation();
  const sorted = [...(conversations || [])].sort((a, b) => String(b.lastActivityUtc || b.createdUtc).localeCompare(String(a.lastActivityUtc || a.createdUtc)));
  return (
    <nav className="conversation-list" aria-label={t('conversations.title')}>
      <div className="conversation-list-header">
        <h2>{t('conversations.title')}</h2>
      </div>
      <button type="button" className="button primary block new-conversation" onClick={onNew} {...tip(t('tips.newConversation'))} data-testid="new-conversation">
        <PlusIcon />
        <span>{t('conversations.new')}</span>
      </button>
      {error ? (
        <p className="notice notice-error" role="alert">
          {t('conversations.loadError')} {errorText(t, error)}
        </p>
      ) : null}
      {!error && conversations && !conversations.length ? <p className="empty-text">{t('conversations.empty')}</p> : null}
      <ul>
        {sorted.map((c) => {
          const title = c.title || t('conversations.untitled', { date: formatDateTime(c.createdUtc) });
          const selected = c.id === selectedId;
          return (
            <li key={c.id}>
              <button
                type="button"
                className={`conversation-item ${selected ? 'is-selected' : ''}`}
                aria-current={selected ? 'page' : undefined}
                onClick={() => onSelect(c.id)}
                {...tip(t('tips.conversation'))}
                data-testid="conversation-item"
              >
                <span className="conversation-title">{title}</span>
                <span className="conversation-meta">
                  {c.busy ? <span className="badge badge-working">{t('conversations.working')}</span> : null}
                  <span>{t('conversations.messages', { count: c.turnCount || 0 })}</span>
                  <span aria-hidden="true">·</span>
                  <time dateTime={c.lastActivityUtc || c.createdUtc}>{formatRelativeTime(c.lastActivityUtc || c.createdUtc)}</time>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
