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
    }
}
