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
    /// Worker nodes.
    /// </summary>
    public class NodesClient : ClientBase
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public NodesClient(GarrisonTransport transport) : base(transport)
        {
        }
        /// <summary>
        /// List records.
        /// </summary>
        /// <param name="query">Optional query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<EnumerationResult<Node>> ListAsync(EnumerationQuery? query = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<EnumerationResult<Node>>(HttpMethod.Get, "/v1.0/api/nodes", null, QueryBuilder.From(query), token: token).ConfigureAwait(false) ?? new EnumerationResult<Node>();
        }

        /// <summary>
        /// Read a node.
        /// </summary>
        /// <param name="id">Node identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Node.</returns>
        public async Task<Node> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Node>(HttpMethod.Get, "/v1.0/api/nodes/" + Segment(id), null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Change capacity or pool.
        /// </summary>
        /// <param name="id">Node identifier.</param>
        /// <param name="request">Request.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Node.</returns>
        public async Task<Node> UpdateAsync(string id, NodeUpdateRequest request, CancellationToken token = default)
        {
            return await Transport.SendAsync<Node>(HttpMethod.Put, "/v1.0/api/nodes/" + Segment(id), request, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Cordon a node.
        /// </summary>
        /// <param name="id">Node identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Node.</returns>
        public async Task<Node> CordonAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Node>(HttpMethod.Post, "/v1.0/api/nodes/" + Segment(id) + "/cordon", null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Uncordon a node.
        /// </summary>
        /// <param name="id">Node identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Node.</returns>
        public async Task<Node> UncordonAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Node>(HttpMethod.Post, "/v1.0/api/nodes/" + Segment(id) + "/uncordon", null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Drain a node.
        /// </summary>
        /// <param name="id">Node identifier or name.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Node.</returns>
        public async Task<Node> DrainAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<Node>(HttpMethod.Post, "/v1.0/api/nodes/" + Segment(id) + "/drain", null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
        /// <summary>
        /// Remove a lost or offline node.
        /// </summary>
        /// <param name="id">Node identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        public async Task DeleteAsync(string id, CancellationToken token = default)
        {
            await Transport.SendTextAsync(HttpMethod.Delete, "/v1.0/api/nodes/" + Segment(id), null, null, token: token).ConfigureAwait(false);
        }
    }
}
