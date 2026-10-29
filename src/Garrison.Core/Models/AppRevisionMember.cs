namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// The agent revision an app revision pins for one member (AD6.4).
    /// </summary>
    public class AppRevisionMember
    {
        /// <summary>
        /// Member agent identifier.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// Member agent name, filled in on read.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// Pinned published agent revision.
        /// </summary>
        public string AgentRevisionId { get; set; } = String.Empty;

        /// <summary>
        /// Number of the pinned revision, filled in on read.
        /// </summary>
        public int? AgentRevisionNumber { get; set; } = null;
    }
}
