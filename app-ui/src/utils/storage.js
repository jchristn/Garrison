// Browser storage keys and safe accessors. Storage can be missing or throw (private windows, blocked site data), so
// every read and write is wrapped and the app works without it.

export const STORAGE_KEYS = {
  locale: 'garrison.app.locale',
  theme: 'garrison.app.theme',
  sessionPrefix: 'garrison.app.session.',
  conversationSort: 'garrison.app.conversationSort',
  fileSort: 'garrison.app.fileSort',
  conversationsWidth: 'garrison.app.conversationsWidth',
  filesWidth: 'garrison.app.filesWidth'
};

function store(kind) {
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

/** Read a value; null when missing or when storage is unavailable. */
export function readStorage(key, kind = 'local') {
  try {
    const s = store(kind);
    return s ? s.getItem(key) : null;
  } catch {
    return null;
  }
}

/** Write a value; null or undefined removes the key. Failures are ignored. */
export function writeStorage(key, value, kind = 'local') {
  try {
    const s = store(kind);
    if (!s) return;
    if (value === null || value === undefined) s.removeItem(key);
    else s.setItem(key, value);
  } catch {
    // Storage is a convenience; the app keeps working without it.
  }
}
