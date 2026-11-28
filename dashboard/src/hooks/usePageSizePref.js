import { useState, useCallback } from 'react';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, STORAGE_KEYS } from '../utils/constants';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.pageSize) || '{}') || {};
  } catch {
    return {};
  }
}

/**
 * The saved rows-per-page for a table, or `fallback` when none is saved or the saved value is not one of
 * PAGE_SIZE_OPTIONS.
 * @param {string} tableId Stable table identifier.
 * @param {number} fallback Page size to use when nothing valid is saved.
 */
export function savedPageSize(tableId, fallback = DEFAULT_PAGE_SIZE) {
  const value = Number(readAll()[tableId]);
  return PAGE_SIZE_OPTIONS.includes(value) ? value : fallback;
}

/**
 * Save the rows-per-page for a table. Storage that is blocked or full is ignored: the choice then lasts for the visit.
 * @param {string} tableId Stable table identifier.
 * @param {number} size Rows per page.
 */
export function persistPageSize(tableId, size) {
  try {
    const all = readAll();
    all[tableId] = size;
    localStorage.setItem(STORAGE_KEYS.pageSize, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

/**
 * Per-table rows-per-page persisted in localStorage, keyed by table ID (the same key as the table's column choice).
 * @param {string} tableId Stable table identifier.
 * @param {number} fallback Page size when nothing is saved. Defaults to DEFAULT_PAGE_SIZE (25).
 * @returns {[number, (size:number) => void]} The page size and a setter that saves it.
 */
export default function usePageSizePref(tableId, fallback = DEFAULT_PAGE_SIZE) {
  const [pageSize, setPageSizeState] = useState(() => savedPageSize(tableId, fallback));
  const setPageSize = useCallback(
    (size) => {
      persistPageSize(tableId, size);
      setPageSizeState(size);
    },
    [tableId]
  );
  return [pageSize, setPageSize];
}
