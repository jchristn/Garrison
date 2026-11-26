namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// The CEO of an organization on the board view (AA10): the lead of the root unit, its mandate, and its briefs.
    /// Not thread-safe.
    /// </summary>
    public class BoardCeo
    {
        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// Agent name, or null.
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
        /// The CEO's mandate in the live revision, or null when it has none.
        /// </summary>
        public string? MandateId { get; set; } = null;

        /// <summary>
        /// Mandate name, or null.
        /// </summary>
        public string? MandateName { get; set; } = null;

        /// <summary>
        /// Deployment of the CEO's mandate, which board messages run on, or null when the mandate has none.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Hours between briefs from the mandate's published revision, or null when briefs are off.
        /// </summary>
        public int? BriefIntervalHours { get; set; } = null;

        /// <summary>
        /// When the CEO last filed a Brief report (UTC), or null when it never has.
        /// </summary>
        public DateTime? LastBriefUtc { get; set; } = null;
    }
}
