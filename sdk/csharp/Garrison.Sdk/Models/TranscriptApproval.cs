namespace Garrison.Sdk.Models
{
    using System;
    using System.Text.Json;
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
        /// The input the approval is about as a JSON object (a tool call's arguments, or the diff of a studio draft),
        /// redacted. Null when the stored input is not a JSON object, in which case <see cref="InputPreview"/> carries it.
        /// </summary>
        public JsonElement? Input { get; set; } = null;

        /// <summary>
        /// Redacted input as text when it is not a JSON object (for example clipped to the preview size); null when
        /// <see cref="Input"/> carries it.
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
