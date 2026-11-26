namespace Garrison.Core.Organizations
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// What an executive may change (AA8.2, AA-022): the units strictly below the unit it leads, their leads and members,
    /// those agents' deployments and mandates, and the prompt templates and agent assets used only by them. Templates and
    /// assets also used outside the subtree are shared and read-only. Names compare without regard to case. Computed by
    /// <see cref="SubtreeAuthority"/> from the live chart. Not thread-safe.
    /// </summary>
    public class ExecutiveScope
    {
        #region Public-Members

        /// <summary>
        /// The live tree the scope was computed from.
        /// </summary>
        public OrgTree Tree { get; }

        /// <summary>
        /// Organization identifier.
        /// </summary>
        public string OrganizationId { get; }

        /// <summary>
        /// Organization name.
        /// </summary>
        public string OrganizationName { get; }

        /// <summary>
        /// The unit the executive leads.
        /// </summary>
        public string UnitId { get; }

        /// <summary>
        /// The unit's name.
        /// </summary>
        public string UnitName { get; }

        /// <summary>
        /// The executive's agent.
        /// </summary>
        public string AgentId { get; }

        /// <summary>
        /// The executive's agent name, or its identifier when the inventory does not name it.
        /// </summary>
        public string AgentName { get; set; } = String.Empty;

        /// <summary>
        /// Units strictly below the executive's unit.
        /// </summary>
        public HashSet<string> UnitIds { get; } = new HashSet<string>(StringComparer.Ordinal);

        /// <summary>
        /// Names of the units strictly below the executive's unit.
        /// </summary>
        public HashSet<string> UnitNames { get; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Names of the units above the executive's unit.
        /// </summary>
        public HashSet<string> AncestorUnitNames { get; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Agents holding a position below the executive's unit (never the executive).
        /// </summary>
        public HashSet<string> AgentIds { get; } = new HashSet<string>(StringComparer.Ordinal);

        /// <summary>
        /// Names of the agents below the executive's unit.
        /// </summary>
        public HashSet<string> AgentNames { get; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// For each agent name below the executive's unit, the unit it sits in.
        /// </summary>
        public Dictionary<string, string> UnitOfAgent { get; } = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Deployments of agents below the executive's unit.
        /// </summary>
        public HashSet<string> DeploymentNames { get; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Mandates of deployments below the executive's unit, and mandates the subtree's units bind.
        /// </summary>
        public HashSet<string> MandateNames { get; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// The executive's own deployments.
        /// </summary>
        public HashSet<string> OwnDeploymentNames { get; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// The executive's own mandates: those of its deployments and the lead mandate of its unit.
        /// </summary>
        public HashSet<string> OwnMandateNames { get; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Prompt templates used only inside the subtree.
        /// </summary>
        public HashSet<string> ExclusiveTemplateNames { get; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Prompt templates used inside and outside the subtree (read-only to the executive).
        /// </summary>
        public HashSet<string> SharedTemplateNames { get; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Agent assets used only inside the subtree.
        /// </summary>
        public HashSet<string> ExclusiveAssetNames { get; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Agent assets used inside and outside the subtree (read-only to the executive).
        /// </summary>
        public HashSet<string> SharedAssetNames { get; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Every live record name per kind, so the validator can tell a new record from one outside the subtree.
        /// </summary>
        public Dictionary<string, HashSet<string>> LiveNames { get; } = new Dictionary<string, HashSet<string>>(StringComparer.Ordinal);

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate an empty scope.
        /// </summary>
        /// <param name="tree">Live tree.</param>
        /// <param name="unitId">Unit the executive leads.</param>
        /// <param name="agentId">Executive's agent.</param>
        /// <exception cref="ArgumentNullException">Thrown when tree is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the unit is not in the tree.</exception>
        public ExecutiveScope(OrgTree tree, string unitId, string agentId)
        {
            Tree = tree ?? throw new ArgumentNullException(nameof(tree));
            OrgUnitOrThrow(tree, unitId);
            OrganizationId = tree.Organization.Id;
            OrganizationName = tree.Organization.Name;
            UnitId = unitId;
            UnitName = tree.Unit(unitId)!.Name;
            AgentId = agentId ?? String.Empty;
            AgentName = AgentId;
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether a live record of a kind exists with a name.
        /// </summary>
        /// <param name="kind">Manifest kind.</param>
        /// <param name="name">Name.</param>
        /// <returns>True when live.</returns>
        public bool IsLive(string kind, string? name)
        {
            if (String.IsNullOrWhiteSpace(name)) return false;
            return LiveNames.TryGetValue(kind, out HashSet<string>? names) && names.Contains(name.Trim());
        }

        #endregion

        #region Private-Methods

        private static void OrgUnitOrThrow(OrgTree tree, string unitId)
        {
            if (tree.Unit(unitId) == null) throw new ArgumentException("Unit " + unitId + " is not in organization " + tree.Organization.Name + ".", nameof(unitId));
        }

        #endregion
    }
}
