namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

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
                _Id = String.IsNullOrWhiteSpace(value) ? String.Empty : value;
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
                _TimestampUtc = value;
            }
        }

        /// <summary>
        /// Text content: model output, a message, or a tool call's input or result when it is not JSON. Null for a tool
        /// call or result whose JSON is in <see cref="ToolInput"/> or <see cref="ToolOutput"/>.
        /// </summary>
        public string? Text { get; set; } = null;

        /// <summary>
        /// A tool call's arguments as a JSON object, when the harness reported JSON; null otherwise.
        /// </summary>
        public JsonElement? ToolInput { get; set; } = null;

        /// <summary>
        /// A tool result as a JSON object or array, when the tool answered JSON; null otherwise.
        /// </summary>
        public JsonElement? ToolOutput { get; set; } = null;

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
        /// Verbatim harness event line or Garrison notice as a JSON object, or null. Null when the line was not valid
        /// JSON, in which case <see cref="RawEventText"/> carries it.
        /// </summary>
        public JsonElement? RawEvent { get; set; } = null;

        /// <summary>
        /// Verbatim harness event line as text, set only when it is not valid JSON (for example truncated); null when
        /// <see cref="RawEvent"/> carries it.
        /// </summary>
        public string? RawEventText { get; set; } = null;

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
                _CreatedUtc = value;
            }
        }

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _RunId = String.Empty;
        private DateTime _TimestampUtc = DateTime.UtcNow;
        private DateTime _CreatedUtc = DateTime.UtcNow;

        #endregion
    }
}
