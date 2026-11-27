namespace Garrison.Benchmark.Runners
{
    using System;

    /// <summary>
    /// One timed operation of an autonomy phase and whether its result was right.
    /// </summary>
    public class MeasuredOperation
    {
        /// <summary>
        /// True when the call succeeded and its result matched the expectation.
        /// </summary>
        public bool Passed { get; set; }

        /// <summary>
        /// Client latency (ms).
        /// </summary>
        public double LatencyMs { get; set; }

        /// <summary>
        /// What went wrong, or null.
        /// </summary>
        public string? Problem { get; set; }

        /// <summary>
        /// Instantiate.
        /// </summary>
        /// <param name="passed">Whether the result was right.</param>
        /// <param name="latencyMs">Latency (ms).</param>
        /// <param name="problem">What went wrong, or null.</param>
        public MeasuredOperation(bool passed, double latencyMs, string? problem)
        {
            Passed = passed;
            LatencyMs = latencyMs;
            Problem = passed ? null : problem ?? "unexpected result";
        }
    }
}
