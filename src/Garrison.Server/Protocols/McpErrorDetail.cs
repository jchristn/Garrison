namespace Garrison.Server.Protocols
{
    /// <summary>
    /// A JSON-RPC error object.
    /// </summary>
    public class McpErrorDetail
    {
        /// <summary>
        /// Error code.
        /// </summary>
        public int Code { get; set; } = 0;

        /// <summary>
        /// Message.
        /// </summary>
        public string? Message { get; set; } = null;
    }
}
