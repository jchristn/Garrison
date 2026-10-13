namespace Garrison.Harnesses.Preflight
{
    using System.Collections.Generic;
    using System.Text.Json.Serialization;

    /// <summary>Initialization version or paginated tool names returned by a diagnostic.</summary>
    public class McpProbeResult
    {
        /// <summary>Negotiated protocol version.</summary>
        [JsonPropertyName("protocolVersion")]
        public string? ProtocolVersion { get; set; } = null;
        /// <summary>Tools on this page, or null when no list was returned.</summary>
        [JsonPropertyName("tools")]
        public List<McpProbeTool>? Tools { get; set; } = null;
        /// <summary>Next page cursor, or null at the last page.</summary>
        [JsonPropertyName("nextCursor")]
        public string? NextCursor { get; set; } = null;
    }
}
