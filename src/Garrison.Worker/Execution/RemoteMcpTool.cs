namespace Garrison.Worker.Execution
{
    using System.Text.Json.Serialization;
    using System;
    /// <summary>Minimal typed MCP tool descriptor used by remote health checks.</summary>
    public class RemoteMcpTool
    {
        /// <summary>Tool name.</summary>
        [JsonPropertyName("name")]
        public string Name { get; set; } = String.Empty;
    }
}
