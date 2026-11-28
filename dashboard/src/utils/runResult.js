// Run result text (UXP1-V037): a harness result is prose, but it often carries JSON, either as the whole text or as a
// tool result on one line ("Tool result: {...}"). These helpers find that JSON so the Result tab can pretty-print it in
// a mono block instead of showing one long escaped line in proportional type.

/** The shortest JSON text worth a block of its own; shorter values stay inline. */
export const MIN_JSON_BLOCK_LENGTH = 24;

function parseJson(text) {
  const trimmed = (text || '').trim();
  if (trimmed.length < MIN_JSON_BLOCK_LENGTH || !/^[[{]/.test(trimmed)) return undefined;
  try {
    const value = JSON.parse(trimmed);
    return value && typeof value === 'object' ? value : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Split a result into prose and JSON segments: [{ type: 'text', text }] and [{ type: 'json', text, value }], in order.
 * The whole text is tried first, then each line from its first brace or bracket to its end. Returns null when the
 * result holds no JSON, so the caller keeps its normal Markdown view.
 */
export function resultSegments(text) {
  if (typeof text !== 'string' || !text.trim()) return null;
  const whole = parseJson(text);
  if (whole !== undefined) return [{ type: 'json', text: text.trim(), value: whole }];
  const out = [];
  let prose = [];
  let found = false;
  const flush = () => {
    if (prose.length) out.push({ type: 'text', text: prose.join('\n') });
    prose = [];
  };
  for (const line of text.split('\n')) {
    const at = line.search(/[[{]/);
    const value = at >= 0 ? parseJson(line.slice(at)) : undefined;
    if (value === undefined) {
      prose.push(line);
      continue;
    }
    found = true;
    const lead = line.slice(0, at);
    if (lead.trim()) prose.push(lead.trimEnd());
    flush();
    out.push({ type: 'json', text: line.slice(at).trim(), value });
  }
  flush();
  return found ? out.filter((s) => s.type === 'json' || s.text.trim()) : null;
}
