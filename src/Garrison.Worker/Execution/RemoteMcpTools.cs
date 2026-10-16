namespace Garrison.Worker.Execution
{
    using System.Text.Json.Serialization;
    using System.Collections.Generic;
    /// <summary>Typed MCP tools/list response.</summary>
    public class RemoteMcpTools
    {
        /// <summary>Tools in this page.</summary>
        [JsonPropertyName("tools")]
        public List<RemoteMcpTool> Tools { get; set; } = new List<RemoteMcpTool>();
        /// <summary>Next page cursor, null at the end.</summary>
        [JsonPropertyName("nextCursor")]
        public string? NextCursor { get; set; }
    }
}
