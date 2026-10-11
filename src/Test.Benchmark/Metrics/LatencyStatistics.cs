namespace Garrison.Benchmark.Metrics
{
    using System;
    using System.Collections.Generic;
    using System.Linq;

    /// <summary>
    /// Latency summary of successful operations in milliseconds. Percentiles use the nearest-rank method (the
    /// smallest value with at least p percent of the sample at or below it), so every reported percentile is a value
    /// that was actually observed.
    /// </summary>
    public class LatencyStatistics
    {
        #region Public-Members

        /// <summary>
        /// Samples.
        /// </summary>
        public int Count { get; set; }

        /// <summary>
        /// Mean.
        /// </summary>
        public double Mean { get; set; }

        /// <summary>
        /// Standard deviation (sample).
        /// </summary>
        public double StdDev { get; set; }

        /// <summary>
        /// Minimum.
        /// </summary>
        public double Min { get; set; }

        /// <summary>
        /// 50th percentile.
        /// </summary>
        public double P50 { get; set; }

        /// <summary>
        /// 90th percentile.
        /// </summary>
        public double P90 { get; set; }

        /// <summary>
        /// 95th percentile.
        /// </summary>
        public double P95 { get; set; }

        /// <summary>
        /// 99th percentile.
        /// </summary>
        public double P99 { get; set; }

        /// <summary>
        /// Maximum.
        /// </summary>
        public double Max { get; set; }

        /// <summary>
        /// Bootstrap confidence interval of the median, when computed.
        /// </summary>
        public ConfidenceInterval? P50Ci { get; set; }

        /// <summary>
        /// Bootstrap confidence interval of the 95th percentile, when computed.
        /// </summary>
        public ConfidenceInterval? P95Ci { get; set; }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Summarize samples.
        /// </summary>
        /// <param name="samples">Samples in milliseconds.</param>
        /// <param name="resamples">Bootstrap resamples for the p50 and p95 intervals; 0 skips them.</param>
        /// <param name="seed">Bootstrap seed.</param>
        /// <returns>Summary (all zeros for an empty sample).</returns>
        /// <exception cref="ArgumentNullException">Thrown when samples is null.</exception>
        public static LatencyStatistics From(IEnumerable<double> samples, int resamples, int seed)
        {
            if (samples == null) throw new ArgumentNullException(nameof(samples));
            List<double> sorted = samples.OrderBy(s => s).ToList();
            LatencyStatistics stats = new LatencyStatistics();
            stats.Count = sorted.Count;
            if (sorted.Count == 0) return stats;
            stats.Mean = sorted.Average();
            if (sorted.Count > 1)
            {
                double mean = stats.Mean;
                stats.StdDev = Math.Sqrt(sorted.Sum(s => (s - mean) * (s - mean)) / (sorted.Count - 1));
            }
            stats.Min = sorted[0];
            stats.Max = sorted[sorted.Count - 1];
            stats.P50 = Percentile(sorted, 50);
            stats.P90 = Percentile(sorted, 90);
            stats.P95 = Percentile(sorted, 95);
            stats.P99 = Percentile(sorted, 99);
            if (resamples > 0 && sorted.Count > 1)
            {
                stats.P50Ci = Bootstrap.PercentileCi(sorted, 50, resamples, seed);
                stats.P95Ci = Bootstrap.PercentileCi(sorted, 95, resamples, seed + 1);
            }
            return stats;
        }

        /// <summary>
        /// Nearest-rank percentile of a sorted list.
        /// </summary>
        /// <param name="sorted">Ascending samples.</param>
        /// <param name="percentile">Percentile, 0 to 100.</param>
        /// <returns>Value, or 0 for an empty list.</returns>
        /// <exception cref="ArgumentNullException">Thrown when sorted is null.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when percentile is outside 0 to 100.</exception>
        public static double Percentile(IReadOnlyList<double> sorted, double percentile)
        {
            if (sorted == null) throw new ArgumentNullException(nameof(sorted));
            if (percentile < 0 || percentile > 100) throw new ArgumentOutOfRangeException(nameof(percentile));
            if (sorted.Count == 0) return 0;
            int rank = (int)Math.Ceiling(percentile / 100.0 * sorted.Count);
            if (rank < 1) rank = 1;
            if (rank > sorted.Count) rank = sorted.Count;
            return sorted[rank - 1];
        }

        #endregion
    }
}
