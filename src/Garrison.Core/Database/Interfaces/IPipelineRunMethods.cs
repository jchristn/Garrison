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
    /// Pipeline runs and their stage snapshots (P12.9). Every change of a pipeline run row is a compare-and-set on its
    /// status and casVersion, and every stage execution claim is a compare-and-set on the stage's executions, so the
    /// completion hook and the leader sweep on any replica can advance a pipeline run concurrently without creating a stage
    /// run twice.
    /// </summary>
    public interface IPipelineRunMethods
    {
        /// <summary>
        /// Insert a pipeline run with its stage snapshots, or return the existing pipeline run for a repeated idempotency key
        /// (same tenant, caller, and key, for as long as that pipeline run exists; the key is unique per tenant and caller);
        /// concurrent starts with one key create exactly one.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored record: obj, or the existing pipeline run with the same key.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<PipelineRun> CreateAsync(PipelineRun obj, CancellationToken token = default);

        /// <summary>
        /// Read a pipeline run (with stages) in any tenant (internal use).
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        Task<PipelineRun?> ReadAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Read a pipeline run (with stages) in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record, or null when it does not exist in the tenant.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<PipelineRun?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Find a pipeline run by idempotency key.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="callerId">Caller principal identifier, or null.</param>
        /// <param name="idempotencyKey">Key.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or idempotencyKey is null or empty.</exception>
        Task<PipelineRun?> ReadByIdempotencyKeyAsync(string tenantId, string? callerId, string idempotencyKey, CancellationToken token = default);

        /// <summary>
        /// Enumerate pipeline runs (with stages).
        /// </summary>
        /// <param name="filter">Filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when filter is null.</exception>
        Task<EnumerationResult<PipelineRun>> EnumerateAsync(PipelineRunFilter filter, CancellationToken token = default);

        /// <summary>
        /// Apply a compare-and-set change to a pipeline run row.
        /// </summary>
        /// <param name="transition">Change.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this call changed the row.</returns>
        /// <exception cref="ArgumentNullException">Thrown when transition is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the transition names no source status.</exception>
        Task<bool> TransitionAsync(PipelineRunTransition transition, CancellationToken token = default);

        /// <summary>
        /// Claim the next execution of a stage: executions increases by one, the previous run moves to lastRunId, the
        /// current run is cleared, and the stage becomes Running. Applied only while executions still equals the expected
        /// value.
        /// </summary>
        /// <param name="claim">Claim.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this call claimed the execution.</returns>
        /// <exception cref="ArgumentNullException">Thrown when claim is null.</exception>
        Task<bool> ClaimExecutionAsync(PipelineStageClaim claim, CancellationToken token = default);

        /// <summary>
        /// Link the run created for a claimed execution: applied only while the stage is still at that execution and has no
        /// current run.
        /// </summary>
        /// <param name="runStageId">Pipeline run stage.</param>
        /// <param name="execution">Claimed execution.</param>
        /// <param name="runId">Run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this call linked the run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> LinkRunAsync(string runStageId, int execution, string runId, CancellationToken token = default);

        /// <summary>
        /// Record a transient refusal to create the run of a claimed execution, to be tried again at nextAttemptUtc.
        /// </summary>
        /// <param name="runStageId">Pipeline run stage.</param>
        /// <param name="execution">Claimed execution.</param>
        /// <param name="reason">Reason.</param>
        /// <param name="nextAttemptUtc">Next attempt (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when recorded.</returns>
        /// <exception cref="ArgumentNullException">Thrown when runStageId is null or empty.</exception>
        Task<bool> BlockAsync(string runStageId, int execution, string reason, DateTime nextAttemptUtc, CancellationToken token = default);

        /// <summary>
        /// Set a stage's status while it is at an execution (completedUtc is set for finished statuses).
        /// </summary>
        /// <param name="runStageId">Pipeline run stage.</param>
        /// <param name="execution">Execution the stage must be at.</param>
        /// <param name="status">Status.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when changed.</returns>
        /// <exception cref="ArgumentNullException">Thrown when runStageId is null or empty.</exception>
        Task<bool> SetStageStatusAsync(string runStageId, int execution, PipelineStageStatusEnum status, CancellationToken token = default);

        /// <summary>
        /// Active pipeline runs across tenants that the leader sweep must advance, in identifier order after a cursor:
        /// Cancelling runs, runs past their deadline, Running runs whose current stage is missing, unclaimed, waiting for a
        /// due start (nextAttemptUtc at or before now, or none), or whose current stage run ended or no longer exists, and
        /// AwaitingReview runs without a pending, unexpired review of the current stage execution. Runs waiting on a live
        /// stage run or an open review are not returned, so they cannot starve the others.
        /// </summary>
        /// <param name="nowUtc">Current time (UTC) for deadlines, due starts, and review expiry.</param>
        /// <param name="afterId">Return only identifiers greater than this one (the previous page's last identifier), or null to start from the beginning.</param>
        /// <param name="limit">Maximum rows (1 to 10000).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pipeline runs without stages, ordered by identifier.</returns>
        Task<List<PipelineRun>> ListNeedingWorkAsync(DateTime nowUtc, string? afterId, int limit, CancellationToken token = default);

        /// <summary>
        /// Count active pipeline runs of a pipeline.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="pipelineId">Pipeline identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Count.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<long> CountActiveAsync(string tenantId, string pipelineId, CancellationToken token = default);

        /// <summary>
        /// Identifiers of runs that belong to a finished pipeline run but are still queued or running (left behind by a
        /// cancellation race or a crash), for the leader sweep to cancel.
        /// </summary>
        /// <param name="limit">Maximum rows (1 to 10000).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Run identifiers.</returns>
        Task<List<string>> ListOrphanStageRunIdsAsync(int limit, CancellationToken token = default);

        /// <summary>
        /// Delete a finished (Succeeded, Failed, Cancelled, or TimedOut) pipeline run with its stage snapshots and reviews.
        /// The status check is part of the delete, so a pipeline run resumed concurrently is kept. Stage runs are kept.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted; false when it does not exist in the tenant or is not finished.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Delete finished pipeline runs completed before a cutoff (retention), at most 500 per call.
        /// </summary>
        /// <param name="olderThanUtc">Cutoff (UTC).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pipeline runs deleted.</returns>
        Task<int> PruneFinishedAsync(DateTime olderThanUtc, CancellationToken token = default);
    }
}
