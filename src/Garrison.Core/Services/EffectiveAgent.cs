namespace Garrison.Core.Services
{
    using System;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Core.Database;
    using Garrison.Core.Models;

    /// <summary>
    /// Resolves the agent definition a run or deployment actually uses (AD1.3, AD-012): the agent row with the content
    /// of the pinned revision, or of the latest published revision when unpinned, applied on top. Stateless and
    /// thread-safe.
    /// </summary>
    public static class EffectiveAgent
    {
        #region Public-Methods

        /// <summary>
        /// The revision to use: an explicit revision identifier (a run's recorded revision), else the deployment's pin,
        /// else the agent's latest published revision.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="tenantId">Tenant identifier.</param>
        /// <param name="agent">Agent.</param>
        /// <param name="deployment">Deployment, or null.</param>
        /// <param name="revisionId">Explicit revision identifier, or null.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Revision, or null when the agent has none (for example a remote agent that predates revisions).</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public static async Task<AgentRevision?> RevisionAsync(DatabaseDriverBase database, string tenantId, Agent agent, Deployment? deployment, string? revisionId, CancellationToken token = default)
        {
            if (database == null) throw new ArgumentNullException(nameof(database));
            if (String.IsNullOrEmpty(tenantId)) throw new ArgumentNullException(nameof(tenantId));
            if (agent == null) throw new ArgumentNullException(nameof(agent));
            string? id = !String.IsNullOrEmpty(revisionId) ? revisionId
                : !String.IsNullOrEmpty(deployment?.AgentRevisionId) ? deployment!.AgentRevisionId
                : agent.LatestPublishedRevisionId;
            if (String.IsNullOrEmpty(id)) return null;
            AgentRevision? revision = await database.AgentRevisions.ReadAsync(tenantId, id, token).ConfigureAwait(false);
            return revision != null && revision.AgentId == agent.Id ? revision : null;
        }

        /// <summary>
        /// Read a run's agent with the content of the revision the run recorded applied.
        /// </summary>
        /// <param name="database">Database.</param>
        /// <param name="run">Run.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Agent, or null when it no longer exists.</returns>
        /// <exception cref="ArgumentNullException">Thrown when a required argument is null.</exception>
        public static async Task<Agent?> ForRunAsync(DatabaseDriverBase database, Run run, CancellationToken token = default)
        {
            if (database == null) throw new ArgumentNullException(nameof(database));
            if (run == null) throw new ArgumentNullException(nameof(run));
            Agent? agent = await database.Agents.ReadAsync(run.TenantId, run.AgentId, token).ConfigureAwait(false);
            if (agent == null || String.IsNullOrEmpty(run.AgentRevisionId)) return agent;
            AgentRevision? revision = await RevisionAsync(database, run.TenantId, agent, null, run.AgentRevisionId, token).ConfigureAwait(false);
            if (revision != null) AgentRevisionContent.ApplyTo(revision, agent);
            return agent;
        }

        #endregion
    }
}
