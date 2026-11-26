namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Evaluation;
    using Garrison.Core.Models;

    /// <summary>
    /// What a driver of one eval run resolved before running its cases (AA9.3): the work items, the agent and deployment
    /// they run on, and the scorers. Not thread-safe; read-only once built.
    /// </summary>
    public class EvalRunContext
    {
        #region Public-Members

        /// <summary>
        /// Eval run.
        /// </summary>
        public EvalRun Run { get; set; } = new EvalRun();

        /// <summary>
        /// Cases to run, in order.
        /// </summary>
        public List<EvalWorkItem> Items { get; set; } = new List<EvalWorkItem>();

        /// <summary>
        /// Agent whose runs are evaluated.
        /// </summary>
        public Agent Agent { get; set; } = new Agent();

        /// <summary>
        /// Deployment the case runs use: the target deployment, or the revision's ephemeral eval deployment.
        /// </summary>
        public string DeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// Scorers for the run's checks.
        /// </summary>
        public EvalScorers Scorers { get; set; } = new EvalScorers(null);

        #endregion
    }
}
