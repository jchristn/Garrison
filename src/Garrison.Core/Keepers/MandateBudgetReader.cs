namespace Garrison.Core.Keepers
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Reads a keeper's spend against its budgets (AA3.3). The daily spend comes from the usage ledger through the Mandate
    /// quota scope, so it survives run retention. Thread-safe.
    /// </summary>
    public class MandateBudgetReader
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public MandateBudgetReader(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Spend of a tick run against the budgets of the revision its tick ran under.
        /// </summary>
        /// <param name="run">Keeper run.</param>
        /// <param name="utc">Time that selects the UTC day.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The status, or null when the run is not a tick or its revision sets no budget.</returns>
        /// <exception cref="ArgumentNullException">Thrown when run is null.</exception>
        public async Task<MandateBudgetStatus?> ReadForRunAsync(Run run, DateTime utc, CancellationToken token = default)
        {
            if (run == null) throw new ArgumentNullException(nameof(run));
            if (run.Kind != RunKindEnum.Keeper || String.IsNullOrEmpty(run.MandateId) || String.IsNullOrEmpty(run.MandateTickId)) return null;
            MandateTick? tick = await _Database.MandateTicks.ReadAsync(run.TenantId, run.MandateTickId, token).ConfigureAwait(false);
            string? revisionId = tick?.RevisionId;
            if (String.IsNullOrEmpty(revisionId))
            {
                Mandate? mandate = await _Database.Mandates.ReadAsync(run.TenantId, run.MandateId, token).ConfigureAwait(false);
                revisionId = mandate?.CurrentRevisionId;
            }
            if (String.IsNullOrEmpty(revisionId)) return null;
            MandateRevision? revision = await _Database.MandateRevisions.ReadAsync(run.TenantId, revisionId, token).ConfigureAwait(false);
            if (revision == null || (!revision.BudgetPerTickUsd.HasValue && !revision.BudgetPerDayUsd.HasValue)) return null;
            double spent = run.CompletedUtc.HasValue ? 0 : Math.Max(0, run.CostUsd ?? 0);
            MandateBudgetStatus status = await ReadAsync(run.TenantId, run.MandateId, revision, utc, token).ConfigureAwait(false);
            status.TickSpentUsd = spent;
            status.DaySpentUsd += spent;
            return status;
        }

        /// <summary>
        /// Spend of a mandate in the UTC day of the given time against a revision's budgets.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="mandateId">Mandate identifier.</param>
        /// <param name="revision">Revision whose budgets apply.</param>
        /// <param name="utc">Time that selects the UTC day.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The status; TickSpentUsd is 0.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        public async Task<MandateBudgetStatus> ReadAsync(string tenantId, string mandateId, MandateRevision revision, DateTime utc, CancellationToken token = default)
        {
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (String.IsNullOrEmpty(mandateId)) throw new ArgumentNullException(nameof(mandateId));
            if (revision == null) throw new ArgumentNullException(nameof(revision));
            MandateBudgetStatus status = new MandateBudgetStatus();
            status.BudgetPerTickUsd = revision.BudgetPerTickUsd;
            status.BudgetPerDayUsd = revision.BudgetPerDayUsd;
            status.WindowResetUtc = DateTime.SpecifyKind(utc.Date.AddDays(1), DateTimeKind.Utc);
            if (revision.BudgetPerDayUsd.HasValue)
            {
                UsageQuota scope = new UsageQuota();
                scope.TenantId = tenantId;
                scope.Scope = UsageQuotaScopeEnum.Mandate;
                scope.ResourceId = mandateId;
                UsageQuotaUsage usage = await _Database.UsageQuotas.ReadUsageAsync(scope, utc, token).ConfigureAwait(false);
                status.DaySpentUsd = Math.Max(0, usage.CostUsd);
            }
            return status;
        }

        #endregion
    }
}
