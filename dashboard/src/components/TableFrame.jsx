import { useTranslation } from 'react-i18next';
import TablePagination from './TablePagination';
import DataTable from './DataTable';
import ColumnPicker from './ColumnPicker';
import useColumnPrefs from '../hooks/useColumnPrefs';
import { formatNumber } from '../i18n/formatters';
import { tip } from './Tooltip';
import ExportMenu from './ExportMenu';
import { exportFileName as buildExportFileName, tableCsv } from '../utils/exporters';

/**
 * Above-table control bar (pagination, page size, refresh, auto-refresh, Select Columns) plus the table, a bulk
 * action bar when rows are selected, and an optional filter row slot. The column choice is saved under `tableId`.
 * `compact`, `testId`, and `rowProps` pass through to DataTable. `exportFileName(ext)`, `exportCsv()`, and `exportTestId`
 * replace the export menu's defaults (the current page's visible columns) for a table whose export carries more. For a list held in memory, use LocalTableFrame.
 * `error` (a node, usually an ErrorBanner) replaces the rows while the list failed to load, and hides the counts with
 * the empty message (UXP1-V007); a first load hides the counts too (UXP1-V029).
 */
export default function TableFrame({
  tableId,
  columns,
  items,
  loading = false,
  emptyMessage,
  onRowClick,
  rowId,
  sortKey,
  sortDir,
  onSort,
  totalRecords,
  pageNumber,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  leftSlot,
  rightSlot,
  filterSlot,
  autoRefreshSeconds,
  onAutoRefreshChange,
  selectable = false,
  selected = [],
  onSelectChange,
  bulkActions = null,
  compact = false,
  testId,
  rowProps,
  exportFileName,
  exportCsv,
  exportTestId,
  error = null
}) {
  const { t, i18n } = useTranslation();
  const { hidden, toggle, visibleColumns } = useColumnPrefs(tableId || 'default', columns);

  return (
    <div className="table-frame">
      <div className="table-toolbar">
        <TablePagination
          totalRecords={totalRecords}
          pageNumber={pageNumber}
          pageSize={pageSize}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          onRefresh={onRefresh}
          disabled={loading}
          pending={!!error || (loading && (!items || items.length === 0))}
          leftSlot={leftSlot}
          rightSlot={
            <>
              {rightSlot}
              {!error && items && items.length > 0 && (
                <ExportMenu title={t('components.export.tableTitle', { table: tableId })} testId={exportTestId || `export-table-${tableId}`} fileName={exportFileName || ((ext) => buildExportFileName(tableId || 'table', `page-${pageNumber || 1}`, {}, ext))} csv={exportCsv || (() => tableCsv(visibleColumns, items))} />
              )}
              <ColumnPicker columns={columns} hidden={hidden} onToggle={toggle} />
            </>
          }
          autoRefreshSeconds={autoRefreshSeconds}
          onAutoRefreshChange={onAutoRefreshChange}
        />
      </div>
      {filterSlot && <div className="table-filter-row">{filterSlot}</div>}
      {selectable && selected.length > 0 && (
        <div className="bulk-bar" role="region" aria-label={t('components.table.bulkActions')}>
          <span>{t('components.table.selected', { count: selected.length, formattedCount: formatNumber(selected.length, {}, i18n.language) })}</span>
          <button type="button" className="button-secondary button-sm" onClick={() => onSelectChange?.([])} {...tip(t('tips.table.clearSelection'))}>
            {t('components.table.clearSelection')}
          </button>
          {bulkActions}
        </div>
      )}
      <DataTable
        columns={visibleColumns}
        items={items}
        loading={loading}
        emptyMessage={emptyMessage}
        onRowClick={onRowClick}
        rowId={rowId}
        sortKey={sortKey}
        sortDir={sortDir}
        onSort={onSort}
        selectable={selectable}
        selected={selected}
        onSelectChange={onSelectChange}
        compact={compact}
        testId={testId}
        rowProps={rowProps}
        error={error}
      />
    </div>
  );
}
