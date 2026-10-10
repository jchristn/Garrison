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
    /// Captured HTTP request history.
    /// </summary>
    public class RequestHistoryClient : ClientBase
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public RequestHistoryClient(GarrisonTransport transport) : base(transport)
        {
        }

        /// <summary>
        /// List captured requests.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<RequestHistoryPage> ListAsync(RequestHistoryFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>
            {
                { "tenantId", filter?.TenantId }, { "userId", filter?.UserId }, { "method", filter?.Method }, { "statusCode", filter?.StatusCode?.ToString() },
                { "pathContains", filter?.PathContains }, { "fromUtc", QueryBuilder.Date(filter?.FromUtc) }, { "toUtc", QueryBuilder.Date(filter?.ToUtc) },
                { "pageNumber", filter?.PageNumber.ToString() }, { "pageSize", filter?.PageSize.ToString() }, { "bucketMinutes", filter?.BucketMinutes.ToString() }
            };
            return await Transport.SendAsync<RequestHistoryPage>(HttpMethod.Get, "/v1.0/api/request-history", null, query, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Time-bucketed summary.
        /// </summary>
        /// <param name="filter">Filter with FromUtc, ToUtc, and BucketMinutes.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Summary.</returns>
        public async Task<RequestHistorySummary> SummaryAsync(RequestHistoryFilter filter, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>
            {
                { "tenantId", filter?.TenantId }, { "userId", filter?.UserId }, { "method", filter?.Method }, { "statusCode", filter?.StatusCode?.ToString() },
                { "pathContains", filter?.PathContains }, { "fromUtc", QueryBuilder.Date(filter?.FromUtc) }, { "toUtc", QueryBuilder.Date(filter?.ToUtc) },
                { "pageNumber", filter?.PageNumber.ToString() }, { "pageSize", filter?.PageSize.ToString() }, { "bucketMinutes", filter?.BucketMinutes.ToString() }
            };
            return await Transport.SendAsync<RequestHistorySummary>(HttpMethod.Get, "/v1.0/api/request-history/summary", null, query, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Read one entry with headers and bodies.
        /// </summary>
        /// <param name="id">Entry identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Entry.</returns>
        public async Task<RequestHistoryEntry> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<RequestHistoryEntry>(HttpMethod.Get, "/v1.0/api/request-history/" + Segment(id), null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Delete one entry.
        /// </summary>
        /// <param name="id">Entry identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(string id, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, "/v1.0/api/request-history/" + Segment(id), null, null, token: token).ConfigureAwait(false);
        }
        /// <summary>
        /// Delete entries matching a filter.
        /// </summary>
        /// <param name="filter">Filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Delete count.</returns>
        public async Task<DeleteCountResponse> DeleteManyAsync(RequestHistoryFilter filter, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>
            {
                { "tenantId", filter?.TenantId }, { "userId", filter?.UserId }, { "method", filter?.Method }, { "statusCode", filter?.StatusCode?.ToString() },
                { "pathContains", filter?.PathContains }, { "fromUtc", QueryBuilder.Date(filter?.FromUtc) }, { "toUtc", QueryBuilder.Date(filter?.ToUtc) },
                { "pageNumber", filter?.PageNumber.ToString() }, { "pageSize", filter?.PageSize.ToString() }, { "bucketMinutes", filter?.BucketMinutes.ToString() }
            };
            return await Transport.SendAsync<DeleteCountResponse>(HttpMethod.Delete, "/v1.0/api/request-history", null, query, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
    }
}
