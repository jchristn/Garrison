namespace Garrison.Server.Services
{
    using System.Collections.Generic;

    /// <summary>
    /// What a capability refresh changed (AD4).
    /// </summary>
    public class CapabilityRefreshResult
    {
        /// <summary>
        /// Agent descriptors created, refreshed, or removed.
        /// </summary>
        public int Agents { get; set; } = 0;

        /// <summary>
        /// Harness built-in descriptors created, refreshed, or removed, across every scope.
        /// </summary>
        public int HarnessBuiltIns { get; set; } = 0;

        /// <summary>
        /// Agent descriptors whose hints were recomputed.
        /// </summary>
        public int Hints { get; set; } = 0;

        /// <summary>
        /// One entry per MCP server listed.
        /// </summary>
        public List<CapabilityServerRefresh> McpServers { get; set; } = new List<CapabilityServerRefresh>();
    }
}
