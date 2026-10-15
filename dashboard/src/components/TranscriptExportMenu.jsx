import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { DownloadIcon } from './Icons';
import { tip } from './Tooltip';
import { useToast } from '../context/ToastContext';
import { downloadText } from '../utils/exporters';
import { errorMessage } from '../utils/errors';
import { TRANSCRIPT_FORMATS, transcriptFileName, transcriptMediaType } from '../utils/transcripts';

/**
 * Transcript export for a run or a conversation (P12.27): Markdown or JSON, optionally with thinking. `load(format,
 * includeThinking)` returns the transcript text from the server, which redacts secrets; the file is named
 * <id>-transcript.md or <id>-transcript.json.
 */
export default function TranscriptExportMenu({ id, load, testId = 'transcript-export' }) {
  const { t } = useTranslation();
  const { addToast } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    const w = 240;
    const h = TRANSCRIPT_FORMATS.length * 34 + 48;
    const top = window.innerHeight - r.bottom < h + 8 ? r.top - h - 4 : r.bottom + 4;
    const left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
    setPos({ top, left });
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

  const run = async (format) => {
    setOpen(false);
    setBusy(true);
    try {
      const text = await load(format, thinking);
      downloadText(transcriptFileName(id, format), typeof text === 'string' ? text : JSON.stringify(text, null, 2), transcriptMediaType(format));
    } catch (e) {
      addToast({ type: 'error', message: t('components.transcriptExport.failed', { message: errorMessage(t, e) }) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="button-secondary"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={busy}
        onClick={() => setOpen((v) => !v)}
        data-testid={testId}
        {...tip(t('tips.components.transcriptExport.menu'))}
      >
        <DownloadIcon size={14} /> {busy ? t('components.transcriptExport.exporting') : t('components.transcriptExport.label')}
      </button>
      {open &&
        createPortal(
          <div ref={menuRef} className="action-menu-dropdown" role="menu" style={{ top: pos.top, left: pos.left, minWidth: 240 }} data-testid={`${testId}-menu`}>
            {TRANSCRIPT_FORMATS.map((f) => (
              <button key={f} type="button" role="menuitem" className="action-menu-item" onClick={() => run(f)} data-transcript-format={f} {...tip(t(`tips.components.transcriptExport.${f}`))}>
                {t(`components.transcriptExport.${f}`)}
              </button>
            ))}
            <label className="transcript-export-thinking" {...tip(t('tips.components.transcriptExport.includeThinking'))}>
              <input type="checkbox" checked={thinking} onChange={(e) => setThinking(e.target.checked)} data-testid={`${testId}-thinking`} {...tip(t('tips.components.transcriptExport.includeThinking'))} />
              <span>{t('components.transcriptExport.includeThinking')}</span>
            </label>
          </div>,
          document.body
        )}
    </>
  );
}
