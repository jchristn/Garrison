namespace Garrison.Core.Models
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Performance of a set of agents over a window (AA11.1): run outcomes, cost, latency percentiles, escalations,
    /// loop-guard refusals, eval scores, and sample runs. Covers runs created in the window by the agents in scope; Eval,
    /// Shadow, and Playground runs are left out. Not thread-safe.
    /// </summary>
    public class PerformanceMetrics
    {
        #region Public-Members

        /// <summary>
        /// Runs created in the window. Minimum 0.
        /// </summary>
        public int Runs { get; set; } = 0;

        /// <summary>
        /// Runs that succeeded. Minimum 0.
        /// </summary>
        public int Succeeded { get; set; } = 0;

        /// <summary>
        /// Runs that failed, were rejected, or timed out. Minimum 0.
        /// </summary>
        public int Failed { get; set; } = 0;

        /// <summary>
        /// Runs that were cancelled. Minimum 0.
        /// </summary>
        public int Cancelled { get; set; } = 0;

        /// <summary>
        /// succeeded / (succeeded + failed), from 0 to 1; null when no run succeeded or failed.
        /// </summary>
        public double? SuccessRate { get; set; } = null;

        /// <summary>
        /// Total cost in USD, rounded to 6 decimal places. Minimum 0.
        /// </summary>
        public double CostUsd { get; set; } = 0;

        /// <summary>
        /// Median total time (queued to completed) of finished runs, in milliseconds (nearest rank); null when none
        /// finished.
        /// </summary>
        public long? LatencyP50Ms { get; set; } = null;

        /// <summary>
        /// 95th percentile total time of finished runs, in milliseconds; null when none finished.
        /// </summary>
        public long? LatencyP95Ms { get; set; } = null;

        /// <summary>
        /// 99th percentile total time of finished runs, in milliseconds; null when none finished.
        /// </summary>
        public long? LatencyP99Ms { get; set; } = null;

        /// <summary>
        /// Escalations the agents raised in the window (escalating one up is not counted again). Minimum 0.
        /// </summary>
        public int EscalationsRaised { get; set; } = 0;

        /// <summary>
        /// escalationsRaised / runs; null when there are no runs. May exceed 1.
        /// </summary>
        public double? EscalationRate { get; set; } = null;

        /// <summary>
        /// Messages the agents sent in the window that the loop guards refused (HopLimit, LineRate, ThreadBudget).
        /// Minimum 0.
        /// </summary>
        public int LoopGuardRejections { get; set; } = 0;

        /// <summary>
        /// Mean score (0 to 1) of completed eval runs created in the window against the agents' deployments, scheduled
        /// checks included; null when there are none with a score.
        /// </summary>
        public double? EvalScore { get; set; } = null;

        /// <summary>
        /// Completed eval runs with a score counted in evalScore. Minimum 0.
        /// </summary>
        public int EvalRuns { get; set; } = 0;

        /// <summary>
        /// At most 5 run identifiers: the newest failed runs first, then the newest succeeded.
        /// </summary>
        public List<string> SampleRunIds
        {
            get
            {
                return _SampleRunIds;
            }
            set
            {
                _SampleRunIds = value ?? new List<string>();
            }
        }

        #endregion

        #region Private-Members

        private List<string> _SampleRunIds = new List<string>();

        #endregion
    }
}
