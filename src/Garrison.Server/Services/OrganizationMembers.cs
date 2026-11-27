namespace Garrison.Server.Services
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// What a set of organizations holds in their live trees, used to filter tenant lists for a principal whose access
    /// comes from organization-scoped grants (UT-01). Not thread-safe.
    /// </summary>
    public class OrganizationMembers
    {
        #region Public-Members

        /// <summary>
        /// Organization identifiers. Never null.
        /// </summary>
        public HashSet<string> OrganizationIds { get; } = new HashSet<string>(StringComparer.Ordinal);

        /// <summary>
        /// Unit identifiers in the live trees. Never null.
        /// </summary>
        public HashSet<string> UnitIds { get; } = new HashSet<string>(StringComparer.Ordinal);

        /// <summary>
        /// Agents that hold a position in the live trees. Never null.
        /// </summary>
        public HashSet<string> AgentIds { get; } = new HashSet<string>(StringComparer.Ordinal);

        /// <summary>
        /// Keepers named on a seat in the live trees. Never null.
        /// </summary>
        public HashSet<string> MandateIds { get; } = new HashSet<string>(StringComparer.Ordinal);

        /// <summary>
        /// Deployments of the agents that hold positions. Never null.
        /// </summary>
        public HashSet<string> DeploymentIds { get; } = new HashSet<string>(StringComparer.Ordinal);

        /// <summary>
        /// Every identifier above in one list: organizations, units, agents, keepers, and deployments.
        /// </summary>
        /// <returns>Identifiers.</returns>
        public List<string> All()
        {
            List<string> all = new List<string>();
            all.AddRange(OrganizationIds);
            all.AddRange(UnitIds);
            all.AddRange(AgentIds);
            all.AddRange(MandateIds);
            all.AddRange(DeploymentIds);
            return all;
        }

        #endregion
    }
}
