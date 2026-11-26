namespace Garrison.Core.Database.Interfaces
{
    using System;
    using System.Collections.Generic;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Enumeration;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Canary release data access (AA9.2, AA9.8). Steps live in a child table keyed by release and position. At most one
    /// release per agent is Running (a unique partial index backs the check). Step advances and status changes are
    /// compare-and-set. Every tenant read filters by tenant. Implementations are thread-safe.
    /// </summary>
    public interface ICanaryReleaseMethods
    {
        /// <summary>
        /// Insert a release with its steps.
        /// </summary>
        /// <param name="obj">Release.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored release.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        /// <exception cref="ConflictException">Thrown with code CanaryAlreadyRunning when obj is Running and the agent already has a Running release.</exception>
        Task<CanaryRelease> CreateAsync(CanaryRelease obj, CancellationToken token = default);

        /// <summary>
        /// Read a release in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Release identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The release with steps, or null.</returns>
        Task<CanaryRelease?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Write a release's current step, step start, status, rollback reason, and completion time unconditionally.
        /// Steps and thresholds do not change after creation.
        /// </summary>
        /// <param name="obj">Release.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The release.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<CanaryRelease> UpdateAsync(CanaryRelease obj, CancellationToken token = default);

        /// <summary>
        /// Move a Running release to its next step (compare-and-set on the current step index) and set StepStartedUtc.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Release identifier.</param>
        /// <param name="expectedIndex">Current step index the release must have.</param>
        /// <param name="utc">Start time of the next step (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the release was Running at expectedIndex and moved to expectedIndex plus one.</returns>
        Task<bool> AdvanceStepAsync(string tenantId, string id, int expectedIndex, DateTime utc, CancellationToken token = default);

        /// <summary>
        /// Move a release from one status to another (compare-and-set). Leaving Running sets CompletedUtc.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Release identifier.</param>
        /// <param name="expected">Status the release must have.</param>
        /// <param name="next">New status.</param>
        /// <param name="rollbackReason">Reason to store, or null to keep the current one.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the release had the expected status and moved.</returns>
        Task<bool> TransitionAsync(string tenantId, string id, CanaryStatusEnum expected, CanaryStatusEnum next, string? rollbackReason, CancellationToken token = default);

        /// <summary>
        /// Enumerate releases, newest first by default.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent filter, or null.</param>
        /// <param name="status">Status filter, or null.</param>
        /// <param name="query">Paging and ordering.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        Task<EnumerationResult<CanaryRelease>> EnumerateAsync(string tenantId, string? agentId, CanaryStatusEnum? status, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// The Running release of an agent.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agentId">Agent identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The release, or null.</returns>
        Task<CanaryRelease?> ReadRunningForAgentAsync(string tenantId, string agentId, CancellationToken token = default);

        /// <summary>
        /// The Running release whose candidate or baseline is a deployment.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deploymentId">Deployment identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The release, or null.</returns>
        Task<CanaryRelease?> ReadRunningForDeploymentAsync(string tenantId, string deploymentId, CancellationToken token = default);

        /// <summary>
        /// Running releases across every tenant, oldest first, for the leader to advance or roll back.
        /// </summary>
        /// <param name="maxResults">Most rows, 1 to 10000.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Releases.</returns>
        Task<List<CanaryRelease>> ListRunningAsync(int maxResults, CancellationToken token = default);

        /// <summary>
        /// Delete a release with its steps.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Release identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);
    }
}
