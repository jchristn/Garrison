namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// A published or prior result next to this run's value for the same metric.
    /// </summary>
    public class BaselineComparison
    {
        /// <summary>
        /// Metric.
        /// </summary>
        public string Metric { get; set; } = String.Empty;

        /// <summary>
        /// Where the baseline comes from.
        /// </summary>
        public string Source { get; set; } = String.Empty;

        /// <summary>
        /// Link or path.
        /// </summary>
        public string? Link { get; set; } = String.Empty;

        /// <summary>
        /// Baseline value; null when no comparable result exists.
        /// </summary>
        public double? Baseline { get; set; }

        /// <summary>
        /// This run's value.
        /// </summary>
        public double? Ours { get; set; }

        /// <summary>
        /// Ours minus baseline.
        /// </summary>
        public double? Delta { get; set; }

        /// <summary>
        /// Why the comparison is or is not like-for-like.
        /// </summary>
        public string? Note { get; set; }
    }
}
