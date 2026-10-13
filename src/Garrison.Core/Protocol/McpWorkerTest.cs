namespace Garrison.Core.Protocol
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Compilation;

    /// <summary>Single-use stdio diagnostic delivered only to its selected worker; credentials are never persisted in the queue.</summary>
    public class McpWorkerTest
    {
        /// <summary>Transient diagnostic identifier.</summary>
        public string Id { get; set; } = String.Empty;
        /// <summary>Executable, passed directly without a shell.</summary>
        public string Command { get; set; } = String.Empty;
        /// <summary>Resolved argument list.</summary>
        public List<string> Arguments { get; set; } = new List<string>();
        /// <summary>Resolved environment; may contain secrets and must never be logged.</summary>
        public List<ExecutionEnvironmentVariable> Environment { get; set; } = new List<ExecutionEnvironmentVariable>();
        /// <summary>Tool names required by the operator.</summary>
        public List<string> RequiredTools { get; set; } = new List<string>();
        /// <summary>Protocol timeout. Default 15000 ms; range 1000 to 120000 ms.</summary>
        public int TimeoutMs { get { return _TimeoutMs; } set { _TimeoutMs = Math.Clamp(value, 1000, 120000); } }
        /// <summary>Absolute queue/test expiration; expired assignments do not start.</summary>
        public DateTime ExpiresUtc { get; set; } = DateTime.UtcNow.AddMinutes(1);
        private int _TimeoutMs = 15000;
    }
}
