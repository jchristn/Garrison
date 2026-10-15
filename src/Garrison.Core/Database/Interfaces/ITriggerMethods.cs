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
    /// Trigger definitions (P12.5). Every read that takes a tenant filters by it. Cron firing advances the schedule with a
    /// compare-and-set on nextfireutc, so only one control-plane replica fires each occurrence.
    /// </summary>
    public interface ITriggerMethods
    {
        /// <summary>
        /// Insert a trigger.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<Trigger> CreateAsync(Trigger obj, CancellationToken token = default);

        /// <summary>
        /// Read a trigger in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record, or null when it does not exist in the tenant.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<Trigger?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read a trigger by name in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<Trigger?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default);

        /// <summary>
        /// Replace a trigger's configuration, signing secret, run-as principal, and schedule.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<Trigger> UpdateAsync(Trigger obj, CancellationToken token = default);

        /// <summary>
        /// Delete a trigger and its fire history. Runs it started are kept.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate a tenant's triggers. Search matches the name.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="type">Optional type filter.</param>
        /// <param name="query">Query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<EnumerationResult<Trigger>> EnumerateAsync(string tenantId, TriggerTypeEnum? type, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Active cron triggers in every tenant whose next fire is at or before a time, earliest first.
        /// </summary>
        /// <param name="nowUtc">Time (UTC).</param>
        /// <param name="limit">Most records. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Due triggers.</returns>
        Task<List<Trigger>> ListDueAsync(DateTime nowUtc, int limit, CancellationToken token = default);

        /// <summary>
        /// Compare-and-set the schedule of an active cron trigger: move nextfireutc from the expected value to the next
        /// one and record the occurrence being fired. Exactly one caller wins for each occurrence.
        /// </summary>
        /// <param name="id">Trigger identifier.</param>
        /// <param name="expectedNextUtc">The nextfireutc value read with the trigger.</param>
        /// <param name="nextUtc">New nextfireutc, or null when the schedule never fires again.</param>
        /// <param name="firedUtc">Occurrence being fired (stored as lastfireutc).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this caller won the occurrence.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        Task<bool> TryAdvanceAsync(string id, DateTime expectedNextUtc, DateTime? nextUtc, DateTime firedUtc, CancellationToken token = default);

        /// <summary>
        /// Record a fire's outcome on its trigger: increments fireCount and sets lastFireOutcome (and lastFireUtc for
        /// webhook and manual fires).
        /// </summary>
        /// <param name="id">Trigger identifier.</param>
        /// <param name="outcome">Outcome.</param>
        /// <param name="firedUtc">Fire time to store as lastfireutc, or null to keep the value the schedule set.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        Task RecordFireAsync(string id, TriggerFireOutcomeEnum outcome, DateTime? firedUtc, CancellationToken token = default);

        /// <summary>
        /// Names of the tenant's triggers that reference a resource.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="column">agentid, deploymentid, pipelineid, or inputtemplateid.</param>
        /// <param name="resourceId">Resource identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Trigger names, ordered by name.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        /// <exception cref="ArgumentException">Thrown when column is not one of the listed values.</exception>
        Task<List<string>> NamesReferencingAsync(string tenantId, string column, string resourceId, CancellationToken token = default);
    }
}
