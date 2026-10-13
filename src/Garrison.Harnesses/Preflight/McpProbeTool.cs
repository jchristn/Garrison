namespace Garrison.Harnesses.Preflight
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>Tool name needed by connection diagnostics; arbitrary input schemas are not materialized.</summary>
    public class McpProbeTool
    {
        /// <summary>Advertised tool name.</summary>
        [JsonPropertyName("name")]
        public string Name { get; set; } = String.Empty;
    }
}
