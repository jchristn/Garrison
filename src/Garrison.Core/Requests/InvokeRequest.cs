namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

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
    }
}
