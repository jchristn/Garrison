/**
 * Copy text to the clipboard on any origin. On https and on localhost (secure contexts) it uses the Clipboard API.
 * On plain http to another host, where navigator.clipboard does not exist, or when the API refuses, it copies through
 * an off-screen, read-only textarea and document.execCommand('copy'), restoring the focus and selection it took.
 * Returns true when the text was copied, false when the browser refused both ways (the caller says so).
 */
export async function copyToClipboard(value) {
  const text = String(value ?? '');
  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof window !== 'undefined' && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to the textarea path */
    }
  }
  return copyWithTextarea(text);
}

/** The pre-Clipboard-API path: select the text in a hidden textarea and ask the browser to copy the selection. */
export function copyWithTextarea(text) {
  if (typeof document === 'undefined') return false;
  const active = document.activeElement;
  const selection = document.getSelection ? document.getSelection() : null;
  const ranges = [];
  if (selection) for (let i = 0; i < selection.rangeCount; i++) ranges.push(selection.getRangeAt(i));
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.setAttribute('aria-hidden', 'true');
  Object.assign(ta.style, { position: 'fixed', left: '-9999px', top: '-9999px', opacity: '0' });
  document.body.appendChild(ta);
  let ok = false;
  try {
    ta.focus();
    ta.select();
    ta.setSelectionRange(0, text.length);
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(ta);
  if (selection) {
    selection.removeAllRanges();
    for (const r of ranges) selection.addRange(r);
  }
  if (active && typeof active.focus === 'function') active.focus();
  return ok;
}
