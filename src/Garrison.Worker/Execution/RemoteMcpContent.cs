namespace Garrison.Worker.Execution
{
    using System.Text.Json.Serialization;
    /// <summary>Typed text-bearing MCP content block. Other block types remain in structured output.</summary>
    public class RemoteMcpContent
    {
        /// <summary>Content type.</summary>
        [JsonPropertyName("type")]
        public string? Type { get; set; }
        /// <summary>Text content.</summary>
        [JsonPropertyName("text")]
        public string? Text { get; set; }
    }
}
