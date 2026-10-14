namespace Garrison.Benchmark.Runners
{
    using System;

    /// <summary>
    /// One submission of a scale level: the run it created, or why it failed, and how long the request took.
    /// </summary>
    public class ScaleSubmission
    {
        /// <summary>
        /// Sequence number within the level, from 1.
        /// </summary>
        public int Sequence { get; set; }

        /// <summary>
        /// Server replica the submission went to (index into the server list).
        /// </summary>
        public int Server { get; set; }

        /// <summary>
        /// Run created, or null when the submission failed.
        /// </summary>
        public string? RunId { get; set; }

        /// <summary>
        /// Failure kind when no run was created.
        /// </summary>
        public string? FailureKind { get; set; }

        /// <summary>
        /// Request latency (ms); 0 for a submission the client dropped.
        /// </summary>
        public double LatencyMs { get; set; }
    }
}
