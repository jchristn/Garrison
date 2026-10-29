namespace Garrison.Core.Protocol
{
    using System.Collections.Generic;
    using System.Text.Json.Serialization;

    /// <summary>
    /// One page of an MCP tools/list result.
    /// </summary>
    public class McpToolsListResult
    {
        /// <summary>
        /// Tools on this page, or null when the server returned none.
        /// </summary>
        [JsonPropertyName("tools")]
        public List<McpListedTool>? Tools { get; set; } = null;

        /// <summary>
        /// Cursor of the next page, or null on the last page.
        /// </summary>
        [JsonPropertyName("nextCursor")]
        public string? NextCursor { get; set; } = null;
    }
}
