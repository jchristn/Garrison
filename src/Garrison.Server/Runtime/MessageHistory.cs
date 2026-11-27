namespace Garrison.Server.Runtime
{
    using System;

    /// <summary>
    /// Result of garrison_read_thread (AA12.7): earlier messages the run's agent sent or received, rendered through the
    /// message-history template so their text arrives framed as data. Reading changes nothing. Not thread-safe.
    /// </summary>
    public class MessageHistory
    {
        /// <summary>
        /// The thread read, or null when the call listed the agent's recent messages across threads.
        /// </summary>
        public string? ThreadId { get; set; } = null;

        /// <summary>
        /// Number of messages in <see cref="Text"/>.
        /// </summary>
        public int Count { get; set; } = 0;

        /// <summary>
        /// Whether more messages matched than are shown.
        /// </summary>
        public bool More { get; set; } = false;

        /// <summary>
        /// The messages, oldest first, framed as data between lines that carry a random marker.
        /// </summary>
        public string Text { get; set; } = String.Empty;
    }
}
