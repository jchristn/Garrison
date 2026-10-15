namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One run of a transcript (a conversation has one per turn).
    /// </summary>
    public class TranscriptTurn
    {
        #region Public-Members

        /// <summary>
        /// Turn number, starting at 1.
        /// </summary>
        public int Turn { get; set; } = 1;

        /// <summary>
        /// Run identifier.
        /// </summary>
        public string RunId { get; set; } = String.Empty;

        /// <summary>
        /// Agent name.
        /// </summary>
        public string AgentName { get; set; } = String.Empty;

        /// <summary>
        /// Deployment identifier.
        /// </summary>
        public string DeploymentId { get; set; } = String.Empty;

        /// <summary>
        /// Run kind.
        /// </summary>
        public RunKindEnum Kind { get; set; } = RunKindEnum.Invoke;

        /// <summary>
        /// Run status.
        /// </summary>
        public RunStatusEnum Status { get; set; } = RunStatusEnum.Queued;

        /// <summary>
        /// Run outcome.
        /// </summary>
        public RunOutcomeEnum Outcome { get; set; } = RunOutcomeEnum.None;

        /// <summary>
        /// Caller name, or null.
        /// </summary>
        public string? CallerName { get; set; } = null;

        /// <summary>
        /// Served model, or null.
        /// </summary>
        public string? Model { get; set; } = null;

        /// <summary>
        /// Input text (redacted), or null.
        /// </summary>
        public string? Input { get; set; } = null;

        /// <summary>
        /// Input content type, or null.
        /// </summary>
        public string? InputContentType { get; set; } = null;

        /// <summary>
        /// Creation time (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Start time (UTC), or null.
        /// </summary>
        public DateTime? StartedUtc { get; set; } = null;

        /// <summary>
        /// Completion time (UTC), or null.
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        /// <summary>
        /// Events in sequence order.
        /// </summary>
        public List<TranscriptEntry> Entries { get; set; } = new List<TranscriptEntry>();

        /// <summary>
        /// Approvals requested during the turn.
        /// </summary>
        public List<TranscriptApproval> Approvals { get; set; } = new List<TranscriptApproval>();

        /// <summary>
        /// Result text (redacted), or null.
        /// </summary>
        public string? Result { get; set; } = null;

        /// <summary>
        /// Error message (redacted), or null.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        /// <summary>
        /// Usage of this turn.
        /// </summary>
        public TranscriptUsage Usage { get; set; } = new TranscriptUsage();

        /// <summary>
        /// Events the run recorded that are no longer stored (removed by retention).
        /// </summary>
        public long OmittedEvents { get; set; } = 0;

        /// <summary>
        /// Whether this turn was cut by the transcript size cap.
        /// </summary>
        public bool Truncated { get; set; } = false;

        #endregion
    }
}
