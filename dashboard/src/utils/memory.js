// Scoped memory (AA4.13): helpers shared by the Memory page, its scope list, the content viewer, and the delete dialog.

import { pathFor } from '../config/navConfig';
import { enumLabel } from './enums';
import { holds } from './apps';

/** Window event sent after a memory entry is deleted, so the scope list and the entries table reload. */
export const MEMORY_CHANGED_EVENT = 'garrison:memory-changed';

/** Tell the Memory page that entries changed. */
export function notifyMemoryChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(MEMORY_CHANGED_EVENT));
}

/** Scope kinds in the order the scope list groups them. OrgUnit and Organization hold entries once organizations exist (AA7). */
export const MEMORY_SCOPE_KINDS = ['Agent', 'App', 'OrgUnit', 'Organization'];

/** Scope kinds shown even when they hold nothing; the organization kinds show only when they have entries. */
const ALWAYS_SHOWN = ['Agent', 'App'];

/** The key identifying one scope, for selection and lookups. */
export function scopeKey(kind, id) {
  return `${kind || ''}:${id || ''}`;
}

/**
 * Scopes grouped by kind, in MEMORY_SCOPE_KINDS order, each group sorted by name (then ID) and totalled:
 * [{ kind, scopes, entryCount, bytes }]. Agent and App groups are always present; the organization groups only when
 * they hold entries.
 */
export function groupScopes(scopes) {
  return MEMORY_SCOPE_KINDS.map((kind) => {
    const inKind = (scopes || [])
      .filter((s) => s.scopeKind === kind)
      .sort((a, b) => String(a.scopeName || a.scopeId).localeCompare(String(b.scopeName || b.scopeId)));
    return {
      kind,
      scopes: inKind,
      entryCount: inKind.reduce((sum, s) => sum + (s.entryCount || 0), 0),
      bytes: inKind.reduce((sum, s) => sum + (s.bytes || 0), 0)
    };
  }).filter((g) => ALWAYS_SHOWN.includes(g.kind) || g.scopes.length > 0);
}

/** Names of scopes by scopeKey, from the scope list. */
export function scopeNames(scopes) {
  return Object.fromEntries((scopes || []).map((s) => [scopeKey(s.scopeKind, s.scopeId), s.scopeName || null]));
}

/**
 * "Agent: echo-agent" for an entry or a scope. A scope whose agent or app no longer exists shows its ID with a
 * "(deleted)" note.
 */
export function scopeText(t, kind, id, names = {}) {
  const name = names[scopeKey(kind, id)];
  const shown = name || (id ? t('memory.deletedScope', { id }) : '-');
  return `${enumLabel(t, 'memoryScopeKind', kind)}: ${shown}`;
}

/** Who last wrote an entry: the writer's name, else the agent name from the lookups, else the principal ID. */
export function writerText(entry, agents = {}) {
  if (!entry) return '';
  return entry.writerName || (entry.writerAgentId && agents[entry.writerAgentId]) || entry.writerAgentId || entry.writerPrincipalId || '';
}

/** The run page of the run that last wrote the entry, or null. */
export function writerRunPath(entry) {
  return entry?.writerRunId ? pathFor('runs', entry.writerRunId) : null;
}

/** The dashboard page of a scope's agent or app, or null for the organization kinds. */
export function scopePath(kind, id) {
  if (!id) return null;
  if (kind === 'Agent') return pathFor('agents', id);
  if (kind === 'App') return pathFor('apps', null, { search: id });
  return null;
}

/** True once the entry's expiry has passed (the curator removes it on its next sweep). */
export function isExpired(entry, now = Date.now()) {
  return !!entry?.expiresUtc && new Date(entry.expiresUtc).getTime() <= now;
}

/**
 * The tooltip explaining a missing Memory permission, or '' when the caller holds it (or it cannot be known: the
 * server then decides). Viewing needs Read; deleting needs Delete.
 */
export function memoryDenied(t, permissions, operation) {
  if (holds(permissions, 'Memory', operation)) return '';
  return t('tips.memory.denied', { operation: enumLabel(t, 'operationType', operation) });
}
