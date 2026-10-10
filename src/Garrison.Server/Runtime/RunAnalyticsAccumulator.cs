namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;
    using Garrison.Core.Responses;

    /// <summary>
    /// Collects runs for one bucket (or the totals) and produces <see cref="RunAnalyticsMetrics"/>: counts and sums,
    /// averages over runs that have each measurement, and nearest-rank percentiles. Not thread-safe.
    /// </summary>
    public class RunAnalyticsAccumulator
    {
        #region Private-Members

        private long _Runs = 0;
        private long _Succeeded = 0;
        private long _Failed = 0;
        private long _Cancelled = 0;
        private long _TimedOut = 0;
        private long _InputTokens = 0;
        private long _OutputTokens = 0;
        private long _CachedTokens = 0;
        private long _ReasoningTokens = 0;
        private double _CostUsd = 0;
        private long _ToolCalls = 0;
        private readonly List<long> _TimeToFirstToken = new List<long>();
        private readonly List<long> _Streaming = new List<long>();
        private readonly List<long> _Execution = new List<long>();
        private readonly List<long> _Queue = new List<long>();
        private readonly List<double> _OutputTokensPerSecond = new List<double>();

        #endregion

        #region Public-Methods

        /// <summary>
        /// Add a run.
        /// </summary>
        /// <param name="run">Run; null is ignored.</param>
        public void Add(Run? run)
        {
            if (run == null) return;
            _Runs++;
            switch (run.Status)
            {
                case RunStatusEnum.Succeeded:
                    _Succeeded++;
                    break;
                case RunStatusEnum.Failed:
                case RunStatusEnum.Rejected:
                    _Failed++;
                    break;
                case RunStatusEnum.Cancelled:
                    _Cancelled++;
                    break;
                case RunStatusEnum.TimedOut:
                    _TimedOut++;
                    break;
                default:
                    break;
            }
            _InputTokens += run.InputTokens;
            _OutputTokens += run.OutputTokens;
            _CachedTokens += run.CachedTokens;
            _ReasoningTokens += run.ReasoningTokens;
            _CostUsd += run.CostUsd ?? 0;
            _ToolCalls += run.ToolCallCount;
            if (run.TimeToFirstTokenMs.HasValue) _TimeToFirstToken.Add(run.TimeToFirstTokenMs.Value);
            if (run.StreamingMs.HasValue) _Streaming.Add(run.StreamingMs.Value);
            if (run.ExecutionMs.HasValue) _Execution.Add(run.ExecutionMs.Value);
            if (run.QueueMs.HasValue) _Queue.Add(run.QueueMs.Value);
            double? rate = run.OutputTokensPerSecond;
            if (rate.HasValue) _OutputTokensPerSecond.Add(rate.Value);
        }

        /// <summary>
        /// Write the aggregated metrics onto a metrics object (a bucket or the totals).
        /// </summary>
        /// <param name="metrics">Target.</param>
        /// <exception cref="ArgumentNullException">Thrown when metrics is null.</exception>
        public void WriteTo(RunAnalyticsMetrics metrics)
        {
            if (metrics == null) throw new ArgumentNullException(nameof(metrics));
            metrics.Runs = _Runs;
            metrics.Succeeded = _Succeeded;
            metrics.Failed = _Failed;
            metrics.Cancelled = _Cancelled;
            metrics.TimedOut = _TimedOut;
            metrics.InputTokens = _InputTokens;
            metrics.OutputTokens = _OutputTokens;
            metrics.CachedTokens = _CachedTokens;
            metrics.ReasoningTokens = _ReasoningTokens;
            metrics.CostUsd = Math.Round(_CostUsd, 6);
            metrics.ToolCalls = _ToolCalls;
            metrics.TimeToFirstTokenMsAvg = Average(_TimeToFirstToken);
            metrics.TimeToFirstTokenMsP50 = Percentile(_TimeToFirstToken, 50);
            metrics.TimeToFirstTokenMsP95 = Percentile(_TimeToFirstToken, 95);
            metrics.StreamingMsAvg = Average(_Streaming);
            metrics.ExecutionMsAvg = Average(_Execution);
            metrics.ExecutionMsP95 = Percentile(_Execution, 95);
            metrics.QueueMsAvg = Average(_Queue);
            metrics.OutputTokensPerSecondAvg = _OutputTokensPerSecond.Count == 0 ? null : Math.Round(_OutputTokensPerSecond.Average(), 2);
        }

        /// <summary>
        /// Nearest-rank percentile: the smallest value such that at least the given percent of values are less than
        /// or equal to it.
        /// </summary>
        /// <param name="values">Values (not modified).</param>
        /// <param name="percent">Percent, clamped to 0 through 100.</param>
        /// <returns>Value, or null when there are no values.</returns>
        public static double? Percentile(IReadOnlyCollection<long> values, double percent)
        {
            if (values == null || values.Count == 0) return null;
            List<long> sorted = values.OrderBy(v => v).ToList();
            double p = Math.Clamp(percent, 0, 100);
            int rank = (int)Math.Ceiling(p / 100.0 * sorted.Count);
            int index = Math.Clamp(rank - 1, 0, sorted.Count - 1);
            return sorted[index];
        }

        #endregion

        #region Private-Methods

        private static double? Average(List<long> values)
        {
            if (values.Count == 0) return null;
            return Math.Round(values.Average(), 1);
        }

        #endregion
    }
}
