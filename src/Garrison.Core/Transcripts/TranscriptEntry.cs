namespace Garrison.Core.Transcripts
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// One event of a transcript turn: assistant text, thinking (only when requested), a tool call or result, a warning,
    /// an error, or a lifecycle note (P12.27). Text is redacted.
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
        /// Event type: AssistantText, Thinking, ToolCall, ToolResult, Warning, Error, or Lifecycle.
        /// </summary>
        public RunEventTypeEnum Type { get; set; } = RunEventTypeEnum.AssistantText;

        /// <summary>
        /// Text: the assistant's words, the tool arguments of a call, the tool's output for a result, or the message.
        /// Null when the event had none.
        /// </summary>
        public string? Text { get; set; } = null;

        /// <summary>
        /// Tool name for tool calls and results.
        /// </summary>
        public string? ToolName { get; set; } = null;

        /// <summary>
        /// Tool call identifier, which pairs a result with its call.
        /// </summary>
        public string? ToolCallId { get; set; } = null;

        /// <summary>
        /// Whether a tool result succeeded, when the harness said.
        /// </summary>
        public bool? Success { get; set; } = null;

        /// <summary>
        /// Stable code of a warning, error, or lifecycle event, when it had one.
        /// </summary>
        public string? Code { get; set; } = null;

        /// <summary>
        /// Whether <see cref="Text"/> was cut to the tool text limit (Transcripts.ToolTextMaxChars).
        /// </summary>
        public bool TextTruncated { get; set; } = false;

        #endregion
    }
}
