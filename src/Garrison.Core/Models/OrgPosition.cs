namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// Where an agent sits in one organization's live revision (AA7.5): its unit, whether it leads it, and its manager.
    /// Computed by the chain of command; never stored. Not thread-safe.
    /// </summary>
    public class OrgPosition
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
        /// Live revision the position was read from.
        /// </summary>
        public string RevisionId { get; set; } = String.Empty;

        /// <summary>
        /// The agent's unit.
        /// </summary>
        public string UnitId { get; set; } = String.Empty;

        /// <summary>
        /// The unit's name.
        /// </summary>
        public string UnitName { get; set; } = String.Empty;

        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// True when the agent leads the unit; false for a member.
        /// </summary>
        public bool IsLead { get; set; } = false;

        /// <summary>
        /// The agent's title, or null.
        /// </summary>
        public string? Title { get; set; } = null;

        /// <summary>
        /// The agent's mandate in this position, or null.
        /// </summary>
        public string? MandateId { get; set; } = null;

        /// <summary>
        /// The manager agent: the unit's lead for a member, the nearest lead above for a lead. Null when the board (the
        /// people above the organization) is the manager.
        /// </summary>
        public string? ManagerAgentId { get; set; } = null;

        /// <summary>
        /// True when no agent is above this one: the board is its manager.
        /// </summary>
        public bool ManagerIsBoard
        {
            get
            {
                return String.IsNullOrEmpty(ManagerAgentId);
            }
        }
    }
}
