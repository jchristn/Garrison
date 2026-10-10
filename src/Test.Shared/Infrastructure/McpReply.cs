namespace Test.Shared.Infrastructure
{
    using System;

    /// <summary>
    /// A raw MCP HTTP reply.
    /// </summary>
    public class McpReply
    {
        /// <summary>
        /// HTTP status.
        /// </summary>
        public int Status { get; set; } = 0;

        /// <summary>
        /// MCP-Session-Id response header, or null.
        /// </summary>
        public string? SessionId { get; set; } = null;

        /// <summary>
        /// JSON-RPC body (the last JSON-RPC data line when the reply was a stream).
        /// </summary>
        public string Body { get; set; } = String.Empty;
    }
}
