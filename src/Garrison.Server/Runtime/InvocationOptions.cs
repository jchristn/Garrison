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
    }
}
