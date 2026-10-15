namespace Garrison.Core.Transcripts
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// One run in a transcript: its input, what the agent did, approvals, the result or error, and usage (P12.27). A run
    /// transcript has one turn; a conversation transcript has one per turn, oldest first.
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
        /// Agent name at the time of the run.
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
        /// Run status when the transcript was generated.
        /// </summary>
        public RunStatusEnum Status { get; set; } = RunStatusEnum.Pending;

        /// <summary>
        /// Run outcome.
        /// </summary>
        public RunOutcomeEnum Outcome { get; set; } = RunOutcomeEnum.None;

        /// <summary>
        /// Name of the caller that started the run.
        /// </summary>
        public string? CallerName { get; set; } = null;

        /// <summary>
        /// Model the harness reported serving the run.
        /// </summary>
        public string? Model { get; set; } = null;

        /// <summary>
        /// Input text, redacted.
        /// </summary>
        public string? Input { get; set; } = null;

        /// <summary>
        /// Input content type (for example application/json for structured input).
        /// </summary>
        public string? InputContentType { get; set; } = null;

        /// <summary>
        /// When the run was created (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the run started on a worker (UTC).
        /// </summary>
        public DateTime? StartedUtc { get; set; } = null;

        /// <summary>
        /// When the run finished (UTC).
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;

        /// <summary>
        /// Events in sequence order. Never null.
        /// </summary>
        public List<TranscriptEntry> Entries
        {
            get
            {
                return _Entries;
            }
            set
            {
                _Entries = value ?? new List<TranscriptEntry>();
            }
        }

        /// <summary>
        /// Approvals the run waited on, in request order. Never null.
        /// </summary>
        public List<TranscriptApproval> Approvals
        {
            get
            {
                return _Approvals;
            }
            set
            {
                _Approvals = value ?? new List<TranscriptApproval>();
            }
        }

        /// <summary>
        /// Final result text, redacted.
        /// </summary>
        public string? Result { get; set; } = null;

        /// <summary>
        /// Error message, redacted, when the run failed.
        /// </summary>
        public string? ErrorMessage { get; set; } = null;

        /// <summary>
        /// Usage of this run. Never null.
        /// </summary>
        public TranscriptUsage Usage
        {
            get
            {
                return _Usage;
            }
            set
            {
                _Usage = value ?? new TranscriptUsage();
            }
        }

        /// <summary>
        /// Events the run recorded that are no longer stored (removed by event retention).
        /// </summary>
        public long OmittedEvents { get; set; } = 0;

        /// <summary>
        /// Whether the size limit cut this turn short.
        /// </summary>
        public bool Truncated { get; set; } = false;

        #endregion

        #region Private-Members

        private List<TranscriptEntry> _Entries = new List<TranscriptEntry>();
        private List<TranscriptApproval> _Approvals = new List<TranscriptApproval>();
        private TranscriptUsage _Usage = new TranscriptUsage();

        #endregion
    }
}
