namespace Garrison.Server.Protocols
{
    using System.Text.Json;

    /// <summary>
    /// A JSON-RPC error response: written by the MCP cluster proxy and read from the internal endpoint.
    /// </summary>
    public class McpErrorEnvelope
    {
        /// <summary>
        /// JSON-RPC version.
        /// </summary>
        public string Jsonrpc { get; set; } = "2.0";

        /// <summary>
        /// Identifier of the failed request, or null.
        /// </summary>
        public JsonElement? Id { get; set; } = null;

        /// <summary>
        /// Error.
        /// </summary>
        public McpErrorDetail? Error { get; set; } = null;
    }
}
