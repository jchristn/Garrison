namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// An approval requested during a transcript turn.
    /// </summary>
    public class TranscriptApproval
    {
        #region Public-Members

        /// <summary>
        /// Approval identifier.
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Approval kind.
        /// </summary>
        public ApprovalKindEnum Kind { get; set; } = ApprovalKindEnum.Tool;

        /// <summary>
        /// Tool name.
        /// </summary>
        public string ToolName { get; set; } = String.Empty;

        /// <summary>
        /// Summary, or null.
        /// </summary>
        public string? Summary { get; set; } = null;

        /// <summary>
        /// Redacted input preview, or null.
        /// </summary>
        public string? InputPreview { get; set; } = null;

        /// <summary>
        /// Status.
        /// </summary>
        public ApprovalStatusEnum Status { get; set; } = ApprovalStatusEnum.Pending;

        /// <summary>
        /// Decision, or null while pending.
        /// </summary>
        public ApprovalDecisionEnum? Decision { get; set; } = null;

        /// <summary>
        /// What decided it, or null while pending.
        /// </summary>
        public ApprovalSourceEnum? DecisionSource { get; set; } = null;

        /// <summary>
        /// Who decided it, or null.
        /// </summary>
        public string? DecidedBy { get; set; } = null;

        /// <summary>
        /// Reason, or null.
        /// </summary>
        public string? Reason { get; set; } = null;

        /// <summary>
        /// When it was requested (UTC).
        /// </summary>
        public DateTime RequestedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When it was decided (UTC), or null.
        /// </summary>
        public DateTime? DecidedUtc { get; set; } = null;

        #endregion
    }
}
