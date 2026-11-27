namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// Outcome of one MCP tools/call as the harness saw it.
    /// </summary>
    public class McpCallResult
    {
        /// <summary>
        /// True when the call returned a tool result that is not an error.
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// True when the tool answered with isError; Text then starts with the error code.
        /// </summary>
        public bool ToolError { get; set; }

        /// <summary>
        /// Text of the first text block, or the transport or JSON-RPC error.
        /// </summary>
        public string Text { get; set; } = String.Empty;

        /// <summary>
        /// HTTP status, or 0 when no response arrived.
        /// </summary>
        public int StatusCode { get; set; }

        /// <summary>
        /// Client latency, request sent to response read (ms).
        /// </summary>
        public double ElapsedMs { get; set; }
    }
}
