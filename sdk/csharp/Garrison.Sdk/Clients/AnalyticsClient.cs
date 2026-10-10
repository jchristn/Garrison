namespace Garrison.Sdk.Clients
{
    using System;
    using System.Collections.Generic;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enums;
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
                parameters["model"] = query.Model;
                parameters["groupBy"] = GroupByValue(query.GroupBy);
            }
            return await Transport.SendAsync<RunAnalyticsResponse>(HttpMethod.Get, TenantPath("/analytics/runs"), null, parameters, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        /// <summary>
        /// Distinct agents, harnesses, deployments, and served models among the tenant's runs in a range, for populating analytics filters.
        /// </summary>
        /// <param name="from">Range start (UTC, inclusive). Null uses the server default (24 hours before to).</param>
        /// <param name="to">Range end (UTC, exclusive). Null uses the server default (now).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Dimensions.</returns>
        /// <exception cref="GarrisonException">Status 400 when from is not earlier than to or a timestamp is invalid.</exception>
        public async Task<RunAnalyticsDimensions> DimensionsAsync(DateTime? from = null, DateTime? to = null, CancellationToken token = default)
        {
            Dictionary<string, string?> parameters = new Dictionary<string, string?>(StringComparer.Ordinal);
            parameters["from"] = QueryBuilder.Date(from);
            parameters["to"] = QueryBuilder.Date(to);
            return await Transport.SendAsync<RunAnalyticsDimensions>(HttpMethod.Get, TenantPath("/analytics/runs/dimensions"), null, parameters, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }

        private static string? GroupByValue(AnalyticsGroupByEnum? groupBy)
        {
            if (!groupBy.HasValue) return null;
            switch (groupBy.Value)
            {
                case AnalyticsGroupByEnum.HarnessModel:
                    return "harnessModel";
                default:
                    return groupBy.Value.ToString().ToLowerInvariant();
            }
        }
    }
}
