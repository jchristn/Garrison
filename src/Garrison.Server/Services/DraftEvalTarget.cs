namespace Garrison.Server.Services
{
    using System;
    using Garrison.Core.Models;

    /// <summary>
    /// What an eval run of a studio draft evaluates (AA9.10): the agent with the draft's document applied as its draft
    /// revision (or, for a worker the draft adds, an eval copy of the new agent), the revision to pin, and, when the draft
    /// changes or adds the agent's deployment, the eval copy of that deployment the cases run on. Not thread-safe.
    /// </summary>
    public class DraftEvalTarget
    {
        #region Public-Members

        /// <summary>
        /// Agent the cases run as.
        /// </summary>
        public Agent Agent { get; set; } = new Agent();

        /// <summary>
        /// Name the draft uses for the agent (the new agent's name when the draft adds it).
        /// </summary>
        public string DraftAgentName { get; set; } = String.Empty;

        /// <summary>
        /// Agent revision to evaluate, or null when the agent has none.
        /// </summary>
        public string? AgentRevisionId { get; set; } = null;

        /// <summary>
        /// Whether the draft adds the agent, so <see cref="Agent"/> is an eval copy rather than the live agent.
        /// </summary>
        public bool NewAgent { get; set; } = false;

        /// <summary>
        /// Eval copy of the draft's deployment for the agent, in the draft environment with weight 0, or null when the draft
        /// leaves the agent's deployments alone (the runner then copies a live one).
        /// </summary>
        public Deployment? Deployment { get; set; } = null;

        #endregion
    }
}
