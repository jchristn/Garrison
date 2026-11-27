namespace Garrison.Server.Protocols
{
    using System;

    /// <summary>
    /// Raised when an A2A caller is not permitted; carries the JSON-RPC error code to return and, when the denial has a
    /// meaning of its own, the machine-readable code REST sends for the same refusal.
    /// </summary>
    public class A2AAccessException : Exception
    {
        /// <summary>
        /// JSON-RPC error code.
        /// </summary>
        public int Code { get; }

        /// <summary>
        /// Machine-readable refusal code sent as the JSON-RPC error's <c>data.code</c>, such as AuthorizationDenied,
        /// ShadowRunRefused, or EvalRunRefused (SR-29). Null sends no data.
        /// </summary>
        public string? ErrorCode { get; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="code">JSON-RPC error code.</param>
        /// <param name="message">Message.</param>
        public A2AAccessException(int code, string message) : base(message)
        {
            Code = code;
        }

        /// <summary>
        /// Instantiate with a machine-readable refusal code.
        /// </summary>
        /// <param name="code">JSON-RPC error code.</param>
        /// <param name="errorCode">Machine-readable refusal code for <c>data.code</c>; null or empty sends no data.</param>
        /// <param name="message">Message.</param>
        public A2AAccessException(int code, string? errorCode, string message) : base(message)
        {
            Code = code;
            ErrorCode = String.IsNullOrEmpty(errorCode) ? null : errorCode;
        }
    }
}
