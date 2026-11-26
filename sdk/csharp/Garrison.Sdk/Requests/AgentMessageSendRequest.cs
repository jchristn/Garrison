namespace Garrison.Sdk.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A person's or API credential's message to an agent (AA6). Needs Create on AgentMessage. Agents send with the garrison_send_message MCP tool.
    /// </summary>
    public class AgentMessageSendRequest
    {
        /// <summary>
        /// Recipient agent identifier or name. Required unless ParentMessageId names a message from an agent.
        /// </summary>
        public string? Recipient { get; set; } = null;

        /// <summary>
        /// Subject, 1 to 256 characters. Required.
        /// </summary>
        public string? Subject { get; set; } = null;

        /// <summary>
        /// Body text, at most Messaging.MaxBodyBytes UTF-8 bytes.
        /// </summary>
        public string? Body { get; set; } = null;

        /// <summary>
        /// Urgency. Default Normal.
        /// </summary>
        public MessageUrgencyEnum? Urgency { get; set; } = null;

        /// <summary>
        /// The message this one replies to, or null to start a thread.
        /// </summary>
        public string? ParentMessageId { get; set; } = null;

        /// <summary>
        /// Run artifacts to attach by identifier, at most 20.
        /// </summary>
        public List<string>? ArtifactIds { get; set; } = null;

        /// <summary>
        /// Seconds until an undelivered message expires, 1 to 31536000, or null for never.
        /// </summary>
        public int? TtlSeconds { get; set; } = null;

        /// <summary>
        /// Sending again with the same key returns the first message. At most 256 characters.
        /// </summary>
        public string? IdempotencyKey { get; set; } = null;
    }
}
