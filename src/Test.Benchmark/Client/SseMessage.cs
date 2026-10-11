namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One server-sent event message read from a run event stream.
    /// </summary>
    public class SseMessage
    {
        /// <summary>
        /// SSE id (the run event sequence for run.event).
        /// </summary>
        public string? Id { get; set; }

        /// <summary>
        /// SSE event name, for example run.event or run.completed.
        /// </summary>
        public string Event { get; set; } = String.Empty;

        /// <summary>
        /// SSE data (JSON).
        /// </summary>
        public string Data { get; set; } = String.Empty;

        /// <summary>
        /// When the harness read the message (UTC).
        /// </summary>
        public DateTime ReceivedUtc { get; set; }
    }
}
