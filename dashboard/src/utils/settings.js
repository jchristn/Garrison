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

/**
 * Normalize: { fields: [...] } | { groups: [{ name, fields }] } | raw settings object -> field array.
 * Field: { path, value, type, isSecret, isSet, source, applyMode, editable, min, max, group, options }.
 */
export function normalizeSettings(response) {
  if (!response) return [];
  let fields = [];
  if (Array.isArray(response.fields)) fields = response.fields;
  else if (Array.isArray(response.groups)) fields = response.groups.flatMap((g) => (g.fields || []).map((f) => ({ group: g.name || g.group, ...f })));
  else flatten(response, '', fields);
  return fields.map((f) => ({
    ...f,
    path: f.path || f.name,
    group: f.group || (f.path || '').split('.')[0] || 'General',
    type: (f.type || inferType(f.value)).toString().toLowerCase(),
    editable: f.editable !== false && f.source !== 'Environment' && f.source !== 'ConfigMap',
    applyMode: f.applyMode || 'RestartRequired'
  }));
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
