namespace Garrison.Server.Runtime
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Core.Enums;
    using Garrison.Core.Models;

    /// <summary>
    /// Collects the runs, escalation and loop-guard counts, and eval runs of a set of agents and produces
    /// <see cref="PerformanceMetrics"/> (AA11.1). Latency percentiles are nearest-rank over the total time of finished
    /// runs, computed with <see cref="RunAnalyticsAccumulator.Percentile"/>. Not thread-safe.
    /// </summary>
    public class PerformanceAccumulator
    {
        #region Public-Members

        /// <summary>
        /// Most sample run identifiers written: 5.
        /// </summary>
        public static int SampleSize
        {
            get
            {
                return 5;
            }
        }

        #endregion

        #region Private-Members

        private readonly List<Run> _Runs = new List<Run>();
        private readonly List<EvalRun> _EvalRuns = new List<EvalRun>();
        private long _Escalations = 0;
        private long _LoopGuard = 0;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Add runs.
        /// </summary>
        /// <param name="runs">Runs; null is ignored.</param>
        public void AddRuns(IEnumerable<Run>? runs)
        {
            if (runs == null) return;
            _Runs.AddRange(runs.Where(r => r != null));
        }

        /// <summary>
        /// Add completed eval runs.
        /// </summary>
        /// <param name="evalRuns">Eval runs; null is ignored.</param>
        public void AddEvalRuns(IEnumerable<EvalRun>? evalRuns)
        {
            if (evalRuns == null) return;
            _EvalRuns.AddRange(evalRuns.Where(r => r != null));
        }

        /// <summary>
        /// Add escalations raised.
        /// </summary>
        /// <param name="count">Count; negative values are ignored.</param>
        public void AddEscalations(long count)
        {
            if (count > 0) _Escalations += count;
        }

        /// <summary>
        /// Add loop-guard refusals.
        /// </summary>
        /// <param name="count">Count; negative values are ignored.</param>
        public void AddLoopGuardRejections(long count)
        {
            if (count > 0) _LoopGuard += count;
        }

        /// <summary>
        /// Write the metrics.
        /// </summary>
        /// <returns>Metrics.</returns>
        public PerformanceMetrics ToMetrics()
        {
            PerformanceMetrics metrics = new PerformanceMetrics();
            List<Run> ordered = _Runs.GroupBy(r => r.Id, StringComparer.Ordinal).Select(g => g.First())
                .OrderByDescending(r => r.CreatedUtc).ThenByDescending(r => r.Id, StringComparer.Ordinal).ToList();
            metrics.Runs = ordered.Count;
            metrics.Succeeded = ordered.Count(r => r.Status == RunStatusEnum.Succeeded);
            metrics.Failed = ordered.Count(IsFailure);
            metrics.Cancelled = ordered.Count(r => r.Status == RunStatusEnum.Cancelled);
            int decided = metrics.Succeeded + metrics.Failed;
            metrics.SuccessRate = decided == 0 ? null : Math.Round((double)metrics.Succeeded / decided, 4);
            metrics.CostUsd = Math.Round(ordered.Sum(r => r.CostUsd ?? 0), 6);
            List<long> latencies = ordered.Where(r => RunService.IsTerminal(r.Status) && r.TotalMs.HasValue).Select(r => r.TotalMs!.Value).ToList();
            metrics.LatencyP50Ms = ToLong(RunAnalyticsAccumulator.Percentile(latencies, 50));
            metrics.LatencyP95Ms = ToLong(RunAnalyticsAccumulator.Percentile(latencies, 95));
            metrics.LatencyP99Ms = ToLong(RunAnalyticsAccumulator.Percentile(latencies, 99));
            metrics.EscalationsRaised = (int)Math.Min(Int32.MaxValue, _Escalations);
            metrics.EscalationRate = metrics.Runs == 0 ? null : Math.Round((double)metrics.EscalationsRaised / metrics.Runs, 4);
            metrics.LoopGuardRejections = (int)Math.Min(Int32.MaxValue, _LoopGuard);
            List<EvalRun> scored = _EvalRuns.GroupBy(e => e.Id, StringComparer.Ordinal).Select(g => g.First()).Where(e => e.Score.HasValue).ToList();
            metrics.EvalRuns = scored.Count;
            metrics.EvalScore = scored.Count == 0 ? null : Math.Round(scored.Average(e => e.Score!.Value), 4);
            List<string> samples = ordered.Where(IsFailure).Take(SampleSize).Select(r => r.Id).ToList();
            samples.AddRange(ordered.Where(r => r.Status == RunStatusEnum.Succeeded).Take(SampleSize - samples.Count).Select(r => r.Id));
            metrics.SampleRunIds = samples;
            return metrics;
        }

        #endregion

        #region Private-Methods

        private static bool IsFailure(Run run)
        {
            return run.Status == RunStatusEnum.Failed || run.Status == RunStatusEnum.Rejected || run.Status == RunStatusEnum.TimedOut;
        }

        private static long? ToLong(double? value)
        {
            if (!value.HasValue) return null;
            return (long)Math.Round(value.Value);
        }

        #endregion
    }
}
