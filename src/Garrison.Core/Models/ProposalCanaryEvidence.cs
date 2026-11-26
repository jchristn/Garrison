namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One canary release of a deployment an executive's draft changes, as its proposal shows it (AA9.10). Not
    /// thread-safe.
    /// </summary>
    public class ProposalCanaryEvidence
    {
        #region Public-Members

        /// <summary>
        /// Canary release identifier (cnr_).
        /// </summary>
        public string CanaryReleaseId { get; set; } = String.Empty;

        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// Candidate deployment identifier.
        /// </summary>
        public string CandidateDeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// Candidate deployment name, or null when it no longer exists.
        /// </summary>
        public string? CandidateDeploymentName { get; set; } = null;

        /// <summary>
        /// Baseline deployment identifier.
        /// </summary>
        public string BaselineDeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// Status.
        /// </summary>
        public CanaryStatusEnum Status { get; set; } = CanaryStatusEnum.Running;

        /// <summary>
        /// Index of the current step, from 0.
        /// </summary>
        public int CurrentStepIndex { get; set; } = 0;

        /// <summary>
        /// Number of steps.
        /// </summary>
        public int StepCount { get; set; } = 0;

        /// <summary>
        /// Why the release rolled back, or null.
        /// </summary>
        public string? RollbackReason { get; set; } = null;

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
