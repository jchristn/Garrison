// Activity trail layout (LP2.2): pure functions that turn a RunTrail (GET .../runs/{id}/trail) into lanes, rows, and
// edges for the sequence view, layers for the graph view, a step order for the keyboard, and the summary strip. No
// React, no DOM: everything here is unit tested against the LP1.5 fixture.
//
// The trail carries no agent-written text (LP-002), so nothing here ever reads a prompt, body, or answer.

/** Node kinds of a trail, as the server sends them (RunTrailNodeKindEnum). */
export const TRAIL_NODE_KINDS = ['Caller', 'Trigger', 'KeeperTick', 'Run', 'Message', 'Report', 'Escalation', 'Approval', 'Effect', 'FanOutGroup', 'PipelineRun', 'Reply', 'Redacted'];

/** Edge kinds of a trail (RunTrailEdgeKindEnum). */
export const TRAIL_EDGE_KINDS = ['Started', 'Spawned', 'FannedOut', 'Retried', 'Sent', 'Woke', 'Filed', 'Raised', 'Routed', 'Answered', 'Requested', 'Decided', 'Performed', 'Replied'];

/** Truncation reasons (RunTrailTruncationEnum). */
export const TRAIL_TRUNCATIONS = ['None', 'NodeCap', 'HopCap', 'SpanCap'];

/** Every node state the trail can carry, across runs, messages, escalations, approvals, effects, and fan-out groups. */
export const TRAIL_STATES = [
  'Pending', 'Queued', 'Leased', 'Running', 'Cancelling', 'Suspended', 'Open', 'Authorized', 'Dispatched',
  'Succeeded', 'Completed', 'Delivered', 'Acknowledged', 'Answered', 'Filed', 'Approved', 'Joined',
  'Failed', 'TimedOut', 'Rejected', 'Denied', 'Expired', 'BudgetExceeded', 'Unknown',
  'Cancelled', 'Withdrawn'
];

const RUNNING = new Set(['Pending', 'Queued', 'Leased', 'Running', 'Cancelling', 'Suspended', 'Open', 'Authorized', 'Dispatched']);
const SUCCESS = new Set(['Succeeded', 'Completed', 'Delivered', 'Acknowledged', 'Answered', 'Filed', 'Approved', 'Joined']);
const DANGER = new Set(['Failed', 'TimedOut', 'Rejected', 'Denied', 'Expired', 'BudgetExceeded', 'Unknown']);

/** The caller lane's ID. */
export const CALLER_LANE = 'caller';

/**
 * Tone of a node state: 'running' (still moving), 'success', 'danger' (failed or refused), 'neutral' (cancelled,
 * withdrawn), or 'none' (no state, as on a caller or a redacted step). The views pair each tone with an icon and the
 * state's label, never color alone.
 */
export function stateTone(state) {
  if (!state) return 'none';
  if (RUNNING.has(state)) return 'running';
  if (SUCCESS.has(state)) return 'success';
  if (DANGER.has(state)) return 'danger';
  return 'neutral';
}

/** True while any node of the trail is still running (LP-011 keeps auto-refresh on until every node is terminal). */
export function isTrailLive(trail) {
  return (trail?.nodes || []).some((n) => stateTone(n.state) === 'running');
}

const time = (value) => {
  const ms = value ? Date.parse(value) : NaN;
  return Number.isFinite(ms) ? ms : null;
};

/** Nodes in time order: start time, then the server's order for ties and for nodes without a time. */
export function orderedNodes(trail) {
  const nodes = (trail?.nodes || []).map((n, index) => ({ n, index, at: time(n.startedUtc) }));
  nodes.sort((a, b) => {
    if (a.at !== null && b.at !== null && a.at !== b.at) return a.at - b.at;
    if (a.at === null && b.at !== null) return 1;
    if (b.at === null && a.at !== null) return -1;
    return a.index - b.index;
  });
  return nodes.map((x) => x.n);
}

/**
 * Lanes, caller first, then one per agent in order of first appearance. A node without a lane falls into the caller
 * lane when it is a caller or reply and into a shared lane named by its kind otherwise (a trigger or keeper tick).
 * Each lane lists the run kinds seen in it, so the header can mark Shadow and Eval runs.
 */
export function buildLanes(trail) {
  const lanes = [];
  const byId = new Map();
  const add = (id, node) => {
    if (!byId.has(id)) {
      const lane = { id, agentId: node?.agentId || null, agentName: node?.agentName || null, unitId: node?.unitId || null, unitName: node?.unitName || null, runKinds: [] };
      byId.set(id, lane);
      lanes.push(lane);
    }
    const lane = byId.get(id);
    if (node) {
      if (!lane.agentName && node.agentName) lane.agentName = node.agentName;
      if (!lane.unitName && node.unitName) {
        lane.unitName = node.unitName;
        lane.unitId = node.unitId || null;
      }
      if (node.runKind && !lane.runKinds.includes(node.runKind)) lane.runKinds.push(node.runKind);
    }
    return lane;
  };
  const nodes = orderedNodes(trail);
  if (nodes.some((n) => laneOf(n) === CALLER_LANE)) add(CALLER_LANE, null);
  for (const n of nodes) add(laneOf(n), n);
  return lanes;
}

/** The lane a node belongs to. */
export function laneOf(node) {
  if (!node) return CALLER_LANE;
  if (node.lane) return node.lane;
  if (node.kind === 'Caller' || node.kind === 'Reply') return CALLER_LANE;
  return node.agentId || `kind:${node.kind}`;
}

/** Default sequence geometry, in SVG units. */
export const SEQUENCE_GEOMETRY = {
  laneWidth: 176,
  headerHeight: 62,
  nodeWidth: 144,
  nodeHeight: 40,
  rowGap: 22,
  gapHeight: 26,
  pad: 12,
  // Idle time longer than this between two rows is drawn as a collapsed gap with its length (one minute).
  collapseMs: 60000
};

/**
 * Rows in time order. Nodes that start at the same moment in different lanes share a row; every other node starts a
 * new one. Rows are evenly spaced, so a long idle stretch does not stretch the drawing: a pause longer than
 * `collapseMs` between two rows is marked on the later row as `gapMs` and drawn as a short break with its length.
 */
export function buildRows(trail, collapseMs = SEQUENCE_GEOMETRY.collapseMs) {
  const rows = [];
  let last = null;
  for (const n of orderedNodes(trail)) {
    const at = time(n.startedUtc);
    const lane = laneOf(n);
    const current = rows[rows.length - 1];
    if (current && at !== null && current.at === at && !current.lanes.has(lane)) {
      current.ids.push(n.id);
      current.lanes.add(lane);
      continue;
    }
    const gapMs = last !== null && at !== null && at - last > collapseMs ? at - last : 0;
    rows.push({ index: rows.length, at, ids: [n.id], lanes: new Set([lane]), gapMs });
    if (at !== null) last = at;
  }
  return rows.map((r) => ({ index: r.index, at: r.at, ids: r.ids, gapMs: r.gapMs }));
}

/**
 * Full sequence layout: lanes with their x, nodes with x and y (top-left of the box), edges with a path and a label
 * point, collapsed gaps, and the drawing size. `rtl` mirrors the lanes so the caller lane sits on the right.
 * Edges to an earlier row (an answer coming back, a loop between two agents) are marked `back`; edges within one
 * lane bow out to the lane's inline-end side.
 */
export function layoutSequence(trail, { rtl = false, geometry = {} } = {}) {
  const g = { ...SEQUENCE_GEOMETRY, ...geometry };
  const lanes = buildLanes(trail);
  const rows = buildRows(trail, g.collapseMs);
  const width = g.pad * 2 + Math.max(1, lanes.length) * g.laneWidth;
  const laneIndex = new Map(lanes.map((l, i) => [l.id, i]));
  const laneX = (i) => (rtl ? width - g.pad - (i + 1) * g.laneWidth : g.pad + i * g.laneWidth);
  const placedLanes = lanes.map((l, i) => ({ ...l, index: i, x: laneX(i), center: laneX(i) + g.laneWidth / 2 }));

  const rowOf = new Map();
  const gaps = [];
  let y = g.headerHeight + g.pad;
  const rowY = [];
  for (const r of rows) {
    if (r.gapMs > 0) {
      gaps.push({ y: y - g.rowGap / 2 + g.gapHeight / 2, ms: r.gapMs, row: r.index });
      y += g.gapHeight;
    }
    rowY.push(y);
    for (const id of r.ids) rowOf.set(id, r.index);
    y += g.nodeHeight + g.rowGap;
  }
  const height = y + g.pad;

  const nodes = (trail?.nodes || []).map((n) => {
    const li = laneIndex.get(laneOf(n)) ?? 0;
    const row = rowOf.get(n.id) ?? 0;
    const lane = placedLanes[li];
    return { ...n, laneIndex: li, row, x: lane.center - g.nodeWidth / 2, y: rowY[row] ?? 0, width: g.nodeWidth, height: g.nodeHeight };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const edges = (trail?.edges || [])
    .map((e, i) => {
      const a = byId.get(e.fromId);
      const b = byId.get(e.toId);
      if (!a || !b) return null;
      return { ...e, key: `${e.fromId}>${e.toId}>${e.kind}>${i}`, ...edgeGeometry(a, b, rtl, g) };
    })
    .filter(Boolean);

  return { lanes: placedLanes, rows, nodes, edges, gaps, width, height, geometry: g, rtl };
}

function edgeGeometry(a, b, rtl, g) {
  const back = b.row < a.row;
  const ay = a.y + a.height / 2;
  const by = b.y + b.height / 2;
  if (a.laneIndex === b.laneIndex) {
    // Same lane: bow out past the boxes on the inline-end side (right in LTR, left in RTL).
    const side = rtl ? -1 : 1;
    const x1 = rtl ? a.x : a.x + a.width;
    const x2 = rtl ? b.x : b.x + b.width;
    const bow = x1 + side * Math.min(28, (g.laneWidth - g.nodeWidth) / 2 + 6);
    return { back, same: true, path: `M ${x1} ${ay} C ${bow} ${ay}, ${bow} ${by}, ${x2 + side * 2} ${by}`, labelX: bow + side * 2, labelY: (ay + by) / 2, anchor: rtl ? 'end' : 'start' };
  }
  const toRight = b.x > a.x;
  const x1 = toRight ? a.x + a.width : a.x;
  const x2 = toRight ? b.x - 2 : b.x + b.width + 2;
  const mid = (x1 + x2) / 2;
  return { back, same: false, path: `M ${x1} ${ay} C ${mid} ${ay}, ${mid} ${by}, ${x2} ${by}`, labelX: mid, labelY: (ay + by) / 2 - 4, anchor: 'middle' };
}

/**
 * Keyboard order of the steps: by row (time), then by lane in reading order. Arrow keys walk this list (LP2.3);
 * `stepNeighbor` resolves a key to the next step.
 */
export function stepOrder(layout) {
  return [...(layout?.nodes || [])].sort((a, b) => a.row - b.row || a.laneIndex - b.laneIndex).map((n) => n.id);
}

/**
 * The step an arrow key moves to from `currentId`. Down goes to the next step in time and Up to the previous one.
 * Right and Left move to the nearest step in the neighbouring lane, mirrored in right-to-left layouts (Left moves
 * toward the inline end). Home and End jump to the first and last step. Returns `currentId` when there is nowhere to go.
 */
export function stepNeighbor(layout, currentId, key, rtl = !!layout?.rtl) {
  const order = stepOrder(layout);
  if (!order.length) return null;
  const i = order.indexOf(currentId);
  if (i < 0) return order[0];
  if (key === 'Home') return order[0];
  if (key === 'End') return order[order.length - 1];
  if (key === 'ArrowDown') return order[Math.min(order.length - 1, i + 1)];
  if (key === 'ArrowUp') return order[Math.max(0, i - 1)];
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return currentId;
  const forward = (key === 'ArrowRight') !== rtl;
  const nodes = layout.nodes;
  const current = nodes.find((n) => n.id === currentId);
  const laneCount = layout.lanes.length;
  for (let step = 1; step < laneCount; step += 1) {
    const lane = current.laneIndex + (forward ? step : -step);
    if (lane < 0 || lane >= laneCount) break;
    const inLane = nodes.filter((n) => n.laneIndex === lane);
    if (!inLane.length) continue;
    inLane.sort((a, b) => Math.abs(a.row - current.row) - Math.abs(b.row - current.row) || a.row - b.row);
    return inLane[0].id;
  }
  return currentId;
}

/**
 * Graph layers (LP2.4): a breadth-first walk from the origin along forward edges (an edge back to a node already
 * placed, such as an answer or a loop, does not move it), so each node sits one layer after what caused it. Nodes
 * nothing reaches go after the last layer. Within a layer, nodes keep time order. Returns [{ id, layer, slot }].
 */
export function graphLayers(trail) {
  const nodes = orderedNodes(trail);
  const ids = new Set(nodes.map((n) => n.id));
  const out = new Map();
  for (const e of trail?.edges || []) {
    if (!ids.has(e.fromId) || !ids.has(e.toId)) continue;
    if (!out.has(e.fromId)) out.set(e.fromId, []);
    out.get(e.fromId).push(e.toId);
  }
  const layer = new Map();
  const origin = ids.has(trail?.originId) ? trail.originId : nodes[0]?.id;
  if (origin) {
    layer.set(origin, 0);
    const queue = [origin];
    while (queue.length) {
      const id = queue.shift();
      for (const next of out.get(id) || []) {
        if (layer.has(next)) continue;
        layer.set(next, layer.get(id) + 1);
        queue.push(next);
      }
    }
  }
  const deepest = Math.max(0, ...layer.values());
  for (const n of nodes) if (!layer.has(n.id)) layer.set(n.id, deepest + 1);
  const slots = new Map();
  return nodes.map((n) => {
    const l = layer.get(n.id);
    const slot = slots.get(l) || 0;
    slots.set(l, slot + 1);
    return { id: n.id, layer: l, slot };
  });
}

/**
 * Summary strip (LP2.7): distinct agents, message hops, the span from the first start to the last end, input and
 * output tokens and cost summed over runs, and the number of failed or refused steps.
 */
export function trailSummary(trail) {
  const nodes = trail?.nodes || [];
  const agents = new Set(nodes.filter((n) => n.agentId).map((n) => n.agentId));
  const starts = nodes.map((n) => time(n.startedUtc)).filter((v) => v !== null);
  const ends = nodes.map((n) => time(n.endedUtc) ?? time(n.startedUtc)).filter((v) => v !== null);
  const runs = nodes.filter((n) => n.kind === 'Run');
  const sum = (key) => runs.reduce((acc, n) => acc + (Number(n[key]) || 0), 0);
  const costs = runs.filter((n) => n.costUsd !== null && n.costUsd !== undefined);
  return {
    agents: agents.size,
    runs: runs.length,
    hops: trail?.hopCount ?? nodes.filter((n) => n.kind === 'Message').length,
    steps: trail?.nodeCount ?? nodes.length,
    durationMs: starts.length && ends.length ? Math.max(0, Math.max(...ends) - Math.min(...starts)) : null,
    inputTokens: sum('inputTokens'),
    outputTokens: sum('outputTokens'),
    costUsd: costs.length ? costs.reduce((acc, n) => acc + Number(n.costUsd), 0) : null,
    failures: nodes.filter((n) => stateTone(n.state) === 'danger').length
  };
}

/** True when the trail is a single run with nothing before or after it but the caller and the reply. */
export function isSingleRunTrail(trail) {
  const nodes = trail?.nodes || [];
  return nodes.filter((n) => !['Caller', 'Reply', 'Trigger', 'KeeperTick'].includes(n.kind)).length <= 1;
}

/**
 * The run a step belongs to: itself for a run, otherwise the run that caused it (the source of an edge into it that
 * is a run), or for a reply the run that replied. Used by the drawer's provenance line and by effect lookups.
 */
export function owningRunId(trail, nodeId) {
  const nodes = new Map((trail?.nodes || []).map((n) => [n.id, n]));
  const node = nodes.get(nodeId);
  if (!node) return null;
  if (node.kind === 'Run') return node.id;
  const into = (trail?.edges || []).filter((e) => e.toId === nodeId && nodes.get(e.fromId)?.kind === 'Run');
  return into[0]?.fromId || null;
}

/** The run a step woke or started, when one edge leads from it to a run (a message's Woke edge). */
export function resultingRunId(trail, nodeId) {
  const nodes = new Map((trail?.nodes || []).map((n) => [n.id, n]));
  const edge = (trail?.edges || []).find((e) => e.fromId === nodeId && nodes.get(e.toId)?.kind === 'Run');
  return edge?.toId || null;
}

/** Filter the list view's rows by kind, agent (lane), and state tone or state; '' means any. */
export function filterTrailNodes(nodes, { kind = '', agent = '', state = '' } = {}) {
  return (nodes || []).filter((n) => (!kind || n.kind === kind) && (!agent || laneOf(n) === agent) && (!state || n.state === state));
}
