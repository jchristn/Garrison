namespace Garrison.Server.WebSockets
{
    /// <summary>
    /// Message sent by a WebSocket client.
    /// </summary>
    public class ClientMessage
    {
        /// <summary>
        /// Message type: auth, subscribe, unsubscribe, or ping.
        /// </summary>
        public string Type { get; set; } = "ping";

        /// <summary>
        /// Session token for auth messages.
        /// </summary>
        public string? Token { get; set; } = null;

        /// <summary>
        /// Channel for subscribe and unsubscribe: runs, run:{id}, or nodes.
        /// </summary>
        public string? Channel { get; set; } = null;
    }
}
