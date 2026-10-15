namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Trigger fire history (P12.5). A unique key per trigger (the cron occurrence or the webhook delivery identifier)
    /// makes each fire happen once.
    /// </summary>
    public interface ITriggerFireMethods
    {
        /// <summary>
        /// Insert a fire unless one with the same trigger and fire key exists.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when inserted, false when the key was already used.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<bool> TryCreateAsync(TriggerFire obj, CancellationToken token = default);

        /// <summary>
        /// Read a fire by its trigger and fire key.
        /// </summary>
        /// <param name="triggerId">Trigger identifier.</param>
        /// <param name="fireKey">Fire key.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<TriggerFire?> ReadByKeyAsync(string triggerId, string fireKey, CancellationToken token = default);

        /// <summary>
        /// Read a fire in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<TriggerFire?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Update a fire's outcome, run references, and error.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<TriggerFire> UpdateAsync(TriggerFire obj, CancellationToken token = default);

        /// <summary>
        /// Enumerate a trigger's fires, newest first by default.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="triggerId">Trigger identifier.</param>
        /// <param name="outcome">Optional outcome filter.</param>
        /// <param name="query">Query (paging and ordering).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<EnumerationResult<TriggerFire>> EnumerateAsync(string tenantId, string triggerId, TriggerFireOutcomeEnum? outcome, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Delete fires created before a time, in every tenant.
        /// </summary>
        /// <param name="olderThanUtc">Cutoff (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rows deleted.</returns>
        Task<int> PruneAsync(DateTime olderThanUtc, CancellationToken token = default);
    }
}
