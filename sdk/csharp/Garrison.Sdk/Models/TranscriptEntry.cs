namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// One event of a transcript turn: assistant text, thinking (only when requested), a tool call or result, a warning,
    /// an error, or a lifecycle note. Secret values are already replaced with [REDACTED].
    /// </summary>
    public class TranscriptEntry
    {
        #region Public-Members

        /// <summary>
        /// Event sequence within the run.
        /// </summary>
        public long Sequence { get; set; } = 0;

        /// <summary>
        /// Event time (UTC).
        /// </summary>
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Event type.
        /// </summary>
        public RunEventTypeEnum Type { get; set; } = RunEventTypeEnum.AssistantText;

        /// <summary>
        /// Text, or null.
        /// </summary>
        public string? Text { get; set; } = null;

        /// <summary>
        /// Tool name for tool calls and results, or null.
        /// </summary>
        public string? ToolName { get; set; } = null;

        /// <summary>
        /// Tool call identifier, or null.
        /// </summary>
        public string? ToolCallId { get; set; } = null;

        /// <summary>
        /// Tool result success flag, or null.
        /// </summary>
        public bool? Success { get; set; } = null;

        /// <summary>
        /// Event code (warnings, errors), or null.
        /// </summary>
        public string? Code { get; set; } = null;

        /// <summary>
        /// Whether the text was cut to the server's tool text limit.
        /// </summary>
        public bool TextTruncated { get; set; } = false;

        #endregion
    }
}
