import { useRef } from 'react';
import { tip } from './Tooltip.jsx';

/** Pixels one arrow key press moves a splitter. */
const STEP = 16;

/**
 * A draggable divider between two panes. Drag it with a mouse, pen, or finger, or focus it and use the arrow keys (Home
 * and End jump to the narrowest and widest). `edge` says which side of the divider the resized pane sits on: 'start'
 * (the conversation list, before the divider) or 'end' (the file list, after it). Right-to-left layouts are mirrored.
 */
export default function Splitter({ edge, width, min, max, onChange, label, tipText, testId }) {
  const drag = useRef(null);
  const clamp = (value) => Math.min(max, Math.max(min, Math.round(value)));
  const direction = () => {
    const rtl = typeof document !== 'undefined' && document.documentElement.dir === 'rtl';
    const grows = edge === 'start' ? 1 : -1;
    return rtl ? -grows : grows;
  };
  const down = (e) => {
    if (e.button !== undefined && e.button !== 0) return;
    e.preventDefault();
    drag.current = { x: e.clientX, width, sign: direction() };
    if (e.currentTarget.setPointerCapture && e.pointerId !== undefined) e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e) => {
    if (!drag.current) return;
    onChange(clamp(drag.current.width + (e.clientX - drag.current.x) * drag.current.sign));
  };
  const up = () => {
    drag.current = null;
  };
  const key = (e) => {
    const sign = direction();
    if (e.key === 'ArrowRight') onChange(clamp(width + STEP * sign));
    else if (e.key === 'ArrowLeft') onChange(clamp(width - STEP * sign));
    else if (e.key === 'Home') onChange(min);
    else if (e.key === 'End') onChange(max);
    else return;
    e.preventDefault();
  };
  return (
    <div
      className={`splitter splitter-${edge}`}
      role="separator"
      aria-orientation="vertical"
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={width}
      tabIndex={0}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onKeyDown={key}
      data-testid={testId}
      {...tip(tipText)}
    />
  );
}
