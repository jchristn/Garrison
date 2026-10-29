namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Options for invoking an agent from any ingress (REST, MCP, A2A).
    /// </summary>
    public class InvocationOptions
    {
        /// <summary>
        /// Input message.
        /// </summary>
        public string Input { get; set; } = String.Empty;

        /// <summary>
        /// Input content type.
        /// </summary>
        public string? InputContentType { get; set; } = null;

        /// <summary>
        /// Specific deployment, or null for weighted selection.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Per-run parameters.
        /// </summary>
        public Dictionary<string, string> Parameters { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Priority.
        /// </summary>
        public int Priority { get; set; } = 0;

        /// <summary>
        /// Run kind for non-delegated runs.
        /// </summary>
        public RunKindEnum Kind { get; set; } = RunKindEnum.Invoke;

        /// <summary>
        /// Idempotency key.
        /// </summary>
        public string? IdempotencyKey { get; set; } = null;

        /// <summary>
        /// Conversation to continue with this invocation as its next turn, or null. A turn sent while the conversation's
        /// previous turn is unfinished fails with 409 ConversationBusy.
        /// </summary>
        public string? ConversationId { get; set; } = null;

        /// <summary>
        /// Whether this invocation starts a new conversation; the run's conversationId then names it. Ignored when
        /// <see cref="ConversationId"/> or <see cref="ContextId"/> is set. Default false.
        /// </summary>
        public bool StartConversation { get; set; } = false;

        /// <summary>
        /// A2A context identifier of the message, or null. Every A2A message belongs to a conversation: a known context
        /// continues it, an unknown or missing one starts a new conversation.
        /// </summary>
        public string? ContextId { get; set; } = null;

        /// <summary>
        /// Fan-out group the new run is a member of (AD5), or null.
        /// </summary>
        public string? FanOutGroupId { get; set; } = null;

        /// <summary>
        /// Agentic app whose chat UI started the run (AD6); a conversation it starts records the app. Null otherwise.
        /// </summary>
        public string? AppId { get; set; } = null;

        /// <summary>
        /// Run identifier to use for the new run, or null to generate one. Fan-out sets it so the group can name its
        /// members before they exist.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Whether to wait for completion.
        /// </summary>
        public bool Wait { get; set; } = false;

        /// <summary>
        /// Maximum wait in seconds.
        /// </summary>
        public int WaitSeconds { get; set; } = 60;

        /// <summary>
        /// Whether a waiting caller that goes away cancels the run: when <see cref="Wait"/> is true and the invoke's
        /// cancellation token is cancelled while waiting (client disconnect, cancelled MCP request, closed MCP session),
        /// the run is cancelled before the cancellation propagates. Ignored when not waiting. Default false; each
        /// protocol sets its own default (REST and A2A blocking calls default to true).
        /// </summary>
        public bool CancelOnDisconnect { get; set; } = false;

        /// <summary>
        /// Optional check that the caller is really gone when the cancellation token fires, so a replica shutting down
        /// (which also cancels request tokens) does not cancel runs. Null treats any cancellation as the caller leaving.
        /// </summary>
        public Func<bool>? CallerGone { get; set; } = null;

        /// <summary>
        /// Short description of the caller for the log line written when the run is cancelled, for example "the REST
        /// client disconnected".
        /// </summary>
        public string DisconnectReason { get; set; } = "the caller disconnected";

        /// <summary>
        /// Protocol surface the invocation came from, used as the surface label on invocation metrics: rest, mcp, or
        /// a2a. Default rest.
        /// </summary>
        public string Surface { get; set; } = "rest";

        /// <summary>
        /// Whether the caller follows the run until it finishes by itself instead of through <see cref="Wait"/> (an A2A
        /// stream). A calling run is then recorded as waiting on its child as with Wait (P12.38), and the record stays
        /// until the caller passes <see cref="ChildWaitId"/> to AgentInvoker.EndChildWaitAsync. Default false.
        /// </summary>
        public bool CallerWaits { get; set; } = false;

        /// <summary>Use a durable checkpoint instead of keeping a resident parent waiting. Internal callers only.</summary>
        public bool DurableWait { get; set; } = false;

        /// <summary>
        /// Set by the invocation: the delegation wait left open for a caller that waits by itself
        /// (<see cref="CallerWaits"/>), or null.
        /// </summary>
        public string? ChildWaitId { get; set; } = null;

        /// <summary>
        /// Studio draft to link to a conversation this run starts (AD7.10), or null.
        /// </summary>
        public string? StudioDraftId { get; set; } = null;
    }
}
