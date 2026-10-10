namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

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
        public string? RawEventJson { get; set; } = null;

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
