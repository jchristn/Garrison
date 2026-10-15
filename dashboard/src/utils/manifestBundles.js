// Manifest bundle export (P12.21). The server writes a multi-document YAML bundle whose first document is a
// `Bundle` that lists what the target tenant must already have (secrets, artifact stores, built-ins). Secret values
// are never exported.

/** Kinds that can be selected for export, in apply order. Secrets are never documents in a bundle. */
export const EXPORT_KINDS = ['PromptTemplate', 'HarnessProfile', 'McpServer', 'WorkspaceTemplate', 'Agent', 'Deployment', 'Pipeline', 'Trigger', 'NotificationEndpoint'];

/** Parse a free-form list of Kind/name entries (comma or newline separated) into trimmed, de-duplicated entries. */
export function parseResourceSelectors(text) {
  const seen = new Set();
  const out = [];
  for (const raw of String(text || '').split(/[\n,]+/)) {
    const entry = raw.trim();
    if (!entry || seen.has(entry)) continue;
    seen.add(entry);
    out.push(entry);
  }
  return out;
}

/** Entries that are not Kind/name with a known kind and a non-empty name. */
export function invalidResourceSelectors(entries) {
  return (entries || []).filter((entry) => {
    const slash = entry.indexOf('/');
    if (slash <= 0 || slash === entry.length - 1) return true;
    const kind = entry.slice(0, slash);
    return !EXPORT_KINDS.some((k) => k.toLowerCase() === kind.toLowerCase());
  });
}

/** Query parameters for GET .../manifests/export; an empty selection exports every tenant-owned resource. */
export function manifestExportQuery({ kinds = [], resources = [], followReferences = false, includeBuiltIn = false } = {}) {
  return {
    kinds: kinds && kinds.length ? kinds.join(',') : undefined,
    resources: resources && resources.length ? resources.join(',') : undefined,
    followReferences: followReferences ? 'true' : undefined,
    includeBuiltIn: includeBuiltIn ? 'true' : undefined
  };
}

/** Bundle file name the server also proposes. */
export function bundleFileName(tenantId) {
  return `garrison-bundle-${tenantId}.yaml`;
}

function unquote(value) {
  const v = String(value).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) return v.slice(1, -1);
  return v;
}

/**
 * Read the requirements from a bundle's `Bundle` document without a YAML library: the server writes it in a fixed
 * block style. Returns { secrets: [{ name, kind }], artifactStores: [name], builtIns: [{ kind, name }] }.
 */
export function bundleRequirements(yaml) {
  const result = { secrets: [], artifactStores: [], builtIns: [] };
  const docs = String(yaml || '').split(/^---\s*$/m);
  const bundle = docs.find((d) => /^kind:\s*Bundle\s*$/m.test(d));
  if (!bundle) return result;
  let section = null;
  let current = null;
  for (const line of bundle.split(/\r?\n/)) {
    const top = line.match(/^ {2}(requiredSecrets|requiredArtifactStores|requiredBuiltIns):\s*(\[\])?\s*$/);
    if (top) {
      section = top[2] ? null : top[1];
      current = null;
      continue;
    }
    if (!section) continue;
    const item = line.match(/^ {2,4}- (.*)$/);
    const prop = line.match(/^ {4,6}(\w+):\s*(.*)$/);
    if (item) {
      if (section === 'requiredArtifactStores') {
        result.artifactStores.push(unquote(item[1]));
        continue;
      }
      current = {};
      (section === 'requiredSecrets' ? result.secrets : result.builtIns).push(current);
      const inline = item[1].match(/^(\w+):\s*(.*)$/);
      if (inline) current[inline[1]] = unquote(inline[2]);
    } else if (prop && current) {
      current[prop[1]] = unquote(prop[2]);
    } else if (/^\S|^ {2}\S/.test(line)) {
      section = null;
      current = null;
    }
  }
  return result;
}
