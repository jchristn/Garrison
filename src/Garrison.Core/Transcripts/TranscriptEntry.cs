namespace Garrison.Core.Transcripts
{
    using System;
    using System.Text.Json;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Serialization;

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
        [JsonIgnore]
        public string? Text { get; set; } = null;

        /// <summary>
        /// The event's text: model output, a message, or a tool call's input or result when it is not JSON. Null for a
        /// tool call or result whose JSON is in <see cref="ToolInput"/> or <see cref="ToolOutput"/>.
        /// </summary>
        [JsonPropertyName("text")]
        public string? DisplayText
        {
            get
            {
                return ToolInput.HasValue || ToolOutput.HasValue ? null : Text;
            }
            set
            {
                if (value != null) Text = value;
            }
        }

        /// <summary>
        /// A tool call's arguments as a JSON object, when the harness reported JSON; null otherwise.
        /// </summary>
        public JsonElement? ToolInput
        {
            get
            {
                return Type == RunEventTypeEnum.ToolCall ? JsonText.Structured(Text) : null;
            }
            set
            {
                if (value.HasValue) Text = JsonText.Text(value);
            }
        }

        /// <summary>
        /// A tool result as a JSON object or array, when the tool answered JSON; null otherwise.
        /// </summary>
        public JsonElement? ToolOutput
        {
            get
            {
                return Type == RunEventTypeEnum.ToolResult ? JsonText.Structured(Text) : null;
            }
            set
            {
                if (value.HasValue) Text = JsonText.Text(value);
            }
        }

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
