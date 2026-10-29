// Studio canvas (AD8.2 to AD8.6): helpers that turn the draft graph (GET .../graph) into what the canvas draws, build
// graph operations, describe the graph in words for screen readers, and find the deployments of an agent. Plain
// functions (no JSX, no React Flow) so Node-based tests can import them.

import { layoutAppGraph } from './apps';
import { draftItems, graphApps } from './studio';
import { manifestValue, readDeploymentFields } from './manifestYaml';

/** Graph operations of POST .../graph-operations. */
export const GRAPH_OPERATIONS = ['AddMember', 'RemoveMember', 'Connect', 'Disconnect', 'SetEntry', 'MoveNode'];

/** How long (ms) the canvas waits after the last drag or arrow-key move of a node before it saves the position. */
export const MOVE_DEBOUNCE_MS = 400;

/** Spacing of the starting layout for nodes the draft has no saved position for. */
export const LAYOUT = { columnWidth: 240, rowHeight: 120, x: 24, y: 24 };

/** Environments in promotion order; others follow alphabetically. */
export const ENVIRONMENT_ORDER = ['dev', 'staging', 'prod'];

/** The id of a call on the canvas: `from>to`. */
export function edgeId(from, to) {
  return `${from}>${to}`;
}

/** The caller and callee of a canvas edge id. */
export function parseEdgeId(id) {
  const at = String(id || '').indexOf('>');
  return at < 0 ? { from: '', to: '' } : { from: id.slice(0, at), to: id.slice(at + 1) };
}

/** Graph node key of an agent or app. */
export function nodeKey(kind, name) {
  return `${kind}/${name}`;
}

/** The apps the canvas can show: app nodes and apps named by edges, plus the draft's target app, in that order, unique. */
export function canvasApps(graph, draft) {
  const names = graphApps(graph).apps.map((a) => a.name);
  if (draft?.targetApp && !names.includes(draft.targetApp)) names.push(draft.targetApp);
  return names;
}

/** The app the canvas opens on: the remembered one when it still exists, else the target app, else the first. */
export function defaultCanvasApp(graph, draft, remembered) {
  const apps = canvasApps(graph, draft);
  if (remembered && apps.includes(remembered)) return remembered;
  if (draft?.targetApp && apps.includes(draft.targetApp)) return draft.targetApp;
  return apps[0] || '';
}

/**
 * The selected app as canvas nodes and edges. Nodes are the app's members in reading order (the entry agent first,
 * then by call depth), placed at their saved position or on a starting grid by call depth. Edges carry the fan-out
 * flag and delegation depth. `loose` lists agents of the draft that are in no app.
 */
export function graphToFlow(graph, app) {
  const { apps, loose } = graphApps(graph);
  const shape = apps.find((a) => a.name === app) || { name: app, entryAgentId: '', members: [], edges: [] };
  const byName = new Map((graph?.nodes || []).filter((n) => n.kind === 'Agent').map((n) => [n.name, n]));
  const layout = layoutAppGraph(shape);
  const order = [...layout.nodes].sort((a, b) => a.layer - b.layer || a.row - b.row);
  const nodes = order.map((placed) => {
    const n = byName.get(placed.id) || { name: placed.id, key: nodeKey('Agent', placed.id), capabilities: [] };
    const saved = Number.isFinite(n.x) && Number.isFinite(n.y);
    return {
      id: placed.id,
      key: n.key || nodeKey('Agent', placed.id),
      name: placed.id,
      position: saved ? { x: n.x, y: n.y } : { x: LAYOUT.x + placed.layer * LAYOUT.columnWidth, y: LAYOUT.y + placed.row * LAYOUT.rowHeight },
      saved,
      entry: shape.entryAgentId === placed.id,
      unreachable: placed.unreachable,
      inDraft: !!n.inDraft,
      deleted: !!n.deleted,
      capabilities: Array.isArray(n.capabilities) ? n.capabilities : []
    };
  });
  const rank = new Map(nodes.map((n, i) => [n.id, i]));
  const edges = shape.edges
    .map((e) => ({ id: edgeId(e.callerAgentId, e.calleeAgentId), from: e.callerAgentId, to: e.calleeAgentId, fanOut: e.fanOutAllowed !== false, depth: e.depth ?? 1 }))
    .sort((a, b) => (rank.get(a.from) ?? 0) - (rank.get(b.from) ?? 0) || (rank.get(a.to) ?? 0) - (rank.get(b.to) ?? 0));
  return { app: shape.name, entry: shape.entryAgentId, deletedApp: !!shape.deleted, inDraft: !!shape.inDraft, nodes, edges, loose: loose.map((n) => n.name) };
}

/** Saved positions of a graph by node key (to tell whether a move reached the server). */
export function savedPositions(graph) {
  const out = new Map();
  for (const n of graph?.nodes || []) if (Number.isFinite(n.x) && Number.isFinite(n.y)) out.set(n.key, { x: n.x, y: n.y });
  return out;
}

/** Positions are compared on whole pixels: React Flow and the server may round differently. */
export function samePosition(a, b) {
  return !!a && !!b && Math.round(a.x) === Math.round(b.x) && Math.round(a.y) === Math.round(b.y);
}

/** Body of POST .../graph-operations: the version read, the operation, and only the fields it uses. */
export function operationBody(version, operation, fields = {}) {
  const body = { version, operation };
  for (const key of ['app', 'agent', 'role', 'from', 'to', 'fanOut', 'nodeKey', 'x', 'y']) {
    if (fields[key] !== undefined && fields[key] !== null && fields[key] !== '') body[key] = fields[key];
  }
  if (operation === 'MoveNode') {
    body.x = Math.round(Number(fields.x) || 0);
    body.y = Math.round(Number(fields.y) || 0);
  }
  return body;
}

/**
 * Agents that can join the app: tenant agents, Agent items of the draft, and agents of the graph, minus the app's
 * members, unique and sorted. Items the draft deletes are left out.
 */
export function agentChoices(agents, graph, draft, app) {
  const members = new Set(graphToFlow(graph, app).nodes.map((n) => n.id));
  const names = new Set();
  for (const a of agents || []) if (a?.name && a.name !== 'agent-architect') names.add(a.name);
  for (const i of draftItems(draft)) if (i.kind === 'Agent' && i.operation !== 'Delete') names.add(i.name);
  for (const n of graph?.nodes || []) if (n.kind === 'Agent' && !n.deleted) names.add(n.name);
  return [...names].filter((n) => !members.has(n)).sort();
}

/**
 * The graph in words for screen readers, built with `t`: sentences with the counts and the entry agent, then one
 * per call ("planner calls writer, one call at a time, delegation depth 1."). Answers { overview, calls[] }.
 */
export function graphSummary(t, flow) {
  if (!flow.app) return { overview: t('components.studio.canvas.summary.noApp'), calls: [] };
  const agents = t('components.studio.canvas.summary.agents', { app: flow.app, count: flow.nodes.length });
  const links = t('components.studio.canvas.summary.callCount', { count: flow.edges.length });
  const entry = flow.entry ? t('components.studio.canvas.summary.entry', { name: flow.entry }) : flow.nodes.length ? t('components.studio.canvas.summary.noEntry') : '';
  const calls = flow.edges.map((e) => edgeSentence(t, e));
  return { overview: [agents, links, entry].filter(Boolean).join(' '), calls };
}

/** One call in words. */
export function edgeSentence(t, edge) {
  return t(edge.fanOut ? 'components.studio.canvas.summary.callParallel' : 'components.studio.canvas.summary.callSingle', { from: edge.from, to: edge.to, depth: edge.depth });
}

/** The accessible name of an agent node: its name, entry marker, draft state, and capabilities. */
export function nodeLabel(t, node) {
  const parts = [node.name];
  if (node.entry) parts.push(t('components.studio.canvas.node.entry'));
  if (node.deleted) parts.push(t('components.studio.graph.deleted'));
  else if (node.inDraft) parts.push(t('components.studio.graph.inDraft'));
  if (node.unreachable) parts.push(t('components.studio.canvas.node.unreachable'));
  if (node.capabilities.length) parts.push(t('components.studio.graph.capabilities', { list: node.capabilities.join(', ') }));
  return parts.join(', ');
}

function environmentRank(environment) {
  const i = ENVIRONMENT_ORDER.indexOf(environment);
  return i < 0 ? ENVIRONMENT_ORDER.length : i;
}

function byEnvironment(a, b) {
  return environmentRank(a) - environmentRank(b) || a.localeCompare(b);
}

/** Sort environments in promotion order (dev, staging, prod), then the rest alphabetically, unique. */
export function sortEnvironments(list) {
  return [...new Set(list)].sort(byEnvironment);
}

/** Deployment items of the draft that belong to an agent (spec.agent), with their runtime fields, by environment then name. */
export function draftDeployments(draft, agent) {
  return draftItems(draft)
    .filter((i) => i.kind === 'Deployment' && i.operation !== 'Delete')
    .map((item) => ({ item, fields: readDeploymentFields(item.document) }))
    .filter((d) => d.fields.agent === agent)
    .sort((a, b) => byEnvironment(a.fields.environment, b.fields.environment) || a.item.name.localeCompare(b.item.name));
}

/**
 * Live deployments of an agent the draft does not hold yet (by name), from the tenant's deployment and agent lists,
 * sorted by environment then name. Playground copies (environment draft) are left out.
 */
export function liveDeployments(deployments, agents, agent, draft) {
  const ids = new Set((agents || []).filter((a) => a?.name === agent).map((a) => a.id));
  const held = new Set(draftItems(draft).filter((i) => i.kind === 'Deployment').map((i) => i.name));
  return (deployments || [])
    .filter((d) => ids.has(d.agentId) && !held.has(d.name) && d.environment !== 'draft')
    .sort((a, b) => byEnvironment(a.environment || 'dev', b.environment || 'dev') || a.name.localeCompare(b.name));
}

/** The draft item of a kind and name, or null. */
export function findItem(draft, kind, name) {
  return draftItems(draft).find((i) => i.kind === kind && i.name === name) || null;
}

/** The Agent item's document value, or null when the draft does not hold the agent. */
export function agentValue(draft, name) {
  const item = findItem(draft, 'Agent', name);
  return item && item.operation !== 'Delete' ? manifestValue(item.document) : null;
}

/** The translated message of a server field error: the field code's text when known, else the server's message. */
export function fieldError(t, error, field) {
  if (!error || !field) return '';
  const message = error.fields?.[field];
  const code = error.fieldCodes?.[field];
  if (!message && !code) return '';
  if (code) {
    const key = `common.fieldCodes.${code}`;
    const known = t(key, { defaultValue: '' });
    if (known && known !== key) return known;
  }
  return message || code;
}

/** Fields of a server error that a panel does not show next to a control, as `field: message` lines. */
export function otherFieldErrors(t, error, shown) {
  const keys = Object.keys(error?.fields || error?.fieldCodes || {});
  return keys.filter((k) => !shown.includes(k)).map((k) => `${k}: ${fieldError(t, error, k)}`);
}
