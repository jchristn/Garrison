namespace Garrison.Sdk.Requests
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Start an eval run (AA9.3, AA9.12): which set, against what, how, and within what budget. Not thread-safe.
    /// </summary>
    public class EvalRunRequest
    {
        #region Public-Members

        /// <summary>
        /// Eval set identifier (one version) or name. Required.
        /// </summary>
        public string? SetId { get; set; } = null;

        /// <summary>
        /// Version to run when SetId is a name, or null for the latest approved version (the latest version when none is
        /// approved).
        /// </summary>
        public int? SetVersion { get; set; } = null;

        /// <summary>
        /// What to evaluate. Default Deployment when DeploymentId is set, otherwise AgentRevision.
        /// </summary>
        public EvalRunTargetEnum? TargetType { get; set; } = null;

        /// <summary>
        /// Agent identifier or name (AgentRevision target), or null.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Agent revision identifier (AgentRevision target), or null for the agent's draft revision, else its latest
        /// published revision.
        /// </summary>
        public string? AgentRevisionId { get; set; } = null;

        /// <summary>
        /// Deployment identifier or name (Deployment target), or null.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Studio draft whose document for the agent becomes the agent's draft revision and is evaluated, or null. Run
        /// tokens of executives may evaluate only their own drafts.
        /// </summary>
        public string? StudioDraftId { get; set; } = null;

        /// <summary>
        /// Cases (default) or RecentInputs (a Deployment target's last completed run inputs, AA9.11).
        /// </summary>
        public EvalRunInputModeEnum InputMode { get; set; } = EvalRunInputModeEnum.Cases;

        /// <summary>
        /// Recent runs replayed in RecentInputs mode. Minimum 1, maximum 1000, default 20.
        /// </summary>
        public int RecentInputCount { get; set; } = 20;

        /// <summary>
        /// Score from 0 to 1 the run must reach to pass, or null for none.
        /// </summary>
        public double? Threshold { get; set; } = null;

        /// <summary>
        /// Most USD the run's case and judge runs may spend, or null for no budget. Minimum 0, maximum 100000.
        /// </summary>
        public double? BudgetUsd { get; set; } = null;

        #endregion
    }
}
