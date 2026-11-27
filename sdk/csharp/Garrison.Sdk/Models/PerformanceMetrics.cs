namespace Garrison.Sdk.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Performance of a set of agents over a window (AA11.1): run outcomes, cost, latency, escalations, loop-guard
    /// rejections, and eval scores. Covers runs created in the window by the agents in scope; eval, shadow, and playground
    /// runs are left out. Computed by the server on each read. Not thread-safe.
    /// </summary>
    public class PerformanceMetrics
    {
        /// <summary>
        /// Runs created in the window.
        /// </summary>
        public int Runs { get; set; } = 0;

        /// <summary>
        /// Runs that succeeded.
        /// </summary>
        public int Succeeded { get; set; } = 0;

        /// <summary>
        /// Runs that failed.
        /// </summary>
        public int Failed { get; set; } = 0;

        /// <summary>
        /// Runs that were cancelled.
        /// </summary>
        public int Cancelled { get; set; } = 0;

        /// <summary>
        /// Succeeded divided by succeeded plus failed, 0 to 1, or null when no run finished.
        /// </summary>
        public double? SuccessRate { get; set; } = null;

        /// <summary>
        /// Cost of the runs in US dollars.
        /// </summary>
        public double CostUsd { get; set; } = 0;

        /// <summary>
        /// Median latency of finished runs in milliseconds, or null when none finished.
        /// </summary>
        public long? LatencyP50Ms { get; set; } = null;

        /// <summary>
        /// 95th percentile latency of finished runs in milliseconds, or null when none finished.
        /// </summary>
        public long? LatencyP95Ms { get; set; } = null;

        /// <summary>
        /// 99th percentile latency of finished runs in milliseconds, or null when none finished.
        /// </summary>
        public long? LatencyP99Ms { get; set; } = null;

        /// <summary>
        /// Escalations raised by the agents in scope in the window.
        /// </summary>
        public int EscalationsRaised { get; set; } = 0;

        /// <summary>
        /// Escalations raised divided by runs, or null when there are no runs.
        /// </summary>
        public double? EscalationRate { get; set; } = null;

        /// <summary>
        /// Message sends and wakes the loop guard refused in the window.
        /// </summary>
        public int LoopGuardRejections { get; set; } = 0;

        /// <summary>
        /// Mean score, 0 to 1, of completed eval runs in the window that target the scope's deployments, scheduled checks
        /// included, or null when there are none.
        /// </summary>
        public double? EvalScore { get; set; } = null;

        /// <summary>
        /// Completed eval runs counted in EvalScore.
        /// </summary>
        public int EvalRuns { get; set; } = 0;

        /// <summary>
        /// At most 5 run identifiers: the newest failed runs first, then the newest succeeded.
        /// </summary>
        public List<string> SampleRunIds { get; set; } = new List<string>();
    }
}
