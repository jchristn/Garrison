namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;

    /// <summary>
    /// Pipeline stage reviews (P12.9): list, read, and decide. Reading needs Read on Approval; deciding needs Update on
    /// Approval. Run tokens can never list or decide reviews.
    /// </summary>
    public class PipelineReviewsClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public PipelineReviewsClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List reviews. For a pending count, filter on Pending with MaxResults 1 and read TotalRecords.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<PipelineReview>> ListAsync(PipelineReviewFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["status"] = filter.Status?.ToString();
                query["pipelineRunId"] = filter.PipelineRunId;
                query["pipelineId"] = filter.PipelineId;
                query["runId"] = filter.RunId;
                query["decisionSource"] = filter.DecisionSource?.ToString();
                query["fromUtc"] = QueryBuilder.Date(filter.FromUtc);
                query["toUtc"] = QueryBuilder.Date(filter.ToUtc);
                query["skip"] = filter.Skip.ToString(CultureInfo.InvariantCulture);
                query["maxResults"] = filter.MaxResults.ToString(CultureInfo.InvariantCulture);
                query["ordering"] = filter.Ordering.ToString();
            }
            return await Transport.SendAsync<EnumerationResult<PipelineReview>>(HttpMethod.Get, TenantPath("/pipeline-reviews"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<PipelineReview>();
        }

        /// <summary>
        /// Read a review.
        /// </summary>
        /// <param name="id">Review identifier (prv_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Review.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<PipelineReview> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<PipelineReview>(HttpMethod.Get, TenantPath("/pipeline-reviews/" + Segment(id)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Decide a pending review: Approve (optional notes for the next stage), RequestChanges (comment required; the
        /// stage runs again, at most maxRevisions times, else 409 RevisionLimitReached), or Reject (the pipeline run
        /// fails). The server answers 409 (ReviewNotPending) when the review was already decided.
        /// </summary>
        /// <param name="id">Review identifier (prv_).</param>
        /// <param name="request">Decision and optional comment.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Decided review.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<PipelineReview> DecideAsync(string id, PipelineReviewDecideRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<PipelineReview>(HttpMethod.Post, TenantPath("/pipeline-reviews/" + Segment(id) + "/decide"), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion
    }
}
