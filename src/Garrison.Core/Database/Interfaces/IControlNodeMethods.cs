namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;

    /// <summary>
    /// Control-plane replica rows (P10.19). Each replica writes only its own row; the leader marks silent rows Offline and
    /// deletes old Offline rows.
    /// </summary>
    public interface IControlNodeMethods
    {
        /// <summary>
        /// Insert the row, or replace every stored column of an existing row with the same identifier. Used for
        /// registration and for every heartbeat, so a row the leader marked Offline (or deleted) comes back.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null or has no identifier.</exception>
        Task<ControlNode> UpsertAsync(ControlNode obj, CancellationToken token = default);

        /// <summary>
        /// Read a row.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        Task<ControlNode?> ReadAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate rows. Search matches the name; created ordering uses the start time.
        /// </summary>
        /// <param name="query">Query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when query is null.</exception>
        Task<EnumerationResult<ControlNode>> EnumerateAsync(EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Set the status of a row and record the time as its last heartbeat.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="status">Status.</param>
        /// <param name="nowUtc">Current time.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a row was updated.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        Task<bool> SetStatusAsync(string id, ControlNodeStatusEnum status, DateTime nowUtc, CancellationToken token = default);

        /// <summary>
        /// Mark rows that are not Offline and last heartbeated before the cutoff as Offline, with zero activity.
        /// </summary>
        /// <param name="cutoffUtc">Cutoff.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Identifiers of the rows marked Offline.</returns>
        Task<List<string>> MarkSilentOfflineAsync(DateTime cutoffUtc, CancellationToken token = default);

        /// <summary>
        /// Delete Offline rows whose last heartbeat is before the cutoff.
        /// </summary>
        /// <param name="cutoffUtc">Cutoff.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rows deleted.</returns>
        Task<int> DeleteOfflineAsync(DateTime cutoffUtc, CancellationToken token = default);

        /// <summary>
        /// Delete a row.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when a row was deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        Task<bool> DeleteAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Count rows by status.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>One entry per status present.</returns>
        Task<List<StatusCount>> CountByStatusAsync(CancellationToken token = default);
    }
}
