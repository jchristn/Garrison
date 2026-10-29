// Agent studio (AD7.10, AD7.16, AD9.2, AD9.3): helpers shared by the Studio tab, the draft workspace, its panels, and
// their tests. Plain functions (no JSX) so Node-based tests can import them.

import { holds } from './apps';
import { enumLabel } from './enums';

/** Draft statuses, in the order the list's status chips show them. */
export const DRAFT_STATUSES = ['Open', 'PendingApproval', 'Applied', 'Discarded'];

/** Item operations: Upsert creates or updates the resource, Delete deletes it on apply. */
export const DRAFT_OPERATIONS = ['Upsert', 'Delete'];

/** What applying an item would do, from GET .../diff. */
export const DIFF_CHANGES = ['Create', 'Update', 'Delete', 'Unchanged', 'Failed'];

/** Manifest kinds a draft can hold (docs/STUDIO.md). */
export const DRAFT_KINDS = ['PromptTemplate', 'HarnessProfile', 'McpServer', 'WorkspaceTemplate', 'AgentAsset', 'Agent', 'Deployment', 'Pipeline', 'AgenticApp', 'Trigger', 'NotificationEndpoint'];

/** Kinds a draft can delete on apply. */
export const DELETABLE_KINDS = ['Agent', 'Deployment', 'Pipeline', 'AgenticApp'];

/** The protected agent every tenant has; its deployments are architects. */
export const ARCHITECT_AGENT = 'agent-architect';

/** The architect prompt a new architect deployment binds when nothing else is chosen. */
export const DEFAULT_ARCHITECT_PROMPT = 'builtin/agent-architect';

/** How often (ms) the workspace refreshes the draft while its live channel is not subscribed. */
export const STUDIO_POLL_MS = 5000;

/** How often (ms) a chat or playground turn is checked while it runs. */
export const TURN_POLL_MS = 2000;

/** Item names follow manifest names: lowercase letters, digits, and hyphens (and dots and slashes for templates). */
export const ITEM_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/;

/** WebSocket channel that pushes studio-draft.changed for one draft. */
export function studioDraftChannel(draftId) {
  return `studio-draft:${draftId}`;
}

/** True when a WebSocket message is a studio-draft.changed for this draft. */
export function isStudioDraftChanged(message, draftId) {
  return message?.type === 'studio-draft.changed' && !!draftId && message.draftId === draftId;
}

/** Badge tone for a draft status. Every badge also carries the translated status, so tone is never the only signal. */
export function draftStatusTone(status) {
  switch (status) {
    case 'Open':
      return 'info';
    case 'PendingApproval':
      return 'warning';
    case 'Applied':
      return 'success';
    default:
      return 'neutral';
  }
}

/** Badge tone for a diff change. */
export function diffChangeTone(change) {
  switch (change) {
    case 'Create':
      return 'success';
    case 'Update':
      return 'info';
    case 'Delete':
      return 'warning';
    case 'Failed':
      return 'danger';
    default:
      return 'neutral';
  }
}

/** Items of a draft (or [] for none), as the server sends them. */
export function draftItems(draft) {
  return Array.isArray(draft?.items) ? draft.items : [];
}

/** The key of an item: kind and name. */
export function itemKey(item) {
  return `${item?.kind || ''}/${item?.name || ''}`;
}

/**
 * Drafts the list shows: the server answers the page (search and mine are sent to it); status chips filter in the
 * browser because the server has no status filter. An empty status set shows every status.
 */
export function filterDrafts(drafts, statuses) {
  const list = Array.isArray(drafts) ? drafts : [];
  const chosen = statuses instanceof Set ? statuses : new Set(statuses || []);
  if (!chosen.size) return list;
  return list.filter((d) => chosen.has(d.status || 'Open'));
}

/** Whether a draft can still change: only Open drafts take item edits, graph operations, and request-apply. */
export function isDraftOpen(draft) {
  return (draft?.status || 'Open') === 'Open';
}

/**
 * What changed between two reads of a draft, item by item: { added, updated, removed } (item keys, sorted), plus the
 * version and status before and after. Used to name what moved under a person whose save failed with 409
 * DraftVersionConflict.
 */
export function draftChanges(before, after) {
  const was = new Map(draftItems(before).map((i) => [itemKey(i), i]));
  const now = new Map(draftItems(after).map((i) => [itemKey(i), i]));
  const added = [];
  const updated = [];
  const removed = [];
  for (const [key, item] of now) {
    const old = was.get(key);
    if (!old) added.push(key);
    else if (old.document !== item.document || old.operation !== item.operation) updated.push(key);
  }
  for (const key of was.keys()) if (!now.has(key)) removed.push(key);
  return {
    added: added.sort(),
    updated: updated.sort(),
    removed: removed.sort(),
    fromVersion: before?.version ?? null,
    toVersion: after?.version ?? null,
    statusChanged: (before?.status || 'Open') !== (after?.status || 'Open'),
    status: after?.status || 'Open'
  };
}

/** True when draftChanges found nothing beyond the version number. */
export function noItemChanges(changes) {
  return !changes || (!changes.added.length && !changes.updated.length && !changes.removed.length);
}

/** The text a person wrote, without the draft prefix that architect messages from earlier dashboard builds carried. */
export function stripDraftPrefix(text) {
  return String(text || '').replace(/^\[Studio draft [^\]\n]*\]\n\n/, '');
}

/** Deployments that may work on drafts: managementAccess Drafts (every deployment of agent-architect has it). */
export function architectDeployments(deployments) {
  return (deployments || []).filter((d) => d?.managementAccess === 'Drafts');
}

/** The agent-architect agent from a list of agents, by exact name; null when the tenant has none. */
export function findArchitectAgent(agents) {
  return (agents || []).find((a) => a?.name === ARCHITECT_AGENT) || null;
}

/**
 * Architect prompts in the order to offer them: built-ins first (the default leading), then the rest in the order the
 * server sent them (tenant clones of built-ins, then other System templates).
 */
export function sortArchitectPrompts(entries) {
  const list = Array.isArray(entries) ? entries : [];
  const builtIns = list.filter((e) => e.isBuiltIn).sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault));
  return [...builtIns, ...list.filter((e) => !e.isBuiltIn)];
}

/** The prompt a new architect binds by default: the entry marked default, else builtin/agent-architect by name. */
export function defaultArchitectPrompt(entries) {
  const list = Array.isArray(entries) ? entries : [];
  return list.find((e) => e.isDefault) || list.find((e) => e.name === DEFAULT_ARCHITECT_PROMPT) || list[0] || null;
}

/**
 * The deployments a 409 PromptTemplateInUse names: "... is bound by deployment(s) dep_1 (architect), dep_2 (x). ..."
 * gives ['architect', 'x'] (the name, or the ID when no name is given). [] when the message names none.
 */
export function inUseDeployments(message) {
  const m = /bound by deployment\(s\) (.+?)\.(?:\s|$)/.exec(String(message || ''));
  if (!m) return [];
  return m[1]
    .split(/,\s*/)
    .map((part) => {
      const named = /^(\S+) \((.+)\)$/.exec(part.trim());
      return named ? named[2] : part.trim();
    })
    .filter(Boolean);
}

/** Counts of what the diff would do: { Create, Update, Delete, Unchanged, Failed, stale }. */
export function diffCounts(diff) {
  const counts = { Create: 0, Update: 0, Delete: 0, Unchanged: 0, Failed: 0, stale: 0 };
  for (const item of diff?.items || []) {
    if (counts[item.change] !== undefined) counts[item.change] += 1;
    if (item.stale) counts.stale += 1;
  }
  return counts;
}

/** Stale flags by item key, from a diff. */
export function staleKeys(diff) {
  return new Set((diff?.items || []).filter((i) => i.stale).map(itemKey));
}

/** A starting document for a new item: the manifest header with the kind and name filled in. */
export function itemTemplate(kind, name) {
  return `apiVersion: garrison/v1\nkind: ${kind || 'Agent'}\nmetadata:\n  name: ${name || ''}\nspec: {}\n`;
}

/** Client-side checks for a new item: { field: message } (empty when valid). */
export function newItemErrors(form, items, t) {
  const e = {};
  if (!form.kind || !DRAFT_KINDS.includes(form.kind)) e.kind = t('common.errors.required');
  const name = String(form.name || '').trim();
  if (!name) e.name = t('common.errors.required');
  else if (!ITEM_NAME_PATTERN.test(name)) e.name = t('components.studio.items.errors.name');
  else if ((items || []).some((i) => i.kind === form.kind && i.name === name)) e.name = t('components.studio.items.errors.exists', { kind: form.kind, name });
  if (form.operation === 'Delete' && !DELETABLE_KINDS.includes(form.kind)) e.operation = t('components.studio.items.errors.deleteKind', { kind: form.kind });
  return e;
}

/**
 * The agents a playground turn can target: every agent node of the graph and every Agent item the draft upserts,
 * unique, sorted. The empty choice means the server's default (the target app's entry agent).
 */
export function playgroundAgents(draft, graph) {
  const names = new Set();
  for (const n of graph?.nodes || []) if (n.kind === 'Agent' && !n.deleted) names.add(n.name);
  for (const i of draftItems(draft)) if (i.kind === 'Agent' && i.operation !== 'Delete') names.add(i.name);
  return [...names].sort();
}

/** The entry agent of the draft's target app (or of the first app), or null. */
export function entryAgent(draft, graph) {
  const nodes = (graph?.nodes || []).filter((n) => n.kind === 'Agent');
  const app = draft?.targetApp;
  const entry = (app && nodes.find((n) => (n.entryOf || []).includes(app))) || nodes.find((n) => (n.entryOf || []).length);
  return entry ? entry.name : null;
}

/**
 * The draft graph as app shapes the app graph component draws: one per app node, with members by name, the entry, and
 * the calls with their fan-out flag and depth. `loose` lists the agents that belong to no app.
 */
export function graphApps(graph) {
  const nodes = graph?.nodes || [];
  const apps = nodes.filter((n) => n.kind === 'AgenticApp').map((n) => n.name);
  for (const e of graph?.edges || []) if (e.app && !apps.includes(e.app)) apps.push(e.app);
  const agents = nodes.filter((n) => n.kind === 'Agent');
  const shaped = apps.map((app) => {
    const members = agents.filter((n) => (n.memberOf || []).includes(app)).map((n) => n.name);
    for (const e of graph?.edges || []) {
      if (e.app !== app) continue;
      if (!members.includes(e.from)) members.push(e.from);
      if (!members.includes(e.to)) members.push(e.to);
    }
    const entry = agents.find((n) => (n.entryOf || []).includes(app));
    const node = nodes.find((n) => n.kind === 'AgenticApp' && n.name === app);
    return {
      name: app,
      deleted: !!node?.deleted,
      inDraft: !!node?.inDraft,
      entryAgentId: entry ? entry.name : '',
      members: members.map((agentId) => ({ agentId })),
      edges: (graph?.edges || []).filter((e) => e.app === app).map((e) => ({ callerAgentId: e.from, calleeAgentId: e.to, fanOutAllowed: e.fanOut !== false, depth: e.depth ?? 1 }))
    };
  });
  const inApps = new Set(shaped.flatMap((a) => a.members.map((m) => m.agentId)));
  const loose = agents.filter((n) => !inApps.has(n.name));
  return { apps: shaped, loose };
}

/** Agent nodes by name, for capabilities and draft flags in the graph. */
export function agentNodes(graph) {
  return new Map((graph?.nodes || []).filter((n) => n.kind === 'Agent').map((n) => [n.name, n]));
}

/** The graph a studio-draft.changed message carries, when it is for this draft. */
export function graphFromMessage(message) {
  return message?.graph && Array.isArray(message.graph.nodes) ? message.graph : null;
}

/**
 * A playground conversation as Markdown for download: a heading with the draft, then each turn's input and answer
 * (or its status when it has none), with the run ID. Labels come from the caller so the file is in the person's
 * language.
 */
export function playgroundMarkdown(draft, turns, labels) {
  const l = labels || {};
  const lines = [`# ${l.title || 'Playground'}: ${draft?.title || draft?.id || ''}`, ''];
  if (draft?.id) lines.push(`${l.draft || 'Draft'}: ${draft.id}`, '');
  (turns || []).forEach((turn, i) => {
    lines.push(`## ${l.turn || 'Turn'} ${i + 1}${turn.agent ? ` (${turn.agent})` : ''}`, '');
    lines.push(`**${l.input || 'Input'}**`, '', String(turn.input || ''), '');
    lines.push(`**${l.answer || 'Answer'}**`, '', String(turn.answer || turn.error || turn.status || ''), '');
    if (turn.runId) lines.push(`${l.run || 'Run'}: ${turn.runId}`, '');
  });
  return `${lines.join('\n').trimEnd()}\n`;
}

/** Save text as a Markdown file through a temporary link (the browser's download). */
export function downloadMarkdown(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** File name for a playground transcript: playground-{draftId}.md. */
export function playgroundFileName(draft) {
  return `playground-${String(draft?.id || 'draft').replace(/[^A-Za-z0-9_-]+/g, '-')}.md`;
}

/**
 * What a compile preview places before launch: the command line (the server's display string, else built from the
 * spec), asset files with their target paths, and the file space mount, or null when there is none.
 */
export function compilePreviewSummary(response) {
  const spec = response?.spec || null;
  const commandLine = response?.commandLine || (spec ? [spec.executable, ...(spec.arguments || [])].filter(Boolean).map((a) => (/\s/.test(a) ? JSON.stringify(a) : a)).join(' ') : '');
  const assets = (spec?.assetFiles || []).map((a) => ({ path: a.path, assetName: a.assetName, kind: a.kind, version: a.version, sizeBytes: a.sizeBytes ?? 0 }));
  const fs = spec?.fileSpace || null;
  const fileSpace = fs ? { mountPath: fs.mountPath || 'files', fileSpaceId: fs.fileSpaceId || null, maxFiles: fs.maxFiles ?? null, maxFileBytes: fs.maxFileBytes ?? null, files: (fs.files || []).length } : null;
  return { commandLine, assets, fileSpace, deploymentId: response?.deploymentId || null, agentRevisionId: response?.agentRevisionId || null };
}

/** Body for POST .../compile-preview: the sample input, and the revision and environment only when chosen. */
export function compilePreviewBody(form) {
  const body = { input: form?.input || 'Hello from the compile preview.', parameters: {} };
  if (form?.agentRevisionId) body.agentRevisionId = form.agentRevisionId;
  if (form?.environment) body.environment = form.environment;
  return body;
}

/** localStorage key that remembers the architect conversation of one draft for this browser. */
export function conversationStorageKey(draftId) {
  return `garrison.studio.conversation.${draftId}`;
}

/** localStorage key of the architect deployment last used in the studio. */
export const ARCHITECT_STORAGE_KEY = 'garrison.studio.architect';

/** Read a stored JSON value; null when storage is unavailable or the value is not JSON. */
export function readStored(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Store a JSON value (or remove it for null); storage errors are ignored. */
export function writeStored(key, value) {
  try {
    if (value === null || value === undefined) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

/**
 * The explanation of a missing permission, or '' when the caller holds it (or it cannot be known: the server stays the
 * judge). Every studio action that needs a permission stays visible but disabled with this as its tooltip.
 */
export function studioDenied(t, permissions, resourceType, operation, extra = {}) {
  if (holds(permissions, resourceType, operation, extra)) return '';
  return t('tips.apps.denied', { operation: enumLabel(t, 'operationType', operation), resource: enumLabel(t, 'resourceType', resourceType) });
}

/**
 * Missing-permission explanations for the studio's actions: create, discard, edit (items, request apply), playground
 * (Update on StudioDraft and on AgentRevision), decide (Update on Approval and Create on Manifest, the decider's
 * check for an Allow), preview (Read on Deployment), architect (Create on Deployment), select (Update on Deployment),
 * and clone, editPrompt, and deletePrompt on PromptTemplate. Each is '' when allowed.
 */
export function studioPermissions(t, permissions) {
  const d = (type, op) => studioDenied(t, permissions, type, op);
  return {
    create: d('StudioDraft', 'Create'),
    discard: d('StudioDraft', 'Delete'),
    edit: d('StudioDraft', 'Update'),
    playground: d('StudioDraft', 'Update') || d('AgentRevision', 'Update'),
    decide: d('Approval', 'Update') || d('Manifest', 'Create'),
    preview: d('Deployment', 'Read'),
    architect: d('Deployment', 'Create'),
    select: d('Deployment', 'Update'),
    clone: d('PromptTemplate', 'Create'),
    editPrompt: d('PromptTemplate', 'Update'),
    deletePrompt: d('PromptTemplate', 'Delete')
  };
}
