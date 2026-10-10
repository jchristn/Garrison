namespace Garrison.Sdk.Http
{
    using System;

    /// <summary>
    /// One server-sent event.
    /// </summary>
    public class SseMessage
    {
        /// <summary>
        /// Event name, or null for unnamed events.
        /// </summary>
        public string? Event { get; set; } = null;

        /// <summary>
        /// Event identifier.
        /// </summary>
        public string? Id { get; set; } = null;

        /// <summary>
        /// Data (multi-line data joined with newlines).
        /// </summary>
        public string Data { get; set; } = String.Empty;
    }
}
