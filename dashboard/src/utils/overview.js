// Normalization for the tenant overview (GET /v1.0/api/tenants/{tenantId}/overview).
//
// The server returns status counts as arrays of { status, count } (OverviewResponse.RunsByStatus and
// NodesByStatus are List<StatusCount>). The client-side fallback builds plain { Status: count } maps.
// Both shapes normalize to a map so the KPI cards can read counts by status name.

const ACTIVE_RUN_STATUSES = ['Leased', 'Running', 'Cancelling'];

/** Convert [{ status, count }] or { Status: count } into { Status: count }; null for anything else. */
export function toStatusMap(value) {
  if (Array.isArray(value)) {
    const out = {};
    for (const entry of value) {
      if (!entry || entry.status === undefined || entry.status === null) continue;
      const count = Number(entry.count);
      out[entry.status] = (out[entry.status] || 0) + (Number.isFinite(count) ? count : 0);
    }
    return out;
  }
  if (value && typeof value === 'object') {
    const out = {};
    for (const [status, count] of Object.entries(value)) {
      const n = Number(count);
      out[status] = Number.isFinite(n) ? n : 0;
    }
    return out;
  }
  return null;
}

function finite(value) {
  const n = typeof value === 'string' && value.trim() === '' ? NaN : Number(value);
  return value !== null && value !== undefined && Number.isFinite(n) ? n : null;
}

function sum(map) {
  return Object.values(map).reduce((s, n) => s + n, 0);
}

/**
 * KPI numbers derived from an overview payload. Every value is a finite number or null (unknown).
 * `queued` and `active` prefer the server's all-time counts and fall back to the status map;
 * `succeeded` and `failed` come from runsByStatus (the last 24 hours on the server).
 */
export function overviewKpis(overview) {
  const runs = toStatusMap(overview?.runsByStatus);
  const nodes = toStatusMap(overview?.nodesByStatus);
  const fromRuns = (status) => (runs ? runs[status] || 0 : null);
  return {
    agents: finite(overview?.agents),
    deployments: finite(overview?.deployments),
    active: finite(overview?.active) ?? (runs ? ACTIVE_RUN_STATUSES.reduce((s, k) => s + (runs[k] || 0), 0) : null),
    queued: finite(overview?.queued) ?? fromRuns('Queued'),
    succeeded: fromRuns('Succeeded'),
    failed: fromRuns('Failed'),
    nodesReady: nodes ? nodes.Ready || 0 : null,
    nodesTotal: nodes ? sum(nodes) : null,
    nodesLost: nodes ? nodes.Lost || 0 : null
  };
}
