namespace Garrison.Harnesses.Preflight
{
    using System;
    using System.Text.Json.Serialization;
    using Voltaic.Core;

    /// <summary>Typed subset of a stdio MCP reply or server request. Unknown tool schema fields are ignored.</summary>
    public class McpProbeEnvelope
    {
        /// <summary>Integer or string JSON-RPC identifier.</summary>
        [JsonPropertyName("id")]
        [JsonConverter(typeof(McpProbeIdConverter))]
        public object? Id { get; set; } = null;
        /// <summary>Server request method, or null for responses.</summary>
        [JsonPropertyName("method")]
        public string? Method { get; set; } = null;
        /// <summary>Initialization or tools/list result.</summary>
        [JsonPropertyName("result")]
        public McpProbeResult? Result { get; set; } = null;
        /// <summary>Protocol error; its content is never included in operator diagnostics.</summary>
        [JsonPropertyName("error")]
        public JsonRpcError? Error { get; set; } = null;
    }
}
