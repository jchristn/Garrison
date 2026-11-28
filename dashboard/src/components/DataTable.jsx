import { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingState } from './States';
import { tip } from './Tooltip';

const INTERACTIVE = 'a, button, input, select, textarea, label, [role="menu"], [role="menuitem"], [data-ignore-row-click]';

// Column width rules (UXP1-V003, V016, V017). A short value (a time, a status, a kind, a number, a version) stays on one
// line; a long text column wraps between words and keeps a readable width on a narrow screen, where the table scrolls
// sideways inside its frame instead. A column's `nowrap: true` or `wrap: true` overrides the guess from its key.
const SHORT_KEY = /(Utc|Ms|Seconds|Bytes|Count|Percent|Usd|Number)$/;
// Statuses and kinds are left out: their badges already keep one line, and a long translated status may need two words.
const SHORT_KEYS = new Set(['version', 'method', 'statusCode', 'active', 'score', 'cost', 'costUsd', 'tokens', 'number', 'order', 'size', 'created', 'updated', 'started', 'lastRun', 'lastTick', 'nextFire', 'latency', 'ttft', 'day', 'month', 'interval', 'weight', 'revision', 'published', 'success', 'successRate', 'traffic', 'samples', 'runs', 'escalations', 'queued', 'leased', 'running', 'total']);
const TEXT_KEYS = new Set(['description', 'reason', 'summary', 'subject', 'title', 'question', 'note', 'notes', 'changeNote', 'mission', 'input', 'output', 'expected', 'answer', 'error', 'failure', 'preview', 'message', 'text', 'body', 'rollbackReason', 'liftReason', 'limits', 'classes', 'spend', 'scope', 'tags', 'checks', 'details', 'detail', 'path', 'url', 'target']);

/** The width class for a column: `col-short`, `col-text`, or none. */
export function columnWidthClass(col) {
  if (!col || col.key === 'select') return '';
  if (col.key === 'actions') return 'col-actions';
  if (col.wrap) return 'col-text';
  if (col.nowrap) return 'col-short';
  const key = String(col.key || '');
  if (TEXT_KEYS.has(key)) return 'col-text';
  if (SHORT_KEYS.has(key) || SHORT_KEY.test(key)) return 'col-short';
  return '';
}

/**
 * Presentation table. columns: [{ key, label, tip?, cellClass?, headerClass?, render?(item), sortable?, serverSort? }].
 * `tip` is the column header tooltip: what the column shows and how it is measured.
 * Row clicks are ignored when the target is an interactive element. Optional row selection checkboxes.
 * `compact` uses the tighter row padding; `testId` sets the table's data-testid.
 * `rowProps(item)` adds attributes to a row's `<tr>` (data attributes; a `className` merges with the row's own).
 * Columns may set `nowrap` (a short value kept on one line) or `wrap` (long text with a readable minimum width).
 * `error` (a node, usually an ErrorBanner) replaces the rows and the empty message while the list failed to load
 * (UXP1-V007). The empty message sits below the scrolling table, so a phone never cuts it off (UXP1-V008).
 */
export default function DataTable({
  columns = [],
  items = [],
  loading = false,
  emptyMessage,
  onRowClick = null,
  rowId = (item) => item.id,
  sortKey = null,
  sortDir = 'asc',
  onSort = null,
  selectable = false,
  selected = [],
  onSelectChange = null,
  compact = false,
  testId,
  rowProps = null,
  error = null
}) {
  const { t } = useTranslation();
  const scrollRef = useRef(null);
  // Whether the table is wider than its frame and how far it is scrolled: the pinned Actions column shows an edge shadow
  // while columns hide behind it (UXP1-V016).
  const [edge, setEdge] = useState('');
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const measure = () => {
      const over = el.scrollWidth > el.clientWidth + 1;
      const atEnd = Math.abs(el.scrollLeft) + el.clientWidth >= el.scrollWidth - 1;
      const next = over ? (atEnd ? 'is-overflowing at-end' : 'is-overflowing') : '';
      setEdge((prev) => (prev === next ? prev : next));
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    let observer = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(measure);
      observer.observe(el);
      if (el.firstElementChild) observer.observe(el.firstElementChild);
    }
    return () => {
      el.removeEventListener('scroll', measure);
      if (observer) observer.disconnect();
    };
  });

  // Only the first load shows a spinner. Refreshes keep the rows on screen so open menus and focus survive.
  if (loading && items.length === 0) {
    return (
      <div className="table-scroll">
        <LoadingState label={t('components.table.loading')} />
      </div>
    );
  }

  if (error) {
    return <div className="table-error" data-testid="table-error">{error}</div>;
  }

  const ids = items.map((it, i) => rowId(it) || String(i));
  const allSelected = selectable && ids.length > 0 && ids.every((id) => selected.includes(id));
  const toggleAll = () => onSelectChange?.(allSelected ? [] : ids);
  const toggleOne = (id) => onSelectChange?.(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const handleRowClick = (e, item) => {
    if (!onRowClick) return;
    if (e.target.closest && e.target.closest(INTERACTIVE)) return;
    onRowClick(item);
  };

  const widthClass = (col, own) => [own || '', columnWidthClass(col)].join(' ').trim() || undefined;
  const empty = items.length === 0;

  return (
    <>
    <div ref={scrollRef} className={edge ? `table-scroll ${edge}` : 'table-scroll'} aria-busy={loading || undefined}>
      <table className={compact ? 'data-table compact' : 'data-table'} data-testid={testId}>
        <thead>
          <tr>
            {selectable && (
              <th scope="col" className="select-cell" {...tip(t('tips.table.selectAll'))}>
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={t('components.table.selectAll')} {...tip(t('tips.table.selectAll'))} />
              </th>
            )}
            {columns.map((col) => {
              const sortable = col.sortable && onSort;
              const active = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={widthClass(col, `${sortable ? 'sortable' : ''} ${col.headerClass || ''}`.trim())}
                  {...tip(col.tip)}
                  aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : sortable ? 'none' : undefined}
                >
                  {sortable ? (
                    <button type="button" className="th-sort" onClick={() => onSort(col.key)} {...tip(t(col.serverSort === false ? 'tips.table.sortPageOnly' : 'tips.table.sortServer', { tip: col.tip || col.label }))}>
                      {col.label}
                      <span className="sort-indicator" aria-hidden="true">{active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                    </button>
                  ) : col.key === 'actions' ? (
                    // The row menu column needs no visible heading, only room for its button (UXP1-V016).
                    <span className="sr-only">{col.label}</span>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {!empty &&
            items.map((item, index) => {
              const id = ids[index];
              const { className: rowClass, onClick: _ignored, key: _key, ...extra } = (rowProps && rowProps(item)) || {};
              return (
                <tr key={id} {...extra} className={[onRowClick ? 'clickable' : '', rowClass || ''].join(' ').trim()} onClick={(e) => handleRowClick(e, item)}>
                  {selectable && (
                    <td className="select-cell" data-ignore-row-click>
                      <input type="checkbox" checked={selected.includes(id)} onChange={() => toggleOne(id)} aria-label={t('components.table.selectRow')} {...tip(t('tips.table.selectRow'))} />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={widthClass(col, col.cellClass)}>
                      {col.render ? col.render(item) : item[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
        </tbody>
      </table>
    </div>
    {empty && (
      <div className="table-empty" role="status">
        {emptyMessage || t('components.table.empty')}
      </div>
    )}
    </>
  );
}
