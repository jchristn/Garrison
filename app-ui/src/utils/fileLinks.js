// Links in an agent answer that point at a file the agent wrote. Harnesses link their output files in ways a browser
// cannot open: Codex writes sandbox:/workspaces/.../work/files/report.pdf, others write file:// URLs, absolute paths
// inside the worker, or paths relative to the working directory. The app resolves such a link to a path in the
// conversation's file space and opens it in the files panel's viewer instead.
//
// A sandbox: or file: link is always a file link, and so is a plain path (no scheme) whose last segment has a file
// extension: inside the app a relative link can only reach the app itself, which would open its sign-in page in a new
// tab. A link resolves to the longest listed path it ends with; else to the one listed file with the same name (agents
// sometimes name the wrong folder, such as output/ for a file saved under reports/); else a sandbox: or file: link
// falls back to the part after the last /files/ segment (the default file space mount path), and any other file link
// to the path without leading slashes. A plain path without an extension that matches nothing stays an ordinary link.

/** The href prefix that marks a rendered file link; the rest is the URI-encoded file space path. */
export const FILE_LINK_PREFIX = '#file:';

function stripQuery(path) {
  const cut = path.search(/[?#]/);
  return cut >= 0 ? path.slice(0, cut) : path;
}

function decode(path) {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

/**
 * The file space path a link points at, or null when it is not a file link.
 * @param {string} href Link target from the answer.
 * @param {string[]} [paths] Paths in the conversation's file listing.
 * @returns {string|null}
 */
export function fileLinkPath(href, paths) {
  const raw = String(href || '').trim();
  if (!raw) return null;
  let path;
  let explicit = false;
  const scheme = raw.match(/^(?:sandbox|file):(.*)$/i);
  if (scheme) {
    path = scheme[1];
    explicit = true;
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(raw) || raw.startsWith('#') || raw.startsWith('?') || raw.startsWith('//')) {
    return null;
  } else {
    path = raw;
  }
  const clean = decode(stripQuery(path)).replace(/\\/g, '/').replace(/^\/{2,}/, '/').replace(/^\.\//, '');
  if (!clean || clean === '/') return null;
  let best = null;
  for (const p of paths || []) {
    if (!p) continue;
    if ((clean === p || clean.endsWith(`/${p}`)) && (!best || p.length > best.length)) best = p;
  }
  if (best) return best;
  const name = clean.split('/').filter(Boolean).pop() || '';
  const named = (paths || []).filter((p) => p && (p === name || p.endsWith(`/${name}`)));
  if (named.length === 1) return named[0];
  if (!explicit && !/\.[A-Za-z0-9]{1,8}$/.test(name)) return null;
  const marker = clean.lastIndexOf('/files/');
  const rest = marker >= 0 ? clean.slice(marker + '/files/'.length) : clean.replace(/^\/+/, '');
  return rest || null;
}

/** The href for a rendered file link. */
export function fileLinkHref(path) {
  return FILE_LINK_PREFIX + encodeURIComponent(path);
}

/** The file space path of a rendered file link's href, or null when the href is not one. */
export function filePathFromHref(href) {
  const value = String(href || '');
  if (!value.startsWith(FILE_LINK_PREFIX)) return null;
  const path = decode(value.slice(FILE_LINK_PREFIX.length));
  return path || null;
}
