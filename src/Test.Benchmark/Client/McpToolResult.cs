namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Result of an MCP tools/call.
    /// </summary>
    public class McpToolResult
    {
        /// <summary>
        /// Content blocks.
        /// </summary>
        public List<McpContent> Content { get; set; } = new List<McpContent>();

        /// <summary>
        /// Whether the tool reported an error; the text then starts with its code.
        /// </summary>
        public bool IsError { get; set; } = false;
    }
}
