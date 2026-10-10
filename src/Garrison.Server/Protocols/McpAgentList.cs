namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Agent list returned by MCP tools (an object, because some harnesses reject array results).
    /// </summary>
    public class McpAgentList
    {
        /// <summary>
        /// Agents.
        /// </summary>
        public List<McpAgentSummary> Agents { get; set; } = new List<McpAgentSummary>();

        /// <summary>
        /// Total matching agents.
        /// </summary>
        public long TotalRecords { get; set; } = 0;
    }
}
