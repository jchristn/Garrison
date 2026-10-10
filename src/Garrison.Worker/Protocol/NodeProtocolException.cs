namespace Garrison.Worker.Protocol
{
    using System;

    /// <summary>
    /// Raised when a node protocol call fails with a non-success status or a transport error.
    /// </summary>
    public class NodeProtocolException : Exception
    {
        /// <summary>
        /// HTTP status code, or 0 for transport errors.
        /// </summary>
        public int StatusCode { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="statusCode">Status code.</param>
        /// <param name="message">Message.</param>
        public NodeProtocolException(int statusCode, string message) : base(message)
        {
            StatusCode = statusCode;
        }

        /// <summary>
        /// Instantiate with an inner exception.
        /// </summary>
        /// <param name="statusCode">Status code.</param>
        /// <param name="message">Message.</param>
        /// <param name="inner">Inner exception.</param>
        public NodeProtocolException(int statusCode, string message, Exception inner) : base(message, inner)
        {
            StatusCode = statusCode;
        }
    }
}
