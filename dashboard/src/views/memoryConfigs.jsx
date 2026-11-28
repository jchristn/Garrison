// ResourceView configuration for scoped memory (AA4.13, Autonomy > Memory): the entries agents and people saved, with
// the scope list above the table, provenance columns, the content viewer, and delete. Re-exported by resourceConfigs.jsx
// so the configuration-wide tests (tooltips, i18n keys, enum labels) cover it.

import CopyableId from '../components/CopyableId';
import DeleteMemoryModal from '../components/DeleteMemoryModal';
import MemoryContentModal from '../components/MemoryContentModal';
import MemoryScopeList from '../components/MemoryScopeList';
import { Badge } from '../components/StatusBadge';
import { tip } from '../components/Tooltip';
import { formatBytes, formatDateTime, formatNumber, formatRelativeTime } from '../i18n/formatters';
import { copyToClipboard } from '../utils/clipboard';
import { loadCallerPermissions } from '../utils/apps';
import { resourceTip } from '../utils/tips';
import { MEMORY_CHANGED_EVENT, isExpired, memoryDenied, scopeNames, scopeText, writerRunPath, writerText } from '../utils/memory';

const ID = 'memory';

function col(t, key, render, extra = {}) {
  return { key, label: t(`resources.${ID}.columns.${key}`), tip: resourceTip(t, ID, key), render, ...extra };
}

const when = (value, lng) => (value ? <span {...tip(formatDateTime(value, lng))}>{formatRelativeTime(value, lng)}</span> : '-');
const safeList = (promise) => promise.then((r) => r.items || []).catch(() => []);

/** Confirm, then delete an entry with the version the person saw. */
export function openDelete(ctx, entry) {
  const close = () => ctx.setExtraModal(null);
  ctx.setExtraModal(
    <DeleteMemoryModal
      entry={entry}
      names={ctx.lookups?.names || {}}
      onClose={close}
      onDone={() => {
        close();
        ctx.reload?.();
      }}
    />
  );
}

/** Show an entry's provenance and text; Delete in its footer goes on to the delete dialog. */
export function openContent(ctx, entry) {
  const close = () => ctx.setExtraModal(null);
  const denied = memoryDenied(ctx.t, ctx.lookups?.permissions, 'Delete');
  ctx.setExtraModal(<MemoryContentModal entry={entry} names={ctx.lookups?.names || {}} agents={ctx.lookups?.agents || {}} deleteDenied={denied} onDelete={(shown) => openDelete(ctx, shown)} onClose={close} />);
}

/** Copy an entry's ID and say whether the browser allowed it. */
async function copyId(ctx, id) {
  const ok = await copyToClipboard(id);
  ctx.addToast?.({ type: ok ? 'success' : 'error', message: ctx.t(ok ? 'memory.toasts.copied' : 'tips.copy.failed') });
}

/**
 * Scoped memory (AA4.13): entries ordered by scope and key, without their text. The scope list above the table picks a
 * scope (or a whole kind); category, tag, search, and writer are server filters. Choosing a row, or View content in its
 * menu, opens the content viewer. Delete confirms first and carries the entry's version, so an entry rewritten in the
 * meantime is refused with 409 MemoryVersionConflict. Deleting needs Delete on Memory; without it Delete stays visible
 * but disabled with the reason.
 */
export const memoryConfig = {
  id: ID,
  explainer: 'memory',
  autoRefresh: 0,
  search: false,
  defaultSort: 'key',
  defaultSortDir: 'asc',
  urlFilters: ['scopeKind', 'scopeId', 'category', 'tag', 'search', 'writer'],
  lookupsEvents: [MEMORY_CHANGED_EVENT],
  api: {
    list: (c, tenant, p) => c.listMemoryEntries(tenant, p),
    create: null,
    update: null,
    remove: null
  },
  filters: [
    { name: 'search', type: 'text', label: (t) => t('memory.filters.search'), placeholder: (t) => t('memory.filters.searchPlaceholder'), tip: (t) => t('tips.memory.filters.search') },
    { name: 'category', type: 'text', label: (t) => t(`resources.${ID}.columns.category`), placeholder: (t) => t('memory.filters.categoryPlaceholder'), tip: (t) => t('tips.memory.filters.category') },
    { name: 'tag', type: 'text', label: (t) => t('memory.filters.tag'), placeholder: (t) => t('memory.filters.tagPlaceholder'), tip: (t) => t('tips.memory.filters.tag') },
    {
      name: 'writer',
      label: (t) => t('memory.filters.writer'),
      tip: (t) => t('tips.memory.filters.writer'),
      options: (lookups, filters) => [...new Set([...Object.keys(lookups?.agents || {}), ...(filters?.writer ? [filters.writer] : [])])],
      optionLabel: (o, _t, lookups) => lookups?.agents?.[o] || o
    }
  ],
  // The scopes (for the list and the scope names), agent names (writer filter and column), and the caller's permissions.
  loadLookups: async ({ apiClient, tenantId, principal }) => {
    const [scopes, agents, permissions] = await Promise.all([
      apiClient.listMemoryScopes(tenantId).catch((e) => ({ error: e })),
      safeList(apiClient.listAgents(tenantId, { pageNumber: 1, pageSize: 1000 })),
      loadCallerPermissions(apiClient, tenantId, principal)
    ]);
    const failed = !Array.isArray(scopes);
    return {
      scopes: failed ? [] : scopes,
      scopesError: failed ? scopes?.error || true : null,
      names: failed ? {} : scopeNames(scopes),
      agents: Object.fromEntries(agents.map((a) => [a.id, a.displayName || a.name])),
      permissions
    };
  },
  intro: (ctx) => (
    <MemoryScopeList
      scopes={ctx.lookups?.scopes || (ctx.lookups?.scopesError ? [] : null)}
      error={ctx.lookups?.scopesError || null}
      selected={{ scopeKind: ctx.filters?.scopeKind, scopeId: ctx.filters?.scopeId }}
      onSelect={(kind, id) => ctx.setFilters?.((prev) => ({ ...prev, scopeKind: kind, scopeId: id }))}
      onRetry={ctx.reloadLookups}
    />
  ),
  canDuplicate: false,
  bulkDelete: false,
  isEditable: () => false,
  canDelete: () => false,
  // Row clicks and View open the content viewer instead of a form.
  view: {
    label: (t) => t('memory.actions.viewContent'),
    tip: (t) => t('tips.memory.actions.viewContent'),
    open: (r, ctx) => openContent(ctx, r)
  },
  columns: ({ t, i18n, lookups }) => {
    const lng = i18n.language;
    const names = lookups?.names || {};
    const agents = lookups?.agents || {};
    return [
      col(
        t,
        'key',
        (r) => (
          <span className="memory-key-cell">
            <code className="cell-id" {...tip(r.key)}>
              {r.key}
            </code>
            {r.legacy && <Badge tone="warning" tip={t('tips.memory.legacy')}>{t('memory.legacy')}</Badge>}
          </span>
        ),
        { sortable: true, pinned: true, csv: (r) => r.key || '' }
      ),
      col(t, 'scope', (r) => <span {...tip(r.scopeId)}>{scopeText(t, r.scopeKind, r.scopeId, names)}</span>, { cellClass: 'nowrap', csv: (r) => scopeText(t, r.scopeKind, r.scopeId, names) }),
      col(t, 'category', (r) => r.category || '-', { csv: (r) => r.category || '' }),
      col(t, 'tags', (r) => ((r.tags || []).length ? r.tags.join(', ') : '-'), { csv: (r) => (r.tags || []).join(' ') }),
      col(t, 'writer', (r) => writerText(r, agents) || '-', { csv: (r) => writerText(r, agents) }),
      col(t, 'lastUpdateUtc', (r) => when(r.lastUpdateUtc, lng), { sortable: true, cellClass: 'nowrap', csv: (r) => r.lastUpdateUtc || '' }),
      col(t, 'lastReadUtc', (r) => (r.lastReadUtc ? when(r.lastReadUtc, lng) : <span className="text-muted">{t('memory.neverRead')}</span>), { cellClass: 'nowrap', csv: (r) => r.lastReadUtc || '' }),
      col(t, 'version', (r) => formatNumber(r.version ?? 0, {}, lng), { sortable: true, cellClass: 'nowrap', defaultHidden: true, csv: (r) => String(r.version ?? '') }),
      col(t, 'bytes', (r) => formatBytes(r.bytes ?? 0, lng), { sortable: true, cellClass: 'nowrap', defaultHidden: true, csv: (r) => String(r.bytes ?? '') }),
      col(t, 'expiresUtc', (r) => (r.expiresUtc ? <span className={isExpired(r) ? 'text-danger' : ''}>{when(r.expiresUtc, lng)}</span> : <span className="text-muted">{t('memory.noExpiry')}</span>), { cellClass: 'nowrap', csv: (r) => r.expiresUtc || '' }),
      col(t, 'writerRunId', (r) => (r.writerRunId ? <CopyableId value={r.writerRunId} /> : '-'), { cellClass: 'cell-id', defaultHidden: true }),
      col(t, 'createdUtc', (r) => when(r.createdUtc, lng), { cellClass: 'nowrap', defaultHidden: true, csv: (r) => r.createdUtc || '' }),
      col(t, 'sha256', (r) => (r.sha256 ? <CopyableId value={r.sha256} max={16} /> : '-'), { cellClass: 'cell-id', defaultHidden: true }),
      col(t, 'id', (r) => <CopyableId value={r.id} />, { cellClass: 'cell-id', defaultHidden: true })
    ];
  },
  fields: () => [],
  rowActions: (r, ctx) => {
    const denied = memoryDenied(ctx.t, ctx.lookups?.permissions, 'Delete');
    const runPath = writerRunPath(r);
    return [
      { label: ctx.t('memory.actions.copyId'), tip: ctx.t('tips.memory.actions.copyId'), onClick: () => copyId(ctx, r.id) },
      { label: ctx.t('memory.actions.openRun'), tip: ctx.t('tips.memory.actions.openRun'), hidden: !runPath, onClick: () => ctx.navigate(runPath) },
      { label: ctx.t('common.actions.delete'), tip: denied || ctx.t('tips.memory.actions.delete'), danger: !denied, disabled: !!denied, onClick: () => openDelete(ctx, r) }
    ];
  }
};

