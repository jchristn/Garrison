namespace Garrison.Server.Runtime
{
    using System;
    using System.Linq;
    using Garrison.Core.Enums;
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
            if (!String.IsNullOrEmpty(run.NodePoolId) && run.NodePoolId != node.NodePoolId) return false;
            if (pool != null && pool.Tenants.Count > 0 && !pool.Tenants.Contains(run.TenantId)) return false;
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
