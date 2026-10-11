namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One normalized run event (REST_API.md, RunEvent).
    /// </summary>
    public class RunEvent
    {
        /// <summary>
        /// Identifier.
        /// </summary>
        public string? Id { get; set; }

        /// <summary>
        /// Run identifier.
        /// </summary>
        public string? RunId { get; set; }

        /// <summary>
        /// Per-run sequence number.
        /// </summary>
        public long Sequence { get; set; }

        /// <summary>
        /// Event type.
        /// </summary>
        public string? EventType { get; set; }

        /// <summary>
        /// Event time on the worker (UTC).
        /// </summary>
        public DateTime TimestampUtc { get; set; }

        /// <summary>
        /// Stable machine code for text Garrison writes itself.
        /// </summary>
        public string? Code { get; set; }

        /// <summary>
        /// Text content.
        /// </summary>
        public string? Text { get; set; }

        /// <summary>
        /// Persisted on the server (UTC).
        /// </summary>
        public DateTime CreatedUtc { get; set; }
    }
}
