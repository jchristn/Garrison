namespace Garrison.Server.Protocols
{
    using System.Text.Json;

    /// <summary>
    /// Parameters of an MCP notifications/cancelled message.
    /// </summary>
    public class McpCancelledParams
    {
        /// <summary>
        /// Identifier of the request being cancelled (a string or a number, kept as raw JSON).
        /// </summary>
        public JsonElement? RequestId { get; set; } = null;

        /// <summary>
        /// Optional reason.
        /// </summary>
        public string? Reason { get; set; } = null;
    }
}
