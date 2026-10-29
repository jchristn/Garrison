// The app UI is one build for every app: the slug comes from the URL path.
//   /apps/{slug}/                    the app (sign-in, or the chat with no conversation selected)
//   /apps/{slug}/c/{conversationId}  one conversation
// Slugs follow the server's rule: 2 to 63 lowercase letters, digits, and hyphens, starting with a letter or digit.

export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,62}$/;
const CONVERSATION_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

/** Parse a pathname into { slug, conversationId }; slug is null when the path names no valid app. */
export function parseAppPath(pathname) {
  const parts = String(pathname || '')
    .split('/')
    .filter(Boolean)
    .map((p) => {
      try {
        return decodeURIComponent(p);
      } catch {
        return p;
      }
    });
  if (parts[0] !== 'apps' || !parts[1] || !SLUG_PATTERN.test(parts[1])) return { slug: null, conversationId: null };
  const conversationId = parts[2] === 'c' && parts[3] && CONVERSATION_PATTERN.test(parts[3]) ? parts[3] : null;
  return { slug: parts[1], conversationId };
}

/** The path for an app, or for one of its conversations. */
export function appPath(slug, conversationId) {
  const base = `/apps/${encodeURIComponent(slug)}/`;
  return conversationId ? `${base}c/${encodeURIComponent(conversationId)}` : base;
}
