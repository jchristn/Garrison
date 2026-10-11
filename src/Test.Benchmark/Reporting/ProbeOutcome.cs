namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// The outcome of one probe repeat in one arm.
    /// </summary>
    public class ProbeOutcome
    {
        /// <summary>
        /// Corpus identifier.
        /// </summary>
        public string Corpus { get; set; } = String.Empty;

        /// <summary>
        /// Probe identifier.
        /// </summary>
        public string ProbeId { get; set; } = String.Empty;

        /// <summary>
        /// Repeat index, from 0.
        /// </summary>
        public int Repeat { get; set; }

        /// <summary>
        /// Arm.
        /// </summary>
        public string Arm { get; set; } = String.Empty;

        /// <summary>
        /// Probe type.
        /// </summary>
        public string Type { get; set; } = String.Empty;

        /// <summary>
        /// Probe category.
        /// </summary>
        public string Category { get; set; } = String.Empty;

        /// <summary>
        /// Whether the probe is negative.
        /// </summary>
        public bool Negative { get; set; }

        /// <summary>
        /// Whether every expectation held.
        /// </summary>
        public bool Passed { get; set; }

        /// <summary>
        /// 1 when passed, otherwise 0.
        /// </summary>
        public double Score { get; set; }

        /// <summary>
        /// True when the probe could not be carried out (transport error or an unexpected 5xx).
        /// </summary>
        public bool Errored { get; set; }

        /// <summary>
        /// Expectations that did not hold, or the error.
        /// </summary>
        public List<string> Failures { get; set; } = new List<string>();

        /// <summary>
        /// What was observed: status, outcome, HTTP status, error code, and a result excerpt.
        /// </summary>
        public string? Observed { get; set; }

        /// <summary>
        /// Runs the probe created.
        /// </summary>
        public List<string> RunIds { get; set; } = new List<string>();

        /// <summary>
        /// Nodes that ran them.
        /// </summary>
        public List<string> Nodes { get; set; } = new List<string>();

        /// <summary>
        /// Client latency of the probe's main operation (ms).
        /// </summary>
        public double? LatencyMs { get; set; }

        /// <summary>
        /// Timing values (ms) by name for this outcome.
        /// </summary>
        public SortedDictionary<string, double> Timings { get; set; } = new SortedDictionary<string, double>(StringComparer.Ordinal);
    }
}
