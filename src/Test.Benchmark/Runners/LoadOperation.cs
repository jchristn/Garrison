namespace Garrison.Benchmark.Runners
{
    using System;

    /// <summary>
    /// One operation of a load level: one run through Garrison or one direct harness invocation.
    /// </summary>
    public class LoadOperation
    {
        /// <summary>
        /// When the operation was due to start (open loop) or started (closed loop), from the level's stopwatch (ms).
        /// </summary>
        public double ScheduledMs { get; set; }

        /// <summary>
        /// When it finished, from the level's stopwatch (ms).
        /// </summary>
        public double EndMs { get; set; }

        /// <summary>
        /// Whether it succeeded (HTTP 200 and run status Succeeded, or harness exit 0).
        /// </summary>
        public bool Success { get; set; }

        /// <summary>
        /// Failure kind when it did not succeed.
        /// </summary>
        public string? FailureKind { get; set; }

        /// <summary>
        /// Latency from the scheduled start to the end (ms).
        /// </summary>
        public double LatencyMs { get; set; }

        /// <summary>
        /// Run queueMs (Garrison arm).
        /// </summary>
        public double? QueueMs { get; set; }

        /// <summary>
        /// Run executionMs (Garrison arm).
        /// </summary>
        public double? ExecutionMs { get; set; }

        /// <summary>
        /// Run totalMs (Garrison arm).
        /// </summary>
        public double? TotalMs { get; set; }
    }
}
