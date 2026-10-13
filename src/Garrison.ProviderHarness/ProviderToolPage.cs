namespace Garrison.ProviderHarness
{
    using System;
    using System.Collections.Generic;
    using System.Text.Json.Serialization;

    /// <summary>Typed provider MCP protocol contract.</summary>
    public class ProviderToolPage
    {
        /// <summary>Advertised tools.</summary>
        [JsonPropertyName("tools")]
        public List<ProviderToolInfo> Tools { get; set; } = new List<ProviderToolInfo>();
        /// <summary>Pagination cursor, or null at the end.</summary>
        [JsonPropertyName("nextCursor")]
        public string? NextCursor { get; set; } = null;
    }
}
