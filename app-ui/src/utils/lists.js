// Filtering and sorting for the conversation list and the file list. Plain functions so tests can import them.

/** Conversation orders: latest activity first, oldest first, and by name. */
export const CONVERSATION_SORTS = ['recent', 'oldest', 'nameAsc', 'nameDesc'];

/** File orders: newest change first, oldest first, largest, smallest, and by name. */
export const FILE_SORTS = ['newest', 'oldest', 'largest', 'smallest', 'nameAsc', 'nameDesc'];

const when = (c) => String(c.lastActivityUtc || c.createdUtc || '');

/** A conversation's shown title: its title, else `untitled(c)`. */
export function conversationTitle(c, untitled) {
  return c.title || untitled(c);
}

/** Conversations whose shown title contains the text, ignoring case; all of them for blank text. */
export function filterConversations(list, text, untitled) {
  const needle = String(text || '').trim().toLocaleLowerCase();
  if (!needle) return [...list];
  return list.filter((c) => conversationTitle(c, untitled).toLocaleLowerCase().includes(needle));
}

/** Conversations in the given order (see CONVERSATION_SORTS); unknown orders fall back to latest activity first. */
export function sortConversations(list, sort, untitled) {
  const byName = (a, b) => conversationTitle(a, untitled).localeCompare(conversationTitle(b, untitled), undefined, { sensitivity: 'base', numeric: true });
  const sorted = [...list];
  if (sort === 'oldest') sorted.sort((a, b) => when(a).localeCompare(when(b)));
  else if (sort === 'nameAsc') sorted.sort(byName);
  else if (sort === 'nameDesc') sorted.sort((a, b) => byName(b, a));
  else sorted.sort((a, b) => when(b).localeCompare(when(a)));
  return sorted;
}

/** Files in the given order (see FILE_SORTS); unknown orders fall back to newest change first. Ties go by path. */
export function sortFiles(list, sort) {
  const byPath = (a, b) => String(a.path).localeCompare(String(b.path), undefined, { sensitivity: 'base', numeric: true });
  const at = (f) => String(f.lastUpdateUtc || '');
  const size = (f) => Number(f.sizeBytes) || 0;
  const sorted = [...list];
  if (sort === 'oldest') sorted.sort((a, b) => at(a).localeCompare(at(b)) || byPath(a, b));
  else if (sort === 'largest') sorted.sort((a, b) => size(b) - size(a) || byPath(a, b));
  else if (sort === 'smallest') sorted.sort((a, b) => size(a) - size(b) || byPath(a, b));
  else if (sort === 'nameAsc') sorted.sort(byPath);
  else if (sort === 'nameDesc') sorted.sort((a, b) => byPath(b, a));
  else sorted.sort((a, b) => at(b).localeCompare(at(a)) || byPath(a, b));
  return sorted;
}
