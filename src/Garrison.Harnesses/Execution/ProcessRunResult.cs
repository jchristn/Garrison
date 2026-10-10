namespace Garrison.Harnesses.Execution
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Outcome of a harness process.
    /// </summary>
    public class ProcessRunResult
    {
        /// <summary>
        /// Exit code, when the process exited.
        /// </summary>
        public int? ExitCode { get; set; } = null;

        /// <summary>
        /// Process identifier.
        /// </summary>
        public int? ProcessId { get; set; } = null;

        /// <summary>
        /// Whether the deadline elapsed.
        /// </summary>
        public bool TimedOut { get; set; } = false;

        /// <summary>
        /// Whether cancellation was requested.
        /// </summary>
        public bool Cancelled { get; set; } = false;

        /// <summary>
        /// Whether the executable could not be found.
        /// </summary>
        public bool NotInstalled { get; set; } = false;

        /// <summary>
        /// Whether stdout exceeded the limit.
        /// </summary>
        public bool OutputLimitExceeded { get; set; } = false;

        /// <summary>
        /// Stderr tail (not scrubbed; scrub before reporting).
        /// </summary>
        public string StderrTail { get; set; } = String.Empty;

        /// <summary>
        /// Stdout bytes read.
        /// </summary>
        public long StdoutBytes { get; set; } = 0;

        /// <summary>
        /// Start time (UTC).
        /// </summary>
        public DateTime StartedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// End time (UTC).
        /// </summary>
        public DateTime CompletedUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Launch error message when the process could not start.
        /// </summary>
        public string? LaunchError { get; set; } = null;
    }
}
