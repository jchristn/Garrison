// Markdown to sanitized HTML for agent answers (copied from the dashboard, dashboard/src/utils/markdown.js).
//
// marked parses GitHub-flavored Markdown (tables, fenced code, task lists, strikethrough, autolinks) and passes
// inline HTML through; DOMPurify then removes everything that could run code or escape the card: script and style
// elements, event handler attributes, forms and embedded frames, inline styles, SVG and MathML, and any URL whose
// scheme is not http, https, or mailto. Sanitizing happens after parsing, so Markdown cannot smuggle anything past
// it. Both libraries are small, widely used, and maintained, and marked is fast enough to re-parse a growing
// stream on every throttled update.
//
// Media never loads from another origin (SR-25): an image, video, or audio source that names a scheme or another host
// is dropped, so prompt-injected output cannot send data out through a URL the browser fetches on its own. Only
// relative (same-origin) and data: sources survive. The image's Content-Security-Policy (img-src 'self' data:)
// enforces the same rule in the container image; this check also covers the Vite dev server.

import { Marked } from 'marked';
import DOMPurify from 'dompurify';

/** Schemes a link or image may use. Relative URLs and fragments are allowed too. */
const SAFE_URL = /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i;

const FORBID_TAGS = ['style', 'script', 'form', 'input', 'button', 'textarea', 'select', 'option', 'iframe', 'frame', 'frameset', 'object', 'embed', 'base', 'link', 'meta', 'dialog', 'template'];

/** Attributes that make the browser fetch a URL without a click. */
const FETCH_ATTRS = ['src', 'poster', 'background'];

/** True when a URL leaves this origin: it names a scheme (other than data:) or is protocol-relative. */
export function isRemoteUrl(url) {
  const value = String(url || '').trim();
  if (/^data:/i.test(value)) return false;
  return /^(?:[a-z][a-z0-9+.-]*:|\/\/|\\\\|\/\\|\\\/)/i.test(value);
}

const escapeHtml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    // Fenced and indented code in a scrolling frame.
    code({ text, lang }) {
      const language = String(lang || '').split(/\s+/)[0];
      const cls = language ? ` class="language-${escapeHtml(language)}"` : '';
      return `<div class="code-block markdown-code"><pre><code${cls}>${escapeHtml(text)}</code></pre></div>\n`;
    }
  }
});

let purifier = null;
let currentLinkTip = null;
let currentHeaderTip = null;

function getPurifier() {
  if (purifier) return purifier;
  if (typeof window === 'undefined') return null;
  purifier = DOMPurify(window);
  purifier.addHook('afterSanitizeAttributes', (node) => {
    for (const attr of FETCH_ATTRS) {
      if (node.hasAttribute && node.hasAttribute(attr) && isRemoteUrl(node.getAttribute(attr))) node.removeAttribute(attr);
    }
    if (node.tagName === 'A' && node.hasAttribute('href')) {
      node.setAttribute('target', '_blank');
      node.setAttribute('rel', 'noopener noreferrer');
      if (currentLinkTip) node.setAttribute('data-tip', currentLinkTip(node.getAttribute('href')));
    }
    if (node.tagName === 'TH' && currentHeaderTip) node.setAttribute('data-tip', currentHeaderTip(node.textContent.trim()));
  });
  return purifier;
}

/**
 * Sanitize an HTML string with the Markdown policy above. linkTip(href) returns the tooltip text for each link and
 * headerTip(text) the tooltip for each table column header (tooltips are added after sanitizing, so model output
 * cannot set its own).
 * Returns an empty string when no DOM is available (the app UI does not render on a server).
 */
export function sanitizeHtml(html, { linkTip, headerTip } = {}) {
  const p = getPurifier();
  if (!p) return '';
  currentLinkTip = linkTip || null;
  currentHeaderTip = headerTip || null;
  try {
    return p.sanitize(String(html || ''), {
      USE_PROFILES: { html: true },
      FORBID_TAGS,
      FORBID_ATTR: ['style', 'srcset', 'action', 'formaction', 'xlink:href'],
      ALLOW_DATA_ATTR: false,
      ALLOWED_URI_REGEXP: SAFE_URL,
      ADD_ATTR: ['target'],
      SANITIZE_NAMED_PROPS: true
    });
  } finally {
    currentLinkTip = null;
    currentHeaderTip = null;
  }
}

/** Render GitHub-flavored Markdown (with inline HTML) to sanitized HTML. */
export function renderMarkdown(text, options = {}) {
  if (!text) return '';
  // Wide tables scroll inside their own frame instead of stretching the card.
  const html = marked.parse(String(text), { async: false }).replace(/<table>/g, '<div class="markdown-table"><table>').replace(/<\/table>/g, '</table></div>');
  return sanitizeHtml(html, options);
}
