namespace Garrison.Benchmark.Reporting
{
    using System;

    /// <summary>
    /// One published or prior value for a headline metric.
    /// </summary>
    public class PublishedResult
    {
        /// <summary>
        /// Headline metric key, as written by <see cref="HeadlineMetrics"/> (for example garrison.queueMs.p50).
        /// </summary>
        public string Metric { get; set; } = String.Empty;

        /// <summary>
        /// Value.
        /// </summary>
        public double? Value { get; set; }

        /// <summary>
        /// Source.
        /// </summary>
        public string Source { get; set; } = String.Empty;

        /// <summary>
        /// Link or repository path.
        /// </summary>
        public string? Link { get; set; }

        /// <summary>
        /// Whether and why the comparison is like-for-like.
        /// </summary>
        public string? Note { get; set; }
    }
}
