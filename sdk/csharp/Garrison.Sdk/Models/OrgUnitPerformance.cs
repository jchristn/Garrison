namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// Performance of one org unit's whole subtree (AA11.1). Not thread-safe.
    /// </summary>
    public class OrgUnitPerformance
    {
        /// <summary>
        /// Unit identifier.
        /// </summary>
        public string UnitId { get; set; } = String.Empty;

        /// <summary>
        /// Unit name.
        /// </summary>
        public string UnitName { get; set; } = String.Empty;

        /// <summary>
        /// Parent unit identifier, or null for the root.
        /// </summary>
        public string? ParentUnitId { get; set; } = null;

        /// <summary>
        /// Lead agent identifier, or null when the unit has no lead.
        /// </summary>
        public string? LeadAgentId { get; set; } = null;

        /// <summary>
        /// Metrics over every agent in the unit's subtree.
        /// </summary>
        public PerformanceMetrics Metrics { get; set; } = new PerformanceMetrics();
    }
}
