namespace Garrison.Server.Protocols
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// The identifier and method of an A2A JSON-RPC request, read before the method's typed parameters.
    /// </summary>
    public class A2AJsonRpcHead
    {
        #region Public-Members

        /// <summary>
        /// Request identifier: a whole number, a string, or null for a notification.
        /// </summary>
        [JsonPropertyName("id")]
        [JsonConverter(typeof(JsonRpcIdConverter))]
        public object? Id { get; set; } = null;

        /// <summary>
        /// Method name, for example SendMessage.
        /// </summary>
        [JsonPropertyName("method")]
        public string? Method { get; set; } = null;

        #endregion
    }
}
