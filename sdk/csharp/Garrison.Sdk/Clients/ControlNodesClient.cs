namespace Garrison.Sdk.Clients
{
    using System;
    using System.Net.Http;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Sdk.Enumeration;
    using Garrison.Sdk.Http;
    using Garrison.Sdk.Models;
    using Garrison.Sdk.Responses;

    /// <summary>
    /// Control-plane replicas (control nodes). Read-only; each replica maintains its own record.
    /// </summary>
    public class ControlNodesClient : ClientBase
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public ControlNodesClient(GarrisonTransport transport) : base(transport)
        {
        }

        /// <summary>
        /// List control-plane replicas, with the node ID of the replica that answered.
        /// </summary>
        /// <param name="query">Optional query.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Page.</returns>
        public async Task<ControlNodeListResponse> ListAsync(EnumerationQuery? query = null, CancellationToken token = default)
        {
            return await Transport.SendAsync<ControlNodeListResponse>(HttpMethod.Get, "/v1.0/api/control-nodes", null, QueryBuilder.From(query), token: token).ConfigureAwait(false) ?? new ControlNodeListResponse();
        }

        /// <summary>
        /// Read a control-plane replica.
        /// </summary>
        /// <param name="id">Node ID of the replica.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Control node, with the node ID of the replica that answered.</returns>
        /// <exception cref="InvalidOperationException">Thrown when the response is empty.</exception>
        public async Task<ControlNode> GetAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<ControlNode>(HttpMethod.Get, "/v1.0/api/control-nodes/" + Segment(id), null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
    }
}
