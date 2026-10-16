namespace Garrison.Server.Runtime
{
    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using System.Threading;
    using System;
    using Garrison.Core.Database;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;

    /// <summary>Read-only placement explanation using the scheduler's static and affinity filters. Thread-safe.</summary>
    public class PlacementExplanationService
    {
        private readonly DatabaseDriverBase _Database;

        /// <summary>Construct a diagnostic service. No mutation or claim methods are used.</summary>
        /// <param name="database">Database.</param>
        public PlacementExplanationService(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        /// <summary>Explain placement for an already authorized tenant run. Observations are advisory, not transactional.</summary>
        /// <param name="run">Tenant-scoped persisted run with its admitted placement requirements.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Global and per-node rejection codes without leasing, compiling or reserving capacity.</returns>
        public async Task<RunPlacementResponse> ExplainAsync(Run run, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            token.ThrowIfCancellationRequested();
            RunPlacementResponse response = new RunPlacementResponse { RunId = run.Id };
            if (run.Status != RunStatusEnum.Queued) response.Reasons.Add("RunNotQueued");
            Deployment? deployment = String.IsNullOrEmpty(run.DeploymentId) ? null : await _Database.Deployments.ReadAsync(run.TenantId, run.DeploymentId, token).ConfigureAwait(false);
            Tenant? tenant = await _Database.Tenants.ReadAsync(run.TenantId, token).ConfigureAwait(false);
            Agent? agent = await _Database.Agents.ReadAsync(run.TenantId, run.AgentId, token).ConfigureAwait(false);
            response.AdmissionRejection = SchedulerService.AdmissionRejection(tenant, agent, deployment, run);
            if (response.AdmissionRejection != null) response.Reasons.Add("AdmissionRejected");
            if (deployment != null && deployment.MaxConcurrentRuns > 0)
            {
                List<string> ancestors = new List<string>();
                string? current = run.ParentRunId;
                while (!String.IsNullOrEmpty(current) && ancestors.Count < 64 && !ancestors.Contains(current))
                {
                    ancestors.Add(current);
                    Run? parent = await _Database.Runs.ReadAsync(run.TenantId, current, token).ConfigureAwait(false);
                    current = parent?.ParentRunId;
                }
                if (await _Database.Runs.CountActiveByDeploymentAsync(run.DeploymentId, ancestors, token).ConfigureAwait(false) >= deployment.MaxConcurrentRuns)
                    response.Reasons.Add("DeploymentConcurrencyLimit");
            }
            foreach (UsageQuota quota in await _Database.UsageQuotas.ListForRunAsync(run, token).ConfigureAwait(false))
            {
                UsageQuotaUsage usage = await _Database.UsageQuotas.ReadUsageAsync(quota, response.TakenUtc, token).ConfigureAwait(false);
                if (quota.MaxConcurrentRuns.HasValue && usage.ActiveRuns >= quota.MaxConcurrentRuns.Value) response.Reasons.Add("QuotaConcurrencyLimit");
                if (quota.DailyTokenLimit.HasValue && usage.TokensUsed >= quota.DailyTokenLimit.Value) response.Reasons.Add("QuotaDailyTokenLimit");
                if (quota.DailyCostUsdLimit.HasValue && usage.CostUsd >= quota.DailyCostUsdLimit.Value) response.Reasons.Add("QuotaDailyCostLimit");
            }
            response.Reasons = response.Reasons.Distinct(StringComparer.Ordinal).ToList();
            Node? affinityNode = String.IsNullOrEmpty(run.AffinityNodeId) ? null : await _Database.Nodes.ReadAsync(run.AffinityNodeId, token).ConfigureAwait(false);
            Dictionary<string, NodePool?> pools = new Dictionary<string, NodePool?>(StringComparer.Ordinal);
            int skip = 0;
            while (true)
            {
                EnumerationResult<Node> page = await _Database.Nodes.EnumerateAsync(new EnumerationQuery { MaxResults = 1000, Skip = skip }, token).ConfigureAwait(false);
                foreach (Node node in page.Objects)
                {
                    token.ThrowIfCancellationRequested();
                    NodePool? pool = null;
                    if (!String.IsNullOrEmpty(node.NodePoolId) && !pools.TryGetValue(node.NodePoolId, out pool))
                    {
                        pool = await _Database.NodePools.ReadAsync(node.NodePoolId, token).ConfigureAwait(false);
                        pools[node.NodePoolId] = pool;
                    }
                    // Dedicated inventory is tenant-private, even when the caller can read runs in this tenant.
                    if (pool != null && pool.Tenants.Count > 0 && !pool.Tenants.Contains(run.TenantId)) continue;
                    NodePlacementResponse item = new NodePlacementResponse { NodeId = node.Id, Reasons = PlacementRules.Rejections(node, pool, run) };
                    if (ConversationService.DefersToAffinityNode(run, node, affinityNode, response.TakenUtc)) item.Reasons.Add("SessionAffinityWait");
                    List<Run> active = await _Database.Runs.ListActiveByNodeAsync(node.Id, token).ConfigureAwait(false);
                    bool normalSlot = active.Count < node.MaxConcurrentRuns;
                    bool reserveSlot = false;
                    if (!normalSlot && node.ChildReserveSlots > 0 && !String.IsNullOrEmpty(run.ParentRunId))
                    {
                        long waiting = await _Database.Runs.CountWaitingOnNodeAsync(node.Id, token).ConfigureAwait(false);
                        bool waitedChild = await _Database.Runs.IsWaitedChildAsync(run.TenantId, run.Id, token).ConfigureAwait(false);
                        reserveSlot = waitedChild && active.Count < node.MaxConcurrentRuns + DelegationCapacity.OpenReserveSlots(node, waiting);
                    }
                    if (!normalSlot && !reserveSlot) item.Reasons.Add("NodeCapacityFull");
                    item.Eligible = item.Reasons.Count == 0 && response.Reasons.Count == 0;
                    response.Nodes.Add(item);
                }
                if (page.EndOfResults || page.Objects.Count == 0) break;
                skip += page.Objects.Count;
            }
            response.Eligible = response.Nodes.Any(n => n.Eligible);
            return response;
        }
    }
}
