namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One client-visible request outcome during a resilience scenario.
    /// </summary>
    public class ClientEvent
    {
        /// <summary>
        /// When the request started, from the scenario clock (ms).
        /// </summary>
        public double AtMs { get; set; }

        /// <summary>
        /// True for a creation, false for a read.
        /// </summary>
        public bool Create { get; set; }

        /// <summary>
        /// Whether it succeeded.
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// ok, or the HTTP status and code, or the transport error.
        /// </summary>
        public string Kind { get; set; } = String.Empty;

        /// <summary>
        /// True for an error without a JSON error body.
        /// </summary>
        public bool Unclean { get; set; }
    }
}
