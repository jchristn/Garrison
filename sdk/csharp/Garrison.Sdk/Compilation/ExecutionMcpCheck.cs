namespace Garrison.Sdk.Compilation
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// MCP pre-flight check the worker runs before launching the harness.
    /// </summary>
    public class ExecutionMcpCheck
    {
        /// <summary>
        /// Server name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Base URL.
        /// </summary>
        public string Url { get; set; } = String.Empty;

        /// <summary>
        /// MCP path.
        /// </summary>
        public string Path { get; set; } = "/mcp";

        /// <summary>
        /// Resolved HTTP headers (may contain secrets).
        /// </summary>
        public List<ExecutionEnvironmentVariable> Headers { get; set; } = new List<ExecutionEnvironmentVariable>();

        /// <summary>
        /// Tools that must be listed.
        /// </summary>
        public List<string> RequiredTools { get; set; } = new List<string>();

        /// <summary>
        /// Whether failure fails the run.
        /// </summary>
        public bool Required { get; set; } = true;
    }
}
