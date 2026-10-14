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
    /// Pipeline runs (P12.9): list, read (optionally waiting), cancel, retry, and delete. Reading needs Read on
    /// PipelineRun; cancel and retry need Update; delete needs Delete.
    /// </summary>
    public class PipelineRunsClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public PipelineRunsClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List pipeline runs, newest first by default.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<PipelineRun>> ListAsync(PipelineRunFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["pipelineId"] = filter.PipelineId;
                query["status"] = filter.Status?.ToString();
                query["callerId"] = filter.CallerId;
                query["fromUtc"] = QueryBuilder.Date(filter.FromUtc);
                query["toUtc"] = QueryBuilder.Date(filter.ToUtc);
                query["skip"] = filter.Skip.ToString(CultureInfo.InvariantCulture);
                query["maxResults"] = filter.MaxResults.ToString(CultureInfo.InvariantCulture);
                query["ordering"] = filter.Ordering.ToString();
            }
            return await Transport.SendAsync<EnumerationResult<PipelineRun>>(HttpMethod.Get, TenantPath("/pipeline-runs"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<PipelineRun>();
        }

        /// <summary>
        /// Read a pipeline run with its stages, stage runs, and reviews.
        /// </summary>
        /// <param name="id">Pipeline run identifier (plr_).</param>
        /// <param name="waitSeconds">Optional seconds (1 to 600) to wait until the pipeline run ends or waits for a review; null or 0 reads at once.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pipeline run.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<PipelineRun> GetAsync(string id, int? waitSeconds = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (waitSeconds.HasValue && waitSeconds.Value > 0) query["waitSeconds"] = Math.Min(600, waitSeconds.Value).ToString(CultureInfo.InvariantCulture);
            return await Transport.SendAsync<PipelineRun>(HttpMethod.Get, TenantPath("/pipeline-runs/" + Segment(id)), null, query, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Cancel an active pipeline run, its pending review, and its current stage run. The server answers 409
        /// (PipelineRunFinished) when it already ended.
        /// </summary>
        /// <param name="id">Pipeline run identifier (plr_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pipeline run (Cancelling or Cancelled).</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<PipelineRun> CancelAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<PipelineRun>(HttpMethod.Post, TenantPath("/pipeline-runs/" + Segment(id) + "/cancel"), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Resume a Failed, TimedOut, or Cancelled pipeline run at the stage where it stopped. The server answers 409
        /// (PipelineRunNotRetryable) for an active or succeeded pipeline run.
        /// </summary>
        /// <param name="id">Pipeline run identifier (plr_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pipeline run.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<PipelineRun> RetryAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<PipelineRun>(HttpMethod.Post, TenantPath("/pipeline-runs/" + Segment(id) + "/retry"), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Delete a finished pipeline run and its reviews (stage runs are kept). The server answers 409
        /// (PipelineRunActive) while it is active.
        /// </summary>
        /// <param name="id">Pipeline run identifier (plr_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(string id, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, TenantPath("/pipeline-runs/" + Segment(id)), token: token).ConfigureAwait(false);
        }

        #endregion
    }
}
