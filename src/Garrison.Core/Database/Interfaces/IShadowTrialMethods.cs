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
    /// Shadow trial data access (AA9.2, AA9.7). Counters change only through <see cref="IncrementCountsAsync"/>, which is
    /// atomic, and status changes are compare-and-set. Every tenant read filters by tenant. Implementations are
    /// thread-safe.
    /// </summary>
    public interface IShadowTrialMethods
    {
        /// <summary>
        /// Insert a trial. Counters are stored as given (normally zero).
        /// </summary>
        /// <param name="obj">Trial.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored trial.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<ShadowTrial> CreateAsync(ShadowTrial obj, CancellationToken token = default);

        /// <summary>
        /// Read a trial in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Trial identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The trial, or null.</returns>
        Task<ShadowTrial?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Write a trial's name, end time, comparison set, judge flag, status, stop reason, and completion time. Counters
        /// are not written.
        /// </summary>
        /// <param name="obj">Trial.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The trial.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<ShadowTrial> UpdateAsync(ShadowTrial obj, CancellationToken token = default);

        /// <summary>
        /// Move a trial from one status to another (compare-and-set). Leaving Running sets CompletedUtc.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Trial identifier.</param>
        /// <param name="expected">Status the trial must have.</param>
        /// <param name="next">New status.</param>
        /// <param name="stopReason">Reason to store, or null to keep the current one.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the trial had the expected status and moved.</returns>
        Task<bool> TransitionAsync(string tenantId, string id, ShadowTrialStatusEnum expected, ShadowTrialStatusEnum next, string? stopReason, CancellationToken token = default);

        /// <summary>
        /// Add to a trial's counters atomically. Each delta is 0 or more.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Trial identifier.</param>
        /// <param name="compared">Added to ComparedCount.</param>
        /// <param name="agreed">Added to AgreedCount.</param>
        /// <param name="diverged">Added to DivergedCount.</param>
        /// <param name="candidateFailures">Added to CandidateFailureCount.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the trial exists.</returns>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when a delta is negative.</exception>
        Task<bool> IncrementCountsAsync(string tenantId, string id, long compared, long agreed, long diverged, long candidateFailures, CancellationToken token = default);

        /// <summary>
        /// Enumerate trials, newest first by default.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="sourceDeploymentId">Source deployment filter, or null.</param>
        /// <param name="candidateDeploymentId">Candidate deployment filter, or null.</param>
        /// <param name="status">Status filter, or null.</param>
        /// <param name="query">Paging and ordering.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        Task<EnumerationResult<ShadowTrial>> EnumerateAsync(string tenantId, string? sourceDeploymentId, string? candidateDeploymentId, ShadowTrialStatusEnum? status, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Running trials whose source is a deployment, oldest first. The run path calls this for every finished run of the
        /// deployment, so it reads one index.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="sourceDeploymentId">Source deployment identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Trials.</returns>
        Task<List<ShadowTrial>> ListRunningBySourceDeploymentAsync(string tenantId, string sourceDeploymentId, CancellationToken token = default);

        /// <summary>
        /// Running trials across every tenant, oldest first, for the leader to end at EndsUtc.
        /// </summary>
        /// <param name="maxResults">Most rows, 1 to 10000.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Trials.</returns>
        Task<List<ShadowTrial>> ListRunningAsync(int maxResults, CancellationToken token = default);

        /// <summary>
        /// Delete a trial. Its shadow runs keep their shadowTrialId.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Trial identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);
    }
}
