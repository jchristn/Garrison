namespace Garrison.Worker.Kubernetes
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using k8s.Models;

    /// <summary>
    /// Checks that no shared NetworkPolicy in the run namespace widens the egress of allowlisted run pods (P11.15).
    /// NetworkPolicies are additive, so a policy that selects every run pod and allows an ipBlock (the old single
    /// garrison-run policy with its HTTPS-to-anywhere rule, for example) would let an allowlisted pod reach more than its
    /// allowlist. The worker reports EgressControl only when this audit finds nothing. Selectors on per-run labels (run
    /// ID, worker, tenant, epoch) are treated as matching, so the check errs toward reporting a widening policy.
    /// Policies the worker created for single runs (app.kubernetes.io/managed-by=garrison-worker) are skipped.
    /// Stateless and thread-safe.
    /// </summary>
    public static class EgressPolicyAudit
    {
        #region Private-Members

        private static readonly HashSet<string> _PerRunKeys = new HashSet<string>(StringComparer.Ordinal)
        {
            RunPodNames.RunIdLabel, RunPodNames.WorkerLabel, RunPodNames.TenantLabel, RunPodNames.EpochLabel
        };

        #endregion

        #region Public-Methods

        /// <summary>
        /// Labels every allowlisted run pod carries, apart from the per-run labels: the built-in run pod labels, the
        /// allowlist label, and the operator's extra pod labels.
        /// </summary>
        /// <param name="podLabels">Extra run pod labels (Kubernetes.PodLabels), or null.</param>
        /// <returns>Labels.</returns>
        public static Dictionary<string, string> AllowlistedPodLabels(IDictionary<string, string>? podLabels)
        {
            Dictionary<string, string> labels = new Dictionary<string, string>(StringComparer.Ordinal);
            if (podLabels != null) foreach (KeyValuePair<string, string> label in podLabels) labels[label.Key] = label.Value;
            labels["app.kubernetes.io/name"] = RunPodNames.AppName;
            labels["app.kubernetes.io/component"] = "run";
            labels["app.kubernetes.io/part-of"] = "garrison";
            labels["app.kubernetes.io/managed-by"] = "garrison-worker";
            labels[RunPodNames.EgressLabel] = RunPodNames.EgressAllowlistValue;
            return labels;
        }

        /// <summary>
        /// Shared policies that would let an allowlisted run pod reach an ipBlock or any destination, each described as
        /// "name: reason". Empty when allowlists can be enforced.
        /// </summary>
        /// <param name="policies">NetworkPolicies of the run namespace.</param>
        /// <param name="podLabels">Labels of an allowlisted run pod, from <see cref="AllowlistedPodLabels"/>.</param>
        /// <returns>Descriptions of widening policies.</returns>
        /// <exception cref="ArgumentNullException">Thrown when policies or podLabels is null.</exception>
        public static List<string> Widening(IEnumerable<V1NetworkPolicy> policies, IDictionary<string, string> podLabels)
        {
            if (policies == null) throw new ArgumentNullException(nameof(policies));
            if (podLabels == null) throw new ArgumentNullException(nameof(podLabels));
            List<string> found = new List<string>();
            foreach (V1NetworkPolicy policy in policies)
            {
                if (policy?.Spec == null) continue;
                string name = policy.Metadata?.Name ?? "(unnamed)";
                if (policy.Metadata?.Labels != null && policy.Metadata.Labels.TryGetValue("app.kubernetes.io/managed-by", out string? manager) && manager == "garrison-worker") continue;
                if (!AffectsEgress(policy.Spec)) continue;
                if (!Selects(policy.Spec.PodSelector, podLabels)) continue;
                foreach (V1NetworkPolicyEgressRule rule in policy.Spec.Egress ?? new List<V1NetworkPolicyEgressRule>())
                {
                    if (rule.To == null || rule.To.Count == 0)
                    {
                        found.Add(name + ": an egress rule with no destination allows every address");
                        break;
                    }
                    V1NetworkPolicyPeer? block = rule.To.FirstOrDefault(p => p.IpBlock != null);
                    if (block != null)
                    {
                        found.Add(name + ": allows ipBlock " + block.IpBlock.Cidr + " to every allowlisted run pod");
                        break;
                    }
                }
            }
            return found;
        }

        /// <summary>
        /// Whether a pod selector selects a pod with the given labels. Per-run label keys are treated as present with a
        /// matching value. A null or empty selector selects every pod.
        /// </summary>
        /// <param name="selector">Selector, or null.</param>
        /// <param name="podLabels">Pod labels.</param>
        /// <returns>True when selected.</returns>
        /// <exception cref="ArgumentNullException">Thrown when podLabels is null.</exception>
        public static bool Selects(V1LabelSelector? selector, IDictionary<string, string> podLabels)
        {
            if (podLabels == null) throw new ArgumentNullException(nameof(podLabels));
            if (selector == null) return true;
            if (selector.MatchLabels != null)
            {
                foreach (KeyValuePair<string, string> label in selector.MatchLabels)
                {
                    if (_PerRunKeys.Contains(label.Key)) continue;
                    if (!podLabels.TryGetValue(label.Key, out string? value) || value != label.Value) return false;
                }
            }
            if (selector.MatchExpressions != null)
            {
                foreach (V1LabelSelectorRequirement requirement in selector.MatchExpressions)
                {
                    bool perRun = _PerRunKeys.Contains(requirement.Key);
                    bool has = perRun || podLabels.ContainsKey(requirement.Key);
                    string? value = perRun ? null : (podLabels.TryGetValue(requirement.Key, out string? v) ? v : null);
                    IList<string> values = requirement.Values ?? new List<string>();
                    switch (requirement.OperatorProperty)
                    {
                        case "In":
                            if (!has || (!perRun && !values.Contains(value!))) return false;
                            break;
                        case "NotIn":
                            if (has && !perRun && values.Contains(value!)) return false;
                            break;
                        case "Exists":
                            if (!has) return false;
                            break;
                        case "DoesNotExist":
                            if (has) return false;
                            break;
                        default:
                            return false;
                    }
                }
            }
            return true;
        }

        #endregion

        #region Private-Methods

        private static bool AffectsEgress(V1NetworkPolicySpec spec)
        {
            if (spec.PolicyTypes != null && spec.PolicyTypes.Count > 0) return spec.PolicyTypes.Contains("Egress");
            return spec.Egress != null && spec.Egress.Count > 0;
        }

        #endregion
    }
}
