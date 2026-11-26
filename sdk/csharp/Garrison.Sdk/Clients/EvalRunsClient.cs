namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Requests;

    /// <summary>
    /// Eval runs (AA9): one evaluation of an eval set version against a deployment or an agent revision. Each case runs
    /// as a run of kind Eval and records a scored EvalCaseResult; the run's score is the check-weighted mean of the case
    /// scores, and Passed says whether it reached the threshold.
    /// </summary>
    public class EvalRunsClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public EvalRunsClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List eval runs, newest first.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<EvalRun>> ListAsync(EvalRunFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["set"] = filter.Set;
                query["deployment"] = filter.Deployment;
                query["revision"] = filter.Revision;
                query["status"] = filter.Status?.ToString();
                query["skip"] = filter.Skip.ToString();
                query["maxResults"] = filter.MaxResults.ToString();
            }
            return await Transport.SendAsync<EnumerationResult<EvalRun>>(HttpMethod.Get, TenantPath("/eval-runs"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<EvalRun>();
        }

        /// <summary>
        /// Start an eval run of a set against a deployment or an agent revision. Needs Execute on EvalRun and on the agent.
        /// The run starts Pending; poll GetAsync until its status is Completed, Failed, or Cancelled.
        /// </summary>
        /// <param name="request">Set, target, input mode, threshold, and budget.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The created run.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<EvalRun> CreateAsync(EvalRunRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<EvalRun>(HttpMethod.Post, TenantPath("/eval-runs"), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Read an eval run with its score and counts.
        /// </summary>
        /// <param name="id">Eval run identifier (evr_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The run.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<EvalRun> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<EvalRun>(HttpMethod.Get, TenantPath("/eval-runs/" + Segment(id)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// An eval run's case results in order, with per-check scores and notes. Run tokens see hidden cases as scores only.
        /// </summary>
        /// <param name="id">Eval run identifier (evr_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Results.</returns>
        public async Task<List<EvalCaseResult>> ResultsAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<List<EvalCaseResult>>(HttpMethod.Get, TenantPath("/eval-runs/" + Segment(id) + "/results"), token: token).ConfigureAwait(false) ?? new List<EvalCaseResult>();
        }

        /// <summary>
        /// Cancel a Pending or Running eval run and its unfinished case runs. A finished run answers 409 EvalRunFinished.
        /// </summary>
        /// <param name="id">Eval run identifier (evr_).</param>
        /// <param name="reason">Why, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>The cancelled run.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<EvalRun> CancelAsync(string id, string? reason = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<EvalRun>(HttpMethod.Post, TenantPath("/eval-runs/" + Segment(id) + "/cancel"), new EvalRunCancelRequest { Reason = reason }, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion
    }
}
