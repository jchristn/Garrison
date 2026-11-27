namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;

    /// <summary>Typed arguments of the message tools (AA6.6). Tenant identity comes from the authenticated caller.</summary>
    public class McpMessageArguments
    {
        /// <summary>Thread identifier (read thread).</summary>
        public string? ThreadId { get; set; } = null;

        /// <summary>Recipient agent, by identifier or name (send).</summary>
        public string? Recipient { get; set; } = null;

        /// <summary>Message identifier: the message replied to (reply) or acknowledged (ack).</summary>
        public string? MessageId { get; set; } = null;

        /// <summary>People only: the message a person's message replies to (send).</summary>
        public string? ParentMessageId { get; set; } = null;

        /// <summary>Subject, 1 to 256 characters (send; optional on reply).</summary>
        public string? Subject { get; set; } = null;

        /// <summary>Body text (send, reply).</summary>
        public string? Body { get; set; } = null;

        /// <summary>Urgency: Normal or Urgent (send, reply; list filter for people).</summary>
        public string? Urgency { get; set; } = null;

        /// <summary>Run artifacts to attach by identifier, at most 20 (send, reply).</summary>
        public List<string>? ArtifactIds { get; set; } = null;

        /// <summary>Seconds until an undelivered message expires, 1 to 31536000 (send, reply).</summary>
        public int? TtlSeconds { get; set; } = null;

        /// <summary>People only: sending again with the same key returns the first message (send).</summary>
        public string? IdempotencyKey { get; set; } = null;

        /// <summary>People only: the agent whose inbox to list, by identifier or name (read_inbox).</summary>
        public string? Agent { get; set; } = null;

        /// <summary>People only: status filter (read_inbox).</summary>
        public string? Status { get; set; } = null;

        /// <summary>People only: messages sent at or after this time, UTC (read_inbox).</summary>
        public DateTime? Since { get; set; } = null;

        /// <summary>People only: records to skip (read_inbox).</summary>
        public int? Skip { get; set; } = null;

        /// <summary>Most messages to return or deliver (read_inbox).</summary>
        public int? MaxResults { get; set; } = null;
    }
}
