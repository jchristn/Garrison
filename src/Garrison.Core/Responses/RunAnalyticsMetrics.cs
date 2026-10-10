namespace Garrison.Core.Responses
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// Aggregated run metrics for one bucket or for the whole range. Counts and sums are 0 when there are no runs;
    /// averages and percentiles are null when no run in the set has the measurement. Durations are milliseconds.
    /// </summary>
    public class RunAnalyticsMetrics
    {
        /// <summary>
        /// Runs created in the set, in any status.
        /// </summary>
        public long Runs { get; set; } = 0;

        /// <summary>
        /// Runs with status Succeeded.
        /// </summary>
        public long Succeeded { get; set; } = 0;

        /// <summary>
        /// Runs with status Failed or Rejected.
        /// </summary>
        public long Failed { get; set; } = 0;

        /// <summary>
        /// Runs with status Cancelled.
        /// </summary>
        public long Cancelled { get; set; } = 0;

        /// <summary>
        /// Runs with status TimedOut.
        /// </summary>
        public long TimedOut { get; set; } = 0;

        /// <summary>
        /// Sum of input tokens.
        /// </summary>
        public long InputTokens { get; set; } = 0;

        /// <summary>
        /// Sum of output tokens.
        /// </summary>
        public long OutputTokens { get; set; } = 0;

        /// <summary>
        /// Sum of cached input tokens.
        /// </summary>
        public long CachedTokens { get; set; } = 0;

        /// <summary>
        /// Sum of reasoning tokens.
        /// </summary>
        public long ReasoningTokens { get; set; } = 0;

        /// <summary>
        /// Sum of reported or estimated cost in USD, rounded to six decimals.
        /// </summary>
        public double CostUsd { get; set; } = 0;

        /// <summary>
        /// Sum of tool call events.
        /// </summary>
        public long ToolCalls { get; set; } = 0;

        /// <summary>
        /// Average time to first token.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public double? TimeToFirstTokenMsAvg { get; set; } = null;

        /// <summary>
        /// Median time to first token (nearest rank).
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public double? TimeToFirstTokenMsP50 { get; set; } = null;

        /// <summary>
        /// 95th percentile time to first token (nearest rank).
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public double? TimeToFirstTokenMsP95 { get; set; } = null;

        /// <summary>
        /// Average milliseconds runs spent waiting on child runs they delegated to (runs that recorded it, including
        /// runs that delegated nothing, which count as 0).
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public double? DelegationWaitMsAvg { get; set; } = null;

        /// <summary>
        /// Average time to first token excluding the delegation wait before the first token.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public double? TimeToFirstTokenExcludingDelegationMsAvg { get; set; } = null;

        /// <summary>
        /// Median time to first token excluding delegation wait (nearest rank).
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public double? TimeToFirstTokenExcludingDelegationMsP50 { get; set; } = null;

        /// <summary>
        /// 95th percentile time to first token excluding delegation wait (nearest rank).
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public double? TimeToFirstTokenExcludingDelegationMsP95 { get; set; } = null;

        /// <summary>
        /// Average streaming time.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public double? StreamingMsAvg { get; set; } = null;

        /// <summary>
        /// Average execution time (process start to exit).
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public double? ExecutionMsAvg { get; set; } = null;

        /// <summary>
        /// 95th percentile execution time (nearest rank).
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public double? ExecutionMsP95 { get; set; } = null;

        /// <summary>
        /// Average queue time (queued to leased).
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public double? QueueMsAvg { get; set; } = null;

        /// <summary>
        /// Average of the per-run output tokens per second, over runs where it is defined.
        /// </summary>
        [JsonIgnore(Condition = JsonIgnoreCondition.Never)]
        public double? OutputTokensPerSecondAvg { get; set; } = null;
    }
}
