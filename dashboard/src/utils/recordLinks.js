// Garrison record identifiers in chat answers (an approval apr_..., a run run_..., and so on) become links to the
// dashboard page that shows that record. Plain functions; the DOM walk runs on rendered Markdown.

import { pathFor } from '../config/navConfig';

/** Identifier prefix to the dashboard page that has a detail view for it. */
export const RECORD_PAGES = {
  apr: 'approvals',
  run: 'runs',
  cnv: 'conversations',
  agt: 'agents',
  sdr: 'studio',
  plr: 'pipelineRuns',
  tpl: 'promptTemplates'
};

const PATTERN = /\b(apr|run|cnv|agt|sdr|plr|tpl)_[A-Za-z0-9_]{6,}\b/g;

/** The records an answer mentions, in order of first mention: [{ id, kind, href }]. */
export function findRecordRefs(text) {
  const out = [];
  const seen = new Set();
  for (const m of String(text || '').matchAll(PATTERN)) {
    if (seen.has(m[0])) continue;
    seen.add(m[0]);
    out.push({ id: m[0], kind: m[1], href: pathFor(RECORD_PAGES[m[1]], m[0]) });
  }
  return out;
}

/**
 * Turn identifiers in the text nodes under `root` into links (`a.record-link` with data-record), skipping text that
 * is already inside a link. Returns the number of links made.
 */
export function linkifyRecords(root) {
  if (!root || typeof document === 'undefined') return 0;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    if (n.parentElement && !n.parentElement.closest('a') && PATTERN.test(n.nodeValue)) nodes.push(n);
    PATTERN.lastIndex = 0;
  }
  let made = 0;
  for (const node of nodes) {
    const text = node.nodeValue;
    const frag = document.createDocumentFragment();
    let last = 0;
    for (const m of text.matchAll(PATTERN)) {
      if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
      const a = document.createElement('a');
      a.href = pathFor(RECORD_PAGES[m[1]], m[0]);
      a.className = 'record-link';
      a.dataset.record = m[0];
      a.textContent = m[0];
      frag.appendChild(a);
      last = m.index + m[0].length;
      made += 1;
    }
    if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
    node.parentNode.replaceChild(frag, node);
  }
  return made;
}
