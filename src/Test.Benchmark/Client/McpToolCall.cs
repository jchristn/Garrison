namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// Params of an MCP tools/call request.
    /// </summary>
    public class McpToolCall
    {
        /// <summary>
        /// Tool name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Tool arguments, serialized as an object.
        /// </summary>
        public object? Arguments { get; set; } = null;
    }
}
