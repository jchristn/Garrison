// Copy text on every page the app UI is served from. The Clipboard API exists only in secure contexts (https and
// localhost); on plain http to another host the text goes through a hidden textarea and execCommand('copy'), which
// browsers still allow during a click.

/** Copy text to the clipboard; resolves true when it was copied, false when the browser refused. */
export async function copyText(text, doc = typeof document !== 'undefined' ? document : null, nav = typeof navigator !== 'undefined' ? navigator : null) {
  const value = String(text ?? '');
  if (nav && nav.clipboard && typeof nav.clipboard.writeText === 'function' && (typeof window === 'undefined' || window.isSecureContext !== false)) {
    try {
      await nav.clipboard.writeText(value);
      return true;
    } catch {
      /* fall back to the textarea below */
    }
  }
  if (!doc || !doc.body) return false;
  const area = doc.createElement('textarea');
  area.value = value;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.top = '-1000px';
  area.style.opacity = '0';
  doc.body.appendChild(area);
  area.focus();
  area.select();
  let copied = false;
  try {
    copied = !!doc.execCommand && doc.execCommand('copy');
  } catch {
    copied = false;
  }
  doc.body.removeChild(area);
  return copied;
}
