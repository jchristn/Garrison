namespace Garrison.Server.Runtime
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Models;
    using Garrison.Core.Protocol;
    using Garrison.Core.Services;

    /// <summary>
    /// Estimates missing completion cost from tenant-owned model prices before usage is persisted, including repairs.
    /// Reported cost, including zero, takes precedence. Unknown/disabled prices leave cost unknown. Thread-safe.
    /// </summary>
    public class RunCostEstimationService
    {
        private readonly DatabaseDriverBase _Database;

        /// <summary>Instantiate.</summary>
        /// <param name="database">Database.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public RunCostEstimationService(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        /// <summary>
        /// Fill missing cost on an execution report using its exact served model (or the run's last served model
        /// when a repair omits it). The price is read at completion; later edits do not rewrite saved run costs.
        /// </summary>
        /// <param name="run">Leased run.</param>
        /// <param name="report">Completion report.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run or report is null.</exception>
        public async Task ApplyAsync(Run run, RunCompleteRequest report, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (report == null) throw new ArgumentNullException(nameof(report));
            if (report.CostUsd.HasValue) return;
            string? model = String.IsNullOrWhiteSpace(report.ServedModel) ? run.ServedModel : report.ServedModel;
            if (String.IsNullOrWhiteSpace(model)) return;
            ModelPrice? price = await _Database.ModelPrices.ReadByModelAsync(run.TenantId, run.HarnessType, model.Trim(), token).ConfigureAwait(false);
            if (price == null || !price.Active) return;
            report.CostUsd = RunCostCalculator.Estimate(price, report.InputTokens, report.OutputTokens, report.CachedTokens, report.ReasoningTokens);
            report.CostEstimated = true;
        }
    }
}
