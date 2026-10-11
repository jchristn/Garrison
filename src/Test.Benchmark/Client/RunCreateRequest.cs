namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Request to create a run (REST_API.md, RunCreateRequest).
    /// </summary>
    public class RunCreateRequest
    {
        /// <summary>
        /// Agent name.
        /// </summary>
        public string? AgentName { get; set; }

        /// <summary>
        /// Specific deployment, or null for a weighted pick.
        /// </summary>
        public string? DeploymentId { get; set; }

        /// <summary>
        /// Input message.
        /// </summary>
        public string Input { get; set; } = String.Empty;

        /// <summary>
        /// Per-run parameter overrides.
        /// </summary>
        public Dictionary<string, string>? Parameters { get; set; }

        /// <summary>
        /// Priority from -100 to 100.
        /// </summary>
        public int Priority { get; set; }

        /// <summary>
        /// Whether the server waits for the run to finish before answering.
        /// </summary>
        public bool Wait { get; set; }

        /// <summary>
        /// Longest server-side wait in seconds (1 to 600).
        /// </summary>
        public int? WaitSeconds { get; set; }

        /// <summary>
        /// Whether a waiting call that loses its client cancels the run.
        /// </summary>
        public bool? CancelOnDisconnect { get; set; }
    }
}
