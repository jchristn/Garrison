namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// The fields of an agent message the harness reads.
    /// </summary>
    public class AgentMessage
    {
        /// <summary>
        /// Identifier (amg_).
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Recipient agent.
        /// </summary>
        public string RecipientAgentId { get; set; } = String.Empty;

        /// <summary>
        /// Normal or Urgent.
        /// </summary>
        public string Urgency { get; set; } = String.Empty;

        /// <summary>
        /// Queued, Delivered, Acknowledged, Expired, or Rejected.
        /// </summary>
        public string Status { get; set; } = String.Empty;

        /// <summary>
        /// Why the message was refused, or null.
        /// </summary>
        public string? RejectionReason { get; set; } = null;

        /// <summary>
        /// Whether the message woke its recipient.
        /// </summary>
        public bool WokeRecipient { get; set; } = false;

        /// <summary>
        /// Run the message was delivered to, or null.
        /// </summary>
        public string? DeliveredRunId { get; set; } = null;

        /// <summary>
        /// When it was delivered, or null.
        /// </summary>
        public DateTime? DeliveredUtc { get; set; } = null;

        /// <summary>
        /// When it was sent.
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.MinValue;
    }
}
