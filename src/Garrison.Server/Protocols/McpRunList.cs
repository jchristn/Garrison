namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Run list returned by MCP tools.
    /// </summary>
    public class McpRunList
    {
        /// <summary>
        /// Runs.
        /// </summary>
        public List<McpRunSummary> Runs { get; set; } = new List<McpRunSummary>();

        /// <summary>
        /// Total matching runs.
        /// </summary>
        public long TotalRecords { get; set; } = 0;
    }
}
