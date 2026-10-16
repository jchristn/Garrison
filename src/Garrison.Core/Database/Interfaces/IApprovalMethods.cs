namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Requests;

    /// <summary>
    /// Permission approvals (P12.3). Every read that takes a tenant filters by it. Decisions are compare-and-set updates
    /// from Pending, so concurrent deciders on any replica produce exactly one decision.
    /// </summary>
    public interface IApprovalMethods
    {
        /// <summary>Atomically consume one human decision from the prior saved checkpoint for an exact current permission input.</summary>
        /// <param name="tenantId">Tenant.</param><param name="runId">Run.</param><param name="epoch">Current active lease epoch.</param><param name="tool">Exact tool name.</param><param name="kind">Permission kind.</param><param name="inputDigest">Canonical complete-input SHA-256.</param><param name="token">Cancellation token.</param><returns>Consumed prior approval, or null when no grant matches.</returns>
        Task<Approval?> TryConsumeResumeGrantAsync(string tenantId, string runId, long epoch, string tool, ApprovalKindEnum kind, string inputDigest, CancellationToken token = default);

        /// <summary>
        /// Insert an approval.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<Approval> CreateAsync(Approval obj, CancellationToken token = default);

        /// <summary>
        /// Read an approval in any tenant (internal use).
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        Task<Approval?> ReadAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Read an approval in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record, or null when it does not exist in the tenant.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<Approval?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate approvals.
        /// </summary>
        /// <param name="filter">Filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when filter is null.</exception>
        Task<EnumerationResult<Approval>> EnumerateAsync(ApprovalFilter filter, CancellationToken token = default);

        /// <summary>
        /// Decide a pending approval: applied only while its status is Pending.
        /// </summary>
        /// <param name="resolution">Decision.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this call decided it; false when it was no longer Pending or does not exist.</returns>
        /// <exception cref="ArgumentNullException">Thrown when resolution is null.</exception>
        Task<bool> ResolveAsync(ApprovalResolution resolution, CancellationToken token = default);

        /// <summary>
        /// Record the rule created from a decision with remember.
        /// </summary>
        /// <param name="id">Approval identifier.</param>
        /// <param name="ruleId">Rule identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task SetRememberedRuleAsync(string id, string ruleId, CancellationToken token = default);

        /// <summary>
        /// Pending approvals across tenants, oldest first (leader sweep).
        /// </summary>
        /// <param name="limit">Maximum rows (1 to 10000).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pending approvals.</returns>
        Task<List<Approval>> ListPendingAsync(int limit, CancellationToken token = default);

        /// <summary>
        /// Approvals of a run, oldest first.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="limit">Maximum rows (1 to 10000).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Approvals.</returns>
        /// <exception cref="ArgumentNullException">Thrown when runId is null or empty.</exception>
        Task<List<Approval>> ListByRunAsync(string runId, int limit, CancellationToken token = default);

        /// <summary>
        /// Approvals of several runs, oldest first (worker watch relay).
        /// </summary>
        /// <param name="runIds">Run identifiers; an empty list returns nothing.</param>
        /// <param name="limit">Maximum rows (1 to 10000).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Approvals.</returns>
        Task<List<Approval>> ListByRunsAsync(List<string> runIds, int limit, CancellationToken token = default);

        /// <summary>
        /// Count pending approvals.
        /// </summary>
        /// <param name="tenantId">Tenant identifier, or null for every tenant.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Count.</returns>
        Task<long> CountPendingAsync(string? tenantId, CancellationToken token = default);
    }
}
