namespace Garrison.Server.Protocols
{
    /// <summary>
    /// The clientInfo of an MCP initialize request.
    /// </summary>
    public class McpClientInfoRecord
    {
        /// <summary>
        /// Client name.
        /// </summary>
        public string? Name { get; set; } = null;

        /// <summary>
        /// Client version.
        /// </summary>
        public string? Version { get; set; } = null;
    }
}
