import { useState, useCallback } from 'react';
import { STORAGE_KEYS } from '../utils/constants';

function readAll() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.columns) || '{}') || {};
  } catch {
    return {};
  }
}

/**
 * Per-table column visibility persisted in localStorage. Pinned columns are always visible.
 * @param {string} tableId Stable table identifier.
 * @param {Array<{key:string,pinned?:boolean,defaultHidden?:boolean}>} columns Column definitions.
 */
export default function useColumnPrefs(tableId, columns) {
  const [hidden, setHidden] = useState(() => {
    const saved = readAll()[tableId];
    if (Array.isArray(saved)) return saved;
    return columns.filter((c) => c.defaultHidden && !c.pinned).map((c) => c.key);
  });

  const toggle = useCallback(
    (key) => {
      setHidden((prev) => {
        const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key];
        const all = readAll();
        all[tableId] = next;
        localStorage.setItem(STORAGE_KEYS.columns, JSON.stringify(all));
        return next;
      });
    },
    [tableId]
  );

  const visibleColumns = columns.filter((c) => c.pinned || !hidden.includes(c.key));
  return { hidden, toggle, visibleColumns };
}
