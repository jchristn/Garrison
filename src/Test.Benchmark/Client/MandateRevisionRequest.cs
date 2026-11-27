namespace Garrison.Benchmark.Client
{
    using System;

    /// <summary>
    /// The revision a benchmark keeper is created with.
    /// </summary>
    public class MandateRevisionRequest
    {
        /// <summary>
        /// The job in plain words.
        /// </summary>
        public string Objective { get; set; } = String.Empty;

        /// <summary>
        /// Fixed or Backoff.
        /// </summary>
        public string WakeMode { get; set; } = "Fixed";

        /// <summary>
        /// Shortest interval between wakes, in seconds. The server raises it to Autonomy.MinIntervalSeconds (default 60).
        /// </summary>
        public int MinIntervalSeconds { get; set; } = 60;

        /// <summary>
        /// Longest interval between wakes, in seconds.
        /// </summary>
        public int MaxIntervalSeconds { get; set; } = 60;

        /// <summary>
        /// Jitter percent, 0 to 50, or null for the cluster default.
        /// </summary>
        public int? JitterPercent { get; set; } = 0;
    }
}
