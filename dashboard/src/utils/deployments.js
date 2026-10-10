// Deployment helpers shared by the agent detail page and its tests.

/**
 * Traffic share per deployment id: weight divided by the summed weight of the agent's active deployments.
 * Inactive deployments and deployments with weight 0 get 0. When every active weight is 0 the shares are all 0,
 * matching the server, which then has no deployment to pick.
 */
export function trafficShares(deployments) {
  const active = (deployments || []).filter((d) => d && d.active !== false);
  const total = active.reduce((sum, d) => sum + Math.max(0, Number(d.weight) || 0), 0);
  const out = {};
  for (const d of deployments || []) {
    if (!d) continue;
    out[d.id] = d.active !== false && total > 0 ? Math.max(0, Number(d.weight) || 0) / total : 0;
  }
  return out;
}
