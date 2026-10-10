// Helpers for control nodes, the control-plane replicas listed by GET /v1.0/api/control-nodes (P10.19).

/** Heartbeat age, in milliseconds, past which a replica that is not Offline is shown as stale (15 seconds). */
export const HEARTBEAT_STALE_MS = 15000;

/** Milliseconds since the replica's last heartbeat, or null when the timestamp is missing or invalid. */
export function heartbeatAgeMs(lastHeartbeatUtc, now = Date.now()) {
  if (!lastHeartbeatUtc) return null;
  const ms = Date.parse(lastHeartbeatUtc);
  return Number.isFinite(ms) ? Math.max(0, now - ms) : null;
}

/**
 * True when a replica has gone quiet: its last heartbeat is older than `thresholdMs`. Replicas heartbeat every
 * 5 seconds, and the leader marks one Offline after 30 seconds of silence, so an Offline row is expected to be quiet
 * and is never stale.
 */
export function isHeartbeatStale(node, now = Date.now(), thresholdMs = HEARTBEAT_STALE_MS) {
  if (!node || node.status === 'Offline') return false;
  const age = heartbeatAgeMs(node.lastHeartbeatUtc, now);
  return age !== null && age > thresholdMs;
}

/** The replica that holds the leader lease in a list, or null. */
export function leaderOf(nodes) {
  return (nodes || []).find((n) => n && n.isLeader) || null;
}
