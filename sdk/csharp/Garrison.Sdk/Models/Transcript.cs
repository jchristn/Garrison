namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Transcript of a run or a conversation (schema garrison.transcript/v1).
    /// </summary>
    public class Transcript
    {
        #region Public-Members

        /// <summary>
        /// Schema identifier, garrison.transcript/v1.
        /// </summary>
        public string Schema { get; set; } = "garrison.transcript/v1";

        /// <summary>
        /// What the transcript covers.
        /// </summary>
        public TranscriptKindEnum Kind { get; set; } = TranscriptKindEnum.Run;

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Run identifier for a run transcript, or null.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Conversation identifier, or null.
        /// </summary>
        public string? ConversationId { get; set; } = null;

        /// <summary>
        /// Agent name.
        /// </summary>
        public string AgentName { get; set; } = String.Empty;

        /// <summary>
        /// Title, or null.
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
        /// Whether the transcript was cut by the server's size cap.
        /// </summary>
        public bool Truncated { get; set; } = false;

        /// <summary>
        /// What was left out when truncated, or null.
        /// </summary>
        public string? TruncationNote { get; set; } = null;

        /// <summary>
        /// Number of turns included.
        /// </summary>
        public int TurnCount { get; set; } = 0;

        /// <summary>
        /// Totals over the included turns.
        /// </summary>
        public TranscriptUsage Usage { get; set; } = new TranscriptUsage();

        /// <summary>
        /// Turns, oldest first.
        /// </summary>
        public List<TranscriptTurn> Turns { get; set; } = new List<TranscriptTurn>();

        #endregion
    }
}
