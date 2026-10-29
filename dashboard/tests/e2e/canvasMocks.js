// A stateful mock of one studio draft for the canvas tests (AD8.2 to AD8.6), on top of installMocks: drf_0001 holds the
// research app on the fake harness (planner fans out to researcher and calls writer one at a time), the writer agent,
// and the writer's dev and staging deployments. Graph operations and item saves change the state, check the version
// like the server (409 DraftVersionConflict), and bump it; the graph, diff, and layout are worked out from the state
// the way StudioService does, so positions survive a reload. `edit(fn)` changes the draft as someone else would.

import { parseDocument, stringify } from 'yaml';
import { respond, studioDraft } from './mocks.js';

const json = (status, body) => ({ status, contentType: 'application/json', body: JSON.stringify(body) });

const APP = [
  'apiVersion: garrison/v1',
  'kind: AgenticApp',
  'metadata:',
  '  name: research',
  '  description: Research overviews on the fake harness',
  'spec:',
  '  entry: planner',
  '  members:',
  '    - agent: planner',
  '    - agent: researcher',
  '    - agent: writer',
  '  edges:',
  '    - from: planner',
  '      to: researcher',
  '      fanOut: true',
  '    - from: planner',
  '      to: writer',
  '      fanOut: false',
  '  authMode: AppUsers',
  ''
].join('\n');

const WRITER = ['apiVersion: garrison/v1', 'kind: Agent', 'metadata:', '  name: writer', 'spec:', '  description: Writes the report', '  capabilities:', '    - pandoc', ''].join('\n');

const deploymentYaml = (name, environment, timeout) =>
  [
    'apiVersion: garrison/v1',
    'kind: Deployment',
    'metadata:',
    `  name: ${name}`,
    'spec:',
    '  agent: writer',
    '  harnessProfile: builtin/fake',
    `  environment: ${environment}`,
    '  model: fake-model',
    `  timeoutSeconds: ${timeout}`,
    '  prompts:',
    '    System: writer-system@2',
    '  parameters:',
    '    format: claude',
    ''
  ].join('\n');

/** Tenant agents the Add agent field offers. */
export const CANVAS_AGENTS = ['planner', 'researcher', 'writer', 'editor', 'reviewer'].map((name, i) => ({
  id: `agt_${name}`,
  tenantId: 'default',
  name,
  displayName: name,
  description: `The ${name}`,
  active: true,
  createdUtc: new Date(Date.now() - (i + 1) * 3600000).toISOString(),
  lastUpdateUtc: new Date(Date.now() - (i + 1) * 3600000).toISOString()
}));

/** A live production deployment of the writer that the draft does not hold. */
export const WRITER_PROD = { id: 'dep_writer_prod', tenantId: 'default', name: 'writer-prod', agentId: 'agt_writer', harnessProfileId: 'hp_0001', model: 'fake-model', environment: 'prod', active: true, createdUtc: new Date().toISOString(), lastUpdateUtc: new Date().toISOString() };

function item(kind, name, document) {
  return { kind, name, operation: 'Upsert', document, lastUpdateUtc: new Date().toISOString() };
}

/** Fresh state of drf_0001 at version 3. */
export function canvasState() {
  const items = [item('AgenticApp', 'research', APP), item('Agent', 'writer', WRITER), item('Deployment', 'writer-dev', deploymentYaml('writer-dev', 'dev', 300)), item('Deployment', 'writer-staging', deploymentYaml('writer-staging', 'staging', 300))];
  return {
    version: 3,
    items,
    layout: [],
    live: new Map(items.map((i) => [`${i.kind}/${i.name}`, i.document])),
    operations: [],
    puts: [],
    exports: []
  };
}

const value = (text) => parseDocument(text || '').toJS() || {};

/** The draft as GET /studio/drafts/drf_0001 answers it. */
export function draftOf(state) {
  return { ...studioDraft(1), version: state.version, items: state.items.map((i) => ({ ...i })), layout: state.layout.map((n) => ({ ...n })) };
}

function below(spec, agent, seen) {
  if (seen.has(agent)) return 0;
  seen.add(agent);
  let best = 0;
  for (const e of spec.edges || []) if (e.from === agent) best = Math.max(best, 1 + below(spec, e.to, new Set(seen)));
  return best;
}

/** GET .../graph, worked out from the items and layout the way StudioService.Graph does. */
export function graphOf(state) {
  const nodes = new Map();
  const node = (kind, name) => {
    const key = `${kind}/${name}`;
    if (!nodes.has(key)) nodes.set(key, { key, kind, name, inDraft: false, deleted: false, entryOf: [], memberOf: [], capabilities: [], x: null, y: null });
    return nodes.get(key);
  };
  const edges = [];
  for (const i of state.items.filter((x) => x.kind === 'Agent' || x.kind === 'AgenticApp')) {
    const n = node(i.kind, i.name);
    n.inDraft = true;
    n.deleted = i.operation === 'Delete';
  }
  for (const i of state.items.filter((x) => x.kind === 'AgenticApp' && x.operation === 'Upsert')) {
    const spec = value(i.document).spec || {};
    for (const m of spec.members || []) {
      const n = node('Agent', m.agent);
      if (!n.memberOf.includes(i.name)) n.memberOf.push(i.name);
      if (m.agent === spec.entry && !n.entryOf.includes(i.name)) n.entryOf.push(i.name);
    }
    for (const e of spec.edges || []) edges.push({ app: i.name, from: e.from, to: e.to, fanOut: e.fanOut ?? true, depth: 1 + below(spec, e.to, new Set()) });
  }
  for (const i of state.items.filter((x) => x.kind === 'Agent' && x.operation === 'Upsert')) {
    const caps = value(i.document).spec?.capabilities;
    if (Array.isArray(caps)) node('Agent', i.name).capabilities = caps.map(String);
  }
  for (const p of state.layout) {
    const n = nodes.get(p.nodeKey);
    if (n) {
      n.x = p.x;
      n.y = p.y;
    }
  }
  const list = [...nodes.values()].sort((a, b) => (a.kind === 'AgenticApp' ? 0 : 1) - (b.kind === 'AgenticApp' ? 0 : 1) || a.name.localeCompare(b.name));
  return { draftId: 'drf_0001', version: state.version, nodes: list, edges };
}

function flat(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, key, out);
    else out[key] = v;
  }
  return out;
}

/** GET .../diff: each item against the live copy, field by field; an input schema whose type is not a string fails. */
export function diffOf(state) {
  return {
    draftId: 'drf_0001',
    version: state.version,
    valid: true,
    items: state.items.map((i) => {
      const key = `${i.kind}/${i.name}`;
      const now = value(i.document);
      if (i.kind === 'Agent' && now.spec?.inputSchema && typeof now.spec.inputSchema.type !== 'string') {
        return { kind: i.kind, name: i.name, change: 'Failed', changes: [], message: 'inputSchema is not a valid JSON Schema: type must be a string or an array.', errorCode: 'InvalidJsonSchema', stale: false };
      }
      if (!state.live.has(key)) return { kind: i.kind, name: i.name, change: 'Create', changes: [], stale: false };
      const before = flat({ description: value(state.live.get(key)).metadata?.description, ...value(state.live.get(key)).spec });
      const after = flat({ description: now.metadata?.description, ...now.spec });
      const changes = [...new Set([...Object.keys(before), ...Object.keys(after)])]
        .filter((f) => JSON.stringify(before[f]) !== JSON.stringify(after[f]))
        .sort()
        .map((field) => ({ field, before: before[field] === undefined ? null : JSON.stringify(before[field]), after: after[field] === undefined ? null : JSON.stringify(after[field]) }));
      return { kind: i.kind, name: i.name, change: changes.length ? 'Update' : 'Unchanged', changes, stale: false };
    })
  };
}

const conflict = (state) => json(409, { error: 'Conflict', code: 'DraftVersionConflict', message: `Draft Research app is at version ${state.version}, not the version you read; read it again and retry.` });
const invalid = (field, code, message) => json(400, { error: 'BadRequest', code: 'ValidationFailed', message, fields: { [field]: message }, fieldCodes: { [field]: code } });

function applyOperation(state, body) {
  if (body.operation === 'MoveNode') {
    state.layout = [...state.layout.filter((n) => n.nodeKey !== body.nodeKey), { nodeKey: body.nodeKey, x: body.x, y: body.y }];
    return null;
  }
  const appName = body.app || 'research';
  const app = state.items.find((i) => i.kind === 'AgenticApp' && i.name === appName);
  const doc = value(app.document);
  const spec = doc.spec || (doc.spec = {});
  spec.members = spec.members || [];
  spec.edges = spec.edges || [];
  const member = (a) => spec.members.some((m) => m.agent === a);
  switch (body.operation) {
    case 'AddMember':
      if (!member(body.agent)) spec.members.push(body.role ? { agent: body.agent, role: body.role } : { agent: body.agent });
      if (!spec.entry) spec.entry = body.agent;
      break;
    case 'RemoveMember':
      if (!member(body.agent)) return invalid('agent', 'NotAMember', `${body.agent} is not a member of app ${appName}.`);
      spec.members = spec.members.filter((m) => m.agent !== body.agent);
      spec.edges = spec.edges.filter((e) => e.from !== body.agent && e.to !== body.agent);
      if (spec.entry === body.agent) spec.entry = spec.members[0]?.agent;
      break;
    case 'Connect': {
      if (!member(body.from)) return invalid('from', 'NotAMember', `${body.from} is not a member of app ${appName}.`);
      if (!member(body.to)) return invalid('to', 'NotAMember', `${body.to} is not a member of app ${appName}.`);
      if (body.from === body.to) return invalid('to', 'SelfEdge', 'A member cannot call itself.');
      const edge = spec.edges.find((e) => e.from === body.from && e.to === body.to);
      if (edge) edge.fanOut = body.fanOut;
      else spec.edges.push(body.fanOut === undefined ? { from: body.from, to: body.to } : { from: body.from, to: body.to, fanOut: body.fanOut });
      break;
    }
    case 'Disconnect': {
      const before = spec.edges.length;
      spec.edges = spec.edges.filter((e) => !(e.from === body.from && e.to === body.to));
      if (spec.edges.length === before) return invalid('to', 'NoSuchEdge', `App ${appName} has no edge from ${body.from} to ${body.to}.`);
      break;
    }
    case 'SetEntry':
      if (!member(body.agent)) return invalid('agent', 'NotAMember', `${body.agent} is not a member of app ${appName}.`);
      spec.entry = body.agent;
      break;
    default:
      return invalid('operation', 'Invalid', 'Unknown operation.');
  }
  app.document = stringify(doc);
  app.lastUpdateUtc = new Date().toISOString();
  return null;
}

/**
 * Route drf_0001's draft, graph, diff, graph operations, and item saves to `state`, the tenant's agents and
 * deployments to the canvas fixtures, and manifest exports to the live documents (plus writer-prod). Answers
 * { state, edit } where edit(fn) changes the draft as another person would (fn gets the state; the version moves).
 */
export async function installCanvasMocks(page, state = canvasState()) {
  await page.route(/\/tenants\/[^/]+\/agents(\?.*)?$/, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    const base = respond('GET', new URL(route.request().url()));
    return route.fulfill(json(200, { ...base, objects: CANVAS_AGENTS, totalRecords: CANVAS_AGENTS.length, recordsRemaining: 0, endOfResults: true }));
  });
  await page.route(/\/tenants\/[^/]+\/deployments(\?.*)?$/, (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    const base = respond('GET', new URL(route.request().url()));
    return route.fulfill(json(200, { ...base, objects: [...base.objects, WRITER_PROD], totalRecords: base.totalRecords + 1 }));
  });
  await page.route(/\/tenants\/[^/]+\/manifests\/export(\?.*)?$/, (route) => {
    const url = new URL(route.request().url());
    const resources = (url.searchParams.get('resources') || '').split(',').filter(Boolean);
    state.exports.push(resources);
    const docs = resources.map((r) => (r === 'Deployment/writer-prod' ? deploymentYaml('writer-prod', 'prod', 900) : state.live.get(r))).filter(Boolean);
    return route.fulfill({ status: 200, contentType: 'application/yaml', body: ['apiVersion: garrison/v1\nkind: Bundle\nmetadata:\n  name: export\nspec: {}\n', ...docs].join('---\n') });
  });
  await page.route(/\/studio\/drafts\/drf_0001(\/(graph|diff|validate|graph-operations|items\/[^/]+\/[^/?]+))?(\?.*)?$/, (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const parts = url.pathname.split('/studio/drafts/drf_0001')[1].split('/').filter(Boolean);
    if (!parts.length) return req.method() === 'GET' ? route.fulfill(json(200, draftOf(state))) : route.fallback();
    if (parts[0] === 'graph') return route.fulfill(json(200, graphOf(state)));
    if (parts[0] === 'diff' || parts[0] === 'validate') return route.fulfill(json(200, diffOf(state)));
    if (parts[0] === 'graph-operations') {
      const body = req.postDataJSON();
      state.operations.push(body);
      if (body.version !== state.version) return route.fulfill(conflict(state));
      const refused = applyOperation(state, body);
      if (refused) return route.fulfill(refused);
      state.version += 1;
      return route.fulfill(json(200, graphOf(state)));
    }
    if (parts[0] === 'items') {
      const kind = decodeURIComponent(parts[1]);
      const name = decodeURIComponent(parts[2]);
      if (req.method() === 'PUT') {
        const body = req.postDataJSON();
        state.puts.push({ kind, name, ...body });
        if (body.version !== state.version) return route.fulfill(conflict(state));
        const doc = value(body.document);
        if (doc.kind !== kind || doc.metadata?.name !== name) return route.fulfill(invalid('document', 'DocumentMismatch', `The document is ${doc.kind}/${doc.metadata?.name}, not ${kind}/${name}.`));
        state.items = [...state.items.filter((i) => !(i.kind === kind && i.name === name)), item(kind, name, body.document)];
        state.version += 1;
        return route.fulfill(json(200, draftOf(state)));
      }
      if (req.method() === 'DELETE') {
        if (Number(url.searchParams.get('version')) !== state.version) return route.fulfill(conflict(state));
        state.items = state.items.filter((i) => !(i.kind === kind && i.name === name));
        state.version += 1;
        return route.fulfill(json(200, draftOf(state)));
      }
    }
    return route.fallback();
  });
  const edit = (fn) => {
    fn(state);
    state.version += 1;
  };
  return { state, edit };
}
