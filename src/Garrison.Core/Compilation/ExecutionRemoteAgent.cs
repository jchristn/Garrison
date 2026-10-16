namespace Garrison.Core.Compilation
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>Resolved remote call contract. Credentials exist only in the fenced lease response, never in run records.</summary>
    public class ExecutionRemoteAgent
    {
        /// <summary>Remote protocol.</summary>
        public RemoteProtocolEnum Protocol { get; set; }
        /// <summary>Absolute endpoint URL; redirects are never followed.</summary>
        public string EndpointUrl { get; set; } = String.Empty;
        /// <summary>MCP tool name; null for A2A.</summary>
        public string? ToolName { get; set; }
        /// <summary>Optional bearer token resolved from a secret in this run's tenant.</summary>
        public string? BearerToken { get; set; }
        /// <summary>Input supplied by the caller. MCP input must be a JSON object.</summary>
        public string Input { get; set; } = String.Empty;
        /// <summary>Registration expiry UTC, or null for a registration without a TTL.</summary>
        public DateTime? ExpiresUtc { get; set; }
    }
}
