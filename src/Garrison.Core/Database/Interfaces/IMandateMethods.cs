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
    /// Mandates (AA1). Configuration fields and scheduling state are written by separate methods so a person's edit never
    /// overwrites the scheduler's state. Claims and tick completion are compare-and-set operations, so several replicas
    /// produce one tick per due wake (AA-014).
    /// </summary>
    public interface IMandateMethods
    {
        /// <summary>
        /// Insert a mandate row (not its revisions).
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<Mandate> CreateAsync(Mandate obj, CancellationToken token = default);

        /// <summary>
        /// Read a mandate in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<Mandate?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read a mandate by name in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="name">Name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<Mandate?> ReadByNameAsync(string tenantId, string name, CancellationToken token = default);

        /// <summary>
        /// Update configuration fields: name, description, deployment, and run-as principal.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<Mandate> UpdateAsync(Mandate obj, CancellationToken token = default);

        /// <summary>
        /// Update status and schedule: status, current revision, next wake, pending wake source, current interval, and
        /// consecutive quiet ticks. Used by publish, pause, resume, wake, and the brakes.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<Mandate> UpdateScheduleAsync(Mandate obj, CancellationToken token = default);

        /// <summary>
        /// Delete a mandate with its revisions, signals, and ticks. Runs keep their mandate reference.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate mandates in a tenant, newest first by default.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="status">Optional status filter.</param>
        /// <param name="agentId">Optional agent filter.</param>
        /// <param name="deploymentId">Optional deployment filter.</param>
        /// <param name="query">Query (paging, ordering, search on name).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or query is null.</exception>
        Task<EnumerationResult<Mandate>> EnumerateAsync(string tenantId, MandateStatusEnum? status, string? agentId, string? deploymentId, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// List Active mandates whose next wake is at or before a time, oldest due first, in every tenant.
        /// </summary>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <param name="limit">Most rows; at least 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Due mandates.</returns>
        Task<List<Mandate>> ListDueAsync(DateTime nowUtc, int limit, CancellationToken token = default);

        /// <summary>
        /// List mandates that have a tick in flight, in every tenant, so the scheduler can finalize ticks whose run ended.
        /// </summary>
        /// <param name="limit">Most rows; at least 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Mandates with an active tick.</returns>
        Task<List<Mandate>> ListWithActiveTickAsync(int limit, CancellationToken token = default);

        /// <summary>
        /// Claim a due wake: when the mandate is Active, has no tick in flight, and its next wake still equals the
        /// expected value, set the active tick, clear the next wake and pending source, and count the tick. Exactly one
        /// caller wins.
        /// </summary>
        /// <param name="id">Mandate identifier.</param>
        /// <param name="expectedNextWakeUtc">Next wake the caller read.</param>
        /// <param name="tickId">Tick identifier to record as active.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when claimed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> TryClaimAsync(string id, DateTime expectedNextWakeUtc, string tickId, CancellationToken token = default);

        /// <summary>
        /// Move a due wake that cannot run because a tick is still in flight: when the next wake still equals the expected
        /// value, set it to the given time and clear the pending source. Exactly one caller wins.
        /// </summary>
        /// <param name="id">Mandate identifier.</param>
        /// <param name="expectedNextWakeUtc">Next wake the caller read.</param>
        /// <param name="nextWakeUtc">New next wake.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when moved.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        Task<bool> TryDeferAsync(string id, DateTime expectedNextWakeUtc, DateTime nextWakeUtc, CancellationToken token = default);

        /// <summary>
        /// Change a mandate's status when it still has the expected status (AA3 brakes): set the status and next wake and
        /// clear the pending wake source. Exactly one caller wins.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Mandate identifier.</param>
        /// <param name="expected">Status the caller read.</param>
        /// <param name="status">New status.</param>
        /// <param name="nextWakeUtc">New next wake, or null for none.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when changed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or id is null or empty.</exception>
        Task<bool> TrySetStatusAsync(string tenantId, string id, MandateStatusEnum expected, MandateStatusEnum status, DateTime? nextWakeUtc, CancellationToken token = default);

        /// <summary>
        /// Return every CapReached mandate whose next wake (the daily window reset) has passed to Active (AA3.3), so the
        /// sweep's due list picks it up.
        /// </summary>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Mandates reactivated.</returns>
        Task<int> ReactivateCapsAsync(DateTime nowUtc, CancellationToken token = default);

        /// <summary>
        /// Record the run of the active tick.
        /// </summary>
        /// <param name="id">Mandate identifier.</param>
        /// <param name="tickId">Active tick identifier.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the tick was still active.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> SetActiveRunAsync(string id, string tickId, string runId, CancellationToken token = default);

        /// <summary>
        /// Finish the active tick: when the active tick still equals the given one, clear the active tick and run and write
        /// the schedule and last-tick fields of obj. A pending wake (for example a manual wake requested during the tick)
        /// is kept when its time is earlier than obj's next wake. Exactly one caller wins.
        /// </summary>
        /// <param name="obj">Mandate carrying the new schedule and last-tick fields.</param>
        /// <param name="tickId">Tick being finished.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when finished by this call.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> TryFinishTickAsync(Mandate obj, string tickId, CancellationToken token = default);

        /// <summary>
        /// Request a wake now: set the next wake to the given time and the pending source, unless a nearer wake is already
        /// scheduled. Works while a tick is in flight; the wake then starts after it.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Mandate identifier.</param>
        /// <param name="source">Wake source.</param>
        /// <param name="wakeUtc">Requested wake time.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the mandate exists and is Active.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> RequestWakeAsync(string tenantId, string id, WakeSourceEnum source, DateTime wakeUtc, CancellationToken token = default);

        /// <summary>
        /// Names of mandates in a tenant that reference a resource through a column (agentid or deploymentid), for
        /// refusing deletes of referenced resources.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="column">agentid or deploymentid.</param>
        /// <param name="resourceId">Resource identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Mandate names, sorted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or resourceId is null or empty.</exception>
        /// <exception cref="ArgumentException">Thrown when column is not agentid or deploymentid.</exception>
        Task<List<string>> NamesReferencingAsync(string tenantId, string column, string resourceId, CancellationToken token = default);
    }
}
