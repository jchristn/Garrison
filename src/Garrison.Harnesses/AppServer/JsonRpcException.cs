namespace Garrison.Harnesses.AppServer
{
    using System;

    /// <summary>
    /// Thrown when a JSON-RPC peer answers a request with an error, or when a request handler wants to answer the
    /// peer with one.
    /// </summary>
    public class JsonRpcException : Exception
    {
        #region Public-Members

        /// <summary>
        /// JSON-RPC error code.
        /// </summary>
        public long Code { get; } = 0;

        /// <summary>
        /// Method of the request that failed, or null when unknown.
        /// </summary>
        public string? Method { get; } = null;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="code">JSON-RPC error code.</param>
        /// <param name="message">Error message from the peer, or the message to send to it.</param>
        /// <param name="method">Method of the failed request, or null.</param>
        public JsonRpcException(long code, string message, string? method = null)
            : base(message)
        {
            Code = code;
            Method = method;
        }

        #endregion
    }
}
