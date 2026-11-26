namespace Garrison.Sdk.Requests
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Message list filter (AA6). Results are newest first.
    /// </summary>
    public class AgentMessageFilter
    {
        /// <summary>
        /// Sending agent identifier or name, or null for any.
        /// </summary>
        public string? Sender { get; set; } = null;

        /// <summary>
        /// Recipient agent identifier or name, or null for any.
        /// </summary>
        public string? Recipient { get; set; } = null;

        /// <summary>
        /// Messages to or from this agent (identifier or name), or null.
        /// </summary>
        public string? Agent { get; set; } = null;

        /// <summary>
        /// Status, or null for any.
        /// </summary>
        public MessageStatusEnum? Status { get; set; } = null;

        /// <summary>
        /// Urgency, or null for any.
        /// </summary>
        public MessageUrgencyEnum? Urgency { get; set; } = null;

        /// <summary>
        /// Rejection reason, or null for any.
        /// </summary>
        public MessageRejectionEnum? Reason { get; set; } = null;

        /// <summary>
        /// Thread identifier, or null for any.
        /// </summary>
        public string? Thread { get; set; } = null;

        /// <summary>
        /// Only messages delivered to this run, or null.
        /// </summary>
        public string? DeliveredRunId { get; set; } = null;

        /// <summary>
        /// Sent at or after (UTC), or null.
        /// </summary>
        public DateTime? FromUtc { get; set; } = null;

        /// <summary>
        /// Sent before (UTC), or null.
        /// </summary>
        public DateTime? ToUtc { get; set; } = null;

        /// <summary>
        /// Case-insensitive substring of the subject, or null.
        /// </summary>
        public string? Search { get; set; } = null;

        /// <summary>
        /// Records to skip.
        /// </summary>
        public int Skip { get; set; } = 0;

        /// <summary>
        /// Records to return, 1 to 1000.
        /// </summary>
        public int MaxResults { get; set; } = 100;
    }
}
