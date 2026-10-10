namespace Garrison.Server.Protocols
{
    using System;

    /// <summary>
    /// Raised when an A2A caller is not permitted; carries the JSON-RPC error code to return.
    /// </summary>
    public class A2AAccessException : Exception
    {
        /// <summary>
        /// JSON-RPC error code.
        /// </summary>
        public int Code { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="code">JSON-RPC error code.</param>
        /// <param name="message">Message.</param>
        public A2AAccessException(int code, string message) : base(message)
        {
            Code = code;
        }
    }
}
