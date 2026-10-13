namespace Garrison.ProviderHarness
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;

    /// <summary>Typed provider MCP protocol contract.</summary>
    public class ProviderToolContent
    {
        /// <summary>MCP content kind.</summary>
        [JsonPropertyName("type")]
        public string Type { get; set; } = String.Empty;
        /// <summary>Text content, when present.</summary>
        [JsonPropertyName("text")]
        public string? Text { get; set; } = null;
    }
}
