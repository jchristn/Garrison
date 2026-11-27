namespace Test.Shared.Infrastructure
{
    using System;

    /// <summary>
    /// The parts of an A2A JSON-RPC reply a test reads: the error, when there is one.
    /// </summary>
    public class A2ARpcReply
    {
        /// <summary>
        /// The JSON-RPC error, or null when the call succeeded.
        /// </summary>
        public A2ARpcReplyError? Error { get; set; } = null;
    }
}
