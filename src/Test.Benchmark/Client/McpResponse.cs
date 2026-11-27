namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// A JSON-RPC response from the MCP endpoint.
    /// </summary>
    public class McpResponse
    {
        /// <summary>
        /// Result of a tools/call, or null.
        /// </summary>
        public McpToolResult? Result { get; set; } = null;

        /// <summary>
        /// Error, or null.
        /// </summary>
        public McpError? Error { get; set; } = null;
    }
}
