namespace Garrison.Core.Compilation
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Where a run's agent sits in a live organization (AA7.8), rendered into the system prompt through
    /// builtin/org-context as org.*. Not thread-safe.
    /// </summary>
    public class CompilationOrgContext
    {
        /// <summary>
        /// Organization name.
        /// </summary>
        public string OrganizationName { get; set; } = String.Empty;

        /// <summary>
        /// Mission, or null.
        /// </summary>
        public string? Mission { get; set; } = null;

        /// <summary>
        /// The agent's unit.
        /// </summary>
        public string UnitName { get; set; } = String.Empty;

        /// <summary>
        /// The agent's title, or null.
        /// </summary>
        public string? Title { get; set; } = null;

        /// <summary>
        /// True when the agent leads its unit.
        /// </summary>
        public bool IsLead { get; set; } = false;

        /// <summary>
        /// The manager agent's name, or null when the board is the manager.
        /// </summary>
        public string? ManagerName { get; set; } = null;

        /// <summary>
        /// Names of the agents that report directly to this one.
        /// </summary>
        public List<string> DirectReports { get; set; } = new List<string>();

        /// <summary>
        /// Names of the units joined to the agent's unit by a peer line.
        /// </summary>
        public List<string> PeerUnits { get; set; } = new List<string>();
    }
}
