namespace Garrison.Harnesses.AppServer
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// Outgoing JSON-RPC request or notification. A null <see cref="Id"/> makes it a notification.
    /// </summary>
    public class JsonRpcRequest
    {
        #region Public-Members

        /// <summary>
        /// Request identifier, or null for a notification.
        /// </summary>
        [JsonPropertyName("id")]
        public long? Id { get; set; } = null;

        /// <summary>
        /// Method name.
        /// </summary>
        [JsonPropertyName("method")]
        public string Method
        {
            get
            {
                return _Method;
            }
            set
            {
                _Method = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Parameters (a typed object serialized as JSON), or null to omit them.
        /// </summary>
        [JsonPropertyName("params")]
        public object? Params { get; set; } = null;

        #endregion

        #region Private-Members

        private string _Method = String.Empty;

        #endregion
    }
}
