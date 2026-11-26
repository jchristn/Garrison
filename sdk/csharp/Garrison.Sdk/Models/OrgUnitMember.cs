namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// An agent that works in an org unit and reports to its lead (AA7). Not thread-safe.
    /// </summary>
    public class OrgUnitMember
    {
        /// <summary>
        /// Agent identifier. A request may name the agent instead. The agent must be active.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// Agent name, filled in on read.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// The member's title, at most 128 characters, or null.
        /// </summary>
        public string? Title { get; set; } = null;

        /// <summary>
        /// The member's mandate (a keeper of this agent), or null. A request may name the mandate instead.
        /// </summary>
        public string? MandateId { get; set; } = null;
    }
}
