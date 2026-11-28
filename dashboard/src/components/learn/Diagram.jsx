import { useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { pathFor } from '../../config/navConfig';
import { getDirection } from '../../i18n/localeRegistry';
import { GITHUB_URL } from '../../utils/constants';
import { tip } from '../Tooltip';
import { layoutDiagram, pathData } from './diagramLayout';
import { findDiagram, LABELLED_ARROWS } from './diagrams';

// The diagram kit (LP4.1). A diagram is data (components/learn/diagrams.js) laid out by diagramLayout.js and drawn here
// as SVG whose colors come from CSS classes over the theme tokens in index.css, so it follows light and dark themes.
// Labels come from t(), wrap to fit their boxes, and the layout mirrors in right-to-left locales. Every diagram
// carries a <desc> and a visible "Show as list" toggle that shows the same content as a nested list; below 768 px
// the list is the default.

/** Where the docs live for links from the dashboard. The export script passes a relative base instead. */
export const DOCS_BASE = `${GITHUB_URL}/blob/main/docs/`;

/** Width in pixels below which a diagram opens as its list. */
export const NARROW_WIDTH = 768;

/** Resolve every label of a diagram through t(). */
export function diagramTexts(def, t) {
  const base = `learn.diagrams.${def.id}`;
  const labelled = new Set(LABELLED_ARROWS[def.id] || []);
  return {
    title: t(`${base}.title`),
    desc: t(`${base}.desc`),
    boxes: Object.fromEntries(def.boxes.map((b) => [b.id, { title: t(`${base}.boxes.${b.id}.title`), body: t(`${base}.boxes.${b.id}.body`) }])),
    groups: Object.fromEntries((def.groups || []).map((g) => [g.id, t(`${base}.groups.${g.id}`)])),
    arrows: Object.fromEntries((def.arrows || []).filter((a) => labelled.has(a.id)).map((a) => [a.id, t(`${base}.arrows.${a.id}`)]))
  };
}

/** One sentence per arrow, for the <desc> and the list view. */
export function connectionText(arrow, texts, t, dir) {
  const from = texts.boxes[arrow.from]?.title ?? arrow.from;
  const to = texts.boxes[arrow.to]?.title ?? arrow.to;
  const glyph = arrow.both ? '↔' : dir === 'rtl' ? '←' : '→';
  const label = texts.arrows[arrow.id];
  return label ? t('learn.list.connectionLabelled', { from, to, arrow: glyph, label }) : t('learn.list.connection', { from, to, arrow: glyph });
}

function lineBaseline(top, lineHeight, size) {
  return top + lineHeight / 2 + size * 0.36;
}

/** Multi-line SVG text. `lines` are already wrapped; `x` is the anchor point. */
export function DiagramLabel({ lines, x, y, lineHeight, size, anchor = 'middle', className }) {
  return (
    <text className={className} textAnchor={anchor}>
      {lines.map((line, i) => (
        <tspan key={i} x={x} y={lineBaseline(y + i * lineHeight, lineHeight, size)}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/** A dashed-free rounded rectangle around a set of cells, with its label at the top start corner. */
export function DiagramGroup({ group, metrics }) {
  return (
    <g className="lg-group" data-group={group.id}>
      <rect x={group.x} y={group.y} width={group.w} height={group.h} rx={10} ry={10} />
      {group.labelLines.length > 0 && (
        <DiagramLabel className="lg-group-label" lines={group.labelLines} x={group.labelX} y={group.labelY} lineHeight={metrics.groupLabelLine} size={metrics.groupLabelSize} anchor={group.labelAnchor} />
      )}
    </g>
  );
}

function BookGlyph({ x, y }) {
  return (
    <g className="lg-doc-glyph" transform={`translate(${x} ${y})`} aria-hidden="true">
      <rect x={-3} y={-3} width={18} height={18} rx={4} className="lg-doc-hit" />
      <path d="M2 2.5h3.5A2.5 2.5 0 0 1 8 5v7a2 2 0 0 0-2-2H2z M14 2.5h-3.5A2.5 2.5 0 0 0 8 5v7a2 2 0 0 1 2-2h4z" />
    </g>
  );
}

/**
 * A box. Its body links to the box's dashboard page; the book glyph in its top end corner links to its doc. In the
 * standalone export the body links to the doc.
 */
export function DiagramBox({ box, texts, metrics: m, dir, links }) {
  const { t } = useTranslation();
  const text = texts.boxes[box.id];
  const top = box.y + (box.h - box.contentHeight) / 2 + m.padY;
  const cx = box.x + box.w / 2;
  const titleTop = top;
  const bodyTop = titleTop + box.titleLines.length * m.titleLine + m.blockGap;
  const codeTop = bodyTop + (box.bodyLines.length ? box.bodyLines.length * m.bodyLine + m.blockGap : 0);
  const glyphX = dir === 'rtl' ? box.x + 8 : box.x + box.w - 8 - 12;
  const glyphY = box.y + 7;
  const pageLabel = box.page ? t(`nav.items.${box.page}.label`) : '';
  const docHref = box.doc ? `${links.docBase}${box.doc}` : null;
  const pageHref = links.standalone ? docHref : box.page ? pathFor(box.page) : null;
  const name = [text.title, text.body].filter(Boolean).join('. ');

  const body = (
    <>
      <rect className="lg-box-bg" x={box.x} y={box.y} width={box.w} height={box.h} rx={8} ry={8} />
      <DiagramLabel className="lg-box-title" lines={box.titleLines} x={cx} y={titleTop} lineHeight={m.titleLine} size={m.titleSize} />
      {box.bodyLines.length > 0 && <DiagramLabel className="lg-box-body" lines={box.bodyLines} x={cx} y={bodyTop} lineHeight={m.bodyLine} size={m.bodySize} />}
      {box.codeLines.length > 0 && <DiagramLabel className="lg-box-code" lines={box.codeLines} x={cx} y={codeTop} lineHeight={m.codeLine} size={m.codeSize} />}
    </>
  );

  const onClick = (e) => {
    if (!links.onNavigate || links.standalone || !pageHref) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    links.onNavigate(pageHref);
  };

  return (
    <g className={`lg-box${box.tone ? ` lg-box--${box.tone}` : ''}`} data-box={box.id}>
      {pageHref ? (
        <a
          className="lg-link"
          href={pageHref}
          onClick={onClick}
          aria-label={links.standalone ? name : t('learn.openPage', { name, page: pageLabel })}
          {...(links.standalone ? {} : tip(t('tips.learn.openPage', { page: pageLabel })))}
          data-testid={links.standalone ? undefined : `learn-box-${box.id}`}
        >
          {body}
        </a>
      ) : (
        body
      )}
      {docHref && !links.standalone && (
        <a className="lg-doc" href={docHref} target="_blank" rel="noopener noreferrer" aria-label={t('learn.openDoc', { name: text.title, doc: box.doc.split('#')[0] })} {...tip(t('tips.learn.openDoc', { doc: box.doc.split('#')[0] }))}>
          <BookGlyph x={glyphX} y={glyphY} />
        </a>
      )}
    </g>
  );
}

/** An arrow with a solid or dashed line, a clear head (two heads when `both`), and an optional label pill. */
export function DiagramArrow({ arrow, metrics: m, markerId }) {
  return (
    <g className={`lg-arrow${arrow.dashed ? ' lg-arrow--dashed' : ''}`} data-arrow={arrow.id}>
      <path d={pathData(arrow.points, m.cornerRadius)} markerEnd={`url(#${markerId})`} markerStart={arrow.both ? `url(#${markerId})` : undefined} />
      {arrow.label && (
        <g className="lg-arrow-label">
          <rect x={arrow.label.x} y={arrow.label.y} width={arrow.label.w} height={arrow.label.h} rx={4} ry={4} />
          <DiagramLabel lines={arrow.label.lines} x={arrow.label.cx} y={arrow.label.y + m.labelPadY} lineHeight={m.labelLine} size={m.labelSize} />
        </g>
      )}
    </g>
  );
}

function arrowEnd(points, atStart) {
  // Pull each end back from the box edge so the head touches the border instead of sinking into it.
  const pts = points.map((p) => [...p]);
  const shorten = (i, j) => {
    const [x, y] = pts[i];
    const [px, py] = pts[j];
    const len = Math.hypot(x - px, y - py);
    if (len < 4) return;
    pts[i] = [x - ((x - px) / len) * 1.5, y - ((y - py) / len) * 1.5];
  };
  shorten(pts.length - 1, pts.length - 2);
  if (atStart) shorten(0, 1);
  return pts;
}

/**
 * The SVG of one diagram. `standalone` renders a self-contained file for docs/images (xmlns, an embedded style sheet,
 * links to the docs); otherwise the SVG takes its colors from the app's tokens.
 */
export function DiagramSvg({ def, dir, links, styleSheet = null, idPrefix }) {
  const { t } = useTranslation();
  const texts = useMemo(() => diagramTexts(def, t), [def, t]);
  const layout = useMemo(() => layoutDiagram(def, texts, { dir }), [def, texts, dir]);
  const titleId = `${idPrefix}-title`;
  const descId = `${idPrefix}-desc`;
  const markerId = `${idPrefix}-head`;
  const desc = [texts.desc, ...(def.arrows || []).map((a) => connectionText(a, texts, t, dir))].join(' ');
  const svgProps = links.standalone ? { xmlns: 'http://www.w3.org/2000/svg', width: layout.width, height: layout.height } : {};

  return (
    <svg
      {...svgProps}
      className="lg-svg"
      viewBox={`0 0 ${Math.ceil(layout.width)} ${Math.ceil(layout.height)}`}
      role="group"
      aria-labelledby={titleId}
      aria-describedby={descId}
      direction={dir}
      data-dir={dir}
      data-diagram={def.id}
      style={links.standalone ? undefined : { maxWidth: `${Math.ceil(layout.width)}px` }}
    >
      <title id={titleId}>{texts.title}</title>
      <desc id={descId}>{desc}</desc>
      {styleSheet && <style>{styleSheet}</style>}
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse" markerUnits="userSpaceOnUse">
          <path className="lg-arrowhead" d="M0,0.8 L10,5 L0,9.2 z" />
        </marker>
      </defs>
      <rect className="lg-bg" x={0} y={0} width={Math.ceil(layout.width)} height={Math.ceil(layout.height)} rx={10} ry={10} />
      {layout.groups.map((g) => (
        <DiagramGroup key={g.id} group={g} metrics={layout.metrics} />
      ))}
      {layout.arrows.map((a) => (
        <DiagramArrow key={a.id} arrow={{ ...a, points: arrowEnd(a.points, a.both) }} metrics={layout.metrics} markerId={markerId} />
      ))}
      {layout.boxes.map((b) => (
        <DiagramBox key={b.id} box={b} texts={texts} metrics={layout.metrics} dir={dir} links={links} />
      ))}
    </svg>
  );
}

/** The text alternative: the same boxes, groups, and arrows as a nested list. */
export function DiagramList({ def, dir, links }) {
  const { t } = useTranslation();
  const texts = useMemo(() => diagramTexts(def, t), [def, t]);
  const item = (box) => {
    const text = texts.boxes[box.id];
    const page = box.page ? pathFor(box.page) : null;
    const onClick = (e) => {
      if (!links.onNavigate || !page) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      links.onNavigate(page);
    };
    return (
      <li key={box.id} data-list-box={box.id}>
        {page ? (
          <a href={page} onClick={onClick} className="learn-list-name" {...tip(t('tips.learn.openPage', { page: t(`nav.items.${box.page}.label`) }))}>
            {text.title}
          </a>
        ) : (
          <span className="learn-list-name">{text.title}</span>
        )}
        {text.body && <span className="learn-list-body"> {text.body}</span>}
        {box.code && (
          <>
            {' '}
            <code>{box.code}</code>
          </>
        )}
        {box.doc && (
          <>
            {' '}
            <a href={`${links.docBase}${box.doc}`} target="_blank" rel="noopener noreferrer" className="learn-list-doc" {...tip(t('tips.learn.openDoc', { doc: box.doc.split('#')[0] }))}>
              {t('learn.list.doc', { doc: box.doc.split('#')[0] })}
            </a>
          </>
        )}
      </li>
    );
  };
  const grouped = new Set();
  const groupItems = (def.groups || []).map((g) => {
    const [c0, c1] = g.cols;
    const [r0, r1] = g.rows;
    const members = def.boxes.filter((b) => b.col >= c0 && b.col <= c1 && b.row >= r0 && b.row <= r1 && !grouped.has(b.id));
    members.forEach((b) => grouped.add(b.id));
    return (
      <li key={g.id} data-list-group={g.id}>
        <span className="learn-list-group">{texts.groups[g.id]}</span>
        <ul>{members.map(item)}</ul>
      </li>
    );
  });
  const loose = def.boxes.filter((b) => !grouped.has(b.id));
  return (
    <div className="learn-list" data-testid={`learn-list-${def.id}`}>
      <ul className="learn-list-parts" aria-label={t('learn.list.parts')}>
        {loose.map(item)}
        {groupItems}
      </ul>
      {(def.arrows || []).length > 0 && (
        <>
          <div className="learn-list-heading">{t('learn.list.connections')}</div>
          <ul className="learn-list-connections">
            {def.arrows.map((a) => (
              <li key={a.id} dir={dir}>
                {connectionText(a, texts, t, dir)}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function startsNarrow() {
  try {
    if (typeof window === 'undefined') return false;
    if (typeof window.matchMedia === 'function') return window.matchMedia(`(max-width: ${NARROW_WIDTH - 1}px)`).matches;
    return (window.innerWidth || NARROW_WIDTH) < NARROW_WIDTH;
  } catch {
    return false;
  }
}

/**
 * A diagram with its "Show as list" toggle.
 * @param {{ id: string, dir?: 'ltr' | 'rtl', onNavigate?: (path: string) => void, docBase?: string, list?: boolean }} props
 * `dir` defaults to the current locale's direction; `list` forces the starting view (default: list below 768 px).
 */
export default function Diagram({ id, dir, onNavigate, docBase = DOCS_BASE, list }) {
  const { t, i18n } = useTranslation();
  const def = findDiagram(id);
  const [showList, setShowList] = useState(() => (typeof list === 'boolean' ? list : startsNarrow()));
  const reactId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!def) return null;
  const direction = dir || getDirection(i18n.language);
  const links = { onNavigate, docBase, standalone: false };
  return (
    <figure className="learn-diagram" data-testid={`learn-diagram-${id}`}>
      <div className="learn-diagram-toolbar">
        <button
          type="button"
          className="button-ghost button-sm"
          aria-pressed={showList}
          onClick={() => setShowList((v) => !v)}
          data-testid={`learn-toggle-${id}`}
          {...tip(t(showList ? 'tips.learn.showDiagram' : 'tips.learn.showList'))}
        >
          {t(showList ? 'learn.showDiagram' : 'learn.showList')}
        </button>
      </div>
      {showList ? (
        <DiagramList def={def} dir={direction} links={links} />
      ) : (
        <div className="learn-diagram-frame">
          <DiagramSvg def={def} dir={direction} links={links} idPrefix={`lg-${id}-${reactId}`} />
        </div>
      )}
    </figure>
  );
}
