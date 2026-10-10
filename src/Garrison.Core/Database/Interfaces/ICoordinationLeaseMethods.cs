namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;

    /// <summary>
    /// CoordinationLease data access methods.
    /// </summary>
    public interface ICoordinationLeaseMethods
    {
        /// <summary>
        /// Create a CoordinationLease, including child rows.
        /// </summary>
        /// <param name="obj">Record to create.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The created record.</returns>
        Task<CoordinationLease> CreateAsync(CoordinationLease obj, CancellationToken token = default);

        /// <summary>
        /// Read a CoordinationLease by identifier without tenant scoping. For internal and system-administrator use.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<CoordinationLease?> ReadAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Read a CoordinationLease by name.
        /// </summary>
        /// <param name="name">Name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<CoordinationLease?> ReadByNameAsync(string name, CancellationToken token = default);

        /// <summary>
        /// Update a CoordinationLease, replacing child rows.
        /// </summary>
        /// <param name="obj">Record to update.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The updated record.</returns>
        Task<CoordinationLease> UpdateAsync(CoordinationLease obj, CancellationToken token = default);

        /// <summary>
        /// Delete a CoordinationLease and its child rows.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if a row was deleted.</returns>
        Task<bool> DeleteAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Check whether a CoordinationLease exists.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if it exists.</returns>
        Task<bool> ExistsAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate CoordinationLease records.
        /// </summary>
        /// <param name="query">Enumeration query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>A page of records.</returns>
        Task<EnumerationResult<CoordinationLease>> EnumerateAsync(EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Acquire or renew a named lease. Returns the fencing epoch when the caller holds the lease afterwards, or null
        /// when another holder has an unexpired lease. The epoch increments whenever the holder changes.
        /// </summary>
        /// <param name="name">Lease name.</param>
        /// <param name="holder">Caller identity.</param>
        /// <param name="durationMs">Lease duration in milliseconds.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Epoch or null.</returns>
        Task<long?> TryAcquireAsync(string name, string holder, int durationMs, CancellationToken token = default);

        /// <summary>
        /// Release a lease held by the caller.
        /// </summary>
        /// <param name="name">Lease name.</param>
        /// <param name="holder">Caller identity.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when released.</returns>
        Task<bool> ReleaseAsync(string name, string holder, CancellationToken token = default);
    }
}
