namespace Garrison.Benchmark.Reference
{
    using System;

    /// <summary>
    /// One direct invocation of the fake harness, outside Garrison.
    /// </summary>
    public class DirectResult
    {
        /// <summary>
        /// Wall time from process start to exit (ms).
        /// </summary>
        public double ElapsedMs { get; set; }

        /// <summary>
        /// Exit code.
        /// </summary>
        public int ExitCode { get; set; }

        /// <summary>
        /// Answer from the final result line (Claude format) or stdout (plain format); null when not parsed.
        /// </summary>
        public string? ResultText { get; set; }

        /// <summary>
        /// Whether the harness reported an error.
        /// </summary>
        public bool IsError { get; set; }

        /// <summary>
        /// Start failure or timeout description, when there was one.
        /// </summary>
        public string? Error { get; set; }
    }
}
