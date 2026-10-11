namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Settings of a comparison.
    /// </summary>
    public class ComparisonOptions
    {
        /// <summary>
        /// Smallest drop in a pass rate (absolute) that can count as a regression. Default 0.01.
        /// </summary>
        public double Tolerance { get; set; } = 0.01;

        /// <summary>
        /// Significance level of the paired bootstrap. Default 0.05.
        /// </summary>
        public double Alpha { get; set; } = 0.05;

        /// <summary>
        /// Relative p95 increase that can count as a latency regression. Default 0.2 (20%).
        /// </summary>
        public double LatencyTolerance { get; set; } = 0.2;

        /// <summary>
        /// Relative throughput drop that can count as a regression. Default 0.1 (10%).
        /// </summary>
        public double ThroughputTolerance { get; set; } = 0.1;

        /// <summary>
        /// Compare even when the probe sets differ (the missing probes are still reported).
        /// </summary>
        public bool AllowPartial { get; set; }

        /// <summary>
        /// Compare latency and throughput. Turn off when the reports come from different machines.
        /// </summary>
        public bool CompareLatency { get; set; } = true;

        /// <summary>
        /// Bootstrap resamples.
        /// </summary>
        public int Resamples { get; set; } = 2000;

        /// <summary>
        /// Bootstrap seed.
        /// </summary>
        public int Seed { get; set; } = 42;
    }
}
