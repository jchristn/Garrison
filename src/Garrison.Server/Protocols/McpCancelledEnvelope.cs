namespace Garrison.Server.Protocols
{
    /// <summary>
    /// The parts of a JSON-RPC message the MCP proxy reads to recognize notifications/cancelled, so a cancellation that
    /// reaches a replica other than the one running the request can be relayed to it.
    /// </summary>
    public class McpCancelledEnvelope
    {
        /// <summary>
        /// JSON-RPC method.
        /// </summary>
        public string? Method { get; set; } = null;

        /// <summary>
        /// Parameters.
        /// </summary>
        public McpCancelledParams? Params { get; set; } = null;
    }
}
