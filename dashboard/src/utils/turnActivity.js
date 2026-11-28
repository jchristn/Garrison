// What a running turn is doing between pieces of output, so a run that is busy never looks stalled and a run that
// has gone quiet says so honestly. Plain data (no JSX) so Node tests can import it.

/** Text that arrived this recently counts as the model still writing, so no extra line shows under it. */
export const ACTIVITY_WRITING_MS = 2000;

/**
 * With no new event for this long, the line stops saying "working" and says how long it has been quiet instead.
 * Two minutes by default; a tool that is still running is exempt, because long tool calls are normal.
 */
export const ACTIVITY_QUIET_MS = 120000;

const WORKER_STATUSES = new Set(['Pending', 'Queued', 'Leased']);

/**
 * The state of a running turn:
 * - `worker`: still waiting for a worker to take it (Pending, Queued, Leased);
 * - `approval`: suspended, waiting for a person to approve a tool call;
 * - `tool`: a tool call is running (`tool` is its name);
 * - `writing`: text arrived in the last `writingMs`, so the streaming text itself shows the work;
 * - `working`: between steps (a tool call finished, or the model is thinking before it writes);
 * - `quiet`: no event for `quietMs` or longer, while the run is still not finished.
 * `lastEventAt` and `startedAt` are epoch milliseconds (either may be null); `segments` come from buildPreview.
 */
export function turnActivity({ status, segments = [], lastEventAt = null, startedAt = null, now = Date.now(), writingMs = ACTIVITY_WRITING_MS, quietMs = ACTIVITY_QUIET_MS }) {
  if (WORKER_STATUSES.has(status)) return { state: 'worker', tool: null, quietMs: 0 };
  if (status === 'Suspended') return { state: 'approval', tool: null, quietMs: 0 };
  const last = segments.length ? segments[segments.length - 1] : null;
  const since = lastEventAt || startedAt;
  const idle = since ? Math.max(0, now - since) : 0;
  if (last && last.kind === 'tool' && last.status === 'running') return { state: 'tool', tool: last.name || null, quietMs: idle };
  if (idle >= quietMs) return { state: 'quiet', tool: null, quietMs: idle };
  if (last && last.kind === 'text' && idle < writingMs) return { state: 'writing', tool: null, quietMs: idle };
  return { state: 'working', tool: null, quietMs: idle };
}
