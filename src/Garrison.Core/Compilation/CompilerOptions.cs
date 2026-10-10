namespace Garrison.Core.Compilation
{
    using System;

    /// <summary>
    /// Options for the invocation compiler.
    /// </summary>
    public class CompilerOptions
    {
        /// <summary>
        /// Base URL of the Garrison MCP server as reachable from worker nodes, without the path, for example
        /// http://garrison-server:8701.
        /// </summary>
        public string McpBaseUrl { get; set; } = "http://127.0.0.1:8701";

        /// <summary>
        /// MCP path. Default /mcp.
        /// </summary>
        public string McpPath { get; set; } = "/mcp";

        /// <summary>
        /// Base URL of the Garrison REST API as reachable from worker nodes.
        /// </summary>
        public string ApiBaseUrl { get; set; } = "http://127.0.0.1:8700";

        /// <summary>
        /// Default run timeout in seconds when neither the deployment nor the profile sets one.
        /// </summary>
        public int DefaultTimeoutSeconds { get; set; } = 1800;
    }
}
