import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from './Tooltip.jsx';
import { FilesIcon, MenuIcon, SignOutIcon } from './Icons.jsx';
import ChatPane from './ChatPane.jsx';
import ConversationList from './ConversationList.jsx';
import FilePanel from './FilePanel.jsx';
import LanguageSelect from './LanguageSelect.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import useConversation from '../hooks/useConversation.js';
import useFiles from '../hooks/useFiles.js';
import Splitter from './Splitter.jsx';
import { STORAGE_KEYS, readStorage, writeStorage } from '../utils/storage.js';

const WIDE = '(min-width: 1100px)';
const NARROW = '(max-width: 760px)';

// Pane widths in pixels: the default, and the range the dividers allow. Widths are remembered in this browser.
const LIST_WIDTH = 280;
const LIST_MIN = 200;
const LIST_MAX = 520;
const FILES_WIDTH = 340;
const FILES_MIN = 240;
const FILES_MAX = 640;

function storedWidth(key, fallback) {
  const value = Number(readStorage(key));
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function matches(query) {
  try {
    return !!(window.matchMedia && window.matchMedia(query).matches);
  } catch {
    return false;
  }
}

// The signed-in app: header (logo, name, files, theme, language, sign out), the conversation list, the chat, and
// the file panel. On narrow screens the list and the file panel open over the chat.
export default function ChatShell({ client, info, logoUrl, session, conversationId, onNavigate, onSignOut, theme, onToggleTheme }) {
  const { t } = useTranslation();
  const [conversations, setConversations] = useState(null);
  const [listError, setListError] = useState(null);
  const [listOpen, setListOpen] = useState(() => !matches(NARROW));
  const [filesOpen, setFilesOpen] = useState(() => matches(WIDE));
  const [missing, setMissing] = useState(false);
  const name = info.displayName || info.slug;
  const [listWidth, setListWidth] = useState(() => storedWidth(STORAGE_KEYS.conversationsWidth, LIST_WIDTH));
  const [filesWidth, setFilesWidth] = useState(() => storedWidth(STORAGE_KEYS.filesWidth, FILES_WIDTH));
  const resizeList = (value) => {
    setListWidth(value);
    writeStorage(STORAGE_KEYS.conversationsWidth, String(value));
  };
  const resizeFiles = (value) => {
    setFilesWidth(value);
    writeStorage(STORAGE_KEYS.filesWidth, String(value));
  };

  const loadConversations = useCallback(() => {
    client
      .conversations()
      .then((list) => {
        setConversations(Array.isArray(list) ? list : []);
        setListError(null);
      })
      .catch((err) => setListError(err));
  }, [client]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    setMissing(false);
  }, [conversationId]);

  const conversation = useConversation(client, conversationId, {
    onStarted: (id) => {
      onNavigate(id, { replace: false });
      loadConversations();
    },
    onTurnFinished: loadConversations,
    onMissing: () => setMissing(true)
  });
  const files = useFiles(client, conversationId);
  const fileCount = files.listing && Array.isArray(files.listing.files) ? files.listing.files.filter((f) => !f.deleted).length : 0;

  const select = (id) => {
    onNavigate(id);
    if (matches(NARROW)) setListOpen(false);
  };
  const rename = async (id, title) => {
    await client.renameConversation(id, title);
    loadConversations();
  };
  const remove = async (id) => {
    await client.deleteConversation(id);
    if (id === conversationId) onNavigate(null);
    loadConversations();
  };

  return (
    <div className={`shell ${listOpen ? 'list-open' : ''} ${filesOpen ? 'files-open' : ''}`} style={{ '--conversations-width': `${listWidth}px`, '--files-width': `${filesWidth}px` }}>
      <a className="skip-link" href="#composer-input" {...tip(t('tips.skipToChat'))}>
        {t('app.skipToChat')}
      </a>
      <header className="app-header">
        <button
          type="button"
          className="icon-button"
          onClick={() => setListOpen((v) => !v)}
          aria-expanded={listOpen}
          aria-controls="conversation-sidebar"
          aria-label={t('header.conversations')}
          {...tip(t('tips.conversationsToggle'))}
          data-testid="toggle-conversations"
        >
          <MenuIcon />
        </button>
        <div className="brand">
          {logoUrl ? <img className="brand-logo" src={logoUrl} alt={t('header.logoAlt', { name })} data-testid="brand-logo" /> : null}
          <span className="brand-name" data-testid="brand-name">
            {name}
          </span>
        </div>
        <div className="header-tools">
          <button
            type="button"
            className={`button ghost files-toggle ${filesOpen ? 'is-active' : ''}`}
            onClick={() => setFilesOpen((v) => !v)}
            aria-expanded={filesOpen}
            aria-controls="file-sidebar"
            {...tip(t('tips.filesToggle'))}
            data-testid="toggle-files"
          >
            <FilesIcon />
            <span className="files-toggle-label">{t('header.files')}</span>
            {fileCount ? <span className="count-badge">{fileCount}</span> : null}
          </button>
          <LanguageSelect className="header-lang" />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <span className="principal">
            {session.anonymous ? t('header.guest') : t('header.signedInAs', { name: session.principalName })}
          </span>
          <button type="button" className="icon-button" onClick={onSignOut} aria-label={t('header.signOut')} {...tip(t('tips.signOut'))} data-testid="sign-out">
            <SignOutIcon />
          </button>
        </div>
      </header>
      <div className="shell-body">
        <div id="conversation-sidebar" className="sidebar" hidden={!listOpen}>
          <ConversationList conversations={conversations} error={listError} selectedId={conversationId} onSelect={select} onNew={() => select(null)} onRename={rename} onDelete={remove} />
        </div>
        {listOpen ? <Splitter edge="start" width={listWidth} min={LIST_MIN} max={LIST_MAX} onChange={resizeList} label={t('layout.resizeConversations')} tipText={t('tips.resizeConversations')} testId="resize-conversations" /> : null}
        <ChatPane key={conversationId || 'new'} info={info} conversation={conversation} conversationMissing={missing} />
        {filesOpen ? <Splitter edge="end" width={filesWidth} min={FILES_MIN} max={FILES_MAX} onChange={resizeFiles} label={t('layout.resizeFiles')} tipText={t('tips.resizeFiles')} testId="resize-files" /> : null}
        <div id="file-sidebar" className="files-sidebar" hidden={!filesOpen}>
          <FilePanel client={client} conversationId={conversationId} files={files} onClose={() => setFilesOpen(false)} />
        </div>
      </div>
    </div>
  );
}
