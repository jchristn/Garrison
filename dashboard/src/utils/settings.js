// Normalizes the settings API response into a flat field list with metadata.

function inferType(value) {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  return 'string';
}

function flatten(obj, prefix, out) {
  for (const [k, v] of Object.entries(obj || {})) {
    const key = k.charAt(0).toUpperCase() + k.slice(1);
    const path = prefix ? `${prefix}.${key}` : key;
    if (v && typeof v === 'object' && !Array.isArray(v)) flatten(v, path, out);
    else out.push({ path, value: v, type: Array.isArray(v) ? 'list' : inferType(v), source: 'File', applyMode: 'RestartRequired', editable: true, group: prefix ? prefix.split('.')[0] : 'General' });
  }
}

/** Map the server's field type names (int, long, double, bool, enum, secret, string, list) onto the editor's. */
function editorType(f) {
  const raw = String(f.type || inferType(f.value)).toLowerCase();
  if (['int', 'int32', 'int64', 'long', 'short', 'integer'].includes(raw)) return 'integer';
  if (['double', 'float', 'decimal', 'number'].includes(raw)) return 'number';
  if (['bool', 'boolean'].includes(raw)) return 'boolean';
  return raw;
}

/** Server values are text ("8700", "true"); convert them to the editor's value types. */
function editorValue(type, value) {
  if (value === null || value === undefined) return value;
  if (type === 'boolean') return typeof value === 'boolean' ? value : String(value).toLowerCase() === 'true';
  if ((type === 'integer' || type === 'number') && value !== '' && !Number.isNaN(Number(value))) return Number(value);
  return value;
}

/**
 * Normalize: { fields: [...] } | { groups: [{ name, fields }] } | raw settings object -> field array.
 * Server field: { path, group, description, type (int|bool|enum|secret|string), value (text), isSecret, isSet, source,
 * applyMode, editable, minimum, maximum, allowedValues }.
 * Editor field: { path, value, type (integer|number|boolean|enum|secret|string|list), isSecret, isSet, source,
 * applyMode, editable, min, max, group, options }.
 */
export function normalizeSettings(response) {
  if (!response) return [];
  let fields = [];
  if (Array.isArray(response.fields)) fields = response.fields;
  else if (Array.isArray(response.groups)) fields = response.groups.flatMap((g) => (g.fields || []).map((f) => ({ group: g.name || g.group, ...f })));
  else flatten(response, '', fields);
  return fields.map((f) => {
    const type = editorType(f);
    const options = f.options || f.allowedValues;
    return {
      ...f,
      path: f.path || f.name,
      group: f.group || (f.path || '').split('.')[0] || 'General',
      type,
      value: f.isSecret ? f.value : editorValue(type, f.value),
      min: f.min ?? f.minimum,
      max: f.max ?? f.maximum,
      options: Array.isArray(options) && options.length ? options : undefined,
      editable: f.editable !== false && f.source !== 'Environment' && f.source !== 'ConfigMap',
      applyMode: f.applyMode || 'RestartRequired'
    };
  });
}

/** PUT /v1.0/api/settings body: { values: [{ path, value }] } with every value as text (SettingsUpdateRequest). */
export function settingsUpdateBody(values) {
  return {
    values: Object.entries(values).map(([path, v]) => ({ path, value: v === null || v === undefined ? null : Array.isArray(v) ? v.join(',') : String(v) }))
  };
}

/** Group fields by group name, preserving first-seen order. */
export function groupSettings(fields) {
  const groups = [];
  const index = new Map();
  for (const f of fields) {
    if (!index.has(f.group)) {
      index.set(f.group, groups.length);
      groups.push({ name: f.group, fields: [] });
    }
    groups[index.get(f.group)].fields.push(f);
  }
  return groups;
}

/** Clamp a numeric value to a field's min and max. */
export function clampSetting(field, value) {
  if (value === null || value === undefined || value === '') return value;
  let n = Number(value);
  if (Number.isNaN(n)) return value;
  if (field.min !== undefined && field.min !== null) n = Math.max(field.min, n);
  if (field.max !== undefined && field.max !== null) n = Math.min(field.max, n);
  return n;
}
