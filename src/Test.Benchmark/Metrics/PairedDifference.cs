namespace Garrison.Benchmark.Metrics
{
    using System;

    /// <summary>
    /// Paired bootstrap result: the interval of the mean difference (candidate minus baseline) and a two-sided p-value.
    /// </summary>
    public class PairedDifference
    {
        /// <summary>
        /// Interval of the mean difference.
        /// </summary>
        public ConfidenceInterval Interval { get; set; } = new ConfidenceInterval();

        /// <summary>
        /// Two-sided p-value.
        /// </summary>
        public double PValue { get; set; } = 1.0;
    }
}
