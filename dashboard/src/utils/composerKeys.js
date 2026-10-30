// Chat composers: Enter sends; Ctrl+Enter (Cmd+Enter on a Mac) and Shift+Enter add a new line. Enter while an input
// method is composing (Japanese, Chinese) finishes the composition instead of sending.

/**
 * Key handler for a chat textarea. `send()` sends the message; `setValue(next)` updates the controlled value when a
 * new line is inserted for Ctrl+Enter, with the caret placed after it.
 */
export function composerKeyDown(e, send, setValue) {
  if (e.key !== 'Enter' || e.nativeEvent?.isComposing || e.isComposing || e.keyCode === 229) return;
  if (e.shiftKey) return;
  e.preventDefault();
  if (e.ctrlKey || e.metaKey) {
    // Insert the line break the way typing would, so the caret, undo, and React's onChange all behave; fall back to
    // setting the value where the browser has no insertText command.
    const el = e.currentTarget;
    if (typeof document !== 'undefined' && document.execCommand && document.execCommand('insertText', false, '\n')) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    setValue(`${el.value.slice(0, start)}\n${el.value.slice(end)}`);
    return;
  }
  send();
}
