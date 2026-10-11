namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// Flattens a report into named headline metrics, the keys that history tables, baselines.json, and RESULTS.md use.
    /// Stateless and thread-safe.
    /// </summary>
    public static class HeadlineMetrics
    {
        /// <summary>
        /// Headline metrics of a report.
        /// </summary>
        /// <param name="report">Report.</param>
        /// <returns>Metric values by key.</returns>
        /// <exception cref="ArgumentNullException">Thrown when report is null.</exception>
        public static SortedDictionary<string, double> From(BenchmarkReport report)
        {
            if (report == null) throw new ArgumentNullException(nameof(report));
            SortedDictionary<string, double> metrics = new SortedDictionary<string, double>(StringComparer.Ordinal);
            foreach (ArmSummary arm in report.Arms)
            {
                if (arm.PassRate != null && arm.Probes > 0) metrics[arm.Name + ".passRate"] = arm.PassRate.Estimate;
                foreach (GroupSummary group in arm.ByType)
                {
                    if (group.PassRate != null) metrics[arm.Name + ".passRate.type." + group.Key] = group.PassRate.Estimate;
                }
                if (arm.Latency != null && arm.Latency.Count > 0)
                {
                    metrics[arm.Name + ".latencyMs.p50"] = arm.Latency.P50;
                    metrics[arm.Name + ".latencyMs.p95"] = arm.Latency.P95;
                }
                foreach (KeyValuePair<string, LatencyStatistics> timing in arm.Timings)
                {
                    if (timing.Value.Count == 0) continue;
                    metrics[arm.Name + "." + timing.Key + ".p50"] = timing.Value.P50;
                    metrics[arm.Name + "." + timing.Key + ".p95"] = timing.Value.P95;
                }
            }
            foreach (IGrouping<string, LoadLevelResult> arm in report.LoadLevels.GroupBy(l => l.Arm + "." + l.Mode))
            {
                foreach (LoadLevelResult level in arm)
                {
                    string key = "load." + arm.Key + "." + LevelKey(level);
                    metrics[key + ".throughput"] = level.Throughput;
                    if (level.Latency != null && level.Latency.Count > 0) metrics[key + ".latencyMs.p95"] = level.Latency.P95;
                    if (level.Timings.TryGetValue("queueMs", out LatencyStatistics? queue) && queue.Count > 0) metrics[key + ".queueMs.p50"] = queue.P50;
                }
                metrics["load." + arm.Key + ".peakThroughput"] = arm.Max(l => l.Throughput);
            }
            if (report.Ingest != null)
            {
                metrics["ingest.documentsPerSecond"] = report.Ingest.DocumentsPerSecond;
                metrics["ingest.reachability"] = report.Ingest.Reachability;
                metrics["ingest.reapplyUnchangedRate"] = report.Ingest.ReapplyUnchangedRate;
                if (report.Ingest.ApplyLatency != null) metrics["ingest.applyLatencyMs.p50"] = report.Ingest.ApplyLatency.P50;
            }
            foreach (ResilienceScenarioResult scenario in report.Scenarios.Where(s => !s.Skipped))
            {
                metrics["resilience." + scenario.Name + ".passed"] = scenario.Passed ? 1 : 0;
                if (scenario.RecoverySeconds >= 0) metrics["resilience." + scenario.Name + ".recoverySeconds"] = scenario.RecoverySeconds;
            }
            return metrics;
        }

        /// <summary>
        /// Key of a load level: w&lt;workers&gt;-c&lt;concurrency&gt; for closed loop, w&lt;workers&gt;-r&lt;rate&gt; for open loop.
        /// </summary>
        /// <param name="level">Level.</param>
        /// <returns>Key.</returns>
        /// <exception cref="ArgumentNullException">Thrown when level is null.</exception>
        public static string LevelKey(LoadLevelResult level)
        {
            if (level == null) throw new ArgumentNullException(nameof(level));
            string load = level.Mode == "open"
                ? "r" + level.TargetRate.ToString("0.##", CultureInfo.InvariantCulture)
                : "c" + level.Concurrency.ToString(CultureInfo.InvariantCulture);
            return "w" + level.Workers.ToString(CultureInfo.InvariantCulture) + "-" + load;
        }
    }
}
