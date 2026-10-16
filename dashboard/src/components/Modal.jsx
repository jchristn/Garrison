import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { XIcon } from './Icons';
import { tip } from './Tooltip';

/**
 * Base modal. Renders via portal. Closes on ESC and backdrop click, locks body
 * scroll while open. `size` is 'small' | 'medium' | 'large' | 'xlarge'.
 */
export default function Modal({ open, onClose, title, headerMeta, children, footer, size = 'medium' }) {
  const { t } = useTranslation();
  const titleId = useId();
  const dialogRef = useRef(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previousFocus = document.activeElement;
    const root = document.getElementById('root');
    const previousInert = root?.inert;
    if (root) root.inert = true;
    const focusable = () => Array.from(dialogRef.current?.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ) || []).filter((element) => element.getClientRects().length > 0);
    const onKey = (e) => {
      const dialogs = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
      if (dialogs[dialogs.length - 1] !== dialogRef.current) return;
      if (e.key === 'Escape') closeRef.current?.();
      if (e.key !== 'Tab') return;
      const items = focusable();
      const first = items[0] || dialogRef.current;
      const last = items[items.length - 1] || dialogRef.current;
      if (items.length === 0 || !dialogRef.current?.contains(document.activeElement)
        || (e.shiftKey && document.activeElement === first) || (!e.shiftKey && document.activeElement === last)) {
        e.preventDefault();
        (e.shiftKey ? last : first)?.focus();
      }
    };
    (focusable()[0] || dialogRef.current)?.focus();
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (root) root.inert = previousInert;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [open]);

  if (!open) return null;

  const sizeClass = size === 'medium' ? '' : `modal-${size}`;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className={`modal ${sizeClass}`}
        ref={dialogRef}
        tabIndex={-1}
        aria-labelledby={titleId}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <div className="modal-title" id={titleId}>{title}</div>
            {headerMeta && <div className="modal-header-meta">{headerMeta}</div>}
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label={t('common.actions.close')}
            {...tip(t('tips.modal.dismiss'))}
          >
            <XIcon />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
