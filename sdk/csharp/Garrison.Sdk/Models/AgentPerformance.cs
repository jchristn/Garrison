namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// Performance of one agent positioned in an organization's live tree (AA11.1). Not thread-safe.
    /// </summary>
    public class AgentPerformance
    {
        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// Agent name, or null.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// Unit the agent sits in.
        /// </summary>
        public string UnitId { get; set; } = String.Empty;

        /// <summary>
        /// Unit name, or null.
        /// </summary>
        public string? UnitName { get; set; } = null;

        /// <summary>
        /// Whether the agent leads the unit.
        /// </summary>
        public bool IsLead { get; set; } = false;

        /// <summary>
        /// The agent's metrics.
        /// </summary>
        public PerformanceMetrics Metrics { get; set; } = new PerformanceMetrics();
    }
}
