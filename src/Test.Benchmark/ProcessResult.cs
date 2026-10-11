namespace Garrison.Benchmark
{
    using System;

    /// <summary>
    /// Result of an external process the harness started.
    /// </summary>
    public class ProcessResult
    {
        /// <summary>
        /// Exit code; -1 when the process could not start or was killed on timeout.
        /// </summary>
        public int ExitCode { get; set; } = -1;

        /// <summary>
        /// Standard output.
        /// </summary>
        public string Stdout { get; set; } = String.Empty;

        /// <summary>
        /// Standard error.
        /// </summary>
        public string Stderr { get; set; } = String.Empty;

        /// <summary>
        /// Wall time from start to exit in milliseconds.
        /// </summary>
        public double ElapsedMs { get; set; }

        /// <summary>
        /// True when the process was killed on timeout.
        /// </summary>
        public bool TimedOut { get; set; }

        /// <summary>
        /// Start failure, when the process could not start.
        /// </summary>
        public string? StartError { get; set; }
    }
}
