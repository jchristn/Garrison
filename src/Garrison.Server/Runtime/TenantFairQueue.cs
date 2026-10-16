namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Models;
    using QoSKit;

    /// <summary>
    /// Orders a bounded database candidate window with QoSKit weighted fair queuing. Successful claims carry virtual
    /// service forward across windows on this replica. The database remains authoritative. Thread-safe.
    /// </summary>
    public class TenantFairQueue
    {
        private readonly object _Lock = new object();
        private readonly Dictionary<string, double> _Finish = new Dictionary<string, double>(StringComparer.Ordinal);
        private double _Clock;

        /// <summary>Order candidates while retaining priority and age within each tenant.</summary>
        /// <param name="runs">Candidate window.</param>
        /// <param name="weights">Tenant weights, minimum 1; missing tenants receive weight 1.</param>
        /// <returns>Fair candidate order.</returns>
        public List<Run> Order(List<Run> runs, IReadOnlyDictionary<string, int> weights)
        {
            lock (_Lock)
            {
                List<WeightedFlow> flows = runs.Select(r => r.TenantId).Distinct(StringComparer.Ordinal)
                    .Select(id => new WeightedFlow(id, weights.TryGetValue(id, out int weight) ? Math.Max(1, weight) : 1)).ToList();
                HashSet<string> first = new HashSet<string>(StringComparer.Ordinal);
                QoSQueueOptions options = new QoSQueueOptions { Name = "garrison-tenant-fair-window", EnableMetrics = false, EnableTracing = false };
                using (WeightedFairQoSQueue<Run> queue = new WeightedFairQoSQueue<Run>(r => r.TenantId, flows, options, r =>
                {
                    if (!first.Add(r.TenantId)) return 1;
                    int weight = weights.TryGetValue(r.TenantId, out int configured) ? Math.Max(1, configured) : 1;
                    double debt = _Finish.TryGetValue(r.TenantId, out double finish) ? Math.Max(0, finish - _Clock) : 0;
                    return (int)Math.Min(Int32.MaxValue - 1, Math.Ceiling(debt * weight)) + 1;
                }, keyComparer: StringComparer.Ordinal))
                {
                    foreach (Run run in runs.OrderByDescending(r => r.Priority).ThenBy(r => r.CreatedUtc).ThenBy(r => r.Id, StringComparer.Ordinal)) queue.Enqueue(run);
                    List<Run> ordered = new List<Run>();
                    while (queue.TryDequeue(out Run next)) ordered.Add(next);
                    return ordered;
                }
            }
        }

        /// <summary>Charge service only after a successful database claim.</summary>
        /// <param name="tenantId">Claimed tenant.</param>
        /// <param name="weight">Current weight.</param>
        /// <param name="activeTenants">Tenants in the candidate window.</param>
        public void Claimed(string tenantId, int weight, IEnumerable<string> activeTenants)
        {
            lock (_Lock)
            {
                double finish = _Finish.TryGetValue(tenantId, out double prior) ? prior : _Clock;
                _Finish[tenantId] = Math.Max(_Clock, finish) + 1.0 / Math.Max(1, weight);
                List<string> active = activeTenants.Distinct(StringComparer.Ordinal).ToList();
                if (active.Count > 0) _Clock = Math.Max(_Clock, active.Min(id => _Finish.TryGetValue(id, out double value) ? value : _Clock));
                // Old tenants rejoin at the current virtual clock, so state is bounded by recently observed tenants.
                foreach (string id in _Finish.Where(p => p.Value < _Clock).Select(p => p.Key).ToList()) _Finish.Remove(id);
            }
        }
    }
}
