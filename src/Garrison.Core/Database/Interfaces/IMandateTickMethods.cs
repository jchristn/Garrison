namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Keeper tick history (AA1).
    /// </summary>
    public interface IMandateTickMethods
    {
        /// <summary>
        /// Insert a tick.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<MandateTick> CreateAsync(MandateTick obj, CancellationToken token = default);

        /// <summary>
        /// Read a tick in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<MandateTick?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Update a tick's run, finish time, outcome, applied interval, cost, template, and error.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<MandateTick> UpdateAsync(MandateTick obj, CancellationToken token = default);

        /// <summary>
        /// Record the outcome a run reported: when the tick is not yet reported and not finished, set reported, outcome,
        /// summary, and requested next wake. The first report wins.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Tick identifier.</param>
        /// <param name="outcome">Reported outcome.</param>
        /// <param name="summary">Summary, or null.</param>
        /// <param name="requestedNextWakeSeconds">Requested next wake in seconds, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this call recorded the report.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> TryReportAsync(string tenantId, string id, TickOutcomeEnum outcome, string? summary, int? requestedNextWakeSeconds, CancellationToken token = default);

        /// <summary>
        /// Enumerate a mandate's ticks, newest first by default.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="mandateId">Mandate identifier.</param>
        /// <param name="outcome">Optional outcome filter.</param>
        /// <param name="query">Query (paging and ordering).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<EnumerationResult<MandateTick>> EnumerateAsync(string tenantId, string mandateId, TickOutcomeEnum? outcome, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// The most recent finished ticks of a mandate, newest first.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="mandateId">Mandate identifier.</param>
        /// <param name="limit">Most rows; at least 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Ticks.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<List<MandateTick>> ListRecentAsync(string tenantId, string mandateId, int limit, CancellationToken token = default);

        /// <summary>
        /// Delete finished ticks created before a time, in every tenant.
        /// </summary>
        /// <param name="olderThanUtc">Cutoff (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rows deleted.</returns>
        Task<int> PruneAsync(DateTime olderThanUtc, CancellationToken token = default);

        /// <summary>
        /// Keeper ticks of a tenant by identifier, for the activity trail (LP1.4).
        /// </summary>
        /// <param name="tenantId">Tenant identifier; every row read belongs to it.</param>
        /// <param name="ids">Identifiers; empty and duplicate values are ignored.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Ticks in no particular order; missing and other-tenant identifiers are left out.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        Task<List<MandateTick>> ListByIdsAsync(string tenantId, List<string> ids, CancellationToken token = default);
    }
}
