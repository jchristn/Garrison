namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// A JSON-RPC error.
    /// </summary>
    public class McpError
    {
        /// <summary>
        /// JSON-RPC error code.
        /// </summary>
        public int Code { get; set; } = 0;

        /// <summary>
        /// Message.
        /// </summary>
        public string Message { get; set; } = String.Empty;
    }
}
