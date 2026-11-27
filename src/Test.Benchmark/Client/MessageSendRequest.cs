namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// Body of POST .../messages.
    /// </summary>
    public class MessageSendRequest
    {
        /// <summary>
        /// Recipient agent identifier or name.
        /// </summary>
        public string Recipient { get; set; } = String.Empty;

        /// <summary>
        /// Subject, 1 to 256 characters.
        /// </summary>
        public string Subject { get; set; } = String.Empty;

        /// <summary>
        /// Body text, or null.
        /// </summary>
        public string? Body { get; set; } = null;

        /// <summary>
        /// Normal or Urgent.
        /// </summary>
        public string Urgency { get; set; } = "Normal";
    }
}
