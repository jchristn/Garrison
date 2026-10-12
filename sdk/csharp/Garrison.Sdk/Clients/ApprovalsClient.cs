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
    using Garrison.Sdk.Responses;

    /// <summary>
    /// Permission approvals: list, read, decide, and evaluate a deployment's approval rules against a sample tool call.
    /// Reading needs Read on Approval; deciding needs Update on Approval (and Update on the deployment when remembering
    /// the decision as a rule).
    /// </summary>
    public class ApprovalsClient : ClientBase
    {
        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public ApprovalsClient(GarrisonTransport transport) : base(transport)
        {
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// List approvals. For a pending count, filter on Pending with MaxResults 1 and read TotalRecords.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<Approval>> ListAsync(ApprovalFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (filter != null)
            {
                query["status"] = filter.Status?.ToString();
                query["runId"] = filter.RunId;
                query["rootRunId"] = filter.RootRunId;
                query["agentId"] = filter.AgentId;
                query["deploymentId"] = filter.DeploymentId;
                query["decisionSource"] = filter.DecisionSource?.ToString();
                query["fromUtc"] = QueryBuilder.Date(filter.FromUtc);
                query["toUtc"] = QueryBuilder.Date(filter.ToUtc);
                query["skip"] = filter.Skip.ToString();
                query["maxResults"] = filter.MaxResults.ToString();
                query["ordering"] = filter.Ordering.ToString();
            }
            return await Transport.SendAsync<EnumerationResult<Approval>>(HttpMethod.Get, TenantPath("/approvals"), null, query, token: token).ConfigureAwait(false) ?? new EnumerationResult<Approval>();
        }

        /// <summary>
        /// Read an approval.
        /// </summary>
        /// <param name="id">Approval identifier (apr_).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Approval.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<Approval> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Approval>(HttpMethod.Get, TenantPath("/approvals/" + Segment(id)), token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Decide a pending approval. The server answers 409 (ApprovalNotPending) when the approval was already decided.
        /// </summary>
        /// <param name="id">Approval identifier (apr_).</param>
        /// <param name="request">Decision, optional reason, and whether to remember it as a deployment rule.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Decided approval.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<Approval> DecideAsync(string id, ApprovalDecideRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<Approval>(HttpMethod.Post, TenantPath("/approvals/" + Segment(id) + "/decide"), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Evaluate a deployment's approval rules against a sample tool call. Nothing is recorded.
        /// </summary>
        /// <param name="deploymentId">Deployment identifier.</param>
        /// <param name="request">Tool name and tool input.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>What the rules would do.</returns>
        /// <exception cref="ArgumentNullException">Thrown when request is null.</exception>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<ApprovalCheckResponse> CheckAsync(string deploymentId, ApprovalCheckRequest request, CancellationToken token = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            return await Transport.SendAsync<ApprovalCheckResponse>(HttpMethod.Post, TenantPath("/deployments/" + Segment(deploymentId) + "/approval-check"), request, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        #endregion
    }
}
