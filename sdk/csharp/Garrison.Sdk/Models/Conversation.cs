namespace Garrison.Sdk.Models
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// A multi-turn conversation with one agent. Each turn is a run; a follow-up turn resumes the harness session the
    /// previous turns built, on the node that holds that session's directories (the affinity node). When that node or its
    /// directories are gone, the turn starts a fresh session seeded with the transcript of the earlier turns and the
    /// fallback is recorded. Turns are serialized: a turn requested while another is unfinished fails with 409
    /// ConversationBusy. The A2A contextId of a conversation's tasks is the conversation identifier, or the client-supplied
    /// context identifier the conversation was created for.
    /// </summary>
    public class Conversation
    {
        #region Public-Members

        /// <summary>
        /// Identifier (prefix cnv_).
        /// </summary>
        public string Id
        {
            get
            {
                return _Id;
            }
            set
            {
                _Id = value ?? String.Empty;
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
        /// Agent the conversation is with.
        /// </summary>
        public string AgentId
        {
            get
            {
                return _AgentId;
            }
            set
            {
                _AgentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Agent name when the conversation started.
        /// </summary>
        public string AgentName
        {
            get
            {
                return _AgentName;
            }
            set
            {
                _AgentName = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Deployment every turn runs on: chosen for the first turn and kept for the rest of the conversation, because a
        /// session can only be resumed by the harness that created it. Empty until the first turn is created.
        /// </summary>
        public string DeploymentId
        {
            get
            {
                return _DeploymentId;
            }
            set
            {
                _DeploymentId = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Harness type of the deployment's profile.
        /// </summary>
        public HarnessTypeEnum HarnessType { get; set; } = HarnessTypeEnum.Generic;

        /// <summary>
        /// Client-supplied A2A context identifier the conversation was created for, or null when it was created without
        /// one (its context identifier is then its own identifier).
        /// </summary>
        public string? ContextId { get; set; } = null;

        /// <summary>
        /// Short title: the first line of the first turn's input, at most 200 characters. Null until the first turn.
        /// </summary>
        public string? Title { get; set; } = null;

        /// <summary>
        /// Principal type that started the conversation.
        /// </summary>
        public PrincipalTypeEnum CallerType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Principal identifier that started the conversation.
        /// </summary>
        public string? CallerId { get; set; } = null;

        /// <summary>
        /// Display name of the principal that started the conversation.
        /// </summary>
        public string? CallerName { get; set; } = null;

        /// <summary>
        /// Harness session the next turn resumes, as reported by the last successful turn. Null before the first
        /// successful turn.
        /// </summary>
        public string? SessionId { get; set; } = null;

        /// <summary>
        /// Harness profile that created the session. Null when there is no session.
        /// </summary>
        public string? SessionHarnessProfileId { get; set; } = null;

        /// <summary>
        /// Node holding the conversation's workspace and home directories, or null when no node holds them.
        /// </summary>
        public string? AffinityNodeId { get; set; } = null;

        /// <summary>
        /// Name of the affinity node, or null.
        /// </summary>
        public string? AffinityNodeName { get; set; } = null;

        /// <summary>
        /// Run of the turn in progress, or null when the conversation is idle. A finished turn does not clear it; check
        /// Busy to know whether a new turn would be accepted.
        /// </summary>
        public string? ActiveRunId { get; set; } = null;

        /// <summary>
        /// Most recent turn's run, or null before the first turn.
        /// </summary>
        public string? LastRunId { get; set; } = null;

        /// <summary>
        /// Turns created in this conversation (every run, whatever its outcome). Minimum 0.
        /// </summary>
        public int TurnCount
        {
            get
            {
                return _TurnCount;
            }
            set
            {
                _TurnCount = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Turns that started a fresh session from the transcript instead of resuming. Minimum 0.
        /// </summary>
        public int FallbackCount
        {
            get
            {
                return _FallbackCount;
            }
            set
            {
                _FallbackCount = Math.Max(0, value);
            }
        }

        /// <summary>
        /// Reason of the most recent fallback, or null when no turn fell back.
        /// </summary>
        public ConversationFallbackReasonEnum? LastFallbackReason { get; set; } = null;

        /// <summary>
        /// Time of the most recent fallback (UTC), or null.
        /// </summary>
        public DateTime? LastFallbackUtc { get; set; } = null;

        /// <summary>
        /// Time of the most recent turn's creation or completion (UTC), or null before the first turn.
        /// </summary>
        public DateTime? LastActivityUtc { get; set; } = null;

        /// <summary>
        /// Computed by the server on read: true while the active run is unfinished, so a new turn (or a delete) would be
        /// refused with 409 ConversationBusy. Never sent to the server.
        /// </summary>
        public bool Busy { get; set; } = false;

        /// <summary>
        /// Whether the record is active.
        /// </summary>
        public bool Active { get; set; } = true;

        /// <summary>
        /// Whether the record is protected from deletion.
        /// </summary>
        public bool IsProtected { get; set; } = false;

        /// <summary>
        /// Creation timestamp (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Last update timestamp (UTC).
        /// </summary>
        public DateTime LastUpdateUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Private-Members

        private string _Id = String.Empty;
        private string _TenantId = String.Empty;
        private string _AgentId = String.Empty;
        private string _AgentName = String.Empty;
        private string _DeploymentId = String.Empty;
        private int _TurnCount = 0;
        private int _FallbackCount = 0;

        #endregion
    }
}
