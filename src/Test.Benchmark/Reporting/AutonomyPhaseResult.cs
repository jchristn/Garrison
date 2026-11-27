namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// One measured phase of an autonomy benchmark (AA12.4): a scheduler level (N mandates), a messaging phase (send or
    /// delivery), or one memory operation. Distributions are in milliseconds.
    /// </summary>
    public class AutonomyPhaseResult
    {
        /// <summary>
        /// Scenario: scheduler, messaging, or memory.
        /// </summary>
        public string Scenario { get; set; } = String.Empty;

        /// <summary>
        /// Phase name, unique in the report, for example n1000, send, urgent-delivery, or write.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Size of the phase: mandates for a scheduler level, messages or operations otherwise.
        /// </summary>
        public int Level { get; set; }

        /// <summary>
        /// Operations observed (ticks and pending wakes for a scheduler level).
        /// </summary>
        public int Operations { get; set; }

        /// <summary>
        /// Operations that succeeded.
        /// </summary>
        public int Succeeded { get; set; }

        /// <summary>
        /// Operations that failed (an error answer, a transport error, or a wrong result).
        /// </summary>
        public int Failed { get; set; }

        /// <summary>
        /// Values that are lower bounds because the operation had not finished when the window closed (a wake still
        /// due and unclaimed, a message still queued). They are included in the distributions at their lower bound.
        /// </summary>
        public int Censored { get; set; }

        /// <summary>
        /// Length of the measured window in seconds.
        /// </summary>
        public double WindowSeconds { get; set; }

        /// <summary>
        /// Succeeded operations per second over the window.
        /// </summary>
        public double Throughput { get; set; }

        /// <summary>
        /// Distributions by name (ms), for example tickLagMs or latencyMs.
        /// </summary>
        public SortedDictionary<string, LatencyStatistics> Timings { get; set; } = new SortedDictionary<string, LatencyStatistics>(StringComparer.Ordinal);

        /// <summary>
        /// Counts by name, for example ticksStarted or skipped.PreviousTickRunning.
        /// </summary>
        public SortedDictionary<string, int> Counts { get; set; } = new SortedDictionary<string, int>(StringComparer.Ordinal);
    }
}
