namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One shadow trial of a deployment an executive's draft changes, as its proposal shows it (AA9.10). Not thread-safe.
    /// </summary>
    public class ProposalShadowEvidence
    {
        #region Public-Members

        /// <summary>
        /// Shadow trial identifier (shd_).
        /// </summary>
        public string ShadowTrialId { get; set; } = String.Empty;

        /// <summary>
        /// Trial name, or null.
        /// </summary>
        public string? Name { get; set; } = null;

        /// <summary>
        /// Source deployment identifier.
        /// </summary>
        public string SourceDeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// Candidate deployment identifier.
        /// </summary>
        public string CandidateDeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// Candidate deployment name, or null when it no longer exists.
        /// </summary>
        public string? CandidateDeploymentName { get; set; } = null;

        /// <summary>
        /// Status.
        /// </summary>
        public ShadowTrialStatusEnum Status { get; set; } = ShadowTrialStatusEnum.Running;

        /// <summary>
        /// Source runs compared so far.
        /// </summary>
        public long ComparedCount { get; set; } = 0;

        /// <summary>
        /// Comparisons where the candidate agreed.
        /// </summary>
        public long AgreedCount { get; set; } = 0;

        /// <summary>
        /// Comparisons where the candidate diverged.
        /// </summary>
        public long DivergedCount { get; set; } = 0;

        /// <summary>
        /// Shadow runs of the candidate that failed.
        /// </summary>
        public long CandidateFailureCount { get; set; } = 0;

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
