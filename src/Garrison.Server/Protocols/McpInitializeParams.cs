namespace Garrison.Server.Protocols
{
    /// <summary>
    /// The params of an MCP initialize request, as far as session replay needs them.
    /// </summary>
    public class McpInitializeParams
    {
        /// <summary>
        /// Requested protocol version.
        /// </summary>
        public string? ProtocolVersion { get; set; } = null;

        /// <summary>
        /// Client capabilities (always empty on replay).
        /// </summary>
        public McpReplayCapabilities Capabilities { get; set; } = new McpReplayCapabilities();

        /// <summary>
        /// Client information.
        /// </summary>
        public McpClientInfoRecord? ClientInfo { get; set; } = null;
    }
}
