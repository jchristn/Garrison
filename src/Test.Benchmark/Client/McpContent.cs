namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// One content block of an MCP tool result.
    /// </summary>
    public class McpContent
    {
        /// <summary>
        /// Block type, for example text.
        /// </summary>
        public string Type { get; set; } = String.Empty;

        /// <summary>
        /// Text of a text block.
        /// </summary>
        public string? Text { get; set; } = null;
    }
}
