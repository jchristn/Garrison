namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// Summary of one arm (configuration) of a run.
    /// </summary>
    public class ArmSummary
    {
        /// <summary>
        /// Arm name, for example garrison or direct.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// What the arm is.
        /// </summary>
        public string? Description { get; set; }

        /// <summary>
        /// Probe outcomes scored (repeats included).
        /// </summary>
        public int Probes { get; set; }

        /// <summary>
        /// Outcomes that passed.
        /// </summary>
        public int Passed { get; set; }

        /// <summary>
        /// Outcomes that errored (transport or unexpected server error); they score 0 and stay in the denominator.
        /// </summary>
        public int Errors { get; set; }

        /// <summary>
        /// Pass rate with its 95% bootstrap interval.
        /// </summary>
        public ConfidenceInterval? PassRate { get; set; }

        /// <summary>
        /// Client latency of successful outcomes (ms).
        /// </summary>
        public LatencyStatistics? Latency { get; set; }

        /// <summary>
        /// Further timing distributions by name (queueMs, executionMs, overheadMs, eventPersistMs, streamMs, and so on).
        /// </summary>
        public SortedDictionary<string, LatencyStatistics> Timings { get; set; } = new SortedDictionary<string, LatencyStatistics>(StringComparer.Ordinal);

        /// <summary>
        /// Pass rate by probe type.
        /// </summary>
        public List<GroupSummary> ByType { get; set; } = new List<GroupSummary>();

        /// <summary>
        /// Pass rate by probe category.
        /// </summary>
        public List<GroupSummary> ByCategory { get; set; } = new List<GroupSummary>();
    }
}
