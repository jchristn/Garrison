namespace Garrison.Core.Transcripts
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// A permission approval a transcript turn waited on, with its decision (P12.27). Previews are redacted.
    /// </summary>
    public class TranscriptApproval
    {
        #region Public-Members

        /// <summary>
        /// Approval identifier (apr_).
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Approval kind.
        /// </summary>
        public ApprovalKindEnum Kind { get; set; } = ApprovalKindEnum.Tool;

        /// <summary>
        /// Tool the agent asked to use.
        /// </summary>
        public string ToolName { get; set; } = String.Empty;

        /// <summary>
        /// Short summary of the request (command, URL, or paths), redacted.
        /// </summary>
        public string? Summary { get; set; } = null;

        /// <summary>
        /// Redacted preview of the tool input.
        /// </summary>
        public string? InputPreview { get; set; } = null;

        /// <summary>
        /// Status.
        /// </summary>
        public ApprovalStatusEnum Status { get; set; } = ApprovalStatusEnum.Pending;

        /// <summary>
        /// Decision, once decided.
        /// </summary>
        public ApprovalDecisionEnum? Decision { get; set; } = null;

        /// <summary>
        /// Who or what decided: a person, a rule, or the timeout.
        /// </summary>
        public ApprovalSourceEnum? DecisionSource { get; set; } = null;

        /// <summary>
        /// Name of the person who decided, when a person did.
        /// </summary>
        public string? DecidedBy { get; set; } = null;

        /// <summary>
        /// Reason given with the decision.
        /// </summary>
        public string? Reason { get; set; } = null;

        /// <summary>
        /// When the agent asked (UTC).
        /// </summary>
        public DateTime RequestedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the request was decided (UTC).
        /// </summary>
        public DateTime? DecidedUtc { get; set; } = null;

        #endregion
    }
}
