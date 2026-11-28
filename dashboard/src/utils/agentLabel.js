// UXP1-S021: one way to name an agent in a select or a filter. Tables, the canvas, trails, and dialog titles show the
// agent's name (research-flaky), so a select that showed only the display name (Vendor Checker) looked like a different
// agent. A select shows both, display name first, and the name alone when there is no display name or they match.

/** "Display name (name)", or the name alone. Falls back to the ID when the record has neither. */
export function agentSelectLabel(agent) {
  if (!agent) return '';
  const name = String(agent.name || '').trim();
  const display = String(agent.displayName || '').trim();
  if (display && name && display.toLowerCase() !== name.toLowerCase()) return `${display} (${name})`;
  return name || display || agent.id || '';
}
