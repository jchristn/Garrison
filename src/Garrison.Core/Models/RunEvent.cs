namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;
    using Garrison.Core.Serialization;

    /// <summary>
    /// Normalized event emitted by a run.
    /// </summary>
    public class RunEvent
    {
        #region Public-Members

        /// <summary>
        /// Identifier.
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewRunEventId() : value;
            }
        }

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId
        {
            get
            {
                return _TenantId;
            }
            set
            {
                _TenantId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Run identifier.
        /// </summary>
        public string RunId
        {
            get
            {
                return _RunId;
            }
            set
            {
                _RunId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Per-run sequence number.
        /// </summary>
        public long Sequence { get; set; } = 0;

        /// <summary>
        /// Event type.
        /// </summary>
        public RunEventTypeEnum EventType { get; set; } = RunEventTypeEnum.Lifecycle;

        /// <summary>
        /// Event time (UTC).
        /// </summary>
        public DateTime TimestampUtc
        {
            get
            {
                return _TimestampUtc;
            }
            set
            {
                _TimestampUtc = TimestampHelper.Normalize(value);
            }
        }

        /// <summary>
        /// Stable machine code for text Garrison itself generates (for example WorkspacePrepared, HarnessExited,
        /// RunBlocked), so clients can show a translated label; null for text that comes from the harness or model.
        /// </summary>
        public string? Code { get; set; } = null;

        /// <summary>
        /// Text content.
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
                return EventType == RunEventTypeEnum.ToolCall ? JsonText.Structured(Text) : null;
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
                return EventType == RunEventTypeEnum.ToolResult ? JsonText.Structured(Text) : null;
            }
            set
            {
                if (value.HasValue) Text = JsonText.Text(value);
            }
        }

        /// <summary>
        /// Tool name.
        /// </summary>
        public string? ToolName { get; set; } = null;

        /// <summary>
        /// Tool call identifier.
        /// </summary>
        public string? ToolCallId { get; set; } = null;

        /// <summary>
        /// Success flag for tool results.
        /// </summary>
        public bool? Success { get; set; } = null;

        /// <summary>
        /// Input tokens for usage events.
        /// </summary>
        public long? InputTokens { get; set; } = null;

        /// <summary>
        /// Output tokens for usage events.
        /// </summary>
        public long? OutputTokens { get; set; } = null;

        /// <summary>
        /// Verbatim harness event (unmanaged JSON).
        /// </summary>
        [JsonIgnore]
        public string? RawEventJson { get; set; } = null;

        /// <summary>
        /// The harness event or Garrison notice this event came from, as a JSON object; null when there is none or
        /// when the line is not valid JSON (see <see cref="RawEventText"/>). Stored as <see cref="RawEventJson"/>.
        /// </summary>
        public JsonElement? RawEvent
        {
            get
            {
                return JsonText.Value(RawEventJson);
            }
            set
            {
                if (value.HasValue) RawEventJson = JsonText.Text(value);
            }
        }

        /// <summary>
        /// The source line as text when it is not valid JSON, for example a plain output line or one truncated to the
        /// configured size; null when <see cref="RawEvent"/> carries it.
        /// </summary>
        public string? RawEventText
        {
            get
            {
                return JsonText.Value(RawEventJson).HasValue ? null : RawEventJson;
            }
            set
            {
                if (value != null) RawEventJson = value;
            }
        }

        /// <summary>
        /// Persisted (UTC).
        /// </summary>
        public DateTime CreatedUtc
        {
            get
            {
                return _CreatedUtc;
            }
            set
            {
                _CreatedUtc = TimestampHelper.Normalize(value);
            }
        }

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewRunEventId();
        private string _TenantId = String.Empty;
        private string _RunId = String.Empty;
        private DateTime _TimestampUtc = DateTime.UtcNow;
        private DateTime _CreatedUtc = DateTime.UtcNow;

        #endregion
    }
}
