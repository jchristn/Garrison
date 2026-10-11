namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// Pass rate of one group of probes (a type or a category).
    /// </summary>
    public class GroupSummary
    {
        /// <summary>
        /// Type or category.
        /// </summary>
        public string Key { get; set; } = String.Empty;

        /// <summary>
        /// Outcomes in the group.
        /// </summary>
        public int N { get; set; }

        /// <summary>
        /// Outcomes that passed.
        /// </summary>
        public int Passed { get; set; }

        /// <summary>
        /// Pass rate with its interval; indicative below 20.
        /// </summary>
        public ConfidenceInterval? PassRate { get; set; }
    }
}
