namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// A JSON-RPC request to the MCP endpoint.
    /// </summary>
    public class McpRequest
    {
        /// <summary>
        /// Protocol version, always 2.0.
        /// </summary>
        public string Jsonrpc { get; set; } = "2.0";

        /// <summary>
        /// Request identifier, or null for a notification.
        /// </summary>
        public long? Id { get; set; } = null;

        /// <summary>
        /// Method, for example initialize or tools/call.
        /// </summary>
        public string Method { get; set; } = String.Empty;

        /// <summary>
        /// Params, or null.
        /// </summary>
        public object? Params { get; set; } = null;
    }
}
