namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// Params of the MCP initialize request.
    /// </summary>
    public class McpInitializeParams
    {
        /// <summary>
        /// Protocol version the harness speaks.
        /// </summary>
        public string ProtocolVersion { get; set; } = "2025-03-26";

        /// <summary>
        /// Client capabilities; the harness asks for none.
        /// </summary>
        public McpClientCapabilities Capabilities { get; set; } = new McpClientCapabilities();

        /// <summary>
        /// Client name and version.
        /// </summary>
        public McpClientInfo ClientInfo { get; set; } = new McpClientInfo();
    }
}
