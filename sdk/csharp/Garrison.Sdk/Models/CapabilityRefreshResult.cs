namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Result of a capability refresh. Not thread-safe.
    /// </summary>
    public class CapabilityRefreshResult
    {
        #region Public-Members

        /// <summary>
        /// Agent descriptors created, refreshed, or removed. Zero when nothing changed.
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
        /// One entry per MCP server refreshed. Never null.
        /// </summary>
        public List<CapabilityServerRefresh> McpServers
        {
            get
            {
                return _McpServers;
            }
            set
            {
                _McpServers = value ?? new List<CapabilityServerRefresh>();
            }
        }

        #endregion

        #region Private-Members

        private List<CapabilityServerRefresh> _McpServers = new List<CapabilityServerRefresh>();

        #endregion
    }
}
