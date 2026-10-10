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
    /// Node pools.
    /// </summary>
    public class NodePoolsClient : ClientBase
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public NodePoolsClient(GarrisonTransport transport) : base(transport)
        {
        }
        /// <summary>
        /// List records.
        /// </summary>
        /// <param name="query">Optional query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<NodePool>> ListAsync(EnumerationQuery? query = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<EnumerationResult<NodePool>>(HttpMethod.Get, "/v1.0/api/node-pools", null, QueryBuilder.From(query), token: token).ConfigureAwait(false) ?? new EnumerationResult<NodePool>();
        }

        /// <summary>
        /// Read a node pool.
        /// </summary>
        /// <param name="id">Pool identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pool.</returns>
        public async Task<NodePool> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<NodePool>(HttpMethod.Get, "/v1.0/api/node-pools/" + Segment(id), null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Create a node pool.
        /// </summary>
        /// <param name="pool">Pool.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pool.</returns>
        public async Task<NodePool> CreateAsync(NodePool pool, CancellationToken token = default)
        {
            return await Transport.SendAsync<NodePool>(HttpMethod.Post, "/v1.0/api/node-pools", pool, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Update a node pool.
        /// </summary>
        /// <param name="id">Pool identifier.</param>
        /// <param name="pool">Pool.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Pool.</returns>
        public async Task<NodePool> UpdateAsync(string id, NodePool pool, CancellationToken token = default)
        {
            return await Transport.SendAsync<NodePool>(HttpMethod.Put, "/v1.0/api/node-pools/" + Segment(id), pool, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Delete an empty node pool.
        /// </summary>
        /// <param name="id">Pool identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(string id, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, "/v1.0/api/node-pools/" + Segment(id), null, null, token: token).ConfigureAwait(false);
        }
    }
}
