namespace Garrison.Benchmark.Metrics
{
    using System;

    /// <summary>
    /// One server-side histogram series diffed across a measured phase.
    /// </summary>
    public class StageDelta
    {
        /// <summary>
        /// Series: metric name (without _sum or _count) and labels.
        /// </summary>
        public string Series { get; set; } = String.Empty;

        /// <summary>
        /// Observations during the phase.
        /// </summary>
        public double Count { get; set; }

        /// <summary>
        /// Total observed during the phase (milliseconds for duration series).
        /// </summary>
        public double Total { get; set; }

        /// <summary>
        /// Mean per observation.
        /// </summary>
        public double Mean { get; set; }

        /// <summary>
        /// ms for duration series, otherwise units.
        /// </summary>
        public string Unit { get; set; } = "ms";
    }
}
