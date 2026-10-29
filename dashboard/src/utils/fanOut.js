// Fan-out groups (AD5): child runs a run started together with garrison_fan_out and joins under a policy, a budget,
// and a deadline. Helpers shared by the run tree on Run detail, its group panel, and tests.

/** How often (ms) a running group refreshes while its live channel is not subscribed. */
export const FAN_OUT_POLL_MS = 5000;

/** WebSocket channel that pushes fan-out.status for one group. */
export function fanOutChannel(groupId) {
  return `fan-out:${groupId}`;
}

/** True when a WebSocket message is a fan-out.status for this group. */
export function isFanOutStatus(message, groupId) {
  return message?.type === 'fan-out.status' && !!message.fanOutGroup && message.fanOutGroup.fanOutGroupId === groupId;
}

/** Badge tone for a group status. Every badge also carries the translated status, so tone is never the only signal. */
export function fanOutTone(status) {
  switch (status) {
    case 'Running':
      return 'info';
    case 'Joined':
      return 'success';
    case 'TimedOut':
    case 'BudgetExceeded':
      return 'warning';
    default:
      return 'neutral';
  }
}

/**
 * How much of a budget a group used: { share, over } with share between 0 and 1 for the bar, and over when the usage
 * passed the limit. Null when no positive limit is set (the group has no budget for this measure).
 */
export function budgetUse(used, limit) {
  const max = Number(limit);
  if (limit === null || limit === undefined || !Number.isFinite(max) || max <= 0) return null;
  const value = Math.max(0, Number(used) || 0);
  return { share: Math.min(1, value / max), over: value > max };
}

/** The label a member is shown with: its label, else its agent, else its position (1-based). */
export function memberLabel(member, index) {
  return member?.label || member?.agent || `#${index + 1}`;
}

/** Replace one group in a list by fanOutGroupId, keeping the order; a group not in the list is appended. */
export function mergeGroup(groups, updated) {
  if (!updated?.fanOutGroupId) return groups;
  const list = Array.isArray(groups) ? groups : [];
  const at = list.findIndex((g) => g.fanOutGroupId === updated.fanOutGroupId);
  if (at < 0) return [...list, updated];
  const next = [...list];
  next[at] = updated;
  return next;
}

/**
 * Arrange a run's children for the run tree. Children that share a fanOutGroupId are gathered under that group;
 * the rest stay in `others`, in their original order. Groups keep the order the server gave them (oldest first).
 * A group a child names but the group list does not have (its details failed to load) gets a placeholder entry
 * with `group` null, so its runs are still shown together.
 *
 * Returns { groups: [{ id, group, runs }], others }.
 */
export function buildRunTree(children, groups) {
  const list = Array.isArray(groups) ? groups.filter((g) => g && g.fanOutGroupId) : [];
  const entries = list.map((g) => ({ id: g.fanOutGroupId, group: g, runs: [] }));
  const byId = new Map(entries.map((e) => [e.id, e]));
  const others = [];
  for (const child of Array.isArray(children) ? children : []) {
    const id = child?.fanOutGroupId;
    if (!id) {
      others.push(child);
      continue;
    }
    let entry = byId.get(id);
    if (!entry) {
      entry = { id, group: null, runs: [] };
      byId.set(id, entry);
      entries.push(entry);
    }
    entry.runs.push(child);
  }
  return { groups: entries, others };
}
