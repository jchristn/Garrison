namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json;
    using System.Text.Json.Serialization;

    /// <summary>
    /// Outgoing JSON-RPC response to a request the harness sent: either <see cref="Result"/> or <see cref="Error"/>.
    /// </summary>
    public class JsonRpcResponse
    {
        #region Public-Members

        /// <summary>
        /// Identifier of the request being answered, echoed as received (number or string).
        /// </summary>
        [JsonPropertyName("id")]
        public JsonElement Id { get; set; } = default;

        /// <summary>
        /// Result (a typed object serialized as JSON), or null for an error response.
        /// </summary>
        [JsonPropertyName("result")]
        public object? Result { get; set; } = null;

        /// <summary>
        /// Error, or null for a successful response.
        /// </summary>
        [JsonPropertyName("error")]
        public JsonRpcError? Error { get; set; } = null;

        #endregion
    }
}
