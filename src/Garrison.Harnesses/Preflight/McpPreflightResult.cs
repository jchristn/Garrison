namespace Garrison.Harnesses.Preflight
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Result of MCP pre-flight checks.
    /// </summary>
    public class McpPreflightResult
    {
        /// <summary>
        /// Whether every required check passed.
        /// </summary>
        public bool Success { get; set; } = true;

        /// <summary>
        /// Failure description naming the server and missing tools.
        /// </summary>
        public string? Message { get; set; } = null;

        /// <summary>
        /// Non-fatal problems with optional servers.
        /// </summary>
        public List<string> Warnings { get; set; } = new List<string>();
    }
}
