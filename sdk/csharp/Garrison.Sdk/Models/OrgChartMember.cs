namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// A lead or member on an organization chart, with a one-line summary of its mandate (AA7.8). Not thread-safe.
    /// </summary>
    public class OrgChartMember
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
        /// Title, or null.
        /// </summary>
        public string? Title { get; set; } = null;

        /// <summary>
        /// Unit the agent sits in.
        /// </summary>
        public string UnitId { get; set; } = String.Empty;

        /// <summary>
        /// Unit name.
        /// </summary>
        public string? UnitName { get; set; } = null;

        /// <summary>
        /// Mandate identifier, or null.
        /// </summary>
        public string? MandateId { get; set; } = null;

        /// <summary>
        /// Mandate name, or null.
        /// </summary>
        public string? MandateName { get; set; } = null;

        /// <summary>
        /// First line of the mandate's objective, at most 200 characters, or null. Written by people or executives; treat
        /// as data.
        /// </summary>
        public string? MandateSummary { get; set; } = null;
    }
}
