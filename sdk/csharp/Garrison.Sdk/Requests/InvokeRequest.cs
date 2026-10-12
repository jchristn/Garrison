namespace Garrison.Sdk.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Request to invoke an agent.
    /// </summary>
    public class InvokeRequest
    {
        /// <summary>
        /// Input message.
        /// </summary>
        public string Input { get; set; } = String.Empty;

        /// <summary>
        /// Input content type, default text/plain.
        /// </summary>
        public string? InputContentType { get; set; } = null;

        /// <summary>
        /// Specific deployment; null picks a weighted active deployment.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Per-run parameter overrides allowed by the deployment.
        /// </summary>
        public Dictionary<string, string> Parameters { get; set; } = new Dictionary<string, string>();

        /// <summary>
        /// Priority from -100 to 100.
        /// </summary>
        public int Priority { get; set; } = 0;

        /// <summary>
        /// Whether to wait for completion before responding.
        /// </summary>
        public bool Wait { get; set; } = true;

        /// <summary>
        /// Maximum seconds to wait (1 to 600).
        /// </summary>
        public int WaitSeconds { get; set; } = 60;

        /// <summary>
        /// When waiting, whether the run is cancelled if the connection drops before it finishes. Null means true (the
        /// server default for waiting calls); false keeps the run going so it can be read later.
        /// </summary>
        public bool? CancelOnDisconnect { get; set; } = null;

        /// <summary>
        /// Conversation to continue: the run becomes its next turn and the harness resumes the conversation's session.
        /// Null runs outside a conversation unless StartConversation is true. Fails with 409 ConversationBusy while the
        /// previous turn is unfinished (turns are refused, not queued) and 404 when the conversation does not exist.
        /// </summary>
        public string? ConversationId { get; set; } = null;

        /// <summary>
        /// Start a new conversation with this run as its first turn; the returned run's ConversationId names it. Ignored
        /// when ConversationId is set. Default false.
        /// </summary>
        public bool StartConversation { get; set; } = false;
    }
}
