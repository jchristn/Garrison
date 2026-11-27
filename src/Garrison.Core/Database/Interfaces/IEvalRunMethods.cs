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
    /// Eval run data access (AA9.2, AA9.3). Status changes are compare-and-set and per-case counters are atomic, so
    /// cases recorded in parallel and a concurrent cancel never lose an update. Every tenant read filters by tenant.
    /// Implementations are thread-safe.
    /// </summary>
    public interface IEvalRunMethods
    {
        /// <summary>
        /// Insert an eval run.
        /// </summary>
        /// <param name="obj">Eval run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The stored eval run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<EvalRun> CreateAsync(EvalRun obj, CancellationToken token = default);

        /// <summary>
        /// Read an eval run in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Eval run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The eval run, or null.</returns>
        Task<EvalRun?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Write an eval run's mutable fields unconditionally: status, total cases, counters, cost, score, passed, failure
        /// reason, and start and completion times. Prefer <see cref="TransitionAsync"/> and <see cref="RecordCaseAsync"/>
        /// where another writer may race.
        /// </summary>
        /// <param name="obj">Eval run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The eval run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<EvalRun> UpdateAsync(EvalRun obj, CancellationToken token = default);

        /// <summary>
        /// Move an eval run from one status to another (compare-and-set). Entering Running sets StartedUtc when unset;
        /// entering Completed, Failed, or Cancelled sets CompletedUtc.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Eval run identifier.</param>
        /// <param name="expected">Status the run must have.</param>
        /// <param name="next">New status.</param>
        /// <param name="failureReason">Failure or cancel reason to store, or null to keep the current one.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the run had the expected status and moved.</returns>
        Task<bool> TransitionAsync(string tenantId, string id, EvalRunStatusEnum expected, EvalRunStatusEnum next, string? failureReason, CancellationToken token = default);

        /// <summary>
        /// Count one finished case atomically: CompletedCases plus one, PassedCases plus one when passed, ErroredCases plus
        /// one when errored, and CostUsd plus costUsd.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Eval run identifier.</param>
        /// <param name="passed">Whether the case passed.</param>
        /// <param name="errored">Whether the case's run failed or could not start.</param>
        /// <param name="costUsd">USD the case spent, 0 or more.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when the run exists.</returns>
        Task<bool> RecordCaseAsync(string tenantId, string id, bool passed, bool errored, double costUsd, CancellationToken token = default);

        /// <summary>
        /// Enumerate eval runs, newest first by default.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="setId">Set version filter, or null.</param>
        /// <param name="deploymentId">Deployment filter, or null.</param>
        /// <param name="agentRevisionId">Agent revision filter, or null.</param>
        /// <param name="status">Status filter, or null.</param>
        /// <param name="query">Paging and ordering.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        Task<EnumerationResult<EvalRun>> EnumerateAsync(string tenantId, string? setId, string? deploymentId, string? agentRevisionId, EvalRunStatusEnum? status, EnumerationQuery query, CancellationToken token = default);

        /// <summary>
        /// Eval runs recorded as evidence for a studio draft, newest first.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="studioDraftId">Studio draft identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Eval runs.</returns>
        Task<List<EvalRun>> ListForDraftAsync(string tenantId, string studioDraftId, CancellationToken token = default);

        /// <summary>
        /// Completed eval runs of the given deployments created in [fromUtc, toUtc), newest first (AA11.1).
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="deploymentIds">Deployments; an empty list returns no eval runs.</param>
        /// <param name="fromUtc">Inclusive start (UTC).</param>
        /// <param name="toUtc">Exclusive end (UTC).</param>
        /// <param name="limit">Most rows. Minimum 1.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Eval runs.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId is null or empty or deploymentIds is null.</exception>
        Task<List<EvalRun>> ListCompletedForDeploymentsAsync(string tenantId, List<string> deploymentIds, DateTime fromUtc, DateTime toUtc, int limit, CancellationToken token = default);

        /// <summary>
        /// The newest eval run a trigger started (AA11.3), or null.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="triggerId">Trigger identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The eval run, or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tenantId or triggerId is null or empty.</exception>
        Task<EvalRun?> ReadLatestByTriggerAsync(string tenantId, string triggerId, CancellationToken token = default);

        /// <summary>
        /// Pending and Running eval runs across every tenant, oldest first, for the leader to start or resume.
        /// </summary>
        /// <param name="maxResults">Most rows, 1 to 10000.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Eval runs.</returns>
        Task<List<EvalRun>> ListActiveAsync(int maxResults, CancellationToken token = default);

        /// <summary>
        /// Delete an eval run with its case results and their check results.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Eval run identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when deleted.</returns>
        Task<bool> DeleteAsync(string tenantId, string id, CancellationToken token = default);
    }
}
