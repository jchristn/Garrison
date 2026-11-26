namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// An asynchronous note from an agent or a person to an agent, sent along an allowed line (AA6, AA-020). Subject and
    /// body are text written by the sender and reach a prompt only framed as data (AA-025). Not thread-safe.
    /// </summary>
    public class AgentMessage
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix amg_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewAgentMessageId() : value;
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
        /// Thread identifier: the identifier of the first message in the thread. Equal to Id for a message that starts one.
        /// </summary>
        public string ThreadId
        {
            get
            {
                return _ThreadId;
            }
            set
            {
                _ThreadId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// The message this one replies to, or null.
        /// </summary>
        public string? ParentMessageId { get; set; } = null;

        /// <summary>
        /// How many agent-to-agent hops led to this message: 1 for a message that nothing delivered before it caused, one
        /// more than the message it replies to or the messages delivered to the sending run. Minimum 0 (a person's message).
        /// </summary>
        public int HopCount
        {
            get
            {
                return _HopCount;
            }
            set
            {
                _HopCount = Math.Max(0, value);
            }
        }

        /// <summary>
        /// The sending agent, or null when a person sent the message.
        /// </summary>
        public string? SenderAgentId { get; set; } = null;

        /// <summary>
        /// Name of the sending agent when the message was sent, or null.
        /// </summary>
        public string? SenderAgentName { get; set; } = null;

        /// <summary>
        /// The sending run, or null when a person sent the message.
        /// </summary>
        public string? SenderRunId { get; set; } = null;

        /// <summary>
        /// Who sent the message: Run for a run, otherwise the person's or credential's principal type.
        /// </summary>
        public PrincipalTypeEnum SenderPrincipalType { get; set; } = PrincipalTypeEnum.Run;

        /// <summary>
        /// Principal identifier of the sender: the run, user, or credential identifier.
        /// </summary>
        public string? SenderPrincipalId { get; set; } = null;

        /// <summary>
        /// Display name of the sender.
        /// </summary>
        public string? SenderName { get; set; } = null;

        /// <summary>
        /// The recipient agent.
        /// </summary>
        public string RecipientAgentId
        {
            get
            {
                return _RecipientAgentId;
            }
            set
            {
                _RecipientAgentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Name of the recipient agent when the message was sent, or null.
        /// </summary>
        public string? RecipientAgentName { get; set; } = null;

        /// <summary>
        /// Urgency. Default Normal.
        /// </summary>
        public MessageUrgencyEnum Urgency { get; set; } = MessageUrgencyEnum.Normal;

        /// <summary>
        /// Subject, 1 to 256 characters, trimmed.
        /// </summary>
        /// <exception cref="ArgumentException">Thrown when the value is empty or longer than 256 characters.</exception>
        public string Subject
        {
            get
            {
                return _Subject;
            }
            set
            {
                string trimmed = (value ?? String.Empty).Trim();
                if (trimmed.Length < 1 || trimmed.Length > 256) throw new ArgumentException("A message subject holds 1 to 256 characters.", nameof(Subject));
                _Subject = trimmed;
            }
        }

        /// <summary>
        /// Body, plain text or Markdown written by the sender. At most Messaging.MaxBodyBytes UTF-8 bytes (default 16384),
        /// checked when the message is sent. Empty when not set.
        /// </summary>
        public string Body
        {
            get
            {
                return _Body;
            }
            set
            {
                _Body = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Run artifacts attached by reference, at most 20, in the order given.
        /// </summary>
        public List<AgentMessageArtifact> Artifacts
        {
            get
            {
                return _Artifacts;
            }
            set
            {
                _Artifacts = value ?? new List<AgentMessageArtifact>();
            }
        }

        /// <summary>
        /// Status. Default Queued.
        /// </summary>
        public MessageStatusEnum Status { get; set; } = MessageStatusEnum.Queued;

        /// <summary>
        /// Why the message was refused, when Status is Rejected; otherwise null.
        /// </summary>
        public MessageRejectionEnum? RejectionReason { get; set; } = null;

        /// <summary>
        /// A sentence explaining the rejection, or null.
        /// </summary>
        public string? RejectionDetail { get; set; } = null;

        /// <summary>
        /// The escalation this message carries to an agent (AA6.7), or null. The escalation record stays the source of
        /// truth; the recipient answers it with garrison_answer_escalation.
        /// </summary>
        public string? EscalationId { get; set; } = null;

        /// <summary>
        /// True when this urgent message woke its recipient (a keeper wake or a Message run). Counts toward
        /// Messaging.UrgentWakesPerHour.
        /// </summary>
        public bool WokeRecipient { get; set; } = false;

        /// <summary>
        /// The run the message was delivered to, or null.
        /// </summary>
        public string? DeliveredRunId { get; set; } = null;

        /// <summary>
        /// When the message was delivered (UTC), or null.
        /// </summary>
        public DateTime? DeliveredUtc { get; set; } = null;

        /// <summary>
        /// When the recipient acknowledged the message (UTC), or null.
        /// </summary>
        public DateTime? AcknowledgedUtc { get; set; } = null;

        /// <summary>
        /// When an undelivered message expires (UTC), or null for never.
        /// </summary>
        public DateTime? ExpiresUtc { get; set; } = null;

        /// <summary>
        /// Uppercase hexadecimal SHA-256 that makes a replayed send return the first message instead of sending another:
        /// computed from the run and the message's content for runs, or from the caller and idempotencyKey for people.
        /// Null for a person's message without an idempotency key.
        /// </summary>
        [JsonIgnore]
        public string? SendKey { get; set; } = null;

        /// <summary>
        /// Delivery claim held while a run is being started for this message. Internal.
        /// </summary>
        [JsonIgnore]
        public string? DeliveryClaim { get; set; } = null;

        /// <summary>
        /// When the delivery claim was taken (UTC), or null. Internal.
        /// </summary>
        [JsonIgnore]
        public DateTime? ClaimedUtc { get; set; } = null;

        /// <summary>
        /// When the message was sent (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// When the message last changed status (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewAgentMessageId();
        private string _TenantId = String.Empty;
        private string _ThreadId = String.Empty;
        private int _HopCount = 1;
        private string _RecipientAgentId = String.Empty;
        private string _Subject = "Message";
        private string _Body = String.Empty;
        private List<AgentMessageArtifact> _Artifacts = new List<AgentMessageArtifact>();

        #endregion
    }
}
