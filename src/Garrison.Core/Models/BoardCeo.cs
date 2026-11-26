namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// The organization's top agent as the board sees it (AA10.2): the lead of the root unit, its mandate, and its briefs.
    /// Not thread-safe.
    /// </summary>
    public class BoardCeo
    {
        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// Agent name, or null when the agent no longer exists.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// Root unit identifier.
        /// </summary>
        public string UnitId { get; set; } = String.Empty;

        /// <summary>
        /// Root unit name, or null.
        /// </summary>
        public string? UnitName { get; set; } = null;

        /// <summary>
        /// The lead's mandate in the live revision, or null when it has none.
        /// </summary>
        public string? MandateId { get; set; } = null;

        /// <summary>
        /// Mandate name, or null.
        /// </summary>
        public string? MandateName { get; set; } = null;

        /// <summary>
        /// The mandate's deployment, which board conversations run on, or null.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Hours between briefs from the mandate's current published revision, or null for no briefs.
        /// </summary>
        public int? BriefIntervalHours { get; set; } = null;

        /// <summary>
        /// When the agent last filed a Brief report (UTC), or null.
        /// </summary>
        public DateTime? LastBriefUtc { get; set; } = null;
    }
}
