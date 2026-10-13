namespace Garrison.Core.Models
{
    using System;
    using Garrison.Core.Helpers;
    using Garrison.Core.Responses;

    /// <summary>Transient worker diagnostic queue entry. Contains configuration references, never command/environment credentials.</summary>
    public class McpTestQueueEntry
    {
        /// <summary>Diagnostic identifier.</summary>
        public string Id { get; set; } = IdGenerator.New(Garrison.Core.Constants.McpTestIdPrefix);
        /// <summary>Owning tenant.</summary>
        public string TenantId { get; set; } = String.Empty;
        /// <summary>MCP configuration being tested.</summary>
        public string ServerId { get; set; } = String.Empty;
        /// <summary>Selected worker.</summary>
        public string NodeId { get; set; } = String.Empty;
        /// <summary>Worker registration snapshot; re-registration fences old work.</summary>
        public DateTime NodeRegisteredUtc { get; set; } = DateTime.MinValue;
        /// <summary>Configuration revision snapshot.</summary>
        public DateTime ServerUpdatedUtc { get; set; } = DateTime.MinValue;
        /// <summary>Protocol timeout for this diagnostic.</summary>
        public int TimeoutMs { get; set; } = 15000;
        /// <summary>Queue/test deadline.</summary>
        public DateTime ExpiresUtc { get; set; } = DateTime.UtcNow.AddMinutes(1);
        /// <summary>Whether a worker claimed this test.</summary>
        public bool Started { get; set; } = false;
        /// <summary>Whether the worker reported completion.</summary>
        public bool Finished { get; set; } = false;
        /// <summary>Typed outcome, with tool names stored in child rows.</summary>
        public McpServerTestResponse Result { get; set; } = new McpServerTestResponse();
    }
}
