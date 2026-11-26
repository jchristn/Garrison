namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One eval run of an executive's draft, as its proposal shows it (AA9.10). Not thread-safe.
    /// </summary>
    public class ProposalEvalEvidence
    {
        #region Public-Members

        /// <summary>
        /// Eval run identifier (evr_).
        /// </summary>
        public string EvalRunId { get; set; } = String.Empty;

        /// <summary>
        /// Eval set name.
        /// </summary>
        public string SetName { get; set; } = String.Empty;

        /// <summary>
        /// Eval set version the run used.
        /// </summary>
        public int SetVersion { get; set; } = 1;

        /// <summary>
        /// Evaluated agent identifier. For a worker the draft adds, the eval copy of that agent.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Deployment the cases ran on when the draft changes it (an eval copy in the draft environment), or null when the
        /// runner copies a live deployment of the agent.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Status.
        /// </summary>
        public EvalRunStatusEnum Status { get; set; } = EvalRunStatusEnum.Pending;

        /// <summary>
        /// Score from 0 to 1, or null until the run completes.
        /// </summary>
        public double? Score { get; set; } = null;

        /// <summary>
        /// Threshold the run was asked to reach, or null.
        /// </summary>
        public double? Threshold { get; set; } = null;

        /// <summary>
        /// Whether the score reached the run's own threshold, or null without one.
        /// </summary>
        public bool? Passed { get; set; } = null;

        /// <summary>
        /// Cases finished.
        /// </summary>
        public int CompletedCases { get; set; } = 0;

        /// <summary>
        /// Cases in the run.
        /// </summary>
        public int TotalCases { get; set; } = 0;

        /// <summary>
        /// Whether the run was created after the draft's last change, so it measured the draft as it is now.
        /// </summary>
        public bool Current { get; set; } = false;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Completion time (UTC), or null.
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        #endregion
    }
}
