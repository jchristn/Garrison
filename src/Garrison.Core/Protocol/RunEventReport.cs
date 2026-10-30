namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Serialization;

    /// <summary>
    /// Normalized event reported by a worker.
    /// </summary>
    public class RunEventReport
    {
        /// <summary>
        /// Per-run sequence assigned by the worker, starting at 1.
        /// </summary>
        public long Sequence { get; set; } = 0;

        /// <summary>
        /// Event type.
        /// </summary>
        public RunEventTypeEnum EventType { get; set; } = RunEventTypeEnum.Lifecycle;

        /// <summary>
        /// Event time (UTC).
        /// </summary>
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Stable machine code for text Garrison itself generates (for example WorkspacePrepared, HarnessExited,
        /// RunBlocked), so clients can show a translated label; null for text that comes from the harness or model.
        /// </summary>
        public string? Code { get; set; } = null;

        /// <summary>
        /// Text content.
        /// </summary>
        public string? Text { get; set; } = null;

        /// <summary>
        /// Tool name.
        /// </summary>
        public string? ToolName { get; set; } = null;

        /// <summary>
        /// Tool call identifier.
        /// </summary>
        public string? ToolCallId { get; set; } = null;

        /// <summary>
        /// Tool result success.
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
        /// Verbatim harness event.
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
    }
}
