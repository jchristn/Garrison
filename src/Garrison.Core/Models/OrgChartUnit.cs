namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One unit on an organization chart (AA7.3). Not thread-safe.
    /// </summary>
    public class OrgChartUnit
    {
        /// <summary>
        /// Unit identifier.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Unit name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// What the unit is responsible for, or null.
        /// </summary>
        public string? Description { get; set; } = null;

        /// <summary>
        /// Parent unit, or null for the root.
        /// </summary>
        public string? ParentUnitId { get; set; } = null;

        /// <summary>
        /// Depth below the root (the root is 0).
        /// </summary>
        public int Depth { get; set; } = 0;

        /// <summary>
        /// Agentic app the unit runs, or null.
        /// </summary>
        public string? AppId { get; set; } = null;

        /// <summary>
        /// The lead, or null for a unit without one.
        /// </summary>
        public OrgChartMember? Lead { get; set; } = null;

        /// <summary>
        /// Members other than the lead.
        /// </summary>
        public List<OrgChartMember> Members { get; set; } = new List<OrgChartMember>();

        /// <summary>
        /// Units joined to this one by a peer line, in either direction.
        /// </summary>
        public List<string> PeerUnitIds { get; set; } = new List<string>();

        /// <summary>
        /// Direct child units.
        /// </summary>
        public List<string> ChildUnitIds { get; set; } = new List<string>();

        /// <summary>
        /// Budgets on the unit's subtree.
        /// </summary>
        public List<OrgUnitBudget> Budgets { get; set; } = new List<OrgUnitBudget>();
    }
}
