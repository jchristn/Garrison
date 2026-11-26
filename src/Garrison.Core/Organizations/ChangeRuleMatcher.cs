namespace Garrison.Core.Organizations
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Matches an executive's classified changes against change rules (AA8.6, AA-023). A change is covered by the oldest
    /// in-force rule whose unit contains the change's unit, which lists every class of the change, and whose value limits
    /// the change's new values meet; then each rule's count limits are checked across the draft, counting each subject (an
    /// agent with its deployment, mandate, and unit place, or another record) once. Changes with unclassified
    /// fields are never covered. Stateless and thread-safe.
    /// </summary>
    public static class ChangeRuleMatcher
    {
        #region Public-Members

        /// <summary>
        /// The count limit name, valid for every class.
        /// </summary>
        public const string CountLimit = "count";

        /// <summary>
        /// Match item code (AA9.10): a rule would cover the change once the draft passes the rule's eval gate.
        /// </summary>
        public static readonly string EvalGatePending = "EvalGatePending";

        /// <summary>
        /// Classes an eval gate applies to (AA9.10). A rule's gate holds back only changes with one of these classes.
        /// </summary>
        public static readonly IReadOnlyList<ChangeClassEnum> GatedClasses = new List<ChangeClassEnum> { ChangeClassEnum.AddWorker, ChangeClassEnum.ModelChange };

        #endregion

        #region Public-Methods

        /// <summary>
        /// Limit names a class accepts.
        /// </summary>
        /// <param name="changeClass">Class.</param>
        /// <returns>Names.</returns>
        public static List<string> KnownLimitNames(ChangeClassEnum changeClass)
        {
            List<string> names = new List<string> { CountLimit };
            if (changeClass == ChangeClassEnum.WakeTuning) names.AddRange(new[] { "minIntervalSeconds", "maxIntervalSeconds", "backoffFactor", "jitterPercent" });
            if (changeClass == ChangeClassEnum.DeploymentWeight) names.Add("weight");
            return names;
        }

        /// <summary>
        /// Match classified changes against rules.
        /// </summary>
        /// <param name="changes">Classified changes.</param>
        /// <param name="rules">Rules of the executive's organization; those not in force at <paramref name="utc"/> are ignored.</param>
        /// <param name="tree">Live tree, for unit containment.</param>
        /// <param name="utc">Time (UTC).</param>
        /// <param name="gates">Eval gate status of the draft per rule identifier (AA9.10), or null. A rule with a gate covers
        /// an AddWorker or ModelChange change only when its status here is satisfied; a rule missing from the map counts as
        /// not satisfied.</param>
        /// <returns>The verdict.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument other than gates is null.</exception>
        public static ChangeRuleMatch Match(List<ChangeClassification> changes, List<ChangeRule> rules, OrgTree tree, DateTime utc, Dictionary<string, ChangeRuleGateStatus>? gates = null)
        {
            if (changes == null) throw new ArgumentNullException(nameof(changes));
            if (rules == null) throw new ArgumentNullException(nameof(rules));
            if (tree == null) throw new ArgumentNullException(nameof(tree));
            List<ChangeRule> inForce = rules.Where(r => r.InForce(utc) && r.OrganizationId == tree.Organization.Id).OrderBy(r => r.CreatedUtc).ThenBy(r => r.Id, StringComparer.Ordinal).ToList();
            ChangeRuleMatch match = new ChangeRuleMatch();
            Dictionary<ChangeRuleMatchItem, ChangeRule> assigned = new Dictionary<ChangeRuleMatchItem, ChangeRule>();
            foreach (ChangeClassification change in changes)
            {
                ChangeRuleMatchItem item = new ChangeRuleMatchItem { Kind = change.Kind, Name = change.Name, Detail = change.Detail, Subject = change.Subject, Classes = change.Classes.ToList() };
                match.Items.Add(item);
                if (change.Unclassified.Count > 0)
                {
                    item.Reason = "Needs a person: no change class covers " + String.Join(", ", change.Unclassified.Take(5)) + (change.Unclassified.Count > 5 ? " and more" : String.Empty) + ".";
                    continue;
                }
                if (change.Classes.Count == 0)
                {
                    item.Reason = "Needs a person: the change has no class.";
                    continue;
                }
                string? lastReason = null;
                string? gateReason = null;
                foreach (ChangeRule rule in inForce)
                {
                    string? why = Covers(rule, change, tree);
                    if (why == null && Gated(rule, change))
                    {
                        // AA9.10: the rule would cover the change, but only once the draft passed its eval gate.
                        ChangeRuleGateStatus? gate = gates != null && gates.TryGetValue(rule.Id, out ChangeRuleGateStatus? found) ? found : null;
                        if (gate == null || !gate.Satisfied)
                        {
                            gateReason ??= gate?.Reason ?? "rule " + rule.Name + " requires a passing eval run of eval set " + rule.GateEvalSet + " for the draft.";
                            continue;
                        }
                        item.GateEvalRunId = gate.EvalRunId;
                    }
                    if (why == null)
                    {
                        item.RuleId = rule.Id;
                        item.RuleName = rule.Name;
                        assigned[item] = rule;
                        break;
                    }
                    lastReason ??= why;
                }
                if (item.RuleId == null)
                {
                    item.GateEvalRunId = null;
                    // A pending eval gate is the reason that says what to do next, so it wins over the other rules' reasons.
                    item.Reason = "Needs a person: " + (gateReason ?? lastReason ?? "no change rule is in force for this organization.");
                    if (gateReason != null) item.Code = EvalGatePending;
                }
            }

            foreach (IGrouping<string, KeyValuePair<ChangeRuleMatchItem, ChangeRule>> byRule in assigned.GroupBy(a => a.Value.Id, StringComparer.Ordinal))
            {
                ChangeRule rule = byRule.First().Value;
                foreach (ChangeRuleLimit limit in rule.Limits.Where(l => String.Equals(l.Name, CountLimit, StringComparison.OrdinalIgnoreCase)))
                {
                    // One subject counts once, so a new worker's agent, deployment, mandate, and unit place are one AddWorker.
                    List<ChangeRuleMatchItem> ofClass = byRule.Select(a => a.Key).Where(i => i.Classes.Contains(limit.Class)).ToList();
                    int count = ofClass.Select(i => i.Subject).Distinct(StringComparer.OrdinalIgnoreCase).Count();
                    if (count == 0) continue;
                    if ((limit.Maximum.HasValue && count > limit.Maximum.Value) || (limit.Minimum.HasValue && count < limit.Minimum.Value))
                    {
                        foreach (ChangeRuleMatchItem item in ofClass)
                        {
                            item.RuleId = null;
                            item.RuleName = null;
                            item.GateEvalRunId = null;
                            item.Reason = "Needs a person: rule " + rule.Name + " allows " + Range(limit) + " " + limit.Class + " changes in one draft, and this draft has " + count.ToString(CultureInfo.InvariantCulture) + ".";
                        }
                    }
                }
            }
            return match;
        }

        #endregion

        #region Private-Methods

        private static string? Covers(ChangeRule rule, ChangeClassification change, OrgTree tree)
        {
            if (tree.Unit(rule.UnitId) == null) return "rule " + rule.Name + " names a unit that is not in the live organization.";
            if (!tree.InSubtree(change.UnitId, rule.UnitId)) return "rule " + rule.Name + " covers unit " + (tree.Unit(rule.UnitId)?.Name ?? rule.UnitId) + " and below, and this change is in " + (tree.Unit(change.UnitId)?.Name ?? change.UnitId) + ".";
            List<ChangeClassEnum> missing = change.Classes.Where(c => !rule.Classes.Any(rc => rc.Class == c)).ToList();
            if (missing.Count > 0) return "rule " + rule.Name + " does not cover " + String.Join(", ", missing) + ".";
            foreach (ChangeRuleLimit limit in rule.Limits.Where(l => !String.Equals(l.Name, CountLimit, StringComparison.OrdinalIgnoreCase) && change.Classes.Contains(l.Class)))
            {
                if (!change.Values.TryGetValue(limit.Name, out double value)) continue;
                if ((limit.Minimum.HasValue && value < limit.Minimum.Value) || (limit.Maximum.HasValue && value > limit.Maximum.Value))
                {
                    return "rule " + rule.Name + " allows " + limit.Name + " " + Range(limit) + ", and the change sets " + value.ToString("0.####", CultureInfo.InvariantCulture) + ".";
                }
            }
            return null;
        }

        private static bool Gated(ChangeRule rule, ChangeClassification change)
        {
            return !String.IsNullOrWhiteSpace(rule.GateEvalSet) && change.Classes.Any(c => GatedClasses.Contains(c));
        }

        private static string Range(ChangeRuleLimit limit)
        {
            string min = limit.Minimum.HasValue ? limit.Minimum.Value.ToString("0.####", CultureInfo.InvariantCulture) : String.Empty;
            string max = limit.Maximum.HasValue ? limit.Maximum.Value.ToString("0.####", CultureInfo.InvariantCulture) : String.Empty;
            if (limit.Minimum.HasValue && limit.Maximum.HasValue) return "from " + min + " to " + max;
            if (limit.Maximum.HasValue) return "at most " + max;
            if (limit.Minimum.HasValue) return "at least " + min;
            return "any number of";
        }

        #endregion
    }
}
