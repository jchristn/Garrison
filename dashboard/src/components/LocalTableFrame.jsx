import { useEffect, useMemo, useState } from 'react';
import TableFrame from './TableFrame';
import usePageSizePref from '../hooks/usePageSizePref';
import { sortLocal } from '../utils/query';

/**
 * TableFrame for a list the page already holds in memory (a detail page's revisions, a modal's versions): it pages
 * and sorts on the client. The pagination bar carries the Columns control, and both the column choice and the rows
 * per page are saved under `tableId`, so they survive a reload.
 *
 * Props match TableFrame, minus the server paging ones. `items` is the whole list. Columns marked `sortable` sort on
 * the client; `defaultSort` is an optional `{ key, dir }`.
 */
export default function LocalTableFrame({ tableId, items = [], columns, defaultSort = null, totalRecords, ...rest }) {
  const [pageSize, setPageSize] = usePageSizePref(tableId);
  const [pageNumber, setPageNumber] = useState(1);
  const [sort, setSort] = useState(defaultSort || { key: null, dir: 'asc' });
  const list = useMemo(() => items || [], [items]);
  const pages = Math.max(1, Math.ceil(list.length / pageSize));

  // A refresh that shortens the list keeps the page in range.
  useEffect(() => {
    if (pageNumber > pages) setPageNumber(pages);
  }, [pageNumber, pages]);

  const sorted = useMemo(() => (sort.key ? sortLocal(list, sort.key, sort.dir) : list), [list, sort]);
  const current = Math.min(pageNumber, pages);
  const pageItems = sorted.slice((current - 1) * pageSize, current * pageSize);
  const hasSortable = (columns || []).some((c) => c.sortable);

  return (
    <TableFrame
      {...rest}
      tableId={tableId}
      columns={columns}
      items={pageItems}
      totalRecords={totalRecords ?? list.length}
      pageNumber={current}
      pageSize={pageSize}
      onPageChange={setPageNumber}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPageNumber(1);
      }}
      sortKey={sort.key}
      sortDir={sort.dir}
      onSort={hasSortable ? (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' })) : undefined}
    />
  );
}
