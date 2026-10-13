namespace Garrison.ProviderHarness
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;

    /// <summary>Typed provider MCP protocol contract.</summary>
    public class ProviderToolInfo
    {
        /// <summary>Server tool name.</summary>
        [JsonPropertyName("name")]
        public string Name { get; set; } = String.Empty;
        /// <summary>Tool description supplied by its server.</summary>
        [JsonPropertyName("description")]
        public string? Description { get; set; } = null;
        /// <summary>Dynamic JSON Schema for its arguments.</summary>
        [JsonPropertyName("inputSchema")]
        public Dictionary<string, object> InputSchema { get; set; } = new Dictionary<string, object>();
    }
}
