namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// MCP server resolved for one run, before it is rendered into a harness configuration format.
    /// </summary>
    public class McpServerEntry
    {
        /// <summary>
        /// Position in the run's server list (used in environment variable names).
        /// </summary>
        public int Index { get; set; } = 0;

        /// <summary>
        /// Server name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Whether the server uses streamable HTTP (otherwise stdio).
        /// </summary>
        public bool IsHttp { get; set; } = true;

        /// <summary>
        /// Base URL without the path.
        /// </summary>
        public string Url { get; set; } = String.Empty;

        /// <summary>
        /// MCP path.
        /// </summary>
        public string Path { get; set; } = "/mcp";

        /// <summary>
        /// Command for stdio servers.
        /// </summary>
        public string? Command { get; set; } = null;

        /// <summary>
        /// Arguments for stdio servers.
        /// </summary>
        public List<string> Args { get; set; } = new List<string>();

        /// <summary>
        /// Whether the run fails when the server is unreachable.
        /// </summary>
        public bool Required { get; set; } = true;

        /// <summary>
        /// Tools that must be listed.
        /// </summary>
        public List<string> RequiredTools { get; set; } = new List<string>();

        /// <summary>
        /// Tool timeout in seconds.
        /// </summary>
        public int ToolTimeoutSeconds { get; set; } = 600;

        /// <summary>
        /// Resolved headers.
        /// </summary>
        public List<ExecutionEnvironmentVariable> Headers { get; set; } = new List<ExecutionEnvironmentVariable>();

        /// <summary>
        /// Environment variable names carrying each header value, in header order.
        /// </summary>
        public List<string> HeaderEnvNames { get; set; } = new List<string>();

        /// <summary>
        /// Resolved environment for stdio servers.
        /// </summary>
        public List<ExecutionEnvironmentVariable> Env { get; set; } = new List<ExecutionEnvironmentVariable>();

        /// <summary>
        /// Environment variable names carrying each stdio environment value.
        /// </summary>
        public List<string> EnvEnvNames { get; set; } = new List<string>();

        /// <summary>
        /// Bearer token extracted from an Authorization header, when present.
        /// </summary>
        public string? BearerToken { get; set; } = null;

        /// <summary>
        /// Environment variable carrying the bearer token.
        /// </summary>
        public string? BearerEnvName { get; set; } = null;
    }
}
