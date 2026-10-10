namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Run status and result returned by MCP tools.
    /// </summary>
    public class McpRunSummary
    {
        /// <summary>
        /// Run identifier.
        /// </summary>
        public string RunId { get; set; } = String.Empty;

        /// <summary>
        /// Agent name.
        /// </summary>
        public string Agent { get; set; } = String.Empty;

        /// <summary>
        /// Status.
        /// </summary>
        public string Status { get; set; } = String.Empty;

        /// <summary>
        /// Outcome code.
        /// </summary>
        public string Outcome { get; set; } = String.Empty;

        /// <summary>
        /// Whether the run finished.
        /// </summary>
        public bool Finished { get; set; } = false;

        /// <summary>
        /// Result text when finished.
        /// </summary>
        public string? Result { get; set; } = null;

        /// <summary>
        /// Structured output when the agent declares an output schema.
        /// </summary>
        public string? StructuredOutputJson { get; set; } = null;

        /// <summary>
        /// Error message when failed.
        /// </summary>
        public string? Error { get; set; } = null;

        /// <summary>
        /// Input tokens.
        /// </summary>
        public long InputTokens { get; set; } = 0;

        /// <summary>
        /// Output tokens.
        /// </summary>
        public long OutputTokens { get; set; } = 0;

        /// <summary>
        /// Cost in USD.
        /// </summary>
        public double? CostUsd { get; set; } = null;

        /// <summary>
        /// Created (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Completed (UTC).
        /// </summary>
        public DateTime? CompletedUtc { get; set; } = null;
    }
}
