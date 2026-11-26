namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// Where an Agent capability's agent sits in a live organization (AA7.8), so peers can discover who is responsible for
    /// what. Filled in when descriptors are read; never stored. Not thread-safe.
    /// </summary>
    public class CapabilityOrgPlacement
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
        /// Unit identifier.
        /// </summary>
        public string UnitId { get; set; } = String.Empty;

        /// <summary>
        /// Unit name.
        /// </summary>
        public string UnitName { get; set; } = String.Empty;

        /// <summary>
        /// True when the agent leads the unit.
        /// </summary>
        public bool IsLead { get; set; } = false;

        /// <summary>
        /// The agent's title, or null.
        /// </summary>
        public string? Title { get; set; } = null;

        /// <summary>
        /// The agent's mandate name in this position, or null.
        /// </summary>
        public string? MandateName { get; set; } = null;

        /// <summary>
        /// First line of the mandate's objective, at most 200 characters, or null. Data written by people or executives.
        /// </summary>
        public string? MandateSummary { get; set; } = null;
    }
}
