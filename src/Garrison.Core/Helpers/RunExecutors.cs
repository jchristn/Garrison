namespace Garrison.Core.Helpers
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Executor resolution and capability checks (plan D-033). Stateless and thread-safe.
    /// </summary>
    public static class RunExecutors
    {
        #region Public-Methods

        /// <summary>
        /// The executor a new run of a deployment needs: the deployment's executor, else its node pool's default
        /// executor, else Process.
        /// </summary>
        /// <param name="deployment">Deployment.</param>
        /// <param name="pool">The deployment's node pool, or null when it has none.</param>
        /// <returns>Executor.</returns>
        /// <exception cref="ArgumentNullException">Thrown when deployment is null.</exception>
        public static RunExecutorEnum Resolve(Deployment deployment, NodePool? pool)
        {
            if (deployment == null) throw new ArgumentNullException(nameof(deployment));
            if (deployment.Executor.HasValue) return deployment.Executor.Value;
            if (pool != null && pool.DefaultExecutor.HasValue) return pool.DefaultExecutor.Value;
            return RunExecutorEnum.Process;
        }

        /// <summary>
        /// Executors a node supports. A node that reports none (an older worker) supports Process only.
        /// </summary>
        /// <param name="node">Node.</param>
        /// <returns>Executors, never empty.</returns>
        /// <exception cref="ArgumentNullException">Thrown when node is null.</exception>
        public static List<RunExecutorEnum> Of(Node node)
        {
            if (node == null) throw new ArgumentNullException(nameof(node));
            if (node.Executors.Count == 0) return new List<RunExecutorEnum> { RunExecutorEnum.Process };
            return node.Executors.Distinct().ToList();
        }

        /// <summary>
        /// Whether a node supports an executor.
        /// </summary>
        /// <param name="node">Node.</param>
        /// <param name="executor">Executor.</param>
        /// <returns>True when supported.</returns>
        /// <exception cref="ArgumentNullException">Thrown when node is null.</exception>
        public static bool Supports(Node node, RunExecutorEnum executor)
        {
            return Of(node).Contains(executor);
        }

        #endregion
    }
}
