import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { tip } from '../Tooltip';
import { isRtl } from '../../utils/direction';
import { formatDuration } from '../../i18n/formatters';
import { enumLabel } from '../../utils/enums';
import { buildLanes, charsThatFit, fitSequenceGeometry, layoutSequence, stateTone, stepNeighbor } from '../../utils/trailLayout';
import { ToneIcon, edgeLabel, laneName, stepAriaLabel, stepDetail, stepTitle } from './trailParts';

const ZOOMS = [0.5, 0.67, 0.8, 1, 1.25, 1.5, 2];
const MARKED_RUN_KINDS = ['Shadow', 'Eval'];
const short = (text, max) => (text && text.length > max ? `${text.slice(0, max - 3)}...` : text || '');

function reducedMotion() {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * The sequence view of an activity trail (LP2.3, the default view per LP-005): one lane per agent with the caller lane
 * first, time running down, each step a box with its kind and its state as an icon and a label, and each edge an
 * arrow labeled with its kind. The focus run is highlighted and scrolled into view. Redacted steps are hatched boxes
 * that show only their kind. Zoom with the buttons, pan by dragging or scrolling the drawing.
 *
 * Keyboard: Tab reaches the selected step (one tab stop for the whole drawing). Arrow Up and Down move through the
 * steps in time order, Left and Right to the nearest step in the next lane (mirrored right to left), Home and End to
 * the first and last step, Enter or Space opens the step drawer.
 */
export default function TrailSequence({ trail, selectedId, onSelect, onOpen }) {
  const { t, i18n } = useTranslation();
  const lng = i18n.language;
  const rtl = isRtl();
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, '');
  const markerId = `trail-arrow-${uid}`;
  const hatchId = `trail-hatch-${uid}`;
  const scrollRef = useRef(null);
  const [available, setAvailable] = useState(0);
  const [overflow, setOverflow] = useState({ end: false, bottom: false });
  const laneCount = useMemo(() => buildLanes(trail).length, [trail]);
  // Lanes share the width of the canvas (UXP1-V011), measured once it is on the page and again when it resizes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;
    const measure = () => setAvailable(el.clientWidth || 0);
    measure();
    if (typeof ResizeObserver !== 'function') return undefined;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const fitted = useMemo(() => fitSequenceGeometry(laneCount, available), [laneCount, available]);
  const layout = useMemo(() => layoutSequence(trail, { rtl, geometry: fitted }), [trail, rtl, fitted]);
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef(null);
  const drag = useRef(null);
  const focusId = layout.nodes.find((n) => n.isFocus)?.id || layout.nodes[0]?.id || null;
  const activeId = layout.nodes.some((n) => n.id === selectedId) ? selectedId : focusId;
  const g = layout.geometry;
  const titleChars = charsThatFit(g.nodeWidth - 16, 7);
  const detailChars = charsThatFit(g.nodeWidth - 32, 6.2);
  const laneChars = charsThatFit(g.laneWidth - 16, 7.6);

  // A fade and a note on the side where the drawing continues past the visible area (UXP1-V011).
  const updateOverflow = () => {
    const el = scrollRef.current;
    if (!el) return;
    const maxLeft = el.scrollWidth - el.clientWidth;
    const left = Math.abs(el.scrollLeft);
    const end = maxLeft > 2 && left < maxLeft - 2;
    const bottom = el.scrollHeight - el.clientHeight - el.scrollTop > 2;
    setOverflow((o) => (o.end === end && o.bottom === bottom ? o : { end, bottom }));
  };
  useEffect(() => updateOverflow(), [layout, zoom, available]);

  // Bring the focus run into view once per trail.
  const scrolledFor = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    const node = layout.nodes.find((n) => n.id === activeId);
    if (!el || !node || scrolledFor.current === trail?.focusRunId) return;
    scrolledFor.current = trail?.focusRunId;
    const left = node.x * zoom - el.clientWidth / 2 + (node.width * zoom) / 2;
    const top = node.y * zoom - el.clientHeight / 2;
    if (typeof el.scrollTo === 'function') el.scrollTo({ left: Math.max(0, left), top: Math.max(0, top), behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [layout, activeId, zoom, trail?.focusRunId]);

  const focusStep = (id) => {
    const el = [...(svgRef.current?.querySelectorAll('[data-step-id]') || [])].find((n) => n.getAttribute('data-step-id') === id);
    if (el && typeof el.focus === 'function') el.focus();
    if (el && typeof el.scrollIntoView === 'function') el.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: reducedMotion() ? 'auto' : 'smooth' });
  };

  const onKeyDown = (e) => {
    if (!activeId) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onOpen?.(activeId);
      return;
    }
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const next = stepNeighbor(layout, activeId, e.key, rtl);
    if (next && next !== activeId) {
      onSelect?.(next);
      requestAnimationFrame(() => focusStep(next));
    }
  };

  const onPointerDown = (e) => {
    if (e.button !== 0 || e.target.closest?.('[data-step-id]')) return;
    const el = scrollRef.current;
    drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop };
    el.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    const el = scrollRef.current;
    el.scrollLeft = drag.current.left - (e.clientX - drag.current.x);
    el.scrollTop = drag.current.top - (e.clientY - drag.current.y);
  };
  const endDrag = () => {
    drag.current = null;
  };

  const zoomIndex = ZOOMS.indexOf(zoom);
  const zoomBy = (delta) => setZoom(ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, zoomIndex + delta))]);

  return (
    <div className="trail-sequence" data-testid="trail-sequence">
      <div className="trail-view-toolbar">
        <div className="trail-zoom" role="group" aria-label={t('trail.zoom.label')}>
          <button type="button" className="button-secondary button-sm" onClick={() => zoomBy(-1)} disabled={zoomIndex <= 0} aria-label={t('trail.zoom.out')} data-testid="trail-zoom-out" {...tip(t('tips.trail.zoom.out'))}>
            -
          </button>
          <button type="button" className="button-secondary button-sm" onClick={() => setZoom(1)} data-testid="trail-zoom-reset" {...tip(t('tips.trail.zoom.reset'))}>
            {t('trail.zoom.percent', { value: Math.round(zoom * 100) })}
          </button>
          <button type="button" className="button-secondary button-sm" onClick={() => zoomBy(1)} disabled={zoomIndex >= ZOOMS.length - 1} aria-label={t('trail.zoom.in')} data-testid="trail-zoom-in" {...tip(t('tips.trail.zoom.in'))}>
            +
          </button>
        </div>
        <span className="text-muted trail-keys-hint" {...tip(t('tips.trail.keysHint'))}>
          {t('trail.keysHint')}
        </span>
        {(overflow.end || overflow.bottom) && (
          <span className="trail-more-hint" data-testid="trail-more-hint" {...tip(t('tips.trail.moreHint'))}>
            {overflow.end ? t('trail.moreLanes', { count: layout.lanes.length }) : t('trail.moreSteps')}
          </span>
        )}
      </div>
      <div className={`trail-sequence-frame ${overflow.end ? 'fade-end' : ''} ${overflow.bottom ? 'fade-bottom' : ''}`.trim()}>
      <div
        className="trail-sequence-scroll"
        ref={scrollRef}
        onScroll={updateOverflow}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        data-testid="trail-sequence-scroll"
      >
        <svg
          ref={svgRef}
          width={layout.width * zoom}
          height={layout.height * zoom}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          role="group"
          aria-label={t('trail.sequenceLabel', { steps: layout.nodes.length, lanes: layout.lanes.length })}
          onKeyDown={onKeyDown}
        >
          <defs>
            <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" className="trail-arrow" />
            </marker>
            <pattern id={hatchId} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="8" height="8" className="trail-hatch-bg" />
              <line x1="0" y1="0" x2="0" y2="8" className="trail-hatch-line" />
            </pattern>
          </defs>

          {layout.lanes.map((lane) => {
            const marked = lane.runKinds.filter((k) => MARKED_RUN_KINDS.includes(k));
            const name = laneName(t, lane);
            return (
              <g key={lane.id} className={`trail-lane ${lane.id === 'caller' ? 'is-caller' : ''}`} data-lane-id={lane.id}>
                <rect x={lane.x + 4} y={g.pad} width={g.laneWidth - 8} height={layout.height - g.pad * 2} rx="6" className="trail-lane-bg" />
                <line x1={lane.center} y1={g.headerHeight + g.pad - 6} x2={lane.center} y2={layout.height - g.pad} className="trail-lifeline" />
                <text x={lane.center} y={g.pad + 18} textAnchor="middle" className="trail-lane-name">
                  <title>{[name, lane.unitName].filter(Boolean).join(', ')}</title>
                  {short(name, laneChars)}
                </text>
                {lane.unitName && (
                  <text x={lane.center} y={g.pad + 33} textAnchor="middle" className="trail-lane-unit">
                    {short(lane.unitName, laneChars + 4)}
                  </text>
                )}
                {marked.length > 0 && (
                  <text x={lane.center} y={g.pad + 48} textAnchor="middle" className="trail-lane-badge" data-testid="trail-lane-badge">
                    {marked.map((k) => enumLabel(t, 'runKind', k)).join(', ')}
                  </text>
                )}
              </g>
            );
          })}

          {layout.gaps.map((gap) => (
            <g key={`gap-${gap.row}`} className="trail-gap" data-testid="trail-gap">
              <line x1={g.pad} y1={gap.y} x2={layout.width - g.pad} y2={gap.y} className="trail-gap-line" />
              <text x={layout.width / 2} y={gap.y - 3} textAnchor="middle" className="trail-gap-label">
                {t('trail.idleGap', { duration: formatDuration(gap.ms, lng) })}
              </text>
            </g>
          ))}

          {layout.edges.map((edge) => (
            <g key={edge.key} className={`trail-edge kind-${edge.kind} ${edge.back ? 'is-back' : ''}`} data-edge-kind={edge.kind}>
              <path d={edge.path} className="trail-edge-line" markerEnd={`url(#${markerId})`} />
              <text x={edge.labelX} y={edge.labelY} textAnchor={edge.anchor} className="trail-edge-label">
                {edgeLabel(t, edge.kind)}
              </text>
            </g>
          ))}

          {layout.nodes.map((node) => {
            const tone = stateTone(node.state);
            const redacted = node.kind === 'Redacted';
            const active = node.id === activeId;
            const textX = rtl ? node.x + node.width - 8 : node.x + 8;
            const anchor = rtl ? 'end' : 'start';
            const iconX = rtl ? node.x + node.width - 20 : node.x + 8;
            const detailX = rtl ? node.x + node.width - 24 : node.x + 24;
            return (
              <g
                key={node.id}
                className={`trail-step kind-${node.kind} tone-${tone} ${node.isFocus ? 'is-focus' : ''} ${active ? 'is-selected' : ''} ${redacted ? 'is-redacted' : ''}`.trim()}
                data-step-id={node.id}
                data-testid="trail-step"
                role="button"
                tabIndex={active ? 0 : -1}
                aria-label={stepAriaLabel(t, node, lng)}
                aria-current={node.isFocus ? 'true' : undefined}
                onClick={() => {
                  onSelect?.(node.id);
                  onOpen?.(node.id);
                }}
                onFocus={() => {
                  if (!active) onSelect?.(node.id);
                }}
              >
                {(node.isFocus || active) && (
                  // Focus and selection are rings outside the box, so the box keeps its state color (UXP1-V012).
                  <rect x={node.x - 4} y={node.y - 4} width={node.width + 8} height={node.height + 8} rx="9" className={`trail-step-ring ${active ? 'is-selected-ring' : 'is-focus-ring'}`} data-testid="trail-step-ring" />
                )}
                <rect x={node.x} y={node.y} width={node.width} height={node.height} rx="6" className="trail-step-box" fill={redacted ? `url(#${hatchId})` : undefined} />
                <text x={textX} y={node.y + 16} textAnchor={anchor} className="trail-step-title">
                  {stepTitle(t, node).length > titleChars && <title>{stepTitle(t, node)}</title>}
                  {short(stepTitle(t, node), titleChars)}
                </text>
                {!redacted && (
                  <>
                    <ToneIcon tone={tone} x={iconX} y={node.y + 23} />
                    <text x={detailX} y={node.y + 33} textAnchor={anchor} className="trail-step-detail">
                      {short(stepDetail(t, node, lng), detailChars)}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      </div>
    </div>
  );
}
