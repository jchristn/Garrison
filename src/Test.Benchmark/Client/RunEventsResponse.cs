namespace Garrison.Benchmark.Client
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// A page of run events.
    /// </summary>
    public class RunEventsResponse
    {
        /// <summary>
        /// Run identifier.
        /// </summary>
        public string? RunId { get; set; }

        /// <summary>
        /// Current run status.
        /// </summary>
        public string? Status { get; set; }

        /// <summary>
        /// Events in sequence order.
        /// </summary>
        public List<RunEvent> Events { get; set; } = new List<RunEvent>();

        /// <summary>
        /// Highest sequence returned.
        /// </summary>
        public long LastSequence { get; set; }

        /// <summary>
        /// Whether more events are immediately available.
        /// </summary>
        public bool HasMore { get; set; }
    }
}
