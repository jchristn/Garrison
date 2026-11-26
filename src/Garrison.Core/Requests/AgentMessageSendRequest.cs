namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// A request to send a message to an agent (AA6): the body of POST /messages, and the arguments the message tools pass
    /// to the message service. Runs send as their own agent; people may write to any agent.
    /// </summary>
    public class AgentMessageSendRequest
    {
        /// <summary>
        /// Recipient agent, by identifier or name. Required except when replying, where the recipient is the sender of the
        /// message replied to.
        /// </summary>
        public string? Recipient { get; set; } = null;

        /// <summary>
        /// Subject, 1 to 256 characters. Required except when replying, where it defaults to the replied message's subject.
        /// </summary>
        public string? Subject { get; set; } = null;

        /// <summary>
        /// Body, plain text or Markdown, at most Messaging.MaxBodyBytes UTF-8 bytes. Optional.
        /// </summary>
        public string? Body { get; set; } = null;

        /// <summary>
        /// Urgency. Default Normal.
        /// </summary>
        public MessageUrgencyEnum Urgency { get; set; } = MessageUrgencyEnum.Normal;

        /// <summary>
        /// The message this one replies to, or null to start a thread.
        /// </summary>
        public string? ParentMessageId { get; set; } = null;

        /// <summary>
        /// Identifiers of run artifacts to attach by reference, at most 20.
        /// </summary>
        public List<string> ArtifactIds
        {
            get
            {
                return _ArtifactIds;
            }
            set
            {
                _ArtifactIds = value ?? new List<string>();
            }
        }

        /// <summary>
        /// Seconds until an undelivered message expires, or null for never. Minimum 1, maximum 31536000.
        /// </summary>
        public int? TtlSeconds { get; set; } = null;

        /// <summary>
        /// People only: sending again with the same key returns the first message. At most 256 characters.
        /// </summary>
        public string? IdempotencyKey { get; set; } = null;

        private List<string> _ArtifactIds = new List<string>();
    }
}
