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
    /// Audit records in the client's tenant.
    /// </summary>
    public class AuditClient : ClientBase
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public AuditClient(GarrisonTransport transport) : base(transport)
        {
        }

        /// <summary>
        /// List audit records.
        /// </summary>
        /// <param name="filter">Optional filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<AuditPage> ListAsync(AuditFilter? filter = null, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>
            {
                { "eventType", filter?.EventType?.ToString() }, { "principalId", filter?.PrincipalId }, { "result", filter?.Result?.ToString() },
                { "fromUtc", QueryBuilder.Date(filter?.FromUtc) }, { "toUtc", QueryBuilder.Date(filter?.ToUtc) },
                { "pageNumber", filter?.PageNumber.ToString() }, { "pageSize", filter?.PageSize.ToString() }
            };
            return await Transport.SendAsync<AuditPage>(HttpMethod.Get, TenantPath("/audit"), null, query, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Read an audit record.
        /// </summary>
        /// <param name="id">Record identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Record.</returns>
        public async Task<AuditRecord> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<AuditRecord>(HttpMethod.Get, TenantPath("/audit/" + Segment(id)), null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Delete an audit record.
        /// </summary>
        /// <param name="id">Record identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(string id, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, TenantPath("/audit/" + Segment(id)), null, null, token: token).ConfigureAwait(false);
        }
        /// <summary>
        /// Delete audit records matching a filter.
        /// </summary>
        /// <param name="filter">Filter.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Delete count.</returns>
        public async Task<DeleteCountResponse> DeleteManyAsync(AuditFilter filter, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?>
            {
                { "eventType", filter?.EventType?.ToString() }, { "principalId", filter?.PrincipalId }, { "result", filter?.Result?.ToString() },
                { "fromUtc", QueryBuilder.Date(filter?.FromUtc) }, { "toUtc", QueryBuilder.Date(filter?.ToUtc) },
                { "pageNumber", filter?.PageNumber.ToString() }, { "pageSize", filter?.PageSize.ToString() }
            };
            return await Transport.SendAsync<DeleteCountResponse>(HttpMethod.Delete, TenantPath("/audit"), null, query, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
    }
}
