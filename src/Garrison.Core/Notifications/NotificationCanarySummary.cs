namespace Garrison.Core.Notifications
{
    using System;

    /// <summary>
    /// Fields carried by CanaryRolledBack notifications (AA9.8): which release rolled back, at which step, and why.
    /// </summary>
    public class NotificationCanarySummary
    {
        #region Public-Members

        /// <summary>
        /// Canary release identifier (cnr_).
        /// </summary>
        public string ReleaseId { get; set; } = String.Empty;

        /// <summary>
        /// Agent identifier.
        /// </summary>
        public string AgentId { get; set; } = String.Empty;

        /// <summary>
        /// Agent name, or null.
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// Candidate deployment identifier.
        /// </summary>
        public string CandidateDeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// Candidate deployment name, or null.
        /// </summary>
        public string? CandidateDeploymentName { get; set; } = null;

        /// <summary>
        /// Baseline deployment identifier.
        /// </summary>
        public string BaselineDeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// Baseline deployment name, or null.
        /// </summary>
        public string? BaselineDeploymentName { get; set; } = null;

        /// <summary>
        /// Step that was running when the release rolled back, from 1.
        /// </summary>
        public int Step { get; set; } = 1;

        /// <summary>
        /// Number of steps in the release.
        /// </summary>
        public int StepCount { get; set; } = 1;

        /// <summary>
        /// Why the release rolled back, or null.
        /// </summary>
        public string? Reason { get; set; } = null;

        /// <summary>
        /// When it rolled back (UTC).
        /// </summary>
        public DateTime RolledBackUtc { get; set; } = DateTime.UtcNow;

        #endregion
    }
}
