import { useTranslation } from 'react-i18next';
import { LoadingState } from './States';

const INTERACTIVE = 'a, button, input, select, textarea, label, [role="menu"], [role="menuitem"], [data-ignore-row-click]';

/**
 * Presentation table. columns: [{ key, label, cellClass?, headerClass?, render?(item), sortable?, serverSort? }].
 * Row clicks are ignored when the target is an interactive element. Optional row selection checkboxes.
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
  onSelectChange = null
}) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="table-scroll">
        <LoadingState label={t('components.table.loading')} />
      </div>
    );
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

  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead>
          <tr>
            {selectable && (
              <th scope="col" className="select-cell">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label={t('components.table.selectAll')} />
              </th>
            )}
            {columns.map((col) => {
              const sortable = col.sortable && onSort;
              const active = sortKey === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  className={`${sortable ? 'sortable' : ''} ${col.headerClass || ''}`}
                  aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : sortable ? 'none' : undefined}
                >
                  {sortable ? (
                    <button type="button" className="th-sort" onClick={() => onSort(col.key)} title={col.serverSort === false ? t('components.table.sortPageOnly') : t('components.table.sortBy', { column: col.label })}>
                      {col.label}
                      <span className="sort-indicator" aria-hidden="true">{active ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}</span>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td className="table-empty" colSpan={columns.length + (selectable ? 1 : 0)}>
                {emptyMessage || t('components.table.empty')}
              </td>
            </tr>
          ) : (
            items.map((item, index) => {
              const id = ids[index];
              return (
                <tr key={id} className={onRowClick ? 'clickable' : ''} onClick={(e) => handleRowClick(e, item)}>
                  {selectable && (
                    <td className="select-cell" data-ignore-row-click>
                      <input type="checkbox" checked={selected.includes(id)} onChange={() => toggleOne(id)} aria-label={t('components.table.selectRow')} />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={col.cellClass || ''}>
                      {col.render ? col.render(item) : item[col.key] ?? '-'}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
