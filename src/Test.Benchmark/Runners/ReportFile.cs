namespace Garrison.Benchmark.Runners
{
    using System;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// A report read from disk with its file name.
    /// </summary>
    public class ReportFile
    {
        /// <summary>
        /// Full path.
        /// </summary>
        public string Path { get; set; } = String.Empty;

        /// <summary>
        /// File name.
        /// </summary>
        public string File { get; set; } = String.Empty;

        /// <summary>
        /// Report.
        /// </summary>
        public BenchmarkReport Report { get; set; } = new BenchmarkReport();
    }
}
