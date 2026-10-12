namespace Garrison.Core.Models
{
    using System;
    using System.Text.Json.Serialization;
    using Garrison.Core.Enums;
    using Garrison.Core.Helpers;

    /// <summary>
    /// A multi-turn conversation with one agent (plan P12.1). Each turn is a run; a follow-up turn resumes the harness
    /// session the previous turns built, on the node that holds that session's workspace and home directories (the
    /// affinity node). When the affinity node or its directories are gone, the turn starts a fresh session seeded with
    /// the transcript of the earlier turns, and the fallback is recorded here and on the run. Tenant-scoped; the A2A
    /// <c>contextId</c> of a conversation's tasks is the conversation identifier, or the client-supplied context
    /// identifier the conversation was created for. Turns of one conversation are serialized: a turn requested while
    /// another is unfinished fails with 409 ConversationBusy.
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
                _Id = String.IsNullOrWhiteSpace(value) ? IdGenerator.NewConversationId() : value;
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
        /// Deployment every turn runs on: chosen for the first turn (by the request or by weighted routing) and kept for
        /// the rest of the conversation, because a session can only be resumed by the harness that created it. Empty
        /// until the first turn is created.
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
        /// Client-supplied A2A context identifier the conversation was created for, or null when the conversation was
        /// created without one (its context identifier is then its own identifier). Unique per tenant and agent.
        /// </summary>
        public string? ContextId { get; set; } = null;

        /// <summary>
        /// Short title: the first line of the first turn's input, at most 200 characters. Null until the first turn.
        /// </summary>
        public string? Title
        {
            get
            {
                return _Title;
            }
            set
            {
                if (String.IsNullOrWhiteSpace(value))
                {
                    _Title = null;
                    return;
                }
                string trimmed = value.Trim();
                int newline = trimmed.IndexOfAny(new[] { '\r', '\n' });
                if (newline >= 0) trimmed = trimmed.Substring(0, newline).Trim();
                _Title = trimmed.Length > 200 ? trimmed.Substring(0, 200) : trimmed;
            }
        }

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
        /// Harness session the next turn resumes, as reported by the last successful turn (Claude Code session_id,
        /// Codex thread id, Mux sessionId). Null before the first successful turn.
        /// </summary>
        public string? SessionId { get; set; } = null;

        /// <summary>
        /// Harness profile that created <see cref="SessionId"/>. A turn whose deployment now uses a different profile
        /// cannot resume the session and falls back to the transcript. Null when there is no session.
        /// </summary>
        public string? SessionHarnessProfileId { get; set; } = null;

        /// <summary>
        /// Node holding the conversation's workspace and home directories (the node of the last successful turn), or null
        /// when no node holds them (no successful turn yet, the last turn ran on an executor that keeps no state, or the
        /// affinity was dropped by a fallback).
        /// </summary>
        public string? AffinityNodeId { get; set; } = null;

        /// <summary>
        /// Name of <see cref="AffinityNodeId"/>, or null.
        /// </summary>
        public string? AffinityNodeName { get; set; } = null;

        /// <summary>
        /// Run of the turn in progress, or null when the conversation is idle. A turn finishing does not clear it; a new
        /// turn replaces it once that run has finished.
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
        /// Turns that started a fresh session from the transcript instead of resuming (see
        /// <see cref="ConversationFallbackReasonEnum"/>). Minimum 0.
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
        /// Computed, read-only on the API: true while <see cref="ActiveRunId"/> names an unfinished run, so a new turn
        /// would be refused with 409 ConversationBusy. Filled when the conversation is read over REST or MCP; never stored.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
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

        /// <summary>
        /// Last update timestamp (UTC).
        /// </summary>
        public DateTime LastUpdateUtc
        {
            get
            {
                return _LastUpdateUtc;
            }
            set
            {
                _LastUpdateUtc = TimestampHelper.Normalize(value);
            }
        }

        #endregion

        #region Private-Members

        private string _Id = IdGenerator.NewConversationId();
        private string _TenantId = String.Empty;
        private string _AgentId = String.Empty;
        private string _AgentName = String.Empty;
        private string _DeploymentId = String.Empty;
        private string? _Title = null;
        private int _TurnCount = 0;
        private int _FallbackCount = 0;
        private DateTime _CreatedUtc = DateTime.UtcNow;
        private DateTime _LastUpdateUtc = DateTime.UtcNow;

        #endregion

        #region Public-Methods

        /// <summary>
        /// The A2A context identifier of the conversation's tasks: the client-supplied context identifier when the
        /// conversation was created for one, otherwise the conversation identifier.
        /// </summary>
        /// <returns>Context identifier.</returns>
        public string EffectiveContextId()
        {
            return String.IsNullOrEmpty(ContextId) ? Id : ContextId!;
        }

        #endregion
    }
}
