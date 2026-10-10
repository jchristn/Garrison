namespace Garrison.Server.Protocols
{
    using System.Text.Json;

    /// <summary>
    /// The identifier and method of a JSON-RPC request, read so an error can echo the identifier.
    /// </summary>
    public class McpRequestIdEnvelope
    {
        /// <summary>
        /// Request identifier (a string or number), echoed verbatim; null for notifications.
        /// </summary>
        public JsonElement? Id { get; set; } = null;

        /// <summary>
        /// Method.
        /// </summary>
        public string? Method { get; set; } = null;
    }
}
