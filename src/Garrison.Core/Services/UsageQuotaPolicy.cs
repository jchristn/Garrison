namespace Garrison.Core.Services
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Compilation;
    using Garrison.Core.Database;
    using Garrison.Core.Keepers;
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

        /// <summary>Lower the compilation copy's maxBudgetUsd to the smallest remaining daily cost allowance, and for a keeper tick to what its mandate budgets leave (AA3.3). Missing cost does not block or become zero.</summary>
        /// <param name="deployment">Compilation copy, never persisted.</param>
        /// <param name="run">Run; prior repair cost reduces its remaining allowance.</param>
        /// <param name="token">Cancellation.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when deployment or run is null.</exception>
        /// <exception cref="CompilationException">Thrown with QuotaExceeded when known daily allowance is exhausted, or MandateBudgetExceeded when a keeper tick's per-tick or daily budget is spent.</exception>
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
            // A keeper tick (AA3.3) also stays within what its per-tick and daily budgets leave.
            MandateBudgetStatus? keeper = await new MandateBudgetReader(_Database).ReadForRunAsync(run, DateTime.UtcNow, token).ConfigureAwait(false);
            if (keeper != null)
            {
                string? exhausted = keeper.ExhaustedBudget;
                if (exhausted != null) throw new CompilationException("MandateBudgetExceeded", "Mandate " + run.MandateId + " has nothing left of its " + exhausted + " (tick spent " + keeper.TickSpentUsd.ToString(System.Globalization.CultureInfo.InvariantCulture) + " USD, day spent " + keeper.DaySpentUsd.ToString(System.Globalization.CultureInfo.InvariantCulture) + " USD).");
                double? remaining = keeper.RemainingUsd;
                if (remaining.HasValue) allowance = allowance.HasValue ? Math.Min(allowance.Value, remaining.Value) : remaining;
            }
            if (allowance.HasValue) deployment.MaxBudgetUsd = deployment.MaxBudgetUsd.HasValue ? Math.Min(deployment.MaxBudgetUsd.Value, allowance.Value) : allowance;
        }
    }
}
