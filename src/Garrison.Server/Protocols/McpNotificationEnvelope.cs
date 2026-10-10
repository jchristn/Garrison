namespace Garrison.Server.Protocols
{
    /// <summary>
    /// A JSON-RPC notification without params (notifications/initialized on replay).
    /// </summary>
    public class McpNotificationEnvelope
    {
        /// <summary>
        /// JSON-RPC version.
        /// </summary>
        public string Jsonrpc { get; set; } = "2.0";

        /// <summary>
        /// Method.
        /// </summary>
        public string Method { get; set; } = "notifications/initialized";
    }
}
