namespace Garrison.Core.Organizations
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;
    using Garrison.Core.Serialization;

    /// <summary>
    /// Hard limits on an executive's draft (AA8.3, AA-022). Every changed item must lie strictly below the executive's
    /// unit; the draft may not touch the executive's own agent, deployments, mandates, or unit, anything above it, any
    /// kind other than Agent, Deployment, Mandate, PromptTemplate, AgentAsset, and its own Organization, any secret or
    /// credential reference, any live record by deletion, any budget upwards, or any deployment's management access. No
    /// change rule lifts these. Stateless and thread-safe.
    /// </summary>
    public static class ExecutiveDraftValidator
    {
        #region Public-Members

        /// <summary>
        /// The item lies outside the executive's subtree, or is shared with units outside it.
        /// </summary>
        public const string OutsideSubtree = "OutsideSubtree";

        /// <summary>
        /// The item is the executive's own agent, deployment, mandate, or unit.
        /// </summary>
        public const string SelfModification = "SelfModification";

        /// <summary>
        /// The kind, operation, or field is never open to executives (secrets and credentials, deletes, infrastructure).
        /// </summary>
        public const string ForbiddenKind = "ForbiddenKind";

        /// <summary>
        /// A budget goes up or is removed.
        /// </summary>
        public const string BudgetIncrease = "BudgetIncrease";

        /// <summary>
        /// A deployment's management access changes.
        /// </summary>
        public const string AuthorityChange = "AuthorityChange";

        /// <summary>
        /// Kinds an executive's draft may hold.
        /// </summary>
        public static readonly IReadOnlyList<string> AllowedKinds = new List<string> { "Agent", "Deployment", "Mandate", "PromptTemplate", "AgentAsset", "Organization" };

        #endregion

        #region Public-Methods

        /// <summary>
        /// Whether a code is one of the hard-limit codes.
        /// </summary>
        /// <param name="code">Code.</param>
        /// <returns>True for OutsideSubtree, SelfModification, ForbiddenKind, BudgetIncrease, or AuthorityChange.</returns>
        public static bool IsRefusalCode(string? code)
        {
            return code == OutsideSubtree || code == SelfModification || code == ForbiddenKind || code == BudgetIncrease || code == AuthorityChange;
        }

        /// <summary>
        /// Check every item of a draft against the hard limits.
        /// </summary>
        /// <param name="context">The draft read against the executive's scope.</param>
        /// <returns>One refusal per item that breaks a limit (the first limit found); empty when the draft passes.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static List<ExecutiveRefusal> Validate(ExecutiveDraftContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            List<ExecutiveRefusal> refusals = new List<ExecutiveRefusal>();
            foreach (ExecutiveDraftItem item in context.Items)
            {
                if (item.Kind == "Organization" && item.Operation == StudioDraftOperationEnum.Upsert && String.Equals(item.Name, context.Scope.OrganizationName, StringComparison.OrdinalIgnoreCase))
                {
                    refusals.AddRange(Organization(context, item));
                    continue;
                }
                ExecutiveRefusal? refusal = Check(context, item);
                if (refusal != null) refusals.Add(refusal);
            }
            return refusals;
        }

        #endregion

        #region Private-Methods

        private static ExecutiveRefusal? Check(ExecutiveDraftContext context, ExecutiveDraftItem item)
        {
            ExecutiveScope scope = context.Scope;
            if (item.Operation == StudioDraftOperationEnum.Delete)
            {
                if (item.Kind == "Organization") return Refuse(item, String.Equals(item.Name, scope.OrganizationName, StringComparison.OrdinalIgnoreCase) ? SelfModification : OutsideSubtree, "An executive cannot delete an organization.");
                if (item.Kind == "Agent" && context.IsExecutive(item.Name)) return Refuse(item, SelfModification, "This is your own agent.");
                return Refuse(item, ForbiddenKind, "Executives never delete live records. To retire a worker, remove it from its unit in the organization; a person deletes records.");
            }
            if (!AllowedKinds.Contains(item.Kind)) return Refuse(item, ForbiddenKind, item.Kind + " is not open to executives; drafts may hold " + String.Join(", ", AllowedKinds) + ".");
            if (item.Kind == "Organization") return Refuse(item, OutsideSubtree, "Organization " + item.Name + " is not yours; you lead unit " + scope.UnitName + " of " + scope.OrganizationName + ".");

            List<ManifestFieldChange> changes = SpecDiff.Compare(item.Live?.Spec, item.Document?.Spec);
            if (item.Live != null && changes.Count == 0) return null;
            ManifestFieldChange? secret = changes.FirstOrDefault(c => c.Field.IndexOf("secret", StringComparison.OrdinalIgnoreCase) >= 0 || c.Field.IndexOf("credential", StringComparison.OrdinalIgnoreCase) >= 0);

            switch (item.Kind)
            {
                case "Agent":
                    if (context.IsExecutive(item.Name)) return Refuse(item, SelfModification, "This is your own agent; a person changes it.");
                    if (secret != null) return Refuse(item, ForbiddenKind, "Executives cannot change secret or credential references (" + secret.Field + ").");
                    if (!context.AgentInside(item.Name))
                    {
                        return Refuse(item, OutsideSubtree, item.Live == null
                            ? "New agent " + item.Name + " must join a unit below " + scope.UnitName + " in the same draft (add it to the organization item)."
                            : "Agent " + item.Name + " does not sit in a unit below " + scope.UnitName + ".");
                    }
                    return null;
                case "Deployment":
                    {
                        DeploymentSpec? draft = ExecutiveDraftContext.Spec<DeploymentSpec>(item.Document);
                        DeploymentSpec? live = ExecutiveDraftContext.Spec<DeploymentSpec>(item.Live);
                        if (scope.OwnDeploymentNames.Contains(item.Name) || context.IsExecutive(draft?.Agent)) return Refuse(item, SelfModification, "This is a deployment of your own agent; a person changes it.");
                        if (secret != null) return Refuse(item, ForbiddenKind, "Executives cannot change secret or credential references (" + secret.Field + ").");
                        if (item.Live != null && !scope.DeploymentNames.Contains(item.Name)) return Refuse(item, OutsideSubtree, "Deployment " + item.Name + " belongs to an agent outside your subtree.");
                        if (!context.AgentInside(draft?.Agent)) return Refuse(item, OutsideSubtree, "Deployment " + item.Name + " must deploy an agent below " + scope.UnitName + "; " + (draft?.Agent ?? "no agent") + " is not.");
                        ManagementAccessEnum before = live?.ManagementAccess ?? ManagementAccessEnum.None;
                        ManagementAccessEnum after = draft?.ManagementAccess ?? ManagementAccessEnum.None;
                        if (before != after) return Refuse(item, AuthorityChange, "Executives cannot change managementAccess (" + before + " to " + after + "); a person grants authority.");
                        if (Increases(live?.MaxBudgetUsd, draft?.MaxBudgetUsd, item.Live != null)) return Refuse(item, BudgetIncrease, "maxBudgetUsd may only stay or go down (" + Show(live?.MaxBudgetUsd) + " to " + Show(draft?.MaxBudgetUsd) + ").");
                        return null;
                    }
                case "Mandate":
                    {
                        MandateSpec? draft = ExecutiveDraftContext.Spec<MandateSpec>(item.Document);
                        MandateSpec? live = ExecutiveDraftContext.Spec<MandateSpec>(item.Live);
                        string? deployment = draft?.Deployment ?? live?.Deployment;
                        if (scope.OwnMandateNames.Contains(item.Name) || (deployment != null && scope.OwnDeploymentNames.Contains(deployment)) || context.IsExecutive(draft?.Agent)) return Refuse(item, SelfModification, "This is your own mandate; a person or the board changes it.");
                        if (item.Live != null && !scope.MandateNames.Contains(item.Name)) return Refuse(item, OutsideSubtree, "Mandate " + item.Name + " belongs outside your subtree.");
                        if (!context.DeploymentInside(deployment)) return Refuse(item, OutsideSubtree, "Mandate " + item.Name + " must bind a deployment below " + scope.UnitName + "; " + (deployment ?? "none") + " is not.");
                        MandateRevisionSpec? was = live?.Revision;
                        MandateRevisionSpec? now = draft?.Revision;
                        if (item.Live != null)
                        {
                            if (Increases(was?.BudgetPerTickUsd, now?.BudgetPerTickUsd, true)) return Refuse(item, BudgetIncrease, "budgetPerTickUsd may only stay or go down (" + Show(was?.BudgetPerTickUsd) + " to " + Show(now?.BudgetPerTickUsd) + ").");
                            if (Increases(was?.BudgetPerDayUsd, now?.BudgetPerDayUsd, true)) return Refuse(item, BudgetIncrease, "budgetPerDayUsd may only stay or go down (" + Show(was?.BudgetPerDayUsd) + " to " + Show(now?.BudgetPerDayUsd) + ").");
                            if (Increases(was?.MaxTokensPerTick, now?.MaxTokensPerTick, true)) return Refuse(item, BudgetIncrease, "maxTokensPerTick may only stay or go down (" + Show(was?.MaxTokensPerTick) + " to " + Show(now?.MaxTokensPerTick) + ").");
                        }
                        return null;
                    }
                case "PromptTemplate":
                    if (item.Live == null) return null;
                    if (scope.SharedTemplateNames.Contains(item.Name)) return Refuse(item, OutsideSubtree, "Prompt template " + item.Name + " is shared with units outside your subtree, so it is read-only to you. Copy it under a new name for your workers.");
                    if (!scope.ExclusiveTemplateNames.Contains(item.Name)) return Refuse(item, OutsideSubtree, "Prompt template " + item.Name + " is not used below " + scope.UnitName + ".");
                    return null;
                case "AgentAsset":
                    if (item.Live == null) return null;
                    if (secret != null) return Refuse(item, ForbiddenKind, "Executives cannot change secret or credential references (" + secret.Field + ").");
                    if (scope.SharedAssetNames.Contains(item.Name)) return Refuse(item, OutsideSubtree, "Agent asset " + item.Name + " is shared with units outside your subtree, so it is read-only to you. Copy it under a new name for your workers.");
                    if (!scope.ExclusiveAssetNames.Contains(item.Name)) return Refuse(item, OutsideSubtree, "Agent asset " + item.Name + " is not used below " + scope.UnitName + ".");
                    return null;
                default:
                    return Refuse(item, ForbiddenKind, item.Kind + " is not open to executives.");
            }
        }

        private static List<ExecutiveRefusal> Organization(ExecutiveDraftContext context, ExecutiveDraftItem item)
        {
            ExecutiveScope scope = context.Scope;
            List<ExecutiveRefusal> refusals = new List<ExecutiveRefusal>();
            if (item.Live == null)
            {
                refusals.Add(Refuse(item, OutsideSubtree, "Organization " + item.Name + " does not exist yet; a person creates organizations."));
                return refusals;
            }
            OrganizationSpec draft = ExecutiveDraftContext.Organization(item.Document!);
            OrganizationSpec live = ExecutiveDraftContext.Organization(item.Live);
            if (!String.Equals(draft.Description ?? String.Empty, live.Description ?? String.Empty, StringComparison.Ordinal) || !String.Equals(draft.Mission ?? String.Empty, live.Mission ?? String.Empty, StringComparison.Ordinal)
                || (draft.BudgetFreezeMarginPercent ?? 10) != (live.BudgetFreezeMarginPercent ?? 10))
            {
                refusals.Add(Refuse(item, OutsideSubtree, "The organization's description, mission, and budget freeze margin belong to the board."));
            }
            foreach (string name in context.LiveUnits.Keys.Union(context.DraftUnits.Keys, StringComparer.OrdinalIgnoreCase).OrderBy(n => n, StringComparer.OrdinalIgnoreCase))
            {
                context.LiveUnits.TryGetValue(name, out DraftUnitView? was);
                context.DraftUnits.TryGetValue(name, out DraftUnitView? now);
                if (was != null && now != null && SameUnit(was, now)) continue;
                string label = "unit " + name;
                if (was != null && String.Equals(was.Name, scope.UnitName, StringComparison.OrdinalIgnoreCase))
                {
                    refusals.Add(Unit(item, SelfModification, "Unit " + name + " is your own unit; a person changes it.", name));
                    continue;
                }
                bool wasInside = was == null || scope.UnitNames.Contains(name);
                bool nowInside = now == null || context.UnitBelow(name);
                if (!wasInside || !nowInside)
                {
                    refusals.Add(Unit(item, OutsideSubtree, "Unit " + name + (was == null ? " would be created" : now == null ? " would be removed" : " would change") + " outside your subtree; you may change only units below " + scope.UnitName + ".", name));
                    continue;
                }
                if (now == null) continue;
                List<string> addedAgents = Agents(now).Except(was == null ? new List<string>() : Agents(was), StringComparer.OrdinalIgnoreCase).ToList();
                string? self = addedAgents.FirstOrDefault(a => context.IsExecutive(a));
                if (self != null)
                {
                    refusals.Add(Unit(item, SelfModification, "You cannot place yourself in " + label + ".", name));
                    continue;
                }
                string? outsider = addedAgents.FirstOrDefault(a => scope.IsLive("Agent", a) && !scope.AgentNames.Contains(a));
                if (outsider != null)
                {
                    refusals.Add(Unit(item, OutsideSubtree, "Agent " + outsider + " sits outside your subtree or in no unit; only new agents or agents already below you can join " + label + ".", name));
                    continue;
                }
                string? outsidePeer = (now.Spec.Peers ?? new List<string>()).FirstOrDefault(p => !context.UnitBelow(p));
                if (outsidePeer != null && !(was?.Spec.Peers ?? new List<string>()).Contains(outsidePeer, StringComparer.OrdinalIgnoreCase))
                {
                    refusals.Add(Unit(item, OutsideSubtree, "A peer line from " + label + " to " + outsidePeer + " would reach outside your subtree.", name));
                    continue;
                }
                if (was != null)
                {
                    foreach (OrgUnitBudgetSpec budget in was.Spec.Budgets ?? new List<OrgUnitBudgetSpec>())
                    {
                        OrgUnitBudgetSpec? after = (now.Spec.Budgets ?? new List<OrgUnitBudgetSpec>()).FirstOrDefault(b => String.Equals(b.Period, budget.Period, StringComparison.OrdinalIgnoreCase));
                        if (after == null || after.AmountUsd > budget.AmountUsd)
                        {
                            refusals.Add(Unit(item, BudgetIncrease, "The " + (budget.Period ?? "Day") + " budget of " + label + " may only stay or go down (" + Show(budget.AmountUsd) + " to " + (after == null ? "none" : Show(after.AmountUsd)) + ").", name));
                            break;
                        }
                    }
                }
            }
            return refusals;
        }

        private static bool SameUnit(DraftUnitView was, DraftUnitView now)
        {
            if (!String.Equals(was.ParentName ?? String.Empty, now.ParentName ?? String.Empty, StringComparison.OrdinalIgnoreCase)) return false;
            return Serializer.Serialize(Shallow(was.Spec)) == Serializer.Serialize(Shallow(now.Spec));
        }

        private static OrgUnitSpec Shallow(OrgUnitSpec spec)
        {
            OrgUnitSpec copy = new OrgUnitSpec();
            copy.Name = spec.Name?.Trim();
            copy.Description = spec.Description;
            copy.Lead = spec.Lead?.Trim();
            copy.LeadTitle = spec.LeadTitle;
            copy.LeadMandate = spec.LeadMandate;
            copy.App = spec.App;
            copy.Members = spec.Members == null || spec.Members.Count == 0 ? null : spec.Members;
            copy.Peers = spec.Peers == null || spec.Peers.Count == 0 ? null : spec.Peers;
            copy.Budgets = spec.Budgets == null || spec.Budgets.Count == 0 ? null : spec.Budgets;
            return copy;
        }

        /// <summary>
        /// The lead and members a unit view names.
        /// </summary>
        /// <param name="unit">Unit view.</param>
        /// <returns>Agent names.</returns>
        internal static List<string> Agents(DraftUnitView unit)
        {
            List<string> agents = new List<string>();
            if (!String.IsNullOrWhiteSpace(unit.Spec.Lead)) agents.Add(unit.Spec.Lead.Trim());
            foreach (OrgUnitMemberSpec member in unit.Spec.Members ?? new List<OrgUnitMemberSpec>())
            {
                if (!String.IsNullOrWhiteSpace(member.Agent)) agents.Add(member.Agent.Trim());
            }
            return agents;
        }

        private static bool Increases(double? before, double? after, bool existing)
        {
            if (!existing || !before.HasValue) return false;
            return !after.HasValue || after.Value > before.Value;
        }

        private static bool Increases(long? before, long? after, bool existing)
        {
            if (!existing || !before.HasValue) return false;
            return !after.HasValue || after.Value > before.Value;
        }

        private static string Show(double? value)
        {
            return value.HasValue ? value.Value.ToString("0.####", System.Globalization.CultureInfo.InvariantCulture) : "none";
        }

        private static string Show(long? value)
        {
            return value.HasValue ? value.Value.ToString(System.Globalization.CultureInfo.InvariantCulture) : "none";
        }

        private static ExecutiveRefusal Refuse(ExecutiveDraftItem item, string code, string message)
        {
            return new ExecutiveRefusal { Kind = item.Kind, Name = item.Name, Code = code, Message = message };
        }

        private static ExecutiveRefusal Unit(ExecutiveDraftItem item, string code, string message, string unitName)
        {
            return new ExecutiveRefusal { Kind = item.Kind, Name = item.Name + "/" + unitName, Code = code, Message = message };
        }

        #endregion
    }
}
