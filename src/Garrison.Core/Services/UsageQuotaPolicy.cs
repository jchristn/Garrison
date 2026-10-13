namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Models;

    /// <summary>Reads quota status and applies a known remaining daily cost allowance to compiled harness budgets. Thread-safe.</summary>
    public class UsageQuotaPolicy
    {
        private readonly DatabaseDriverBase _Database;

        /// <summary>Instantiate.</summary>
        /// <param name="database">Database.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public UsageQuotaPolicy(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        /// <summary>Whether a queued run is held by a token, cost, or active-concurrency quota. Atomic enforcement happens in the claim transaction.</summary>
        /// <param name="run">Run.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>True when held.</returns>
        public async Task<bool> HeldAsync(Run run, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            List<UsageQuota> quotas = await _Database.UsageQuotas.ListForRunAsync(run, token).ConfigureAwait(false);
            foreach (UsageQuota quota in quotas)
            {
                UsageQuotaUsage usage = await _Database.UsageQuotas.ReadUsageAsync(quota, DateTime.UtcNow, token).ConfigureAwait(false);
                if (quota.DailyTokenLimit.HasValue && usage.TokensUsed >= quota.DailyTokenLimit.Value) return true;
                if (quota.DailyCostUsdLimit.HasValue && usage.CostUsd >= quota.DailyCostUsdLimit.Value) return true;
                if (quota.MaxConcurrentRuns.HasValue && usage.ActiveRuns >= quota.MaxConcurrentRuns.Value) return true;
            }
            return false;
        }

        /// <summary>Lower the compilation copy's maxBudgetUsd to the smallest remaining daily cost allowance. Missing cost does not block or become zero.</summary>
        /// <param name="deployment">Compilation copy, never persisted.</param>
        /// <param name="run">Run; prior repair cost reduces its remaining allowance.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when deployment or run is null.</exception>
        /// <exception cref="CompilationException">Thrown with QuotaExceeded when known daily allowance is exhausted.</exception>
        public async Task ApplyBudgetAsync(Deployment deployment, Run run, CancellationToken token = default)
        {
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            if (run == null) throw new ArgumentNullException(nameof(run));
            List<UsageQuota> quotas = await _Database.UsageQuotas.ListForRunAsync(run, token).ConfigureAwait(false);
            double? allowance = null;
            foreach (UsageQuota quota in quotas)
            {
                if (!quota.DailyCostUsdLimit.HasValue) continue;
                UsageQuotaUsage usage = await _Database.UsageQuotas.ReadUsageAsync(quota, DateTime.UtcNow, token).ConfigureAwait(false);
                double remaining = Math.Max(0, quota.DailyCostUsdLimit.Value - usage.CostUsd - Math.Max(0, run.CompletedUtc.HasValue ? 0 : run.CostUsd ?? 0));
                if (remaining <= 0) throw new CompilationException("QuotaExceeded", quota.Scope + " " + quota.ResourceId + " has no known daily cost allowance left (quota " + quota.Id + ").");
                allowance = allowance.HasValue ? Math.Min(allowance.Value, remaining) : remaining;
            }
            if (allowance.HasValue) deployment.MaxBudgetUsd = deployment.MaxBudgetUsd.HasValue ? Math.Min(deployment.MaxBudgetUsd.Value, allowance.Value) : allowance;
        }
    }
}
