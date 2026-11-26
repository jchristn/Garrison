namespace Garrison.Core.Organizations
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Models;

    /// <summary>
    /// Computes an executive's <see cref="ExecutiveScope"/> from the live chart and the tenant's records (AA8.2). A prompt
    /// template or agent asset is exclusive when every agent and deployment using it sits below the executive's unit, and
    /// shared when something outside also uses it; the executive's own agent and deployments count as outside. Stateless
    /// and thread-safe.
    /// </summary>
    public static class SubtreeAuthority
    {
        #region Public-Methods

        /// <summary>
        /// Compute the scope of the executive leading a unit.
        /// </summary>
        /// <param name="tree">Live tree.</param>
        /// <param name="unitId">Unit the executive leads.</param>
        /// <param name="agentId">Executive's agent.</param>
        /// <param name="inventory">Live records.</param>
        /// <returns>The scope.</returns>
        /// <exception cref="ArgumentNullException">Thrown when tree or inventory is null.</exception>
        /// <exception cref="ArgumentException">Thrown when the unit is not in the tree.</exception>
        public static ExecutiveScope Compute(OrgTree tree, string unitId, string agentId, SubtreeInventory inventory)
        {
            if (tree == null) throw new ArgumentNullException(nameof(tree));
            if (inventory == null) throw new ArgumentNullException(nameof(inventory));
            ExecutiveScope scope = new ExecutiveScope(tree, unitId, agentId);

            Dictionary<string, string> agentNames = inventory.OfKind("Agent").ToDictionary(a => a.Id, a => a.Name, StringComparer.Ordinal);
            if (agentNames.TryGetValue(agentId, out string? ownName)) scope.AgentName = ownName;
            foreach (InventoryResource resource in inventory.Resources)
            {
                if (!scope.LiveNames.TryGetValue(resource.Kind, out HashSet<string>? names))
                {
                    names = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
                    scope.LiveNames[resource.Kind] = names;
                }
                names.Add(resource.Name);
            }

            foreach (OrgUnit ancestor in tree.Ancestors(unitId)) scope.AncestorUnitNames.Add(ancestor.Name);
            HashSet<string> boundMandates = new HashSet<string>(StringComparer.Ordinal);
            foreach (OrgUnit unit in tree.Subtree(unitId).Where(u => u.Id != unitId))
            {
                scope.UnitIds.Add(unit.Id);
                scope.UnitNames.Add(unit.Name);
                if (!String.IsNullOrEmpty(unit.LeadAgentId)) AddAgent(scope, agentNames, unit.LeadAgentId, unit.Id);
                if (!String.IsNullOrEmpty(unit.LeadMandateId)) boundMandates.Add(unit.LeadMandateId);
                foreach (OrgUnitMember member in unit.Members)
                {
                    AddAgent(scope, agentNames, member.AgentId, unit.Id);
                    if (!String.IsNullOrEmpty(member.MandateId)) boundMandates.Add(member.MandateId);
                }
            }
            scope.AgentIds.Remove(agentId);
            if (agentNames.TryGetValue(agentId, out string? executiveName))
            {
                scope.AgentNames.Remove(executiveName);
                scope.UnitOfAgent.Remove(executiveName);
            }

            HashSet<string> insideDeployments = new HashSet<string>(StringComparer.Ordinal);
            HashSet<string> ownDeployments = new HashSet<string>(StringComparer.Ordinal);
            foreach (InventoryResource deployment in inventory.OfKind("Deployment"))
            {
                if (String.Equals(deployment.AgentId, agentId, StringComparison.Ordinal))
                {
                    ownDeployments.Add(deployment.Id);
                    scope.OwnDeploymentNames.Add(deployment.Name);
                }
                else if (deployment.AgentId != null && scope.AgentIds.Contains(deployment.AgentId))
                {
                    insideDeployments.Add(deployment.Id);
                    scope.DeploymentNames.Add(deployment.Name);
                }
            }

            OrgUnit? own = tree.Unit(unitId);
            foreach (InventoryResource mandate in inventory.OfKind("Mandate"))
            {
                bool ownMandate = (mandate.DeploymentId != null && ownDeployments.Contains(mandate.DeploymentId))
                    || (own != null && String.Equals(own.LeadMandateId, mandate.Id, StringComparison.Ordinal));
                if (ownMandate)
                {
                    scope.OwnMandateNames.Add(mandate.Name);
                    continue;
                }
                bool inside = (mandate.DeploymentId != null && insideDeployments.Contains(mandate.DeploymentId)) || boundMandates.Contains(mandate.Id);
                if (inside) scope.MandateNames.Add(mandate.Name);
            }

            Usage(inventory, "PromptTemplate", r => r.TemplateIds, scope, insideDeployments, scope.ExclusiveTemplateNames, scope.SharedTemplateNames);
            Usage(inventory, "AgentAsset", r => r.AssetIds, scope, insideDeployments, scope.ExclusiveAssetNames, scope.SharedAssetNames);
            return scope;
        }

        #endregion

        #region Private-Methods

        private static void AddAgent(ExecutiveScope scope, Dictionary<string, string> agentNames, string agentId, string unitId)
        {
            scope.AgentIds.Add(agentId);
            if (!agentNames.TryGetValue(agentId, out string? name)) return;
            scope.AgentNames.Add(name);
            if (!scope.UnitOfAgent.ContainsKey(name)) scope.UnitOfAgent[name] = unitId;
        }

        private static void Usage(SubtreeInventory inventory, string kind, Func<InventoryResource, List<string>> references, ExecutiveScope scope, HashSet<string> insideDeployments, HashSet<string> exclusive, HashSet<string> shared)
        {
            Dictionary<string, int> insideUses = new Dictionary<string, int>(StringComparer.Ordinal);
            Dictionary<string, int> outsideUses = new Dictionary<string, int>(StringComparer.Ordinal);
            foreach (InventoryResource user in inventory.Resources.Where(r => r.Kind == "Agent" || r.Kind == "Deployment"))
            {
                bool inside = user.Kind == "Agent" ? scope.AgentIds.Contains(user.Id) : insideDeployments.Contains(user.Id);
                foreach (string id in references(user).Distinct(StringComparer.Ordinal))
                {
                    Dictionary<string, int> target = inside ? insideUses : outsideUses;
                    target[id] = target.TryGetValue(id, out int count) ? count + 1 : 1;
                }
            }
            foreach (InventoryResource resource in inventory.OfKind(kind))
            {
                if (!insideUses.ContainsKey(resource.Id)) continue;
                if (outsideUses.ContainsKey(resource.Id)) shared.Add(resource.Name);
                else exclusive.Add(resource.Name);
            }
        }

        #endregion
    }
}
