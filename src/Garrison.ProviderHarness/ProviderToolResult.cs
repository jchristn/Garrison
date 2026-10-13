namespace Garrison.ProviderHarness
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;

    /// <summary>Typed provider MCP protocol contract.</summary>
    public class ProviderToolResult
    {
        /// <summary>Whether the tool failed.</summary>
        [JsonPropertyName("isError")]
        public bool IsError { get; set; } = false;
        /// <summary>Ordered text content.</summary>
        [JsonPropertyName("content")]
        public List<ProviderToolContent> Content { get; set; } = new List<ProviderToolContent>();
        /// <summary>Dynamic structured content, when present.</summary>
        [JsonPropertyName("structuredContent")]
        public Dictionary<string, object?>? StructuredContent { get; set; } = null;
    }
}
