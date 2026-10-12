namespace Garrison.Harnesses.AppServer
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// JSON-RPC error object, read from an error response or written in one.
    /// </summary>
    public class JsonRpcError
    {
        #region Public-Members

        /// <summary>
        /// Error code. -32601 means the method is not supported; -32603 is an internal error.
        /// </summary>
        [JsonPropertyName("code")]
        public long Code { get; set; } = 0;

        /// <summary>
        /// Error message.
        /// </summary>
        [JsonPropertyName("message")]
        public string Message
        {
            get
            {
                return _Message;
            }
            set
            {
                _Message = value ?? String.Empty;
            }
        }

        #endregion

        #region Private-Members

        private string _Message = String.Empty;

        #endregion
    }
}
