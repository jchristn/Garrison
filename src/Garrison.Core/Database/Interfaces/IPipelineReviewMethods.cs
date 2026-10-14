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
    /// Pipeline stage reviews (P12.9). One review per stage execution (unique), decided with a compare-and-set update from
    /// Pending, so concurrent deciders and the timeout sweep on any replica produce exactly one decision.
    /// </summary>
    public interface IPipelineReviewMethods
    {
        /// <summary>
        /// Insert a review unless the stage execution already has one.
        /// </summary>
        /// <param name="obj">Record.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this call inserted it.</returns>
        /// <exception cref="ArgumentNullException">Thrown when obj is null.</exception>
        Task<bool> CreateIfAbsentAsync(PipelineReview obj, CancellationToken token = default);

        /// <summary>
        /// Read a review in any tenant (internal use).
        /// </summary>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when id is null or empty.</exception>
        Task<PipelineReview?> ReadAsync(string id, CancellationToken token = default);

        /// <summary>
        /// Read a review in a tenant.
        /// </summary>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="id">Identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record, or null when it does not exist in the tenant.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null or empty.</exception>
        Task<PipelineReview?> ReadAsync(string tenantId, string id, CancellationToken token = default);

        /// <summary>
        /// Read the review of a stage execution.
        /// </summary>
        /// <param name="runStageId">Pipeline run stage.</param>
        /// <param name="execution">Execution.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record or null.</returns>
        /// <exception cref="ArgumentNullException">Thrown when runStageId is null or empty.</exception>
        Task<PipelineReview?> ReadByExecutionAsync(string runStageId, int execution, CancellationToken token = default);

        /// <summary>
        /// Reviews of a pipeline run, oldest first.
        /// </summary>
        /// <param name="pipelineRunId">Pipeline run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Reviews.</returns>
        /// <exception cref="ArgumentNullException">Thrown when pipelineRunId is null or empty.</exception>
        Task<List<PipelineReview>> ListByPipelineRunAsync(string pipelineRunId, CancellationToken token = default);

        /// <summary>
        /// Enumerate reviews.
        /// </summary>
        /// <param name="filter">Filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        /// <exception cref="ArgumentNullException">Thrown when filter is null.</exception>
        Task<EnumerationResult<PipelineReview>> EnumerateAsync(PipelineReviewFilter filter, CancellationToken token = default);

        /// <summary>
        /// Decide a pending review: applied only while its status is Pending.
        /// </summary>
        /// <param name="resolution">Decision.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>True when this call decided it; false when it was no longer Pending or does not exist.</returns>
        /// <exception cref="ArgumentNullException">Thrown when resolution is null.</exception>
        Task<bool> ResolveAsync(PipelineReviewResolution resolution, CancellationToken token = default);

        /// <summary>
        /// Pending reviews whose timeout passed, oldest first (leader sweep).
        /// </summary>
        /// <param name="nowUtc">Current time (UTC).</param>
        /// <param name="limit">Maximum rows (1 to 10000).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Expired pending reviews.</returns>
        Task<List<PipelineReview>> ListExpiredAsync(DateTime nowUtc, int limit, CancellationToken token = default);

        /// <summary>
        /// Pending reviews whose pipeline run already ended (left behind by a crash between the end and its cleanup), for the
        /// leader sweep to cancel.
        /// </summary>
        /// <param name="limit">Maximum rows (1 to 10000).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Orphaned pending reviews.</returns>
        Task<List<PipelineReview>> ListOrphanedAsync(int limit, CancellationToken token = default);

        /// <summary>
        /// Count pending reviews.
        /// </summary>
        /// <param name="tenantId">Tenant identifier, or null for every tenant.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Count.</returns>
        Task<long> CountPendingAsync(string? tenantId, CancellationToken token = default);
    }
}
