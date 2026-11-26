namespace Garrison.Core.Organizations
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Serialization;
    using Garrison.Core.Templates;

    /// <summary>
    /// An executive's draft read against its scope (AA8.3, AA8.5): where each agent sits after the draft, which agent
    /// each deployment and mandate belongs to, and whether a name lies below the executive. Shared by
    /// <see cref="ExecutiveDraftValidator"/> and <see cref="ChangeClassifier"/>. Not thread-safe.
    /// </summary>
    public class ExecutiveDraftContext
    {
        #region Public-Members

        /// <summary>
        /// The executive's scope.
        /// </summary>
        public ExecutiveScope Scope { get; }

        /// <summary>
        /// The draft's items.
        /// </summary>
        public IReadOnlyList<ExecutiveDraftItem> Items { get; }

        /// <summary>
        /// Units of the executive's organization as the draft leaves them, by name.
        /// </summary>
        public Dictionary<string, DraftUnitView> DraftUnits { get; } = new Dictionary<string, DraftUnitView>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Units of the executive's organization as they are live (working tree), by name.
        /// </summary>
        public Dictionary<string, DraftUnitView> LiveUnits { get; } = new Dictionary<string, DraftUnitView>(StringComparer.OrdinalIgnoreCase);

        /// <summary>
        /// Whether the draft holds the executive's organization.
        /// </summary>
        public bool HasOrganization { get; }

        #endregion

        #region Private-Members

        private readonly Dictionary<string, string> _AgentUnit = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, string> _DeploymentAgent = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, string> _MandateDeployment = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        private readonly Dictionary<string, string> _MandateAgent = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Read a draft against a scope.
        /// </summary>
        /// <param name="scope">Executive scope.</param>
        /// <param name="items">Draft items with their live records.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public ExecutiveDraftContext(ExecutiveScope scope, List<ExecutiveDraftItem> items)
        {
            Scope = scope ?? throw new ArgumentNullException(nameof(scope));
            Items = items ?? throw new ArgumentNullException(nameof(items));

            ExecutiveDraftItem? organization = items.FirstOrDefault(i => i.Kind == "Organization" && String.Equals(i.Name, scope.OrganizationName, StringComparison.OrdinalIgnoreCase));
            HasOrganization = organization != null && organization.Operation == StudioDraftOperationEnum.Upsert && organization.Document != null;
            if (organization?.Live != null) Flatten(Organization(organization.Live).Units, null, LiveUnits);
            if (HasOrganization) Flatten(Organization(organization!.Document!).Units, null, DraftUnits);
            else foreach (KeyValuePair<string, DraftUnitView> unit in LiveUnits) DraftUnits[unit.Key] = unit.Value;

            foreach (DraftUnitView unit in DraftUnits.Values)
            {
                if (!String.IsNullOrWhiteSpace(unit.Spec.Lead) && !_AgentUnit.ContainsKey(unit.Spec.Lead.Trim())) _AgentUnit[unit.Spec.Lead.Trim()] = unit.Name;
                foreach (OrgUnitMemberSpec member in unit.Spec.Members ?? new List<OrgUnitMemberSpec>())
                {
                    if (!String.IsNullOrWhiteSpace(member.Agent) && !_AgentUnit.ContainsKey(member.Agent.Trim())) _AgentUnit[member.Agent.Trim()] = unit.Name;
                }
            }

            foreach (ExecutiveDraftItem item in items)
            {
                ManifestDocument? document = item.Document ?? item.Live;
                if (document == null) continue;
                if (item.Kind == "Deployment")
                {
                    string? agent = Text(document.Spec, "agent");
                    if (agent != null) _DeploymentAgent[item.Name] = agent;
                }
                else if (item.Kind == "Mandate")
                {
                    string? deployment = Text(document.Spec, "deployment");
                    string? agent = Text(document.Spec, "agent");
                    if (deployment != null) _MandateDeployment[item.Name] = deployment;
                    if (agent != null) _MandateAgent[item.Name] = agent;
                }
            }
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Parse an Organization document's spec.
        /// </summary>
        /// <param name="document">Document.</param>
        /// <returns>Spec.</returns>
        public static OrganizationSpec Organization(ManifestDocument document)
        {
            if (document == null) throw new ArgumentNullException(nameof(document));
            return Serializer.Deserialize<OrganizationSpec>(TemplateValues.ToJson(document.Spec)) ?? new OrganizationSpec();
        }

        /// <summary>
        /// Parse a document's spec as a typed spec.
        /// </summary>
        /// <typeparam name="T">Spec type.</typeparam>
        /// <param name="document">Document, or null.</param>
        /// <returns>Spec, or null for a null document.</returns>
        public static T? Spec<T>(ManifestDocument? document) where T : class
        {
            if (document == null) return null;
            return Serializer.Deserialize<T>(TemplateValues.ToJson(document.Spec));
        }

        /// <summary>
        /// Whether a unit name lies strictly below the executive's unit after the draft: a live unit in the scope, or a new
        /// unit whose parents lead down from the executive's unit or a unit in the scope.
        /// </summary>
        /// <param name="unitName">Unit name.</param>
        /// <returns>True when below.</returns>
        public bool UnitBelow(string? unitName)
        {
            if (String.IsNullOrWhiteSpace(unitName)) return false;
            string name = unitName.Trim();
            HashSet<string> seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            while (seen.Add(name))
            {
                if (Scope.UnitNames.Contains(name)) return true;
                if (String.Equals(name, Scope.UnitName, StringComparison.OrdinalIgnoreCase)) return seen.Count > 1;
                if (Scope.Tree.UnitByName(name) != null) return false;
                if (!DraftUnits.TryGetValue(name, out DraftUnitView? unit) || String.IsNullOrWhiteSpace(unit.ParentName)) return false;
                name = unit.ParentName.Trim();
            }
            return false;
        }

        /// <summary>
        /// The live unit a unit name belongs to: the unit itself when live, otherwise its nearest live ancestor in the
        /// draft, falling back to the executive's unit.
        /// </summary>
        /// <param name="unitName">Unit name, or null.</param>
        /// <returns>Live unit identifier.</returns>
        public string LiveUnitId(string? unitName)
        {
            string? name = unitName?.Trim();
            HashSet<string> seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            while (!String.IsNullOrEmpty(name) && seen.Add(name))
            {
                Garrison.Core.Models.OrgUnit? live = Scope.Tree.UnitByName(name);
                if (live != null) return live.Id;
                if (!DraftUnits.TryGetValue(name, out DraftUnitView? unit)) break;
                name = unit.ParentName?.Trim();
            }
            return Scope.UnitId;
        }

        /// <summary>
        /// The unit an agent sits in after the draft, or null.
        /// </summary>
        /// <param name="agentName">Agent name.</param>
        /// <returns>Unit name, or null.</returns>
        public string? UnitOfAgent(string? agentName)
        {
            if (String.IsNullOrWhiteSpace(agentName)) return null;
            if (_AgentUnit.TryGetValue(agentName.Trim(), out string? unit)) return unit;
            if (Scope.UnitOfAgent.TryGetValue(agentName.Trim(), out string? unitId)) return Scope.Tree.Unit(unitId)?.Name;
            return null;
        }

        /// <summary>
        /// Whether an agent lies below the executive after the draft: an agent already in the scope, or a new agent the
        /// draft places in a unit below the executive. A live agent from outside never moves in through a draft.
        /// </summary>
        /// <param name="agentName">Agent name.</param>
        /// <returns>True when inside.</returns>
        public bool AgentInside(string? agentName)
        {
            if (String.IsNullOrWhiteSpace(agentName)) return false;
            string name = agentName.Trim();
            if (IsExecutive(name)) return false;
            if (Scope.AgentNames.Contains(name)) return true;
            if (Scope.IsLive("Agent", name)) return false;
            return UnitBelow(UnitOfAgent(name));
        }

        /// <summary>
        /// Whether a name is the executive's own agent.
        /// </summary>
        /// <param name="agentName">Agent name.</param>
        /// <returns>True for the executive.</returns>
        public bool IsExecutive(string? agentName)
        {
            return !String.IsNullOrWhiteSpace(agentName) && String.Equals(agentName.Trim(), Scope.AgentName, StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// The agent of a deployment after the draft, or null when unknown.
        /// </summary>
        /// <param name="deploymentName">Deployment name.</param>
        /// <returns>Agent name, or null.</returns>
        public string? AgentOfDeployment(string? deploymentName)
        {
            if (String.IsNullOrWhiteSpace(deploymentName)) return null;
            return _DeploymentAgent.TryGetValue(deploymentName.Trim(), out string? agent) ? agent : null;
        }

        /// <summary>
        /// Whether a deployment lies below the executive after the draft: a deployment in the scope or a new one, whose
        /// agent is inside.
        /// </summary>
        /// <param name="deploymentName">Deployment name.</param>
        /// <returns>True when inside.</returns>
        public bool DeploymentInside(string? deploymentName)
        {
            if (String.IsNullOrWhiteSpace(deploymentName)) return false;
            string name = deploymentName.Trim();
            if (Scope.OwnDeploymentNames.Contains(name)) return false;
            if (Scope.IsLive("Deployment", name) && !Scope.DeploymentNames.Contains(name)) return false;
            string? agent = AgentOfDeployment(name);
            return agent == null ? Scope.DeploymentNames.Contains(name) : AgentInside(agent);
        }

        /// <summary>
        /// The deployment a mandate binds after the draft, or null.
        /// </summary>
        /// <param name="mandateName">Mandate name.</param>
        /// <returns>Deployment name, or null.</returns>
        public string? DeploymentOfMandate(string? mandateName)
        {
            if (String.IsNullOrWhiteSpace(mandateName)) return null;
            return _MandateDeployment.TryGetValue(mandateName.Trim(), out string? deployment) ? deployment : null;
        }

        /// <summary>
        /// The agent a mandate names after the draft, or null.
        /// </summary>
        /// <param name="mandateName">Mandate name.</param>
        /// <returns>Agent name, or null.</returns>
        public string? AgentOfMandate(string? mandateName)
        {
            if (String.IsNullOrWhiteSpace(mandateName)) return null;
            if (_MandateAgent.TryGetValue(mandateName.Trim(), out string? agent)) return agent;
            return AgentOfDeployment(DeploymentOfMandate(mandateName));
        }

        /// <summary>
        /// Whether the draft adds a new agent.
        /// </summary>
        /// <returns>True when an Agent item creates a record.</returns>
        public bool AddsAgent()
        {
            return Items.Any(i => i.Kind == "Agent" && i.Operation == StudioDraftOperationEnum.Upsert && i.Live == null);
        }

        #endregion

        #region Private-Methods

        private static void Flatten(List<OrgUnitSpec>? units, string? parent, Dictionary<string, DraftUnitView> output)
        {
            if (units == null) return;
            foreach (OrgUnitSpec unit in units)
            {
                if (String.IsNullOrWhiteSpace(unit.Name)) continue;
                string name = unit.Name.Trim();
                if (!output.ContainsKey(name)) output[name] = new DraftUnitView { Name = name, ParentName = parent, Spec = unit };
                Flatten(unit.Units, name, output);
            }
        }

        private static string? Text(Dictionary<string, object?> spec, string key)
        {
            if (!spec.TryGetValue(key, out object? value) || value == null) return null;
            string text = TemplateValues.ToText(value).Trim();
            return text.Length == 0 ? null : text;
        }

        #endregion
    }
}
