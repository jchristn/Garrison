namespace Garrison.Server.Protocols
{
    /// <summary>
    /// The method and tool name of a JSON-RPC request, read by the public MCP endpoint before it relays a tools/call so
    /// that an agent tool (exposeMcpTool) is registered on this replica's internal endpoint first.
    /// </summary>
    public class McpToolCallEnvelope
    {
        /// <summary>
        /// Method, for example tools/call.
        /// </summary>
        public string? Method { get; set; } = null;

        /// <summary>
        /// Parameters; null when absent.
        /// </summary>
        public McpToolCallNameParams? Params { get; set; } = null;
    }
}
