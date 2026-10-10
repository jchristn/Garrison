namespace Garrison.Server.Runtime
{
    using System;
    using System.Linq;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Services;

    /// <summary>
    /// Enforces the calling agent's delegation policy when a run delegates to another agent: mode, allowlist,
    /// recursion, and the calling agent's own depth limit. Thread-safe.
    /// </summary>
    public class DelegationPolicy
    {
        #region Private-Members

        private readonly DatabaseDriverBase _Database;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <exception cref="ArgumentNullException">Thrown when database is null.</exception>
        public DelegationPolicy(DatabaseDriverBase database)
        {
            _Database = database ?? throw new ArgumentNullException(nameof(database));
        }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Check that a parent run may delegate to a callee agent.
        /// </summary>
        /// <param name="parent">Parent run.</param>
        /// <param name="callee">Callee agent.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Task.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        /// <exception cref="ConflictException">Thrown with a stable code when delegation is not allowed.</exception>
        public async Task CheckAsync(Run parent, Agent callee, CancellationToken token = default)
        {
            if (parent == null) throw new ArgumentNullException(nameof(parent));
            if (callee == null) throw new ArgumentNullException(nameof(callee));
            if (RunService.IsTerminal(parent.Status)) throw new ConflictException("ParentRunFinished", "The calling run has already finished.");

            Agent caller = await _Database.Agents.ReadAsync(parent.TenantId, parent.AgentId, token).ConfigureAwait(false)
                ?? throw new ConflictException("DelegationDenied", "The calling agent no longer exists.");

            if (caller.DelegationMode == DelegationModeEnum.None)
            {
                throw new ConflictException("DelegationDisabled", "Agent " + caller.Name + " is not allowed to delegate.");
            }
            if (caller.DelegationMode == DelegationModeEnum.AllowList && !caller.DelegationAllowList.Any(n => String.Equals(n, callee.Name, StringComparison.Ordinal)))
            {
                throw new ConflictException("DelegationNotAllowed", "Agent " + caller.Name + " may not delegate to " + callee.Name + ".");
            }

            string chain = String.IsNullOrEmpty(parent.CallChain) ? parent.AgentName : parent.CallChain;
            bool inChain = chain.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).Contains(callee.Name);
            if (inChain && !caller.DelegationAllowRecursion)
            {
                throw new ConflictException("DelegationCycle", "Delegating to " + callee.Name + " would create a cycle (" + chain + ").");
            }

            Run? root = String.IsNullOrEmpty(parent.RootRunId) ? parent : await _Database.Runs.ReadAsync(parent.TenantId, parent.RootRunId, token).ConfigureAwait(false);
            int rootLimit = caller.DelegationMaxDepth;
            if (root != null && root.AgentId != caller.Id)
            {
                Agent? rootAgent = await _Database.Agents.ReadAsync(parent.TenantId, root.AgentId, token).ConfigureAwait(false);
                if (rootAgent != null) rootLimit = Math.Min(rootLimit, rootAgent.DelegationMaxDepth);
            }
            if (parent.Depth + 1 > rootLimit)
            {
                throw new ConflictException("DelegationDepthExceeded", "Delegation depth " + (parent.Depth + 1) + " exceeds the agent limit of " + rootLimit + ".");
            }
        }

        #endregion
    }
}
