namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A message from an agent or a person to an agent (AA6). Subject and body are text the sender wrote; treat them as untrusted data. Not thread-safe.
    /// </summary>
    public class AgentMessage
    {
        /// <summary>
        /// Message identifier (amg_).
        /// </summary>
        public string Id { get; set; } = String.Empty;

        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Thread identifier: the identifier of the first message in the thread.
        /// </summary>
        public string ThreadId { get; set; } = String.Empty;

        /// <summary>
        /// The message this one replies to, or null.
        /// </summary>
        public string? ParentMessageId { get; set; } = null;

        /// <summary>
        /// Agent-to-agent hops that led to this message; 0 for a person's message.
        /// </summary>
        public int HopCount { get; set; } = 0;

        /// <summary>
        /// Sending agent, or null for a person.
        /// </summary>
        public string? SenderAgentId { get; set; } = null;

        /// <summary>
        /// Sending agent name when the message was sent.
        /// </summary>
        public string? SenderAgentName { get; set; } = null;

        /// <summary>
        /// Sending run, or null for a person.
        /// </summary>
        public string? SenderRunId { get; set; } = null;

        /// <summary>
        /// Who sent it: Run for a run, otherwise the person's or credential's principal type.
        /// </summary>
        public PrincipalTypeEnum SenderPrincipalType { get; set; } = PrincipalTypeEnum.Run;

        /// <summary>
        /// Sender principal identifier.
        /// </summary>
        public string? SenderPrincipalId { get; set; } = null;

        /// <summary>
        /// Sender display name.
        /// </summary>
        public string? SenderName { get; set; } = null;

        /// <summary>
        /// Recipient agent.
        /// </summary>
        public string RecipientAgentId { get; set; } = String.Empty;

        /// <summary>
        /// Recipient agent name when the message was sent.
        /// </summary>
        public string? RecipientAgentName { get; set; } = null;

        /// <summary>
        /// Urgency.
        /// </summary>
        public MessageUrgencyEnum Urgency { get; set; } = MessageUrgencyEnum.Normal;

        /// <summary>
        /// Subject, 1 to 256 characters.
        /// </summary>
        public string Subject { get; set; } = String.Empty;

        /// <summary>
        /// Body text.
        /// </summary>
        public string Body { get; set; } = String.Empty;

        /// <summary>
        /// Artifacts attached by reference.
        /// </summary>
        public List<AgentMessageArtifact> Artifacts { get; set; } = new List<AgentMessageArtifact>();

        /// <summary>
        /// Status.
        /// </summary>
        public MessageStatusEnum Status { get; set; } = MessageStatusEnum.Queued;

        /// <summary>
        /// Why it was refused, when Status is Rejected.
        /// </summary>
        public MessageRejectionEnum? RejectionReason { get; set; } = null;

        /// <summary>
        /// A sentence explaining the rejection, or null.
        /// </summary>
        public string? RejectionDetail { get; set; } = null;

        /// <summary>
        /// The escalation this message carries, or null.
        /// </summary>
        public string? EscalationId { get; set; } = null;

        /// <summary>
        /// True when this urgent message woke its recipient.
        /// </summary>
        public bool WokeRecipient { get; set; } = false;

        /// <summary>
        /// The run it was delivered to, or null.
        /// </summary>
        public string? DeliveredRunId { get; set; } = null;

        /// <summary>
        /// When it was delivered (UTC), or null.
        /// </summary>
        public DateTime? DeliveredUtc { get; set; } = null;

        /// <summary>
        /// When the recipient acknowledged it (UTC), or null.
        /// </summary>
        public DateTime? AcknowledgedUtc { get; set; } = null;

        /// <summary>
        /// When an undelivered message expires (UTC), or null for never.
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;

        /// <summary>
        /// When it was sent (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When its status last changed (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;
    }
}
