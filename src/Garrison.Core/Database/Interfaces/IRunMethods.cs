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
    using Garrison.Core.Responses;

    /// <summary>
    /// Run data access methods.
    /// </summary>
    public interface IRunMethods
    {
        /// <summary>
        /// Create a Run, including child rows. When the run carries an idempotency key and a run with the same tenant,
        /// caller, and key was created in the last 24 hours, nothing is inserted and that run is returned instead; the
        /// check and the insert are atomic across replicas.
        /// </summary>
        /// <param name="obj">Record to create.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The created record, or the existing run with the same idempotency key.</returns>
        Task<Run> CreateAsync(Run obj, CancellationToken token = default);

        /// <summary>
        /// Read a Run by identifier without tenant scoping. For internal and system-administrator use.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<Run?> ReadAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Read a Run by identifier within a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The record, or null.</returns>
        Task<Run?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Update a Run, replacing child rows.
        /// </summary>
        /// <param name="obj">Record to update.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The updated record.</returns>
        Task<Run> UpdateAsync(Run obj, CancellationToken token = default);

        /// <summary>
        /// Delete a Run and its child rows.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if a row was deleted.</returns>
        Task<bool> DeleteAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Check whether a Run exists.
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True if it exists.</returns>
        Task<bool> ExistsAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Enumerate Run records.
        /// </summary>
        /// <param name="tenantId">Tenant identifier, or null to enumerate across tenants (system administrators only).</param>
        /// <param name="query">Enumeration query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>A page of records.</returns>
        Task<EnumerationResult<Run>> EnumerateAsync(string? tenantId, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// List queued runs a node could execute, highest priority and oldest first, with requirements loaded.
        /// </summary>
        /// <param name="harnessTypes">Harness types the node can run.</param>
        /// <param name="limit">Maximum candidates.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Candidates.</returns>
        Task<List<Run>> ListClaimCandidatesAsync(List<HarnessTypeEnum> harnessTypes, int limit, CancellationToken token = default);

        /// <summary>
        /// Atomically claim a queued run (compare-and-set on status). Increments the fencing epoch.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="nodeId">Node identifier.</param>
        /// <param name="nodeName">Node name.</param>
        /// <param name="leaseExpiresUtc">Lease expiry.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The new epoch when this caller won the claim; null when another caller did.</returns>
        Task<long?> TryClaimAsync(string runId, string nodeId, string nodeName, DateTime leaseExpiresUtc, CancellationToken token = default);

        /// <summary>
        /// Queued runs a node may claim, highest priority first and oldest first within a priority. Harness type, the
        /// node's pool, and the pool's tenant dedication are applied in SQL; label requirements are loaded for the
        /// caller to check. Parameters and template versions are not loaded.
        /// </summary>
        /// <param name="filter">Candidate filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Candidates with requirements loaded.</returns>
        /// <exception cref="ArgumentNullException">Thrown when filter is null.</exception>
        Task<List<Run>> ListClaimCandidatesAsync(ClaimCandidateFilter filter, CancellationToken token = default);

        /// <summary>
        /// Atomically claim a queued run only while its deployment has fewer than maxConcurrentRuns active (Leased,
        /// Running, or Cancelling) runs. Claims for the same deployment are serialized in the database (a transaction
        /// lock on Postgresql, the single writer on Sqlite), so the limit is exact across replicas.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="nodeId">Claiming node identifier.</param>
        /// <param name="nodeName">Claiming node name.</param>
        /// <param name="leaseExpiresUtc">Lease expiry.</param>
        /// <param name="deploymentId">The run's deployment.</param>
        /// <param name="maxConcurrentRuns">The deployment's limit; 0 or less means unlimited.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Claim result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null or empty.</exception>
        Task<ClaimResult> TryClaimWithinLimitAsync(string runId, string nodeId, string nodeName, DateTime leaseExpiresUtc, string deploymentId, int maxConcurrentRuns, CancellationToken token = default);

        /// <summary>
        /// Finished runs completed before a cutoff, oldest first, with child rows loaded (retention and archival).
        /// </summary>
        /// <param name="olderThanUtc">Cutoff.</param>
        /// <param name="limit">Maximum runs (1 to 1000).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Runs.</returns>
        Task<List<Run>> ListFinishedBeforeAsync(DateTime olderThanUtc, int limit, CancellationToken token = default);

        /// <summary>
        /// Delete a run with its child rows and its events in one transaction.
        /// </summary>
        /// <param name="id">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the run was deleted.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        Task<bool> PurgeAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Count runs of a deployment that are leased, running, or cancelling.
        /// </summary>
        /// <param name="deploymentId">Deployment identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Count.</returns>
        Task<long> CountActiveByDeploymentAsync(string deploymentId, CancellationToken token = default);

        /// <summary>
        /// Conditionally transition a run. Applies only when the run is in one of the from statuses and, when an epoch
        /// and node are supplied, still held by that node at that epoch.
        /// </summary>
        /// <param name="transition">Transition.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the transition applied.</returns>
        Task<bool> TransitionAsync(RunTransition transition, CancellationToken token = default);

        /// <summary>
        /// Record terminal results reported by a worker, fenced by node and epoch.
        /// </summary>
        /// <param name="run">Run carrying the result fields.</param>
        /// <param name="nodeId">Reporting node.</param>
        /// <param name="epoch">Fencing epoch.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when accepted.</returns>
        Task<bool> CompleteAsync(Run run, string nodeId, long epoch, CancellationToken token = default);

        /// <summary>
        /// Record the first execution of a run whose structured output failed schema validation and start its repair
        /// attempt: stores the interim result, session, usage, timing, validation fields, repair attempt count, and the
        /// new deadline while the run stays active. Fenced by node and epoch; applies only while the run is Leased or
        /// Running (not Cancelling).
        /// </summary>
        /// <param name="run">Run carrying the interim fields and the new deadline.</param>
        /// <param name="nodeId">Reporting node.</param>
        /// <param name="epoch">Fencing epoch.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when accepted.</returns>
        Task<bool> RecordRepairAsync(Run run, string nodeId, long epoch, CancellationToken token = default);

        /// <summary>
        /// Extend a run lease held by a node at an epoch.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="nodeId">Node identifier.</param>
        /// <param name="epoch">Fencing epoch.</param>
        /// <param name="leaseExpiresUtc">New expiry.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the node still holds the lease.</returns>
        Task<bool> ExtendLeaseAsync(string runId, string nodeId, long epoch, DateTime leaseExpiresUtc, CancellationToken token = default);

        /// <summary>
        /// Active runs whose lease expired before a time.
        /// </summary>
        /// <param name="nowUtc">Now (UTC).</param>
        /// <param name="limit">Maximum rows.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Runs.</returns>
        Task<List<Run>> ListExpiredLeasesAsync(DateTime nowUtc, int limit, CancellationToken token = default);

        /// <summary>
        /// Active runs held by a node.
        /// </summary>
        /// <param name="nodeId">Node identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Runs.</returns>
        Task<List<Run>> ListActiveByNodeAsync(string nodeId, CancellationToken token = default);

        /// <summary>
        /// Read a run by idempotency key for a caller.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="callerId">Caller identifier.</param>
        /// <param name="idempotencyKey">Key.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Run or null.</returns>
        Task<Run?> ReadByIdempotencyKeyAsync(string tenantId, string? callerId, string idempotencyKey, CancellationToken token = default);

        /// <summary>
        /// Enumerate runs with a typed filter (children not loaded).
        /// </summary>
        /// <param name="filter">Filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        Task<EnumerationResult<Run>> EnumerateAsync(RunFilter filter, CancellationToken token = default);

        /// <summary>
        /// List runs for analytics, newest first, populating only identity, status, timestamp, usage, and timing
        /// fields (children, input, and result text are not loaded). Uses the filter's TenantId (required), AgentId,
        /// DeploymentId, HarnessType, FromUtc (inclusive), and ToUtc (exclusive), all compared against the creation
        /// time; other filter fields are ignored.
        /// </summary>
        /// <param name="filter">Filter; TenantId is required.</param>
        /// <param name="limit">Maximum rows. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Runs, newest first.</returns>
        /// <exception cref="ArgumentNullException">Thrown when filter is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the filter has no tenant.</exception>
        Task<List<Run>> ListForAnalyticsAsync(RunFilter filter, int limit, CancellationToken token = default);

        /// <summary>
        /// Count runs by status.
        /// </summary>
        /// <param name="tenantId">Tenant identifier, or null for all tenants.</param>
        /// <param name="sinceUtc">Only runs created at or after this time, or null for all.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Counts.</returns>
        Task<List<StatusCount>> CountByStatusAsync(string? tenantId, DateTime? sinceUtc, CancellationToken token = default);

        /// <summary>
        /// Count runs in the unfinished statuses (Pending, Queued, Leased, Running, Cancelling) across all tenants.
        /// Uses the status indexes, so it stays cheap however many finished runs are retained.
        /// </summary>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Counts per status; statuses with no runs are absent.</returns>
        Task<List<StatusCount>> CountUnfinishedAsync(CancellationToken token = default);

        /// <summary>
        /// Active run counts grouped by agent and harness.
        /// </summary>
        /// <param name="tenantId">Tenant identifier, or null for all tenants.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Rows.</returns>
        Task<List<QueueSummaryRow>> QueueSummaryAsync(string? tenantId, CancellationToken token = default);

        /// <summary>
        /// Record the highest event sequence received.
        /// </summary>
        /// <param name="runId">Run identifier.</param>
        /// <param name="sequence">Sequence.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        Task UpdateLastEventSequenceAsync(string runId, long sequence, CancellationToken token = default);

        /// <summary>
        /// Delete finished runs completed before a cutoff, including their events and child rows.
        /// </summary>
        /// <param name="olderThanUtc">Cutoff (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Runs deleted.</returns>
        Task<int> PruneFinishedAsync(DateTime olderThanUtc, CancellationToken token = default);

        /// <summary>
        /// Replace the prompt template versions recorded for a run.
        /// </summary>
        /// <param name="run">Run carrying TenantId, Id, and TemplateVersions.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        Task ReplaceTemplateVersionsAsync(Run run, CancellationToken token = default);

        /// <summary>
        /// Active runs whose deadline passed.
        /// </summary>
        /// <param name="nowUtc">Now (UTC).</param>
        /// <param name="limit">Maximum rows.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Runs.</returns>
        Task<List<Run>> ListPastDeadlineAsync(DateTime nowUtc, int limit, CancellationToken token = default);

        /// <summary>
        /// Queued runs, oldest first, with their placement requirements loaded (parameters and template versions are not
        /// loaded). Used to work out which queued runs no worker can take.
        /// </summary>
        /// <param name="tenantId">Tenant identifier, or null for every tenant.</param>
        /// <param name="limit">Maximum rows. Minimum 1, maximum 100000.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Runs.</returns>
        Task<List<Run>> ListQueuedAsync(string? tenantId, int limit, CancellationToken token = default);

        /// <summary>
        /// Replace the placement requirements of each given run with the stored ones, in one query per 500 runs.
        /// </summary>
        /// <param name="runs">Runs.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        Task LoadRequirementsAsync(List<Run> runs, CancellationToken token = default);
    }
}
