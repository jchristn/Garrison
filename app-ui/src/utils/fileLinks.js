// Links in an agent answer that point at a file the agent wrote. Harnesses link their output files in ways a browser
// cannot open: Codex writes sandbox:/workspaces/.../work/files/report.pdf, others write file:// URLs, absolute paths
// inside the worker, or paths relative to the working directory. The app resolves such a link to a path in the
// conversation's file space and downloads it through the gateway instead.
//
// A sandbox: or file: link is always a file link. A plain path (no scheme) is a file link only when it names a file
// the listing has, so ordinary relative links keep working. A link resolves to the longest listed path it ends with;
// a sandbox: or file: link that matches nothing falls back to the part after the last /files/ segment (the default
// file space mount path), or to the path without leading slashes.

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
  if (!explicit) return null;
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
