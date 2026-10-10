namespace Garrison.Server.Protocols
{
    using System;

    /// <summary>
    /// A JSON-RPC initialize request: read from a client's handshake and written when a replica replays it.
    /// </summary>
    public class McpInitializeEnvelope
    {
        /// <summary>
        /// JSON-RPC version.
        /// </summary>
        public string Jsonrpc { get; set; } = "2.0";

        /// <summary>
        /// Request identifier: a string or a number in client requests, a string in replays. Never interpreted.
        /// </summary>
        public object? Id { get; set; } = null;

        /// <summary>
        /// Method.
        /// </summary>
        public string? Method { get; set; } = null;

        /// <summary>
        /// Params.
        /// </summary>
        public McpInitializeParams? Params { get; set; } = null;
    }
}
