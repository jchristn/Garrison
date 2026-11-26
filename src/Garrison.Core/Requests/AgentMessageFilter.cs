namespace Garrison.Core.Requests
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Filter for listing messages between agents (AA6). Results are newest first.
    /// </summary>
    public class AgentMessageFilter
    {
        /// <summary>
        /// Tenant identifier. Required.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Only messages from this sending agent, or null.
        /// </summary>
        public string? SenderAgentId { get; set; } = null;

        /// <summary>
        /// Only messages to this recipient agent, or null.
        /// </summary>
        public string? RecipientAgentId { get; set; } = null;

        /// <summary>
        /// Only messages to or from this agent, or null.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Only messages in this status, or null.
        /// </summary>
        public MessageStatusEnum? Status { get; set; } = null;

        /// <summary>
        /// Only messages of this urgency, or null.
        /// </summary>
        public MessageUrgencyEnum? Urgency { get; set; } = null;

        /// <summary>
        /// Only rejected messages with this reason, or null.
        /// </summary>
        public MessageRejectionEnum? RejectionReason { get; set; } = null;

        /// <summary>
        /// Only messages in this thread, or null.
        /// </summary>
        public string? ThreadId { get; set; } = null;

        /// <summary>
        /// Only messages delivered to this run, or null.
        /// </summary>
        public string? DeliveredRunId { get; set; } = null;

        /// <summary>
        /// Only messages sent at or after this time (UTC), or null.
        /// </summary>
        public DateTime? FromUtc { get; set; } = null;

        /// <summary>
        /// Only messages sent before this time (UTC), or null.
        /// </summary>
        public DateTime? ToUtc { get; set; } = null;

        /// <summary>
        /// Case-insensitive substring of the subject, or null.
        /// </summary>
        public string? Search { get; set; } = null;

        /// <summary>
        /// Records to skip. Minimum 0.
        /// </summary>
        public int Skip { get; set; } = 0;

        /// <summary>
        /// Records to return. Minimum 1, maximum 1000, default 100.
        /// </summary>
        public int MaxResults
        {
            get
            {
                return _MaxResults;
            }
            set
            {
                _MaxResults = Math.Clamp(value, 1, 1000);
            }
        }

        private int _MaxResults = 100;
    }
}
