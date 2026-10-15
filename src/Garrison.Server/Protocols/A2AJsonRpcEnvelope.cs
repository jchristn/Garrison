namespace Garrison.Server.Protocols
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// The typed parameters of an A2A JSON-RPC request for one method.
    /// </summary>
    /// <typeparam name="T">Parameter type of the method.</typeparam>
    public class A2AJsonRpcEnvelope<T> where T : class
    {
        #region Public-Members

        /// <summary>
        /// Parameters, or null when the request has none.
        /// </summary>
        [JsonPropertyName("params")]
        public T? Params { get; set; } = null;

        #endregion
    }
}
