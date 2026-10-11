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
    /// Tenants.
    /// </summary>
    public class TenantsClient : ClientBase
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public TenantsClient(GarrisonTransport transport) : base(transport)
        {
        }
        /// <summary>
        /// List records.
        /// </summary>
        /// <param name="query">Optional query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<Tenant>> ListAsync(EnumerationQuery? query = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<EnumerationResult<Tenant>>(HttpMethod.Get, "/v1.0/api/tenants", null, QueryBuilder.From(query), token: token).ConfigureAwait(false) ?? new EnumerationResult<Tenant>();
        }

        /// <summary>
        /// Read a tenant.
        /// </summary>
        /// <param name="id">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Tenant.</returns>
        public async Task<Tenant> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Tenant>(HttpMethod.Get, "/v1.0/api/tenants/" + Segment(id), null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Create a tenant (system administrators).
        /// </summary>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Tenant.</returns>
        public async Task<Tenant> CreateAsync(TenantRequest request, CancellationToken token = default)
        {
            return await Transport.SendAsync<Tenant>(HttpMethod.Post, "/v1.0/api/tenants", request, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Update a tenant.
        /// </summary>
        /// <param name="id">Tenant identifier.</param>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Tenant.</returns>
        public async Task<Tenant> UpdateAsync(string id, TenantRequest request, CancellationToken token = default)
        {
            return await Transport.SendAsync<Tenant>(HttpMethod.Put, "/v1.0/api/tenants/" + Segment(id), request, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Delete a tenant and everything it owns.
        /// </summary>
        /// <param name="id">Tenant identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task. The server answers 204 No Content.</returns>
        public async Task DeleteAsync(string id, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, "/v1.0/api/tenants/" + Segment(id), token: token).ConfigureAwait(false);
        }
    }
}
