namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;

    /// <summary>
    /// Escalation data access (AA2). Every method that takes a tenant filters by it.
    /// </summary>
    public interface IEscalationMethods
    {
        /// <summary>
        /// Create an escalation with its options.
        /// </summary>
        /// <param name="obj">Escalation.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The escalation.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<Escalation> CreateAsync(Escalation obj, CancellationToken token = default);

        /// <summary>
        /// Read an escalation with its options.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Escalation identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The escalation, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or id is null or empty.</exception>
        Task<Escalation?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate escalations with their options: Open first, then newest first.
        /// </summary>
        /// <param name="filter">Filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when filter or its tenant is null.</exception>
        Task<EnumerationResult<Escalation>> EnumerateAsync(EscalationFilter filter, CancellationToken token = default);

        /// <summary>
        /// Resolve an Open escalation: set its status, answer, resolver, and time, and clear its timeout. Compare-and-set on
        /// Open, so only one resolution wins.
        /// </summary>
        /// <param name="obj">Escalation carrying the resolution fields.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this call resolved it.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<bool> TryResolveAsync(Escalation obj, CancellationToken token = default);

        /// <summary>
        /// Record that an Open escalation was escalated up to another and clear its timeout. Compare-and-set on Open with no
        /// escalation recorded yet.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Escalation identifier.</param>
        /// <param name="escalatedToId">The new escalation's identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this call recorded it.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> TrySetEscalatedToAsync(string tenantId, string id, string escalatedToId, CancellationToken token = default);

        /// <summary>
        /// Record the run started to answer an escalation. Bookkeeping only: lastUpdateUtc does not change.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Escalation identifier.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task SetRoutedRunAsync(string tenantId, string id, string runId, CancellationToken token = default);

        /// <summary>
        /// Open escalations whose timeout has passed, in all tenants, oldest first.
        /// </summary>
        /// <param name="nowUtc">Current time.</param>
        /// <param name="limit">Most to return. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Escalations without options.</returns>
        Task<List<Escalation>> ListExpiredAsync(DateTime nowUtc, int limit, CancellationToken token = default);

        /// <summary>
        /// Answered escalations raised by a mandate's ticks whose answer no tick has carried yet, oldest first.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="mandateId">Mandate identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Escalations with options.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or mandateId is null or empty.</exception>
        Task<List<Escalation>> ListUndeliveredAsync(string tenantId, string mandateId, CancellationToken token = default);

        /// <summary>
        /// Record the tick whose input carries these answers. Only escalations not yet delivered change. Bookkeeping only:
        /// lastUpdateUtc does not change.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="ids">Escalation identifiers.</param>
        /// <param name="tickId">Tick identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Number of escalations marked.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<int> MarkDeliveredAsync(string tenantId, List<string> ids, string tickId, CancellationToken token = default);

        /// <summary>
        /// Count the tenant's Open escalations.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Count.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        Task<long> CountOpenAsync(string tenantId, CancellationToken token = default);

        /// <summary>
        /// True when a run has an Open Blocking escalation.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the run still waits on one.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or runId is null or empty.</exception>
        Task<bool> HasOpenBlockingAsync(string tenantId, string runId, CancellationToken token = default);

        /// <summary>
        /// Escalations of a tenant changed after a position, ordered by (lastupdateutc, id), for the escalations channel.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="afterUtc">Position timestamp (UTC).</param>
        /// <param name="afterId">Position identifier; empty starts at the timestamp.</param>
        /// <param name="limit">Most records. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Escalations with options.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty.</exception>
        Task<List<Escalation>> ListChangedAsync(string tenantId, DateTime afterUtc, string afterId, int limit, CancellationToken token = default);
    }
}
