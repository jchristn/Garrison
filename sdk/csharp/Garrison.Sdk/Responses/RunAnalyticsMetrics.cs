namespace Garrison.Sdk.Responses
{
    using System;

    /// <summary>
    /// Aggregated run metrics for a bucket or for the whole range. Latency and throughput members are null when there are no samples.
    /// </summary>
    public class RunAnalyticsMetrics
    {
        /// <summary>
        /// Runs created in the window.
        /// </summary>
        public long Runs { get; set; } = 0;

        /// <summary>
        /// Runs that succeeded.
        /// </summary>
        public long Succeeded { get; set; } = 0;

        /// <summary>
        /// Runs that failed.
        /// </summary>
        public long Failed { get; set; } = 0;

        /// <summary>
        /// Runs that were cancelled.
        /// </summary>
        public long Cancelled { get; set; } = 0;

        /// <summary>
        /// Runs that timed out.
        /// </summary>
        public long TimedOut { get; set; } = 0;

        /// <summary>
        /// Input tokens.
        /// </summary>
        public long InputTokens { get; set; } = 0;

        /// <summary>
        /// Output tokens.
        /// </summary>
        public long OutputTokens { get; set; } = 0;

        /// <summary>
        /// Cached input tokens.
        /// </summary>
        public long CachedTokens { get; set; } = 0;

        /// <summary>
        /// Reasoning tokens.
        /// </summary>
        public long ReasoningTokens { get; set; } = 0;

        /// <summary>
        /// Tool calls.
        /// </summary>
        public long ToolCalls { get; set; } = 0;

        /// <summary>
        /// Cost in USD.
        /// </summary>
        public double CostUsd { get; set; } = 0;

        /// <summary>
        /// Average time to first token in milliseconds, or null.
        /// </summary>
        public double? TimeToFirstTokenMsAvg { get; set; } = null;

        /// <summary>
        /// Median time to first token in milliseconds, or null.
        /// </summary>
        public double? TimeToFirstTokenMsP50 { get; set; } = null;

        /// <summary>
        /// 95th percentile time to first token in milliseconds, or null.
        /// </summary>
        public double? TimeToFirstTokenMsP95 { get; set; } = null;

        /// <summary>
        /// Average streaming time in milliseconds, or null.
        /// </summary>
        public double? StreamingMsAvg { get; set; } = null;

        /// <summary>
        /// Average execution time in milliseconds, or null.
        /// </summary>
        public double? ExecutionMsAvg { get; set; } = null;

        /// <summary>
        /// 95th percentile execution time in milliseconds, or null.
        /// </summary>
        public double? ExecutionMsP95 { get; set; } = null;

        /// <summary>
        /// Average queue time in milliseconds, or null.
        /// </summary>
        public double? QueueMsAvg { get; set; } = null;

        /// <summary>
        /// Average output tokens per second, or null.
        /// </summary>
        public double? OutputTokensPerSecondAvg { get; set; } = null;
    }
}
