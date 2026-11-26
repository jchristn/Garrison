namespace Garrison.Core.Organizations
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Enums;
    using Garrison.Core.Manifests;
    using Garrison.Core.Models;

    /// <summary>
    /// Maps each change in an executive's draft to change classes (AA8.5). A new agent, deployment, or mandate is
    /// AddWorker; an agent joining a unit is AddWorker and one leaving is RemoveWorker; a deployment's model fields are
    /// ModelChange, its weight DeploymentWeight, and its prompt bindings PromptRetune; a mandate's wake fields are
    /// WakeTuning and its text fields MandateTextEdit; a prompt template or agent asset is PromptRetune (AddWorker when new
    /// in a draft that adds an agent); an agent's card text, skills, tags, and assets are PromptRetune. Anything else is
    /// unclassified. Stateless and thread-safe.
    /// </summary>
    public static class ChangeClassifier
    {
        #region Private-Members

        private static readonly HashSet<string> _AgentPrompt = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "displayName", "description", "skills", "tags", "assets" };
        private static readonly HashSet<string> _DeploymentModel = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "model", "fallbackModel", "effort", "inferenceEndpoint" };
        private static readonly HashSet<string> _DeploymentPrompt = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "prompts", "description" };
        private static readonly HashSet<string> _MandateText = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "objective", "healthyDefinition", "autonomy", "escalationPolicy", "direction", "signals", "changeNote" };
        private static readonly HashSet<string> _MandateWake = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "wakeMode", "minIntervalSeconds", "maxIntervalSeconds", "backoffFactor", "jitterPercent" };

        #endregion

        #region Public-Methods

        /// <summary>
        /// Classify every change of a draft.
        /// </summary>
        /// <param name="context">The draft read against the executive's scope.</param>
        /// <returns>Changes in item order; unchanged items are left out.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static List<ChangeClassification> Classify(ExecutiveDraftContext context)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            List<ChangeClassification> result = new List<ChangeClassification>();
            foreach (ExecutiveDraftItem item in context.Items)
            {
                if (item.Operation == StudioDraftOperationEnum.Delete)
                {
                    ChangeClassification deleted = New(item, context.Scope.UnitId);
                    deleted.Unclassified.Add("delete");
                    result.Add(deleted);
                    continue;
                }
                if (item.Kind == "Organization")
                {
                    result.AddRange(Organization(context, item));
                    continue;
                }
                List<ManifestFieldChange> changes = SpecDiff.Compare(item.Live?.Spec, item.Document?.Spec);
                if (item.Live != null && changes.Count == 0) continue;
                ChangeClassification change = New(item, Location(context, item));
                change.Subject = Subject(context, item);
                if (item.Live == null)
                {
                    bool asset = item.Kind == "PromptTemplate" || item.Kind == "AgentAsset";
                    change.Classes.Add(asset && !context.AddsAgent() ? ChangeClassEnum.PromptRetune : ChangeClassEnum.AddWorker);
                    if (item.Kind == "Agent" || item.Kind == "Deployment" || item.Kind == "Mandate") change.Detail = "new " + item.Kind.ToLowerInvariant();
                    if (item.Kind == "Mandate") AddWakeValues(change, item);
                    if (item.Kind == "Deployment") AddWeight(change, item);
                    result.Add(change);
                    continue;
                }
                foreach (ManifestFieldChange field in changes)
                {
                    string head = SpecDiff.Head(field.Field);
                    ChangeClassEnum? cls = null;
                    switch (item.Kind)
                    {
                        case "Agent":
                            if (_AgentPrompt.Contains(head)) cls = ChangeClassEnum.PromptRetune;
                            break;
                        case "Deployment":
                            if (_DeploymentModel.Contains(head)) cls = ChangeClassEnum.ModelChange;
                            else if (String.Equals(head, "weight", StringComparison.OrdinalIgnoreCase)) cls = ChangeClassEnum.DeploymentWeight;
                            else if (_DeploymentPrompt.Contains(head)) cls = ChangeClassEnum.PromptRetune;
                            break;
                        case "Mandate":
                            if (String.Equals(head, "description", StringComparison.OrdinalIgnoreCase)) cls = ChangeClassEnum.MandateTextEdit;
                            else if (String.Equals(head, "revision", StringComparison.OrdinalIgnoreCase))
                            {
                                string second = SpecDiff.Head(field.Field.Length > head.Length + 1 ? field.Field.Substring(head.Length + 1) : String.Empty);
                                if (_MandateText.Contains(second)) cls = ChangeClassEnum.MandateTextEdit;
                                else if (_MandateWake.Contains(second)) cls = ChangeClassEnum.WakeTuning;
                            }
                            break;
                        case "PromptTemplate":
                        case "AgentAsset":
                            cls = ChangeClassEnum.PromptRetune;
                            break;
                    }
                    if (cls.HasValue)
                    {
                        if (!change.Classes.Contains(cls.Value)) change.Classes.Add(cls.Value);
                    }
                    else if (!change.Unclassified.Contains(field.Field))
                    {
                        change.Unclassified.Add(field.Field);
                    }
                }
                if (change.Classes.Contains(ChangeClassEnum.WakeTuning)) AddWakeValues(change, item);
                if (change.Classes.Contains(ChangeClassEnum.DeploymentWeight)) AddWeight(change, item);
                result.Add(change);
            }
            return result;
        }

        #endregion

        #region Private-Methods

        private static ChangeClassification New(ExecutiveDraftItem item, string unitId)
        {
            return new ChangeClassification { Kind = item.Kind, Name = item.Name, UnitId = unitId, Subject = item.Kind + "/" + item.Name };
        }

        private static string Subject(ExecutiveDraftContext context, ExecutiveDraftItem item)
        {
            string? agent = item.Kind == "Agent" ? item.Name : item.Kind == "Deployment" ? context.AgentOfDeployment(item.Name) : item.Kind == "Mandate" ? context.AgentOfMandate(item.Name) : null;
            return agent == null ? item.Kind + "/" + item.Name : "Agent/" + agent.Trim().ToLowerInvariant();
        }

        private static string Location(ExecutiveDraftContext context, ExecutiveDraftItem item)
        {
            string? agent = null;
            switch (item.Kind)
            {
                case "Agent":
                    agent = item.Name;
                    break;
                case "Deployment":
                    agent = context.AgentOfDeployment(item.Name);
                    break;
                case "Mandate":
                    agent = context.AgentOfMandate(item.Name);
                    break;
            }
            return agent == null ? context.Scope.UnitId : context.LiveUnitId(context.UnitOfAgent(agent));
        }

        private static List<ChangeClassification> Organization(ExecutiveDraftContext context, ExecutiveDraftItem item)
        {
            List<ChangeClassification> result = new List<ChangeClassification>();
            foreach (string name in context.LiveUnits.Keys.Union(context.DraftUnits.Keys, StringComparer.OrdinalIgnoreCase).OrderBy(n => n, StringComparer.OrdinalIgnoreCase))
            {
                context.LiveUnits.TryGetValue(name, out DraftUnitView? was);
                context.DraftUnits.TryGetValue(name, out DraftUnitView? now);
                string unitId = context.LiveUnitId(now != null ? name : was?.ParentName ?? name);
                if (was == null || now == null)
                {
                    ChangeClassification structural = New(item, unitId);
                    structural.Detail = (was == null ? "adds unit " : "removes unit ") + name;
                    structural.Subject = "Unit/" + name.ToLowerInvariant();
                    structural.Unclassified.Add("units." + name);
                    result.Add(structural);
                    continue;
                }
                List<string> before = ExecutiveDraftValidator.Agents(was);
                List<string> after = ExecutiveDraftValidator.Agents(now);
                foreach (string added in after.Except(before, StringComparer.OrdinalIgnoreCase))
                {
                    ChangeClassification join = New(item, unitId);
                    join.Detail = "adds agent " + added + " to unit " + name;
                    join.Subject = "Agent/" + added.ToLowerInvariant();
                    join.Classes.Add(ChangeClassEnum.AddWorker);
                    result.Add(join);
                }
                foreach (string removed in before.Except(after, StringComparer.OrdinalIgnoreCase))
                {
                    ChangeClassification leave = New(item, unitId);
                    leave.Detail = "removes agent " + removed + " from unit " + name;
                    leave.Subject = "Agent/" + removed.ToLowerInvariant();
                    leave.Classes.Add(ChangeClassEnum.RemoveWorker);
                    result.Add(leave);
                }
                List<string> other = UnitFields(was, now, before, after);
                if (other.Count > 0)
                {
                    ChangeClassification changed = New(item, unitId);
                    changed.Detail = "changes unit " + name;
                    changed.Subject = "Unit/" + name.ToLowerInvariant();
                    changed.Unclassified.AddRange(other.Select(f => "units." + name + "." + f));
                    result.Add(changed);
                }
            }
            return result;
        }

        private static List<string> UnitFields(DraftUnitView was, DraftUnitView now, List<string> before, List<string> after)
        {
            List<string> fields = new List<string>();
            if (!String.Equals(was.ParentName ?? String.Empty, now.ParentName ?? String.Empty, StringComparison.OrdinalIgnoreCase)) fields.Add("parent");
            if (!Same(was.Spec.Description, now.Spec.Description)) fields.Add("description");
            if (!Same(was.Spec.Lead, now.Spec.Lead) && before.Count == after.Count) fields.Add("lead");
            if (!Same(was.Spec.LeadTitle, now.Spec.LeadTitle)) fields.Add("leadTitle");
            if (!Same(was.Spec.LeadMandate, now.Spec.LeadMandate)) fields.Add("leadMandate");
            if (!Same(was.Spec.App, now.Spec.App)) fields.Add("app");
            string Members(DraftUnitView unit) => String.Join("|", (unit.Spec.Members ?? new List<OrgUnitMemberSpec>()).Where(m => before.Contains(m.Agent?.Trim() ?? String.Empty, StringComparer.OrdinalIgnoreCase) && after.Contains(m.Agent?.Trim() ?? String.Empty, StringComparer.OrdinalIgnoreCase)).OrderBy(m => m.Agent, StringComparer.OrdinalIgnoreCase).Select(m => (m.Agent ?? String.Empty).Trim().ToLowerInvariant() + ":" + (m.Title ?? String.Empty) + ":" + (m.Mandate ?? String.Empty)));
            if (Members(was) != Members(now)) fields.Add("members");
            string Peers(DraftUnitView unit) => String.Join("|", (unit.Spec.Peers ?? new List<string>()).Select(p => p.Trim().ToLowerInvariant()).OrderBy(p => p, StringComparer.Ordinal));
            if (Peers(was) != Peers(now)) fields.Add("peers");
            string Budgets(DraftUnitView unit) => String.Join("|", (unit.Spec.Budgets ?? new List<OrgUnitBudgetSpec>()).OrderBy(b => b.Period, StringComparer.OrdinalIgnoreCase).Select(b => (b.Period ?? String.Empty).ToLowerInvariant() + ":" + b.AmountUsd.ToString(System.Globalization.CultureInfo.InvariantCulture)));
            if (Budgets(was) != Budgets(now)) fields.Add("budgets");
            return fields;
        }

        private static bool Same(string? a, string? b)
        {
            return String.Equals(a?.Trim() ?? String.Empty, b?.Trim() ?? String.Empty, StringComparison.Ordinal);
        }

        private static void AddWakeValues(ChangeClassification change, ExecutiveDraftItem item)
        {
            MandateRevisionSpec? revision = ExecutiveDraftContext.Spec<MandateSpec>(item.Document)?.Revision;
            if (revision == null) return;
            if (revision.MinIntervalSeconds.HasValue) change.Values["minIntervalSeconds"] = revision.MinIntervalSeconds.Value;
            if (revision.MaxIntervalSeconds.HasValue) change.Values["maxIntervalSeconds"] = revision.MaxIntervalSeconds.Value;
            if (revision.BackoffFactor.HasValue) change.Values["backoffFactor"] = revision.BackoffFactor.Value;
            if (revision.JitterPercent.HasValue) change.Values["jitterPercent"] = revision.JitterPercent.Value;
        }

        private static void AddWeight(ChangeClassification change, ExecutiveDraftItem item)
        {
            DeploymentSpec? deployment = ExecutiveDraftContext.Spec<DeploymentSpec>(item.Document);
            if (deployment != null) change.Values["weight"] = deployment.Weight;
        }

        #endregion
    }
}
