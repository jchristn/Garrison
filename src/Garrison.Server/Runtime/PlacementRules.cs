namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Models;

    /// <summary>
    /// Placement checks shared by the scheduler (which hands runs to nodes) and the blocked-run evaluator (which explains
    /// why nobody can take a run). Stateless and thread-safe.
    /// </summary>
    public static class PlacementRules
    {
        #region Public-Methods

        /// <summary>
        /// Whether a node reports a harness type as available.
        /// </summary>
        /// <param name="node">Node.</param>
        /// <param name="harnessType">Harness type.</param>
        /// <returns>True when the node can run the harness.</returns>
        /// <exception cref="ArgumentNullException">Thrown when node is null.</exception>
        public static bool Supports(Node node, HarnessTypeEnum harnessType)
        {
            if (node == null) throw new ArgumentNullException(nameof(node));
            return node.Capabilities.Any(c => c.Available && c.HarnessType == harnessType);
        }

        /// <summary>
        /// Whether a run's placement constraints allow a node: the deployment's node pool, the pool's tenant dedication,
        /// and the deployment's node selectors (run requirements) against the node's labels. Harness capability is not
        /// checked here.
        /// </summary>
        /// <param name="node">Node.</param>
        /// <param name="pool">The node's pool, or null when it has none or the pool was not found.</param>
        /// <param name="run">Run.</param>
        /// <returns>True when the node matches.</returns>
        /// <exception cref="ArgumentNullException">Thrown when node or run is null.</exception>
        public static bool MatchesPlacement(Node node, NodePool? pool, Run run)
        {
            if (node == null) throw new ArgumentNullException(nameof(node));
            if (run == null) throw new ArgumentNullException(nameof(run));
            return MatchesPool(node, run) && MatchesTenant(pool, run) && MatchesSelectors(node, run);
        }

        /// <summary>Explain pool, dedication and selector constraints using the claim predicate.</summary>
        /// <param name="node">Worker node.</param>
        /// <param name="pool">Worker pool, if any.</param>
        /// <param name="run">Admitted run.</param>
        /// <returns>Stable placement rejection codes. Label keys and values are not exposed.</returns>
        public static List<string> PlacementRejections(Node node, NodePool? pool, Run run)
        {
            if (node == null) throw new ArgumentNullException(nameof(node));
            if (run == null) throw new ArgumentNullException(nameof(run));
            List<string> reasons = new List<string>();
            if (!MatchesPool(node, run)) reasons.Add("NodePoolMismatch");
            if (!MatchesTenant(pool, run)) reasons.Add("TenantDedicationMismatch");
            if (!MatchesSelectors(node, run)) reasons.Add("NodeSelectorMismatch");
            return reasons;
        }

        /// <summary>Shared static claim filters as stable rejection codes. Capacity and affinity need database reads.</summary>
        /// <param name="node">Worker node.</param>
        /// <param name="pool">Worker pool, if any.</param>
        /// <param name="run">Admitted run.</param>
        /// <returns>All static reasons this node cannot claim this run.</returns>
        public static List<string> Rejections(Node node, NodePool? pool, Run run)
        {
            if (node == null) throw new ArgumentNullException(nameof(node));
            if (run == null) throw new ArgumentNullException(nameof(run));
            List<string> reasons = new List<string>();
            if (!node.Active) reasons.Add("NodeInactive");
            if (node.Status != NodeStatusEnum.Ready) reasons.Add("NodeNotReady");
            if (!Supports(node, run.HarnessType)) reasons.Add("HarnessUnavailable");
            if (!ExecutorCapabilityRules.Supports(node, run)) reasons.Add("ExecutorCapabilitiesUnsatisfied");
            reasons.AddRange(PlacementRejections(node, pool, run));
            return reasons;
        }

        private static bool MatchesPool(Node node, Run run)
        {
            return String.IsNullOrEmpty(run.NodePoolId) || run.NodePoolId == node.NodePoolId;
        }

        private static bool MatchesTenant(NodePool? pool, Run run)
        {
            return pool == null || pool.Tenants.Count == 0 || pool.Tenants.Contains(run.TenantId);
        }

        private static bool MatchesSelectors(Node node, Run run)
        {
            foreach (RunRequirement requirement in run.Requirements)
            {
                NodeLabel? label = node.Labels.FirstOrDefault(l => String.Equals(l.Key, requirement.Key, StringComparison.Ordinal));
                if (label == null || !String.Equals(label.Value, requirement.Value, StringComparison.Ordinal)) return false;
            }
            return true;
        }

        #endregion
    }
}
