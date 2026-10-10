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
    /// MCP servers that deployments can bind.
    /// </summary>
    public class McpServersClient : ResourceClient<McpServer, McpServer>
    {
        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="transport">Transport.</param>
        public McpServersClient(GarrisonTransport transport) : base(transport, "mcp-servers")
        {
        }

        /// <summary>
        /// Connect to an MCP server and list its tools.
        /// </summary>
        /// <param name="id">Server identifier.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Test result.</returns>
        public async Task<McpServerTestResponse> TestAsync(string id, CancellationToken token = default)
        {
            return await Transport.SendAsync<McpServerTestResponse>(HttpMethod.Post, Collection() + "/" + Segment(id) + "/test", null, null, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
        }
    }
}
