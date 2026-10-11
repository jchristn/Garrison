namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// The outcome of comparing two reports.
    /// </summary>
    public class CompareResult
    {
        /// <summary>
        /// Report kind.
        /// </summary>
        public string Kind { get; set; } = String.Empty;

        /// <summary>
        /// Baseline report file.
        /// </summary>
        public string Baseline { get; set; } = String.Empty;

        /// <summary>
        /// Candidate report file.
        /// </summary>
        public string Candidate { get; set; } = String.Empty;

        /// <summary>
        /// When the comparison ran (UTC).
        /// </summary>
        public DateTime ComparedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Options.
        /// </summary>
        public ComparisonOptions Options { get; set; } = new ComparisonOptions();

        /// <summary>
        /// True when any row is a regression, the probe sets differ without AllowPartial, or a report is incomplete.
        /// </summary>
        public bool Regression { get; set; }

        /// <summary>
        /// Baseline probes (or load levels) the candidate lacks.
        /// </summary>
        public int MissingInCandidate { get; set; }

        /// <summary>
        /// Candidate probes (or load levels) the baseline lacks.
        /// </summary>
        public int MissingInBaseline { get; set; }

        /// <summary>
        /// Rows.
        /// </summary>
        public List<CompareRow> Rows { get; set; } = new List<CompareRow>();

        /// <summary>
        /// Messages.
        /// </summary>
        public List<string> Messages { get; set; } = new List<string>();
    }
}
