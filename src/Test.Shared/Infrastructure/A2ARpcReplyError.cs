namespace Test.Shared.Infrastructure
{
    using System;
    using Garrison.Server.Protocols;

    /// <summary>
    /// A JSON-RPC error in an A2A reply.
    /// </summary>
    public class A2ARpcReplyError
    {
        /// <summary>
        /// JSON-RPC error code, such as -32007 for a refusal.
        /// </summary>
        public int Code { get; set; } = 0;

        /// <summary>
        /// Error message.
        /// </summary>
        public string Message { get; set; } = String.Empty;

        /// <summary>
        /// Garrison's machine-readable error data, or null when the error carries none.
        /// </summary>
        public A2AErrorData? Data { get; set; } = null;
    }
}
