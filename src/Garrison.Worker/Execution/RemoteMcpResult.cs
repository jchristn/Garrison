namespace Garrison.Worker.Execution
{
    using System.Text.Json.Serialization;
    using System.Collections.Generic;
    /// <summary>Typed MCP tool invocation response.</summary>
    public class RemoteMcpResult
    {
        /// <summary>Content blocks.</summary>
        [JsonPropertyName("content")]
        public List<RemoteMcpContent> Content { get; set; } = new List<RemoteMcpContent>();
        /// <summary>Remote tool reported an error.</summary>
        [JsonPropertyName("isError")]
        public bool IsError { get; set; }
        /// <summary>Schema-dependent structured content.</summary>
        [JsonPropertyName("structuredContent")]
        public object? StructuredContent { get; set; }
    }
}
