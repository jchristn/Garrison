namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One compared value.
    /// </summary>
    public class CompareRow
    {
        /// <summary>
        /// Section: quality, probe, latency, load, ingest, resilience.
        /// </summary>
        public string Section { get; set; } = String.Empty;

        /// <summary>
        /// What is compared.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Baseline value.
        /// </summary>
        public double? Baseline { get; set; }

        /// <summary>
        /// Candidate value.
        /// </summary>
        public double? Candidate { get; set; }

        /// <summary>
        /// Candidate minus baseline.
        /// </summary>
        public double? Delta { get; set; }

        /// <summary>
        /// Interval, p-value, or rule that decided the verdict.
        /// </summary>
        public string? Evidence { get; set; }

        /// <summary>
        /// ok, regression, improvement, or info.
        /// </summary>
        public string Verdict { get; set; } = "ok";
    }
}
