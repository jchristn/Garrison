namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// An agent that belongs to an agentic app (AD6.1).
    /// </summary>
    public class AgenticAppMember
    {
        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// Agent name, filled in on read.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// What the member does in the app, for people, up to 256 characters, or null.
        /// </summary>
        public string? Role { get; set; } = null;
    }
}
