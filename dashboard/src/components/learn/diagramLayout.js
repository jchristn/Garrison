// Grid layout for the concept diagrams (LP4.1). Pure functions with no DOM, so the dashboard, the tests, and
// scripts/export-diagrams.mjs all get the same geometry.
//
// A diagram definition places boxes on a grid of columns and rows, draws groups around rectangles of cells, and joins
// boxes with arrows. Box heights grow with their wrapped labels; every box in a row takes the row's height so the grid
// stays even. Column and row gaps grow when an arrow label needs the room, which is how long German labels fit without
// clipping. Layout is computed left to right and then mirrored for right-to-left locales, so arrows, groups, and the
// corner link swap sides while the reading order of each label stays correct.

import { textWidth, wrapText } from './textWrap';

/** Default metrics in pixels. A definition may override any of them with `layout`. */
export const DEFAULT_METRICS = {
  colWidth: 196,
  minColGap: 56,
  minRowGap: 50,
  quietRowGap: 20,
  margin: 16,
  groupPad: 14,
  groupLabelSize: 11.5,
  groupLabelLine: 15,
  padX: 12,
  padY: 11,
  iconSpace: 13,
  titleSize: 13,
  titleLine: 17,
  bodySize: 11.5,
  bodyLine: 15,
  codeSize: 10.5,
  codeLine: 14,
  blockGap: 4,
  labelSize: 11,
  labelLine: 14,
  labelMaxWidth: 116,
  labelPadX: 6,
  labelPadY: 3,
  cornerRadius: 6
};

function range(def, key, fallback) {
  const value = def[key];
  return Array.isArray(value) ? value : [fallback, fallback];
}

/**
 * Lay out a diagram.
 * @param {object} def The definition: { id, columns, rows?, layout?, boxes, groups?, arrows? }.
 * @param {object} texts Resolved strings: { boxes: { [id]: { title, body } }, groups: { [id]: string }, arrows: { [id]: string } }.
 * @param {{ dir?: 'ltr' | 'rtl', showCode?: boolean }} [options] Direction ('rtl' mirrors the result), and whether
 * boxes draw their code name (default true; the dashboard leaves it out, UXP1-S023, and the docs export keeps it).
 * @returns {object} { width, height, dir, boxes, groups, arrows } with absolute coordinates.
 */
export function layoutDiagram(def, texts, options = {}) {
  const m = { ...DEFAULT_METRICS, ...(def.layout || {}) };
  const columns = def.columns;
  const rows = def.rows ?? Math.max(...def.boxes.map((b) => b.row)) + 1;
  const groups = def.groups || [];
  const arrows = def.arrows || [];

  // Box widths and wrapped lines. A spanning box is measured once the column positions are known, so first wrap
  // single-column boxes for row heights; spanning boxes are wrapped below and can only make their rows taller.
  const boxText = (box) => texts.boxes?.[box.id] || { title: box.id, body: '' };

  // Arrow labels.
  const labelLines = {};
  for (const arrow of arrows) {
    const text = texts.arrows?.[arrow.id];
    labelLines[arrow.id] = text ? wrapText(text, m.labelMaxWidth, m.labelSize) : [];
  }
  const labelBox = (id) => {
    const lines = labelLines[id] || [];
    if (!lines.length) return { w: 0, h: 0 };
    const w = Math.max(...lines.map((l) => textWidth(l, m.labelSize))) + m.labelPadX * 2;
    return { w, h: lines.length * m.labelLine + m.labelPadY * 2 };
  };

  const byId = Object.fromEntries(def.boxes.map((b) => [b.id, b]));
  const span = (b) => b.span || 1;

  // Column gaps: minimum, plus what a horizontal arrow label between adjacent columns needs.
  const colGap = Array.from({ length: Math.max(columns - 1, 0) }, () => m.minColGap);
  // A row gap that no arrow crosses only separates groups, so it stays small.
  const crossed = (r) => arrows.some((a) => byId[a.from] && byId[a.to] && Math.min(byId[a.from].row, byId[a.to].row) <= r && Math.max(byId[a.from].row, byId[a.to].row) > r);
  const rowGap = Array.from({ length: Math.max(rows - 1, 0) }, (_, r) => (crossed(r) ? m.minRowGap : m.quietRowGap));
  for (const arrow of arrows) {
    const a = byId[arrow.from];
    const b = byId[arrow.to];
    if (!a || !b) continue;
    const lb = labelBox(arrow.id);
    if (!lb.w) continue;
    const route = arrow.route || 'auto';
    if (a.row === b.row || route === 'hv') {
      // A label on a horizontal segment between adjacent columns widens that one gap. Across empty cells it has room.
      const [left, right] = a.col < b.col ? [a, b] : [b, a];
      const gapIndex = left.col + span(left) - 1;
      if (a.row === b.row && right.col === gapIndex + 1 && gapIndex < colGap.length) {
        colGap[gapIndex] = Math.max(colGap[gapIndex], lb.w + 20);
      }
      if (route === 'hv' && a.row !== b.row) {
        const gi = Math.min(a.row, b.row);
        if (gi < rowGap.length) rowGap[gi] = Math.max(rowGap[gi], lb.h + 16);
      }
    } else {
      // Label on a vertical segment, or on the horizontal middle of an elbow, sits in a row gap.
      const gi = Math.min(a.row, b.row);
      if (gi < rowGap.length) rowGap[gi] = Math.max(rowGap[gi], lb.h + 22);
    }
  }

  // Group padding widens the gaps next to a group's edges.
  const startsCol = (c) => groups.filter((g) => range(g, 'cols', 0)[0] === c).length;
  const endsCol = (c) => groups.filter((g) => range(g, 'cols', 0)[1] === c).length;
  const groupLabels = {};
  const colLeft = [];
  let x = m.margin;
  for (let c = 0; c < columns; c += 1) {
    x += startsCol(c) * m.groupPad;
    colLeft[c] = x;
    x += m.colWidth + endsCol(c) * m.groupPad;
    if (c < columns - 1) x += colGap[c];
  }
  const width = x + m.margin;
  const cellsWidth = (c0, c1) => colLeft[c1] + m.colWidth - colLeft[c0];

  // Wrap box labels now that every box width is known.
  const measured = {};
  for (const box of def.boxes) {
    const w = cellsWidth(box.col, box.col + span(box) - 1);
    const inner = w - m.padX * 2 - m.iconSpace * 2;
    const text = boxText(box);
    const titleLines = wrapText(text.title, inner, m.titleSize, { bold: true });
    const bodyLines = text.body ? wrapText(text.body, w - m.padX * 2, m.bodySize) : [];
    const codeLines = box.code && options.showCode !== false ? wrapText(box.code, w - m.padX * 2, m.codeSize, { mono: true }) : [];
    let h = m.padY * 2 + titleLines.length * m.titleLine;
    if (bodyLines.length) h += m.blockGap + bodyLines.length * m.bodyLine;
    if (codeLines.length) h += m.blockGap + codeLines.length * m.codeLine;
    measured[box.id] = { w, h, titleLines, bodyLines, codeLines };
  }

  // Group labels and the header room they need above their first row.
  for (const group of groups) {
    const [c0, c1] = range(group, 'cols', 0);
    const text = texts.groups?.[group.id] || '';
    const lines = text ? wrapText(text, cellsWidth(c0, c1) + m.groupPad * 2 - 20, m.groupLabelSize, { bold: true }) : [];
    groupLabels[group.id] = lines;
  }
  const headerAbove = (r) =>
    Math.max(0, ...groups.filter((g) => range(g, 'rows', 0)[0] === r).map((g) => m.groupPad + (groupLabels[g.id].length ? groupLabels[g.id].length * m.groupLabelLine + 6 : 0)));
  const endsRow = (r) => groups.filter((g) => range(g, 'rows', 0)[1] === r).length;

  const rowHeight = Array.from({ length: rows }, (_, r) => Math.max(0, ...def.boxes.filter((b) => b.row === r).map((b) => measured[b.id].h)));
  const rowTop = [];
  let y = m.margin;
  for (let r = 0; r < rows; r += 1) {
    y += headerAbove(r);
    rowTop[r] = y;
    y += rowHeight[r] + endsRow(r) * m.groupPad;
    if (r < rows - 1) y += rowGap[r];
  }
  const height = y + m.margin;

  const boxes = def.boxes.map((box) => {
    const mm = measured[box.id];
    return {
      ...box,
      x: colLeft[box.col],
      y: rowTop[box.row],
      w: mm.w,
      h: rowHeight[box.row],
      titleLines: mm.titleLines,
      bodyLines: mm.bodyLines,
      codeLines: mm.codeLines,
      contentHeight: mm.h
    };
  });
  const placed = Object.fromEntries(boxes.map((b) => [b.id, b]));

  const groupRects = groups.map((group) => {
    const [c0, c1] = range(group, 'cols', 0);
    const [r0, r1] = range(group, 'rows', 0);
    const lines = groupLabels[group.id];
    const header = lines.length ? lines.length * m.groupLabelLine + 6 : 0;
    const gx = colLeft[c0] - m.groupPad;
    const gy = rowTop[r0] - m.groupPad - header;
    return {
      id: group.id,
      x: gx,
      y: gy,
      w: cellsWidth(c0, c1) + m.groupPad * 2,
      h: rowTop[r1] + rowHeight[r1] + m.groupPad - gy,
      labelLines: lines,
      labelX: gx + 10,
      labelY: gy + m.groupPad - 2,
      labelAnchor: 'start'
    };
  });

  const arrowShapes = arrows.filter((a) => placed[a.from] && placed[a.to]).map((arrow) => routeArrow(arrow, placed[arrow.from], placed[arrow.to], labelBox(arrow.id), labelLines[arrow.id]));

  const result = { width, height, dir: 'ltr', metrics: m, boxes, groups: groupRects, arrows: arrowShapes };
  return options.dir === 'rtl' ? mirror(result) : result;
}

function overlap(a0, a1, b0, b1) {
  return Math.min(a1, b1) - Math.max(a0, b0);
}

function routeArrow(arrow, a, b, lb, lines) {
  const fromOff = arrow.fromOffset || 0;
  const toOff = arrow.toOffset || 0;
  const route = arrow.route || 'auto';
  let points;
  const acx = a.x + a.w / 2;
  const bcx = b.x + b.w / 2;
  const sameRow = overlap(a.y, a.y + a.h, b.y, b.y + b.h) > 8;
  const sameCol = overlap(a.x, a.x + a.w, b.x, b.x + b.w) > 8;
  let labelAt;

  if (route === 'hv' && !sameRow) {
    // Leave from the side, turn once, enter the top or bottom.
    const right = bcx > acx;
    const sx = right ? a.x + a.w : a.x;
    const sy = a.y + a.h / 2 + fromOff * a.h;
    const tx = bcx + toOff * b.w;
    const ty = b.y > a.y ? b.y : b.y + b.h;
    points = [[sx, sy], [tx, sy], [tx, ty]];
    labelAt = [(sx + tx) / 2, sy];
  } else if (sameRow && (route === 'auto' || route === 'h')) {
    const top = Math.max(a.y, b.y);
    const bottom = Math.min(a.y + a.h, b.y + b.h);
    const yy = (top + bottom) / 2 + fromOff * (bottom - top);
    const right = b.x > a.x;
    const sx = right ? a.x + a.w : a.x;
    const tx = right ? b.x : b.x + b.w;
    points = [[sx, yy], [tx, yy]];
    labelAt = [(sx + tx) / 2, yy];
  } else if (sameCol && (route === 'auto' || route === 'v')) {
    const lo = Math.max(a.x, b.x);
    const hi = Math.min(a.x + a.w, b.x + b.w);
    // The line runs at the narrower box's center when one box spans several columns.
    const narrow = a.w <= b.w ? a : b;
    const base = Math.min(Math.max(narrow.x + narrow.w / 2, lo + 12), hi - 12);
    const xx = base + fromOff * narrow.w;
    const down = b.y > a.y;
    const sy = down ? a.y + a.h : a.y;
    const ty = down ? b.y : b.y + b.h;
    points = [[xx, sy], [xx, ty]];
    labelAt = [xx, (sy + ty) / 2];
  } else {
    // Elbow: leave the top or bottom, cross in the gap between the rows, enter the other box.
    const down = b.y > a.y;
    const sx = acx + fromOff * a.w;
    const sy = down ? a.y + a.h : a.y;
    const tx = bcx + toOff * b.w;
    const ty = down ? b.y : b.y + b.h;
    const midY = down ? sy + (arrow.bend ?? 0.5) * (ty - sy) : ty + (arrow.bend ?? 0.5) * (sy - ty);
    points = [[sx, sy], [sx, midY], [tx, midY], [tx, ty]];
    labelAt = [(sx + tx) / 2, midY];
  }

  const label = lines && lines.length ? { lines, x: labelAt[0] - lb.w / 2, y: labelAt[1] - lb.h / 2, w: lb.w, h: lb.h, cx: labelAt[0], cy: labelAt[1] } : null;
  return { id: arrow.id, from: arrow.from, to: arrow.to, dashed: !!arrow.dashed, both: !!arrow.both, points, label };
}

/** Mirror a left-to-right layout for a right-to-left locale. */
export function mirror(layout) {
  const W = layout.width;
  return {
    ...layout,
    dir: 'rtl',
    boxes: layout.boxes.map((b) => ({ ...b, x: W - b.x - b.w })),
    groups: layout.groups.map((g) => ({ ...g, x: W - g.x - g.w, labelX: W - g.labelX, labelAnchor: g.labelAnchor === 'start' ? 'end' : 'start' })),
    arrows: layout.arrows.map((a) => ({
      ...a,
      points: a.points.map(([px, py]) => [W - px, py]),
      label: a.label ? { ...a.label, x: W - a.label.x - a.label.w, cx: W - a.label.cx } : null
    }))
  };
}

/** SVG path data for a polyline with rounded corners. */
export function pathData(points, radius = 6) {
  if (!points.length) return '';
  const fmt = (n) => Math.round(n * 10) / 10;
  let d = `M${fmt(points[0][0])},${fmt(points[0][1])}`;
  for (let i = 1; i < points.length; i += 1) {
    const [x, y] = points[i];
    const next = points[i + 1];
    if (!next) {
      d += ` L${fmt(x)},${fmt(y)}`;
      break;
    }
    const [px, py] = points[i - 1];
    const inLen = Math.hypot(x - px, y - py);
    const outLen = Math.hypot(next[0] - x, next[1] - y);
    const r = Math.min(radius, inLen / 2, outLen / 2);
    if (r <= 0.5) {
      d += ` L${fmt(x)},${fmt(y)}`;
      continue;
    }
    const ax = x - ((x - px) / inLen) * r;
    const ay = y - ((y - py) / inLen) * r;
    const bx = x + ((next[0] - x) / outLen) * r;
    const by = y + ((next[1] - y) / outLen) * r;
    d += ` L${fmt(ax)},${fmt(ay)} Q${fmt(x)},${fmt(y)} ${fmt(bx)},${fmt(by)}`;
  }
  return d;
}
