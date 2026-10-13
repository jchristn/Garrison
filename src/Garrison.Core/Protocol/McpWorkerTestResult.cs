namespace Garrison.Core.Protocol
{
    using System;
    using Garrison.Core.Responses;

    /// <summary>Idempotent completion sent by the authenticated worker heartbeat.</summary>
    public class McpWorkerTestResult
    {
        /// <summary>Diagnostic identifier.</summary>
        public string Id { get; set; } = String.Empty;
        /// <summary>Bounded safe outcome without command, environment, or raw output.</summary>
        public McpServerTestResponse Result { get; set; } = new McpServerTestResponse();
    }
}
