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
    /// Notification outbox and delivery log (P12.14), the leader's sweep cursors, and the event source queries the sweep
    /// reads (finished runs and pipeline runs, requested approvals and stage reviews). A unique key per endpoint and event
    /// makes queueing idempotent; claims are compare-and-set so one replica sends a delivery at a time.
    /// </summary>
    public interface INotificationDeliveryMethods
    {
        /// <summary>
        /// Queue a delivery unless one with the same endpoint and event key exists.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when queued, false when the event was already queued for the endpoint.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<bool> TryCreateAsync(NotificationDelivery obj, CancellationToken token = default);

        /// <summary>
        /// Read a delivery in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<NotificationDelivery?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate an endpoint's deliveries, newest first by default.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="endpointId">Endpoint identifier.</param>
        /// <param name="status">Optional status filter.</param>
        /// <param name="query">Query (paging and ordering).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<EnumerationResult<NotificationDelivery>> EnumerateAsync(string tenantId, string endpointId, NotificationDeliveryStatusEnum? status, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Deliveries ready to send: Pending with nextAttemptUtc at or before now, and Delivering with an expired claim.
        /// </summary>
        /// <param name="nowUtc">Time (UTC).</param>
        /// <param name="limit">Most records. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Deliveries, earliest due first.</returns>
        Task<List<NotificationDelivery>> ListDueAsync(DateTime nowUtc, int limit, CancellationToken token = default);

        /// <summary>
        /// Claim a due delivery for one replica (compare-and-set to Delivering).
        /// </summary>
        /// <param name="id">Delivery identifier.</param>
        /// <param name="claimedBy">Claiming replica.</param>
        /// <param name="nowUtc">Time (UTC).</param>
        /// <param name="claimUntilUtc">Claim expiry (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this caller holds the claim.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> TryClaimAsync(string id, string claimedBy, DateTime nowUtc, DateTime claimUntilUtc, CancellationToken token = default);

        /// <summary>
        /// Record an attempt's result and release the claim. Applies only while the caller still holds the claim.
        /// </summary>
        /// <param name="obj">Delivery with status, attempts, next attempt, and last attempt fields set.</param>
        /// <param name="claimedBy">Replica that holds the claim.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when recorded, false when the claim was lost.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        Task<bool> CompleteAttemptAsync(NotificationDelivery obj, string claimedBy, CancellationToken token = default);

        /// <summary>
        /// Delete deliveries in a final state (Succeeded or Failed) created before a time, in every tenant.
        /// </summary>
        /// <param name="olderThanUtc">Cutoff (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rows deleted.</returns>
        Task<int> PruneAsync(DateTime olderThanUtc, CancellationToken token = default);

        /// <summary>
        /// Read a sweep cursor.
        /// </summary>
        /// <param name="source">Event source.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Cursor, or null before the first sweep.</returns>
        /// <exception cref="ArgumentNullException">Thrown when source is null or empty.</exception>
        Task<NotificationCursor?> ReadCursorAsync(string source, CancellationToken token = default);

        /// <summary>
        /// Insert or replace a sweep cursor.
        /// </summary>
        /// <param name="cursor">Cursor.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when cursor is null.</exception>
        Task WriteCursorAsync(NotificationCursor cursor, CancellationToken token = default);

        /// <summary>
        /// Finished runs in the given tenants, ordered by (completedutc, id), strictly after a position and at or before
        /// an upper bound.
        /// </summary>
        /// <param name="tenantIds">Tenants; empty returns nothing.</param>
        /// <param name="afterUtc">Position timestamp (UTC).</param>
        /// <param name="afterId">Position identifier; empty starts at the timestamp.</param>
        /// <param name="untilUtc">Upper bound (UTC), inclusive.</param>
        /// <param name="limit">Most records. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Runs (main columns only).</returns>
        Task<List<Run>> ListFinishedRunsAsync(List<string> tenantIds, DateTime afterUtc, string afterId, DateTime untilUtc, int limit, CancellationToken token = default);

        /// <summary>
        /// Finished pipeline runs in the given tenants, ordered by (completedutc, id), after a position.
        /// </summary>
        /// <param name="tenantIds">Tenants; empty returns nothing.</param>
        /// <param name="afterUtc">Position timestamp (UTC).</param>
        /// <param name="afterId">Position identifier; empty starts at the timestamp.</param>
        /// <param name="untilUtc">Upper bound (UTC), inclusive.</param>
        /// <param name="limit">Most records. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pipeline runs (main columns only).</returns>
        Task<List<PipelineRun>> ListFinishedPipelineRunsAsync(List<string> tenantIds, DateTime afterUtc, string afterId, DateTime untilUtc, int limit, CancellationToken token = default);

        /// <summary>
        /// Permission approvals in the given tenants, ordered by (createdutc, id), after a position.
        /// </summary>
        /// <param name="tenantIds">Tenants; empty returns nothing.</param>
        /// <param name="afterUtc">Position timestamp (UTC).</param>
        /// <param name="afterId">Position identifier; empty starts at the timestamp.</param>
        /// <param name="untilUtc">Upper bound (UTC), inclusive.</param>
        /// <param name="limit">Most records. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Approvals.</returns>
        Task<List<Approval>> ListRequestedApprovalsAsync(List<string> tenantIds, DateTime afterUtc, string afterId, DateTime untilUtc, int limit, CancellationToken token = default);

        /// <summary>
        /// Pipeline stage reviews in the given tenants, ordered by (createdutc, id), after a position.
        /// </summary>
        /// <param name="tenantIds">Tenants; empty returns nothing.</param>
        /// <param name="afterUtc">Position timestamp (UTC).</param>
        /// <param name="afterId">Position identifier; empty starts at the timestamp.</param>
        /// <param name="untilUtc">Upper bound (UTC), inclusive.</param>
        /// <param name="limit">Most records. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Reviews.</returns>
        Task<List<PipelineReview>> ListRequestedReviewsAsync(List<string> tenantIds, DateTime afterUtc, string afterId, DateTime untilUtc, int limit, CancellationToken token = default);
    }
}
