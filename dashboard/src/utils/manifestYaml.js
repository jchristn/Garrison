// Manifest YAML editing for the studio canvas (AD8.3, AD8.4): read the fields a property panel shows from a draft
// item's document, and write the person's edits back into the same document. Only the keys a panel owns change; every
// other key, and the order of the document, stays as it was. The server normalizes the text when it saves an item.
// Plain functions (no JSX) so Node-based tests can import them.

import { isMap, isSeq, parseAllDocuments, parseDocument } from 'yaml';

/** A document that does not parse, with the parser's first message. */
export class ManifestYamlError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ManifestYamlError';
  }
}

const TEXT_OPTIONS = { lineWidth: 0 };

/** Parse one manifest document; throws ManifestYamlError when the text is not one valid YAML mapping. */
export function parseManifest(text) {
  const doc = parseDocument(String(text || ''));
  if (doc.errors.length) throw new ManifestYamlError(doc.errors[0].message);
  if (doc.contents !== null && !isMap(doc.contents)) throw new ManifestYamlError('The document is not a mapping.');
  return doc;
}

/** The document as text again. */
export function manifestText(doc) {
  return doc.toString(TEXT_OPTIONS);
}

/** The document as plain values, or null when it does not parse. */
export function manifestValue(text) {
  try {
    return parseManifest(text).toJS() || {};
  } catch {
    return null;
  }
}

// Flow mappings such as `spec: {}` turn into block mappings before keys are added, so the result reads like the rest.
function blockify(doc, path) {
  const node = doc.getIn(path, true);
  if (isMap(node) || isSeq(node)) node.flow = false;
}

function ensureMap(doc, path) {
  const node = doc.getIn(path, true);
  if (!isMap(node)) doc.setIn(path, doc.createNode({}));
  blockify(doc, path);
}

// Set a key, or remove it when the value is empty (undefined, null, '', or an empty list when `dropEmptyList`).
function put(doc, path, value, { dropEmptyList = true } = {}) {
  const empty = value === undefined || value === null || value === '' || (dropEmptyList && Array.isArray(value) && value.length === 0);
  if (empty) {
    if (doc.hasIn(path)) doc.deleteIn(path);
    return;
  }
  ensureMap(doc, path.slice(0, -1));
  const node = typeof value === 'object' ? doc.createNode(value) : value;
  if (isMap(node) || isSeq(node)) node.flow = false;
  doc.setIn(path, node);
}

function text(value) {
  return value === undefined || value === null ? '' : String(value);
}

function numberText(value) {
  return value === undefined || value === null || value === '' ? '' : String(value);
}

/** Pretty JSON of a schema held as a YAML mapping (inputSchema) or a JSON string (inputSchemaJson); '' for none. */
function schemaText(spec, key) {
  const mapping = spec?.[key];
  if (mapping && typeof mapping === 'object') return JSON.stringify(mapping, null, 2);
  const raw = spec?.[`${key}Json`];
  if (!raw) return '';
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return String(raw);
  }
}

/**
 * Parse schema text from a panel: { value } with the parsed object, null for empty text, or { error } with
 * 'json' (not JSON) or 'object' (JSON, but not an object).
 */
export function parseSchemaText(value) {
  const raw = String(value || '').trim();
  if (!raw) return { value: null };
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: 'json' };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return { error: 'object' };
  return { value: parsed };
}

/** Split a template reference `name@version` into { template, version } (version '' when it follows the latest). */
export function splitPromptRef(ref) {
  const raw = text(ref).trim();
  const m = /^(.*)@(\d+)$/.exec(raw);
  return m ? { template: m[1], version: m[2] } : { template: raw, version: '' };
}

/** Join a template and an optional pinned version into `name@version`, or '' without a template. */
export function joinPromptRef(template, version) {
  const name = text(template).trim();
  if (!name) return '';
  const v = text(version).trim();
  return v ? `${name}@${v}` : name;
}

// ------------------------------------------------------------------------------------------------ Agent

/**
 * The fields the agent panel edits, from an Agent document: description (metadata.description, or spec.description
 * when only that is set), input and output schema as JSON text, asset pins, capabilities, and whether the document
 * names assets and capabilities at all (without the key the agent keeps its current list).
 */
export function readAgentFields(document) {
  const value = manifestValue(document) || {};
  const spec = value.spec || {};
  const assets = Array.isArray(spec.assets) ? spec.assets.map((a) => ({ asset: text(a?.asset), version: numberText(a?.version) })) : [];
  const capabilities = Array.isArray(spec.capabilities) ? spec.capabilities.map(text).filter(Boolean) : [];
  return {
    name: text(value.metadata?.name),
    description: text(value.metadata?.description ?? spec.description),
    inputSchema: schemaText(spec, 'inputSchema'),
    outputSchema: schemaText(spec, 'outputSchema'),
    assets,
    capabilities,
    hasAssets: Object.prototype.hasOwnProperty.call(spec, 'assets'),
    hasCapabilities: Object.prototype.hasOwnProperty.call(spec, 'capabilities')
  };
}

/**
 * Write the agent panel's fields into an Agent document and answer the new text. The description goes where the
 * document keeps it; schemas become YAML mappings (replacing any *Json string); assets and capabilities are written
 * when the document named them or the person set some. Throws ManifestYamlError for a document that does not parse,
 * and Error with code 'schema' for schema text that is not a JSON object (check with parseSchemaText first).
 */
export function writeAgentFields(document, fields) {
  const doc = parseManifest(document);
  ensureMap(doc, ['spec']);
  const description = text(fields.description).trim();
  if (doc.hasIn(['spec', 'description']) && !doc.hasIn(['metadata', 'description'])) put(doc, ['spec', 'description'], description);
  else {
    put(doc, ['metadata', 'description'], description);
    if (doc.hasIn(['spec', 'description'])) doc.deleteIn(['spec', 'description']);
  }
  for (const key of ['inputSchema', 'outputSchema']) {
    const parsed = parseSchemaText(fields[key]);
    if (parsed.error) {
      const e = new Error(`${key} is not a JSON object.`);
      e.code = 'schema';
      e.field = key;
      throw e;
    }
    if (doc.hasIn(['spec', `${key}Json`])) doc.deleteIn(['spec', `${key}Json`]);
    put(doc, ['spec', key], parsed.value);
  }
  const assets = (fields.assets || [])
    .map((a) => ({ asset: text(a.asset).trim(), version: text(a.version).trim() }))
    .filter((a) => a.asset)
    .map((a) => (a.version ? { asset: a.asset, version: Number(a.version) } : { asset: a.asset }));
  if (assets.length || fields.hasAssets) put(doc, ['spec', 'assets'], assets, { dropEmptyList: false });
  const capabilities = (fields.capabilities || []).map((c) => text(c).trim()).filter(Boolean);
  if (capabilities.length || fields.hasCapabilities) put(doc, ['spec', 'capabilities'], capabilities, { dropEmptyList: false });
  return manifestText(doc);
}

// ------------------------------------------------------------------------------------------------ AgenticApp

/** Branding keys of an app, in the order the panel shows them. */
export const BRANDING_KEYS = ['displayName', 'logo', 'primaryColor', 'accentColor', 'welcomeText'];

/** The fields the app panel edits, from an AgenticApp document: description, entry, sign-in, and branding. */
export function readAppFields(document) {
  const value = manifestValue(document) || {};
  const spec = value.spec || {};
  const branding = {};
  for (const key of BRANDING_KEYS) branding[key] = text(spec.branding?.[key]);
  return {
    name: text(value.metadata?.name),
    description: text(value.metadata?.description),
    entry: text(spec.entry),
    authMode: text(spec.authMode),
    anonymousEnabled: spec.anonymousEnabled === true,
    branding
  };
}

/** Write the app panel's fields (description, sign-in, branding) into an AgenticApp document. Members, edges, and the entry agent change through graph operations. */
export function writeAppFields(document, fields) {
  const doc = parseManifest(document);
  ensureMap(doc, ['spec']);
  put(doc, ['metadata', 'description'], text(fields.description).trim());
  put(doc, ['spec', 'authMode'], text(fields.authMode).trim());
  if (fields.anonymousEnabled || doc.hasIn(['spec', 'anonymousEnabled'])) put(doc, ['spec', 'anonymousEnabled'], !!fields.anonymousEnabled);
  for (const key of BRANDING_KEYS) put(doc, ['spec', 'branding', key], text(fields.branding?.[key]).trim());
  const branding = doc.getIn(['spec', 'branding'], true);
  if (isMap(branding) && !branding.items.length) doc.deleteIn(['spec', 'branding']);
  return manifestText(doc);
}

/** A starting AgenticApp document for an app the draft does not hold and live configuration does not have. */
export function appTemplate(name) {
  return `apiVersion: garrison/v1\nkind: AgenticApp\nmetadata:\n  name: ${name}\nspec: {}\n`;
}

// ------------------------------------------------------------------------------------------------ Deployment

/** Runtime fields of a deployment the runtime panel edits as numbers. */
export const RUNTIME_NUMBER_KEYS = ['timeoutSeconds', 'maxTurns', 'maxBudgetUsd'];

/**
 * The fields the runtime panel edits, from a Deployment document: the agent and environment it belongs to, model,
 * effort, timeout, maximum turns, budget, the System prompt template with its pinned version, and approvals.
 */
export function readDeploymentFields(document) {
  const value = manifestValue(document) || {};
  const spec = value.spec || {};
  const system = splitPromptRef(spec.prompts?.System);
  return {
    name: text(value.metadata?.name),
    agent: text(spec.agent),
    environment: text(spec.environment) || 'dev',
    harnessProfile: text(spec.harnessProfile),
    model: text(spec.model),
    effort: text(spec.effort),
    timeoutSeconds: numberText(spec.timeoutSeconds),
    maxTurns: numberText(spec.maxTurns),
    maxBudgetUsd: numberText(spec.maxBudgetUsd),
    systemTemplate: system.template,
    systemVersion: system.version,
    approvalsEnabled: spec.approvalsEnabled === true,
    approvalDefaultAction: text(spec.approvalDefaultAction) || 'Ask',
    approvalRules: Array.isArray(spec.approvalRules)
      ? spec.approvalRules.map((r) => ({ action: text(r?.action) || 'Ask', pattern: text(r?.pattern), inputPattern: text(r?.inputPattern), description: text(r?.description) }))
      : []
  };
}

/**
 * Client checks of runtime fields: { field: code } with 'integer' (a whole number of at least 1 is needed),
 * 'number' (a number of at least 0), 'pattern' (an approval rule without a pattern), or 'version' (a pinned
 * version without a template, or not a whole number). The server checks the rest when the draft is validated.
 */
export function runtimeErrors(fields) {
  const e = {};
  for (const key of ['timeoutSeconds', 'maxTurns']) {
    const v = text(fields[key]).trim();
    if (v && !(/^\d+$/.test(v) && Number(v) >= 1)) e[key] = 'integer';
  }
  const budget = text(fields.maxBudgetUsd).trim();
  if (budget && !(Number.isFinite(Number(budget)) && Number(budget) >= 0)) e.maxBudgetUsd = 'number';
  const version = text(fields.systemVersion).trim();
  if (version && (!/^\d+$/.test(version) || !text(fields.systemTemplate).trim())) e.systemVersion = 'version';
  (fields.approvalRules || []).forEach((r, i) => {
    if (!text(r.pattern).trim()) e[`approvalRules[${i}].pattern`] = 'pattern';
  });
  return e;
}

/** Write the runtime panel's fields into one Deployment document. Keys the panel does not own are left alone. */
export function writeDeploymentFields(document, fields) {
  const doc = parseManifest(document);
  ensureMap(doc, ['spec']);
  put(doc, ['spec', 'model'], text(fields.model).trim());
  put(doc, ['spec', 'effort'], text(fields.effort).trim());
  for (const key of RUNTIME_NUMBER_KEYS) {
    const v = text(fields[key]).trim();
    put(doc, ['spec', key], v === '' ? '' : Number(v));
  }
  put(doc, ['spec', 'prompts', 'System'], joinPromptRef(fields.systemTemplate, fields.systemVersion));
  const prompts = doc.getIn(['spec', 'prompts'], true);
  if (isMap(prompts) && !prompts.items.length) doc.deleteIn(['spec', 'prompts']);
  if (fields.approvalsEnabled || doc.hasIn(['spec', 'approvalsEnabled'])) put(doc, ['spec', 'approvalsEnabled'], !!fields.approvalsEnabled);
  if (fields.approvalsEnabled || doc.hasIn(['spec', 'approvalDefaultAction'])) put(doc, ['spec', 'approvalDefaultAction'], text(fields.approvalDefaultAction) || 'Ask');
  const rules = (fields.approvalRules || [])
    .filter((r) => text(r.pattern).trim())
    .map((r) => {
      const rule = { action: r.action || 'Ask', pattern: text(r.pattern).trim() };
      if (text(r.inputPattern).trim()) rule.inputPattern = text(r.inputPattern).trim();
      if (text(r.description).trim()) rule.description = text(r.description).trim();
      return rule;
    });
  if (rules.length || doc.hasIn(['spec', 'approvalRules'])) put(doc, ['spec', 'approvalRules'], rules, { dropEmptyList: false });
  return manifestText(doc);
}

// ------------------------------------------------------------------------------------------------ Bundles

/**
 * One document of a multi-document manifest (an export), as its own text: the first document of that kind and
 * name, or null when the bundle has none.
 */
export function extractDocument(bundle, kind, name) {
  for (const doc of parseAllDocuments(String(bundle || ''))) {
    if (doc.errors?.length) continue;
    const value = doc.toJS() || {};
    if (value.kind === kind && value.metadata?.name === name) return manifestText(doc);
  }
  return null;
}
