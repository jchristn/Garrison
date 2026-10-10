namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Requests;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// Tenant analytics. Thread-safe.
    /// </summary>
    public class AnalyticsClient : ClientBase
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public AnalyticsClient(GarrisonTransport transport) : base(transport)
        {
        }

        /// <summary>
        /// Run analytics: totals and time-bucketed series of run counts, tokens, cost, latency, and throughput.
        /// </summary>
        /// <param name="query">Optional query; null uses server defaults.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Analytics.</returns>
        /// <exception cref="GarrisonException">Status 400 when From is not earlier than To, when the range needs more than 400 buckets, or when a parameter is invalid.</exception>
        public async Task<RunAnalyticsResponse> RunsAsync(RunAnalyticsQuery? query = null, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = new Dictionary<string, string?>(StringComparer.Ordinal);
            if (query != null)
            {
                parameters["from"] = QueryBuilder.Date(query.From);
                parameters["to"] = QueryBuilder.Date(query.To);
                parameters["interval"] = query.Interval?.ToString().ToLowerInvariant();
                parameters["agentId"] = query.AgentId;
                parameters["harnessType"] = query.HarnessType?.ToString();
                parameters["deploymentId"] = query.DeploymentId;
                parameters["groupBy"] = query.GroupBy?.ToString().ToLowerInvariant();
            }
            return await Transport.SendAsync<RunAnalyticsResponse>(HttpMethod.Get, TenantPath("/analytics/runs"), null, parameters, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
    }
}
