namespace Garrison.Core.Models
{
    using System.Text.Json.Serialization;

    /// <summary>Conservative MCP-compatible tool effect hints. Missing values do not establish replay safety.</summary>
    public class EffectToolMetadata
    {
        /// <summary>Whether the trusted tool implementation performs no mutations.</summary>
        [JsonPropertyName("readOnlyHint")]
        public bool? ReadOnlyHint { get; set; }
        /// <summary>Whether the operation can make destructive changes. True overrides optimistic hints.</summary>
        [JsonPropertyName("destructiveHint")]
        public bool? DestructiveHint { get; set; }
        /// <summary>Whether repeat execution has the same effect. Idempotence still requires a dispatch journal.</summary>
        [JsonPropertyName("idempotentHint")]
        public bool? IdempotentHint { get; set; }
    }
}
