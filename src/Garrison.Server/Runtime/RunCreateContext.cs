namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Everything needed to create a run, after authentication and authorization.
    /// </summary>
    public class RunCreateContext
    {
        /// <summary>
        /// Tenant identifier.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Agent to invoke.
        /// </summary>
        public Agent Agent { get; set; } = new Agent();

        /// <summary>
        /// Specific deployment identifier, or null for weighted selection.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Input message.
        /// </summary>
        public string Input { get; set; } = String.Empty;

        /// <summary>
        /// Input content type.
        /// </summary>
        public string? InputContentType { get; set; } = null;

        /// <summary>
        /// Requested parameter overrides.
        /// </summary>
        public Dictionary<string, string> Parameters { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Priority.
        /// </summary>
        public int Priority { get; set; } = 0;

        /// <summary>
        /// Run kind.
        /// </summary>
        public RunKindEnum Kind { get; set; } = RunKindEnum.Invoke;

        /// <summary>
        /// Caller principal type.
        /// </summary>
        public PrincipalTypeEnum CallerType { get; set; } = PrincipalTypeEnum.User;

        /// <summary>
        /// Caller principal identifier. For delegated runs, the originating principal of the parent run.
        /// </summary>
        public string? CallerId { get; set; } = null;

        /// <summary>
        /// Caller display name.
        /// </summary>
        public string? CallerName { get; set; } = null;

        /// <summary>
        /// Parent run for delegated runs.
        /// </summary>
        public Run? Parent { get; set; } = null;

        /// <summary>
        /// Run this run retries.
        /// </summary>
        public string? RetryOfRunId { get; set; } = null;

        /// <summary>
        /// Idempotency key.
        /// </summary>
        public string? IdempotencyKey { get; set; } = null;

        /// <summary>
        /// Conversation the run continues as its next turn, or null. Must name a conversation of the tenant with the
        /// same agent.
        /// </summary>
        public string? ConversationId { get; set; } = null;

        /// <summary>
        /// Whether the run starts a new conversation (ignored when <see cref="ConversationId"/> or
        /// <see cref="ContextId"/> is set). Default false.
        /// </summary>
        public bool StartConversation { get; set; } = false;

        /// <summary>
        /// A2A context identifier: names a conversation by identifier or by the client-supplied context identifier it was
        /// created for; an unknown value starts a new conversation for it. Null otherwise.
        /// </summary>
        public string? ContextId { get; set; } = null;

        /// <summary>
        /// Protocol surface the run came from (rest, mcp, or a2a), used as a metric label. Default rest.
        /// </summary>
        public string Surface { get; set; } = "rest";
    }
}
