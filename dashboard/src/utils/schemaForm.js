// Invoke forms generated from an agent's input JSON Schema (P12.22). Pure functions only, so the form model, the
// value it builds, and the mapping of server field errors are unit tested without React.
//
// Supported: an object root with properties of type string, number, integer, boolean, enum (any primitive type),
// arrays of primitives (one control per item), and nested objects one level deep. Anything else (deeper objects,
// arrays of objects, oneOf, and so on) becomes a raw JSON control for that property, so every schema still works.

const PRIMITIVES = ['string', 'number', 'integer', 'boolean'];

/** Parse schema text; null when empty or not a JSON object. */
export function parseSchema(text) {
  if (!text || !String(text).trim()) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function typeOf(schema) {
  if (!schema || typeof schema !== 'object') return null;
  let t = schema.type;
  if (Array.isArray(t)) t = t.find((x) => x !== 'null') || null;
  if (!t && Array.isArray(schema.enum)) {
    const first = schema.enum.find((v) => v !== null);
    t = typeof first === 'number' ? 'number' : typeof first === 'boolean' ? 'boolean' : 'string';
  }
  if (!t && schema.properties) t = 'object';
  return t || null;
}

function field(name, schema, path, required, depth) {
  const type = typeOf(schema);
  const base = {
    key: path,
    name,
    label: schema?.title || name,
    description: schema?.description || '',
    required: !!required,
    default: schema?.default
  };
  if (Array.isArray(schema?.enum) && schema.enum.length > 0) return { ...base, type: 'enum', valueType: type || 'string', options: schema.enum };
  if (PRIMITIVES.includes(type)) return { ...base, type, format: schema.format, minimum: schema.minimum, maximum: schema.maximum };
  if (type === 'array') {
    const items = schema.items || {};
    const itemType = typeOf(items);
    if (Array.isArray(items.enum) && items.enum.length > 0) return { ...base, type: 'array', itemType: 'enum', itemValueType: itemType || 'string', options: items.enum };
    if (PRIMITIVES.includes(itemType)) return { ...base, type: 'array', itemType };
    return { ...base, type: 'json' };
  }
  if (type === 'object' && depth === 0 && schema.properties && typeof schema.properties === 'object') {
    const req = new Set(Array.isArray(schema.required) ? schema.required : []);
    const children = Object.entries(schema.properties).map(([childName, child]) => field(childName, child, `${path}.${childName}`, req.has(childName), depth + 1));
    return { ...base, type: 'object', children };
  }
  return { ...base, type: 'json' };
}

/**
 * Form model for a schema, or null when the schema cannot drive a form (not an object with properties). Each field:
 * { key, name, label, description, required, default, type, ... }; object fields carry `children`.
 */
export function buildFormModel(schema) {
  if (!schema || typeOf(schema) !== 'object' || !schema.properties || typeof schema.properties !== 'object') return null;
  const req = new Set(Array.isArray(schema.required) ? schema.required : []);
  const fields = Object.entries(schema.properties).map(([name, child]) => field(name, child, name, req.has(name), 0));
  return { title: schema.title || '', description: schema.description || '', fields };
}

/** Every leaf field (object fields are replaced by their children). */
export function leafFields(model) {
  const out = [];
  for (const f of model?.fields || []) {
    if (f.type === 'object') out.push(...f.children);
    else out.push(f);
  }
  return out;
}

function initialFor(f) {
  const d = f.default;
  switch (f.type) {
    case 'boolean':
      return d === true;
    case 'array':
      return Array.isArray(d) ? d.map((v) => (v === null || v === undefined ? '' : String(v))) : [];
    case 'json':
      return d === undefined ? '' : JSON.stringify(d, null, 2);
    case 'enum':
      return d === undefined ? '' : JSON.stringify(d);
    default:
      return d === undefined || d === null ? '' : String(d);
  }
}

/** Initial form state: a flat map from field key to the control's raw value, filled from schema defaults. */
export function initialState(model) {
  const state = {};
  for (const f of leafFields(model)) state[f.key] = initialFor(f);
  return state;
}

function convertPrimitive(type, raw) {
  const text = String(raw).trim();
  if (type === 'number' || type === 'integer') {
    const n = Number(text);
    if (text === '' || !Number.isFinite(n)) return { error: 'number' };
    if (type === 'integer' && !Number.isInteger(n)) return { error: 'integer' };
    return { value: n };
  }
  if (type === 'boolean') return { value: text === 'true' };
  return { value: String(raw) };
}

function isEmpty(f, raw) {
  if (f.type === 'boolean') return false;
  if (f.type === 'array') return !raw || raw.filter((v) => String(v).trim() !== '').length === 0;
  return raw === undefined || raw === null || String(raw).trim() === '';
}

function leafValue(f, raw) {
  if (f.type === 'boolean') return { value: !!raw };
  if (f.type === 'enum') {
    try {
      return { value: JSON.parse(raw) };
    } catch {
      return { value: raw };
    }
  }
  if (f.type === 'json') {
    try {
      return { value: JSON.parse(raw) };
    } catch {
      return { error: 'json' };
    }
  }
  if (f.type === 'array') {
    const items = (raw || []).filter((v) => String(v).trim() !== '');
    const out = [];
    for (let i = 0; i < items.length; i++) {
      if (f.itemType === 'enum') {
        try {
          out.push(JSON.parse(items[i]));
        } catch {
          out.push(items[i]);
        }
        continue;
      }
      const c = convertPrimitive(f.itemType, items[i]);
      if (c.error) return { error: c.error, index: i };
      out.push(c.value);
    }
    return { value: out };
  }
  return convertPrimitive(f.type, raw);
}

/**
 * Build the JSON value from form state. Empty optional fields are left out; empty required fields are reported.
 * Returns { value, errors } where errors maps field keys to an error kind: required, number, integer, or json.
 */
export function buildValue(model, state) {
  const value = {};
  const errors = {};
  const assign = (f, target) => {
    const raw = state?.[f.key];
    if (isEmpty(f, raw)) {
      if (f.required) errors[f.key] = 'required';
      return;
    }
    const r = leafValue(f, raw);
    if (r.error) errors[f.key] = r.error;
    else target[f.name] = r.value;
  };
  for (const f of model?.fields || []) {
    if (f.type !== 'object') {
      assign(f, value);
      continue;
    }
    const child = {};
    for (const c of f.children) assign(c, child);
    if (Object.keys(child).length > 0 || f.required) value[f.name] = child;
  }
  return { value, errors };
}

/** Fill form state from a JSON value (used when switching back from raw JSON). Unknown properties are ignored. */
export function stateFromValue(model, value) {
  const state = initialState(model);
  const src = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const put = (f, v) => {
    if (v === undefined) {
      state[f.key] = f.type === 'boolean' ? false : f.type === 'array' ? [] : '';
      return;
    }
    if (f.type === 'boolean') state[f.key] = v === true;
    else if (f.type === 'array') state[f.key] = Array.isArray(v) ? v.map((x) => (f.itemType === 'enum' ? JSON.stringify(x) : String(x))) : [];
    else if (f.type === 'json') state[f.key] = JSON.stringify(v, null, 2);
    else if (f.type === 'enum') state[f.key] = JSON.stringify(v);
    else state[f.key] = v === null ? '' : String(v);
  };
  for (const f of model?.fields || []) {
    if (f.type === 'object') {
      const nested = src[f.name] && typeof src[f.name] === 'object' ? src[f.name] : {};
      for (const c of f.children) put(c, nested[c.name]);
    } else {
      put(f, src[f.name]);
    }
  }
  return state;
}

/**
 * Convert a server field key (input, input.topic, input.tags[1], input.address.city) to the form path:
 * { path: 'tags', index: 1 } or { path: '' } for the root.
 */
export function fieldPath(serverKey) {
  let key = String(serverKey || '');
  if (key === 'input') return { path: '', index: null };
  if (key.startsWith('input.')) key = key.slice(6);
  else if (key.startsWith('input[')) key = key.slice(5);
  else return null;
  let index = null;
  const parts = [];
  for (const segment of key.split('.')) {
    const m = segment.match(/^([^[]*)((\[\d+\])*)$/);
    if (!m) {
      parts.push(segment);
      continue;
    }
    if (m[1]) parts.push(m[1]);
    const idx = m[2].match(/\[(\d+)\]/);
    if (idx && index === null) index = Number(idx[1]);
    if (m[2]) break;
  }
  return { path: parts.join('.'), index };
}

/**
 * Map a 400 response's `fields` onto the form. Returns { byKey: { fieldKey: message }, general: [message] }: a
 * message lands on the deepest control whose key is a prefix of the reported path; anything else is general.
 */
export function mapServerErrors(model, fields) {
  const byKey = {};
  const general = [];
  const keys = new Set();
  for (const f of model?.fields || []) {
    keys.add(f.key);
    if (f.type === 'object') for (const c of f.children) keys.add(c.key);
  }
  for (const [serverKey, message] of Object.entries(fields || {})) {
    const p = fieldPath(serverKey);
    if (!p || !p.path) {
      general.push(message);
      continue;
    }
    const segments = p.path.split('.');
    let matched = null;
    for (let n = segments.length; n > 0 && !matched; n--) {
      const candidate = segments.slice(0, n).join('.');
      if (keys.has(candidate)) matched = candidate;
    }
    if (!matched) {
      general.push(`${p.path}: ${message}`);
      continue;
    }
    const text = p.index !== null && matched === p.path ? `[${p.index}] ${message}` : message;
    byKey[matched] = byKey[matched] ? `${byKey[matched]} ${text}` : text;
  }
  return { byKey, general };
}
