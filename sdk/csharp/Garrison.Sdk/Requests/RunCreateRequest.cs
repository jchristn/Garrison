namespace Garrison.Sdk.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

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
    }
}
