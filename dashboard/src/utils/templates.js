// Template helpers mirroring the server's logic-light syntax (plan section 8.2).

const KEYWORDS = new Set(['else', 'this']);

/**
 * Extract variable paths referenced by a template: {{a.b}}, {{a | default: "x"}}, {{#if a}}, {{#each a}}.
 * Includes ({{> name}}), closing tags, and raw blocks are ignored.
 * @param {string} content
 * @returns {string[]} Sorted unique variable paths.
 */
export function extractVariables(content) {
  const found = new Set();
  const text = String(content || '').replace(/\{\{\{\{raw\}\}\}\}[\s\S]*?\{\{\{\{\/raw\}\}\}\}/g, '');
  const re = /\{\{\s*([#/>]?)\s*([^}]*?)\s*\}\}/g;
  let m;
  while ((m = re.exec(text))) {
    const sigil = m[1];
    let expr = m[2];
    if (sigil === '/' || sigil === '>') continue;
    if (sigil === '#') expr = expr.replace(/^(if|each|unless)\s+/, '');
    const path = expr.split('|')[0].trim();
    if (!path || KEYWORDS.has(path) || path.startsWith('this.') || path.startsWith('"')) continue;
    if (/^[A-Za-z_][\w.]*$/.test(path)) found.add(path);
  }
  return [...found].sort();
}
