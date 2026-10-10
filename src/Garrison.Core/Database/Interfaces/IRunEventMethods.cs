namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>
    /// RunEvent data access methods.
    /// </summary>
    public interface IRunEventMethods
    {
        /// <summary>
        /// Create a RunEvent, including child rows.
        /// </summary>
        /// <param name="obj">Record to create.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The created record.</returns>
        Task<RunEvent> CreateAsync(RunEvent obj, CancellationToken token = default);

        /// <summary>
        /// Read a RunEvent by identifier without tenant scoping. For internal and system-administrator use.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<RunEvent?> ReadAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Read a RunEvent by identifier within a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<RunEvent?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Update a RunEvent, replacing child rows.
        /// </summary>
        /// <param name="obj">Record to update.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The updated record.</returns>
        Task<RunEvent> UpdateAsync(RunEvent obj, CancellationToken token = default);

        /// <summary>
        /// Delete a RunEvent and its child rows.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if a row was deleted.</returns>
        Task<bool> DeleteAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Check whether a RunEvent exists.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if it exists.</returns>
        Task<bool> ExistsAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate RunEvent records.
        /// </summary>
        /// <param name="tenantId">Tenant identifier, or null to enumerate across tenants (system administrators only).</param>
        /// <param name="query">Enumeration query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>A page of records.</returns>
        Task<EnumerationResult<RunEvent>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Insert events, ignoring any whose (run, sequence) already exists so worker retries are idempotent.
        /// </summary>
        /// <param name="events">Events.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rows inserted.</returns>
        Task<int> InsertBatchAsync(List<RunEvent> events, CancellationToken token = default);

        /// <summary>
        /// Events after a sequence, in order.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="afterSequence">Exclusive lower bound.</param>
        /// <param name="limit">Maximum events (1 to 5000).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Events.</returns>
        Task<List<RunEvent>> ListAfterAsync(string runId, long afterSequence, int limit, CancellationToken token = default);

        /// <summary>
        /// Delete events persisted before a cutoff.
        /// </summary>
        /// <param name="olderThanUtc">Cutoff (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rows deleted.</returns>
        Task<int> PruneAsync(DateTime olderThanUtc, CancellationToken token = default);
    }
}
