namespace Garrison.Harnesses.Preflight
{
    using System;
    using System.Text.Json;
    using System.Text.Json.Serialization;

    /// <summary>A listed tool: its name, description, and input schema (kept as raw JSON text, never navigated).</summary>
    public class McpProbeTool
    {
        /// <summary>Advertised tool name.</summary>
        [JsonPropertyName("name")]
        public string Name { get; set; } = String.Empty;

        /// <summary>Advertised description, or null.</summary>
        [JsonPropertyName("description")]
        public string? Description { get; set; } = null;

        /// <summary>Advertised input JSON Schema, or null. Copied as raw text for the capability catalog (AD4.3).</summary>
        [JsonPropertyName("inputSchema")]
        public JsonElement? InputSchema { get; set; } = null;
    }
}
