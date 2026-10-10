import { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ColumnsIcon } from './Icons';

/** "Select Columns" control. Pinned columns are listed but cannot be hidden. */
export default function ColumnPicker({ columns, hidden, onToggle }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const options = columns.filter((c) => c.key !== 'actions' && c.key !== 'select');

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const width = 240;
    setPos({ top: rect.bottom + 4, left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)) });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (triggerRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="table-pagination-btn"
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={t('components.table.selectColumns')}
        title={t('components.table.selectColumns')}
        onClick={() => setOpen((v) => !v)}
        data-testid="column-picker"
      >
        <ColumnsIcon />
      </button>
      {open &&
        createPortal(
          <div ref={menuRef} className="column-picker" style={{ top: pos.top, left: pos.left }} role="dialog" aria-label={t('components.table.selectColumns')}>
            <div className="column-picker-title">{t('components.table.selectColumns')}</div>
            {options.map((c) => (
              <label key={c.key} className="column-picker-item">
                <input type="checkbox" checked={c.pinned || !hidden.includes(c.key)} disabled={!!c.pinned} onChange={() => onToggle(c.key)} />
                <span>{c.label}</span>
                {c.pinned && <span className="text-muted column-picker-pinned">{t('components.table.pinned')}</span>}
              </label>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
