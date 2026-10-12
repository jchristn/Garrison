namespace Garrison.Harnesses.AppServer
{
    using System.Text.Json;
    using System.Text.Json.Serialization;

    /// <summary>
    /// One JSON-RPC message read from a harness: a request (id and method), a notification (method only), or a
    /// response (id with result or error). The envelope is typed; <see cref="Params"/> and <see cref="Result"/> stay
    /// raw until a caller deserializes them into the typed class for the method. The <c>jsonrpc</c> version member is
    /// optional on this protocol and ignored.
    /// </summary>
    public class JsonRpcMessage
    {
        #region Public-Members

        /// <summary>
        /// Request identifier (a number or a string), or null for a notification.
        /// </summary>
        [JsonPropertyName("id")]
        public JsonElement? Id { get; set; } = null;

        /// <summary>
        /// Method name, or null for a response.
        /// </summary>
        [JsonPropertyName("method")]
        public string? Method { get; set; } = null;

        /// <summary>
        /// Request or notification parameters, or null.
        /// </summary>
        [JsonPropertyName("params")]
        public JsonElement? Params { get; set; } = null;

        /// <summary>
        /// Successful response result, or null.
        /// </summary>
        [JsonPropertyName("result")]
        public JsonElement? Result { get; set; } = null;

        /// <summary>
        /// Error response, or null.
        /// </summary>
        [JsonPropertyName("error")]
        public JsonRpcError? Error { get; set; } = null;

        /// <summary>
        /// Whether the message is a request the peer expects an answer to (identifier and method).
        /// </summary>
        [JsonIgnore]
        public bool IsRequest
        {
            get
            {
                return Id.HasValue && Method != null;
            }
        }

        /// <summary>
        /// Whether the message is a notification (method, no identifier).
        /// </summary>
        [JsonIgnore]
        public bool IsNotification
        {
            get
            {
                return !Id.HasValue && Method != null;
            }
        }

        /// <summary>
        /// Whether the message is a response to one of our requests (identifier, no method).
        /// </summary>
        [JsonIgnore]
        public bool IsResponse
        {
            get
            {
                return Id.HasValue && Method == null;
            }
        }

        #endregion
    }
}
