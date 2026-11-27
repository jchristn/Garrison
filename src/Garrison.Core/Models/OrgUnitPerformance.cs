namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// Performance of one unit's whole subtree (AA11.1). Not thread-safe.
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
        /// Parent unit, or null for the root.
        /// </summary>
        public string? ParentUnitId { get; set; } = null;

        /// <summary>
        /// The unit's lead, or null.
        /// </summary>
        public string? LeadAgentId { get; set; } = null;

        /// <summary>
        /// Metrics over every agent in the unit and the units below it.
        /// </summary>
        public PerformanceMetrics Metrics { get; set; } = new PerformanceMetrics();
    }
}
