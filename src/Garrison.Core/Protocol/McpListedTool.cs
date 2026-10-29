namespace Garrison.Core.Protocol
{
    using System;
    using System.Text.Json;
    using System.Text.Json.Serialization;

    /// <summary>
    /// One tool in an MCP tools/list result, as the control plane reads it from HTTP MCP servers.
    /// </summary>
    public class McpListedTool
    {
        /// <summary>
        /// Tool name.
        /// </summary>
        [JsonPropertyName("name")]
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Description, or null.
        /// </summary>
        [JsonPropertyName("description")]
        public string? Description { get; set; } = null;

        /// <summary>
        /// Input JSON Schema, kept as raw JSON and never navigated, or null.
        /// </summary>
        [JsonPropertyName("inputSchema")]
        public JsonElement? InputSchema { get; set; } = null;
    }
}
