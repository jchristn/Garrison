// Capability catalog (AD4): agents, MCP tools, and harness built-ins described in one shape. Helpers shared by the
// Capabilities page, its detail and refresh dialogs, the harness profile tool probe editor, the revision capability
// editor, and their tests. Plain functions (no JSX) so Node-based tests can import them.

/** Capability kinds, in the order the form and the filter list them. */
export const CAPABILITY_KINDS = ['Agent', 'McpTool', 'HarnessBuiltIn'];

/** Where a descriptor comes from: kept in step with its source (Derived) or written by a person (Manual). */
export const CAPABILITY_ORIGINS = ['Derived', 'Manual'];

/** Hint status: Known when enough finished runs back the values, Unknown otherwise (every value is then null). */
export const CAPABILITY_HINT_STATUSES = ['Unknown', 'Known'];

/** The only arguments a tool probe may pass, at most one of them (HarnessToolProbe.AllowedArguments). */
export const PROBE_ARGUMENTS = ['--version', '-version', '-v', '-V', 'version', '--help', '-h'];

/** Node label prefix workers use to report a probed tool: garrison.io/tool-{name}=true. */
export const TOOL_LABEL_PREFIX = 'garrison.io/tool-';

/** Tool probe name: 1 to 63 lowercase letters, digits, dots, and hyphens, starting with a letter or digit. */
export const PROBE_NAME_PATTERN = /^[a-z0-9][a-z0-9.-]{0,62}$/;

/** Tool probe executable: a bare file name of 1 to 128 letters, digits, dots, underscores, plus signs, and hyphens. */
export const PROBE_EXECUTABLE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._+-]{0,127}$/;

/** Limits the server enforces on profiles and descriptors. */
export const LIMITS = { probes: 32, probeDescription: 1024, name: 256, summary: 4000, tags: 32, tagLength: 64, requirements: 16, requirementKey: 256, requirementValue: 256 };

/** True for descriptors Garrison derives from a source; they cannot be edited or deleted (409 CapabilityDerived). */
export function isDerived(descriptor) {
  return descriptor?.origin === 'Derived';
}

/** True for descriptors every tenant shares (derived from a built-in harness profile, tenantId null). */
export function isShared(descriptor) {
  return !!descriptor && (descriptor.tenantId === null || descriptor.tenantId === undefined || descriptor.tenantId === '');
}

/** True when the descriptor is a manual entry of the tenant, the only kind that can be edited and deleted. */
export function isEditableCapability(descriptor) {
  return !!descriptor && !isDerived(descriptor) && !isShared(descriptor);
}

/**
 * Translation key that explains why a descriptor cannot be edited or deleted, or '' when it can. Shared built-ins
 * have their own explanation; other derived entries follow their source.
 */
export function lockedReasonKey(descriptor) {
  if (!descriptor || isEditableCapability(descriptor)) return '';
  if (isShared(descriptor)) return 'tips.capabilities.lockedShared';
  return `tips.capabilities.locked.${descriptor.kind || 'Agent'}`;
}

/**
 * One page of a capability list. The server returns the whole filtered catalog in one response, so sorting by name or
 * creation time and paging happen here. params: { pageNumber, pageSize, ordering }.
 * @returns {{ items: Array, pageNumber: number, pageSize: number, totalCount: number, totalPages: number }}
 */
export function pageCapabilities(objects, params = {}) {
  const all = Array.isArray(objects) ? [...objects] : [];
  const ordering = params.ordering || 'NameAscending';
  const byName = (a, b) => String(a?.name || '').localeCompare(String(b?.name || '')) || String(a?.id || '').localeCompare(String(b?.id || ''));
  const byCreated = (a, b) => String(a?.createdUtc || '').localeCompare(String(b?.createdUtc || '')) || byName(a, b);
  if (ordering === 'NameDescending') all.sort((a, b) => byName(b, a));
  else if (ordering === 'CreatedAscending') all.sort(byCreated);
  else if (ordering === 'CreatedDescending') all.sort((a, b) => byCreated(b, a));
  else all.sort(byName);
  const pageSize = Math.max(1, Number(params.pageSize) || all.length || 25);
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  const pageNumber = Math.min(Math.max(1, Number(params.pageNumber) || 1), totalPages);
  const start = (pageNumber - 1) * pageSize;
  return { items: all.slice(start, start + pageSize), pageNumber, pageSize, totalCount: all.length, totalPages };
}

/** "key=value" for one node label requirement (value defaults to true). */
export function requirementText(requirement) {
  if (!requirement?.key) return '';
  const value = requirement.value === undefined || requirement.value === null || requirement.value === '' ? 'true' : requirement.value;
  return `${requirement.key}=${value}`;
}

/** The node label a probed tool reports, for example garrison.io/tool-pandoc=true. */
export function toolLabel(name) {
  return `${TOOL_LABEL_PREFIX}${name}=true`;
}

/** Tool names a list of requirements names (garrison.io/tool-{name} keys), in order. */
export function toolNamesOf(requirements) {
  return (requirements || []).filter((r) => r?.key && String(r.key).startsWith(TOOL_LABEL_PREFIX)).map((r) => String(r.key).slice(TOOL_LABEL_PREFIX.length));
}

/** True when hints carry values backed by enough runs. Unknown hints are never shown as zero. */
export function hintsKnown(hints) {
  return hints?.status === 'Known';
}

/** Where a descriptor's source link points: { type: 'agent' | 'mcpServer' | 'harnessProfile' | 'none', id, tool }. */
export function sourceOf(descriptor) {
  if (!descriptor) return { type: 'none' };
  if (descriptor.kind === 'Agent' && descriptor.sourceAgentId) return { type: 'agent', id: descriptor.sourceAgentId };
  if (descriptor.kind === 'McpTool' && descriptor.sourceMcpServerId) return { type: 'mcpServer', id: descriptor.sourceMcpServerId, tool: descriptor.sourceToolName || '' };
  if (descriptor.kind === 'HarnessBuiltIn' && descriptor.sourceHarnessProfileId) return { type: 'harnessProfile', id: descriptor.sourceHarnessProfileId };
  if (descriptor.sourceAgentId) return { type: 'agent', id: descriptor.sourceAgentId };
  if (descriptor.sourceMcpServerId) return { type: 'mcpServer', id: descriptor.sourceMcpServerId, tool: descriptor.sourceToolName || '' };
  return { type: 'none' };
}

/** True when a text is empty or parses as JSON. */
function isJsonOrEmpty(text) {
  if (!text || !String(text).trim()) return true;
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

/** Form values for a descriptor: schemas as text, lists never null, requirements as { key, value } rows. */
export function capabilityToForm(descriptor) {
  const d = descriptor || {};
  return {
    ...d,
    name: d.name || '',
    kind: d.kind || 'Agent',
    summary: d.summary || '',
    inputSchemaJson: d.inputSchemaJson || '',
    outputSchemaJson: d.outputSchemaJson || '',
    tags: d.tags || [],
    requirements: (d.requirements || []).map((r) => ({ key: r.key || '', value: r.value ?? 'true' })),
    sourceAgentId: d.sourceAgentId || null,
    sourceMcpServerId: d.sourceMcpServerId || null,
    sourceToolName: d.sourceToolName || ''
  };
}

/** Client-side checks for a manual descriptor, keyed by field. Mirrors the server's limits. */
export function capabilityErrors(d, t) {
  const errors = {};
  const name = String(d?.name || '').trim();
  if (!name) errors.name = t('common.errors.required');
  else if (name.length > LIMITS.name) errors.name = t('components.capabilities.errors.nameLength', { max: LIMITS.name });
  if (String(d?.summary || '').length > LIMITS.summary) errors.summary = t('components.capabilities.errors.summaryLength', { max: LIMITS.summary });
  for (const key of ['inputSchemaJson', 'outputSchemaJson']) if (!isJsonOrEmpty(d?.[key])) errors[key] = t('common.errors.invalidJson');
  const tags = (d?.tags || []).map((v) => String(v).trim()).filter(Boolean);
  if (tags.length > LIMITS.tags || tags.some((v) => v.length > LIMITS.tagLength)) errors.tags = t('components.capabilities.errors.tags', { max: LIMITS.tags, length: LIMITS.tagLength });
  const reqs = (d?.requirements || []).filter((r) => r && (String(r.key || '').trim() || String(r.value || '').trim()));
  if (reqs.length > LIMITS.requirements) errors.requirements = t('components.capabilities.errors.requirementCount', { max: LIMITS.requirements });
  else if (reqs.some((r) => !String(r.key || '').trim() || String(r.key).length > LIMITS.requirementKey || String(r.value ?? '').length > LIMITS.requirementValue))
    errors.requirements = t('components.capabilities.errors.requirement', { max: LIMITS.requirementKey });
  if (d?.kind === 'McpTool' && String(d?.sourceToolName || '').trim() && !d?.sourceMcpServerId) errors.sourceToolName = t('components.capabilities.errors.toolNeedsServer');
  return errors;
}

/** Body for POST and PUT /capabilities: trimmed text, schemas null when empty, empty rows dropped. */
export function capabilityToBody(d) {
  const text = (v) => {
    const s = String(v ?? '').trim();
    return s ? s : null;
  };
  return {
    name: String(d?.name || '').trim(),
    kind: d?.kind || 'Agent',
    summary: text(d?.summary),
    inputSchemaJson: text(d?.inputSchemaJson),
    outputSchemaJson: text(d?.outputSchemaJson),
    tags: (d?.tags || []).map((v) => String(v).trim()).filter(Boolean),
    requirements: (d?.requirements || [])
      .filter((r) => r && String(r.key || '').trim())
      .map((r) => ({ key: String(r.key).trim(), value: String(r.value ?? '').trim() || 'true' })),
    // A manual entry may name the agent or MCP tool it stands for; the source fields only apply to their own kind.
    sourceAgentId: d?.kind === 'Agent' ? d?.sourceAgentId || null : null,
    sourceMcpServerId: d?.kind === 'McpTool' ? d?.sourceMcpServerId || null : null,
    sourceToolName: d?.kind === 'McpTool' && d?.sourceMcpServerId ? text(d?.sourceToolName) : null
  };
}

// ---------------------------------------------------------------- tool probes on harness profiles

/** Tool probes as form rows: the single argument becomes `argument` ('' for none). */
export function probesToForm(probes) {
  return (probes || []).map((p) => ({ name: p?.name || '', executable: p?.executable || '', argument: Array.isArray(p?.arguments) && p.arguments.length ? p.arguments[0] : '', description: p?.description || '' }));
}

/** Tool probes for the profile body: trimmed, with arguments as a list of at most one entry and no empty description. */
export function probesToBody(rows) {
  return (rows || [])
    .filter((r) => r && (String(r.name || '').trim() || String(r.executable || '').trim()))
    .map((r) => {
      const out = { name: String(r.name || '').trim(), executable: String(r.executable || '').trim(), arguments: r.argument ? [r.argument] : [] };
      const description = String(r.description || '').trim();
      if (description) out.description = description;
      return out;
    });
}

/**
 * Problems with a profile's tool probes, as one message per probe ({ index: message }) plus `count` for too many.
 * The rules match HarnessToolProbe on the server: name and executable patterns, one allowed argument at most, unique
 * names, at most 32 probes, and descriptions up to 1024 characters.
 */
export function probeProblems(rows, t) {
  const out = {};
  const list = (rows || []).filter((r) => r && (String(r.name || '').trim() || String(r.executable || '').trim()));
  if (list.length > LIMITS.probes) out.count = t('components.capabilities.errors.probeCount', { max: LIMITS.probes });
  const seen = new Set();
  list.forEach((r, i) => {
    const name = String(r.name || '').trim();
    const executable = String(r.executable || '').trim();
    const problems = [];
    if (!PROBE_NAME_PATTERN.test(name)) problems.push(t('components.capabilities.errors.probeName'));
    else if (seen.has(name)) problems.push(t('components.capabilities.errors.probeDuplicate', { name }));
    seen.add(name);
    if (!PROBE_EXECUTABLE_PATTERN.test(executable)) problems.push(t('components.capabilities.errors.probeExecutable'));
    if (r.argument && !PROBE_ARGUMENTS.includes(r.argument)) problems.push(t('components.capabilities.errors.probeArgument', { allowed: PROBE_ARGUMENTS.join(', ') }));
    if (String(r.description || '').length > LIMITS.probeDescription) problems.push(t('components.capabilities.errors.probeDescription', { max: LIMITS.probeDescription }));
    if (problems.length) out[i] = problems.join(' ');
  });
  return out;
}

/** One field error for the tool probes list ("Item 2: ..."), or '' when every probe is valid. */
export function probeError(rows, t) {
  const problems = probeProblems(rows, t);
  const parts = [];
  if (problems.count) parts.push(problems.count);
  for (const [key, message] of Object.entries(problems)) if (key !== 'count') parts.push(t('common.errors.listItem', { index: Number(key) + 1, message }));
  return parts.join(' ');
}

// ---------------------------------------------------------------- capabilities on agent revisions

/** Capability names of a revision, trimmed, without blanks or repeats. */
export function revisionCapabilities(revision) {
  return cleanNames(revision?.capabilities);
}

/** Names trimmed, without blanks, each once (first wins), in order. */
export function cleanNames(names) {
  const out = [];
  for (const n of names || []) {
    const s = String(n ?? '').trim();
    if (s && !out.includes(s)) out.push(s);
  }
  return out;
}

/** True when two name lists hold the same names, in any order. */
export function sameNames(a, b) {
  return cleanNames(a).sort().join('|') === cleanNames(b).sort().join('|');
}

/** Revision fields the server owns; a draft body never sends them. */
const REVISION_SERVER_FIELDS = ['id', 'tenantId', 'agentId', 'number', 'state', 'contentHash', 'authorUserId', 'authorName', 'publishedByUserId', 'publishedByName', 'publishedUtc', 'createdUtc', 'lastUpdateUtc'];

/**
 * Body for POST /agents/{id}/revisions that saves `names` as the draft's capabilities: the complete content of
 * `revision` (the open draft, or the published revision a new draft starts from) with only capabilities changed. The
 * change note is kept for a draft and dropped when starting from a published revision.
 */
export function capabilityDraftBody(revision, names) {
  const body = { ...(revision || {}) };
  for (const key of REVISION_SERVER_FIELDS) delete body[key];
  if (revision?.state !== 'Draft') delete body.changeNote;
  body.capabilities = cleanNames(names);
  return body;
}

/**
 * Catalog entries a revision may name, one per name (names are not unique across kinds), sorted by name. Each entry
 * keeps the kinds that use the name so the picker can say "pandoc (Harness built-in)".
 * @returns {Array<{ name: string, kinds: string[] }>}
 */
export function catalogNames(descriptors) {
  const map = new Map();
  for (const d of descriptors || []) {
    if (!d?.name) continue;
    const entry = map.get(d.name) || { name: d.name, kinds: [] };
    if (d.kind && !entry.kinds.includes(d.kind)) entry.kinds.push(d.kind);
    map.set(d.name, entry);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------- refresh

/** Totals of a refresh result: descriptor counts plus servers listed, failed, tools written, and tools removed. */
export function refreshTotals(result) {
  const servers = Array.isArray(result?.mcpServers) ? result.mcpServers : [];
  return {
    agents: Number(result?.agents) || 0,
    harnessBuiltIns: Number(result?.harnessBuiltIns) || 0,
    hints: Number(result?.hints) || 0,
    servers: servers.length,
    failed: servers.filter((s) => s?.error).length,
    tools: servers.reduce((sum, s) => sum + (Number(s?.tools) || 0), 0),
    removed: servers.reduce((sum, s) => sum + (Number(s?.removed) || 0), 0),
    warned: servers.reduce((sum, s) => sum + (Number(s?.warned) || 0), 0)
  };
}
