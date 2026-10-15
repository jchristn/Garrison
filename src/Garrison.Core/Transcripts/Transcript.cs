namespace Garrison.Core.Transcripts
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// A readable record of a run or a conversation for export (P12.27): every turn's input, assistant text, tool calls
    /// and results, approvals, errors, usage, and cost, with secrets redacted. Serialized as the JSON transcript format
    /// and rendered as Markdown by <see cref="TranscriptMarkdownWriter"/>.
    /// </summary>
    public class Transcript
    {
        #region Public-Members

        /// <summary>
        /// Format identifier of this document. Always garrison.transcript/v1.
        /// </summary>
        public string Schema { get; set; } = SchemaName;

        /// <summary>
        /// Format identifier written to every transcript.
        /// </summary>
        public static readonly string SchemaName = "garrison.transcript/v1";

        /// <summary>
        /// Whether this is a run or a conversation transcript.
        /// </summary>
        public TranscriptKindEnum Kind { get; set; } = TranscriptKindEnum.Run;

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Run identifier, for a run transcript.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Conversation identifier, for a conversation transcript (and for a run that is a conversation turn).
        /// </summary>
        public string? ConversationId { get; set; } = null;

        /// <summary>
        /// Agent name.
        /// </summary>
        public string AgentName { get; set; } = String.Empty;

        /// <summary>
        /// Conversation title, when it has one.
        /// </summary>
        public string? Title { get; set; } = null;

        /// <summary>
        /// When the transcript was generated (UTC).
        /// </summary>
        public DateTime GeneratedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Whether thinking events are included.
        /// </summary>
        public bool IncludesThinking { get; set; } = false;

        /// <summary>
        /// Whether the transcript was cut short by Transcripts.MaxBytes or Transcripts.MaxTurns.
        /// </summary>
        public bool Truncated { get; set; } = false;

        /// <summary>
        /// What was left out when truncated, and where to read the rest.
        /// </summary>
        public string? TruncationNote { get; set; } = null;

        /// <summary>
        /// Number of turns included.
        /// </summary>
        public int TurnCount { get; set; } = 0;

        /// <summary>
        /// Usage totals over the included turns. Never null.
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
        /// Turns, oldest first. Never null.
        /// </summary>
        public List<TranscriptTurn> Turns
        {
            get
            {
                return _Turns;
            }
            set
            {
                _Turns = value ?? new List<TranscriptTurn>();
            }
        }

        #endregion

        #region Private-Members

        private TranscriptUsage _Usage = new TranscriptUsage();
        private List<TranscriptTurn> _Turns = new List<TranscriptTurn>();

        #endregion
    }
}
