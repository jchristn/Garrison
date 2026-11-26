namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A run's own place in an organization (AA7.8, garrison_org_whoami): its unit, its manager, and its direct reports.
    /// Not thread-safe.
    /// </summary>
    public class OrgWhoAmI
    {
        /// <summary>
        /// Organization identifier.
        /// </summary>
        public string OrganizationId { get; set; } = String.Empty;

        /// <summary>
        /// Organization name.
        /// </summary>
        public string OrganizationName { get; set; } = String.Empty;

        /// <summary>
        /// The agent itself, with its unit, title, and mandate.
        /// </summary>
        public OrgChartMember Me { get; set; } = new OrgChartMember();

        /// <summary>
        /// True when the agent leads its unit.
        /// </summary>
        public bool IsLead { get; set; } = false;

        /// <summary>
        /// The manager, or null when the board (people) is the manager.
        /// </summary>
        public OrgChartMember? Manager { get; set; } = null;

        /// <summary>
        /// True when the board is the manager.
        /// </summary>
        public bool ManagerIsBoard { get; set; } = false;

        /// <summary>
        /// Agents that report directly to this one.
        /// </summary>
        public List<OrgChartMember> DirectReports { get; set; } = new List<OrgChartMember>();

        /// <summary>
        /// Units joined to the agent's unit by a peer line.
        /// </summary>
        public List<string> PeerUnitNames { get; set; } = new List<string>();
    }
}
