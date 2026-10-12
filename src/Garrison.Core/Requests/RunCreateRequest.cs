namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Request to create a run.
    /// </summary>
    public class RunCreateRequest
    {
        /// <summary>
        /// Agent identifier (or supply AgentName).
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Agent name (or supply AgentId).
        /// </summary>
        public string? AgentName { get; set; } = null;

        /// <summary>
        /// Specific deployment; null picks a weighted active deployment.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Input message.
        /// </summary>
        public string Input { get; set; } = String.Empty;

        /// <summary>
        /// Input content type, default text/plain.
        /// </summary>
        public string? InputContentType { get; set; } = null;

        /// <summary>
        /// Per-run parameter overrides allowed by the deployment.
        /// </summary>
        public Dictionary<string, string> Parameters { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Priority from -100 to 100; higher runs first.
        /// </summary>
        public int Priority { get; set; } = 0;

        /// <summary>
        /// Whether to wait for completion before responding.
        /// </summary>
        public bool Wait { get; set; } = false;

        /// <summary>
        /// Maximum seconds to wait (1 to 600).
        /// </summary>
        public int WaitSeconds { get; set; } = 60;

        /// <summary>
        /// When waiting, whether the run is cancelled if the client disconnects before it finishes. Null means true
        /// (the default for waiting calls); false keeps the run going after a disconnect so it can be read later. The
        /// query parameter cancelOnDisconnect overrides this value. Ignored when not waiting.
        /// </summary>
        public bool? CancelOnDisconnect { get; set; } = null;

        /// <summary>
        /// Conversation to continue: the run becomes the conversation's next turn and resumes the harness session the
        /// earlier turns built. Must be a conversation of the same agent. A turn sent while the previous turn is
        /// unfinished fails with 409 ConversationBusy. Null runs outside a conversation unless startConversation is set.
        /// </summary>
        public string? ConversationId { get; set; } = null;

        /// <summary>
        /// Start a new conversation with this run as its first turn; the run's conversationId names it. Ignored when
        /// conversationId is set. Default false.
        /// </summary>
        public bool StartConversation { get; set; } = false;
    }
}
