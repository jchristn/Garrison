namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Server information for the dashboard.
    /// </summary>
    public class ServerInfoResponse
    {
        /// <summary>
        /// Product name.
        /// </summary>
        public string Product { get; set; } = "Garrison";

        /// <summary>
        /// Product version.
        /// </summary>
        public string Version { get; set; } = String.Empty;

        /// <summary>
        /// Node identifier.
        /// </summary>
        public string NodeId { get; set; } = String.Empty;

        /// <summary>
        /// Public REST base URL.
        /// </summary>
        public string RestUrl { get; set; } = String.Empty;

        /// <summary>
        /// Public MCP URL including the path, or null when disabled.
        /// </summary>
        public string? McpUrl { get; set; } = null;

        /// <summary>
        /// A2A base URL.
        /// </summary>
        [JsonPropertyName("a2aUrl")]
        public string A2AUrl { get; set; } = String.Empty;

        /// <summary>
        /// OpenAPI document URL.
        /// </summary>
        public string OpenApiUrl { get; set; } = String.Empty;

        /// <summary>
        /// Database provider.
        /// </summary>
        public string DatabaseType { get; set; } = String.Empty;

        /// <summary>
        /// Configured control-plane replicas.
        /// </summary>
        public int ExpectedReplicas { get; set; } = 1;

        /// <summary>
        /// Whether telemetry is active.
        /// </summary>
        public bool TelemetryEnabled { get; set; } = false;

        /// <summary>
        /// Whether request history capture is enabled.
        /// </summary>
        public bool RequestHistoryEnabled { get; set; } = true;

        /// <summary>
        /// Registered routes and tools in the operation scope map.
        /// </summary>
        public int RouteCount { get; set; } = 0;

        /// <summary>
        /// Repository URL.
        /// </summary>
        public string RepositoryUrl { get; set; } = String.Empty;

        /// <summary>
        /// Process start (UTC).
        /// </summary>
        public DateTime StartedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Enabled feature flags.
        /// </summary>
        public List<string> Features { get; set; } = new List<string>();
    }
}
