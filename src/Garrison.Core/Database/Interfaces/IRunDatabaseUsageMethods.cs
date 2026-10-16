namespace Garrison.Core.Database.Interfaces
{
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Models;

    /// <summary>Tenant-scoped per-run database attribution persistence.</summary>
    public interface IRunDatabaseUsageMethods
    {
        /// <summary>Atomically add one completed scope's counters to the run operation total.</summary>
        /// <param name="usage">Completed attribution scope.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Completion task.</returns>
        Task AddAsync(RunDatabaseUsage usage, CancellationToken token = default);
        /// <summary>Read all operation totals for a tenant-owned run.</summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Operation totals.</returns>
        Task<List<RunDatabaseUsage>> ListAsync(string tenantId, string runId, CancellationToken token = default);
    }
}
