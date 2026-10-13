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

        /// <summary>Run a stdio connection diagnostic on an explicitly selected Ready worker.</summary>
        /// <param name="id">MCP server identifier.</param>
        /// <param name="nodeId">Worker with SupportsMcpTests enabled.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Tool names, missing tools, duration, selected worker, and safe error.</returns>
        public async Task<McpServerTestResponse> TestOnWorkerAsync(string id, string nodeId, CancellationToken token = default)
        {
            Dictionary<string, string?> query = new Dictionary<string, string?> { ["nodeId"] = nodeId };
            return await Transport.SendAsync<McpServerTestResponse>(HttpMethod.Post, Collection() + "/" + Segment(id) + "/test", query: query, token: token).ConfigureAwait(false) ?? throw new InvalidOperationException("Empty response.");
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
