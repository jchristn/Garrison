namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

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
        public string? RawEventJson { get; set; } = null;
    }
}
