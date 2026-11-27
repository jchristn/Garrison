namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Performance of an organization over a window (AA11.1, AA11.2): one entry per unit in chart order, each covering its
    /// subtree, one per agent in the live tree, and the scheduled checks on their deployments. Restricted to one unit's
    /// subtree when asked. Computed by the server on each read and never stored. Not thread-safe.
    /// </summary>
    public class OrgPerformance
    {
        /// <summary>
        /// Organization identifier.
        /// </summary>
        public string OrganizationId { get; set; } = String.Empty;

        /// <summary>
        /// Organization name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Window start (UTC).
        /// </summary>
        public DateTime FromUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Window end (UTC).
        /// </summary>
        public DateTime ToUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the server computed the response (UTC).
        /// </summary>
        public DateTime GeneratedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// One entry per unit in chart order, each covering the unit's subtree.
        /// </summary>
        public List<OrgUnitPerformance> Units { get; set; } = new List<OrgUnitPerformance>();

        /// <summary>
        /// One entry per agent positioned in the live tree, or in the requested subtree.
        /// </summary>
        public List<AgentPerformance> Agents { get; set; } = new List<AgentPerformance>();

        /// <summary>
        /// Scheduled checks whose target deployment belongs to an agent in scope.
        /// </summary>
        public List<PerformanceCheck> Checks { get; set; } = new List<PerformanceCheck>();
    }
}
