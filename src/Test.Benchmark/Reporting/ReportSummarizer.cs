namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// Builds per-arm summaries from per-probe outcomes. Errored outcomes score 0 and stay in every denominator;
    /// latency and timing distributions come from passed outcomes only. Stateless and thread-safe.
    /// </summary>
    public static class ReportSummarizer
    {
        /// <summary>
        /// Replace the report's arm summaries with ones computed from its outcomes.
        /// </summary>
        /// <param name="report">Report.</param>
        /// <param name="resamples">Bootstrap resamples.</param>
        /// <param name="seed">Bootstrap seed.</param>
        /// <param name="descriptions">Arm descriptions by arm name, or null.</param>
        /// <exception cref="ArgumentNullException">Thrown when report is null.</exception>
        public static void Summarize(BenchmarkReport report, int resamples, int seed, IDictionary<string, string>? descriptions)
        {
            if (report == null) throw new ArgumentNullException(nameof(report));
            report.Arms.Clear();
            foreach (IGrouping<string, ProbeOutcome> arm in report.Outcomes.GroupBy(o => o.Arm).OrderBy(g => g.Key == "garrison" ? 0 : 1).ThenBy(g => g.Key, StringComparer.Ordinal))
            {
                List<ProbeOutcome> outcomes = arm.ToList();
                ArmSummary summary = new ArmSummary();
                summary.Name = arm.Key;
                if (descriptions != null && descriptions.TryGetValue(arm.Key, out string? description)) summary.Description = description;
                summary.Probes = outcomes.Count;
                summary.Passed = outcomes.Count(o => o.Passed);
                summary.Errors = outcomes.Count(o => o.Errored);
                summary.PassRate = Bootstrap.MeanCi(outcomes.Select(o => o.Score).ToList(), resamples, StableHash.Seed(seed, arm.Key));
                List<double> latencies = outcomes.Where(o => o.Passed && o.LatencyMs.HasValue).Select(o => o.LatencyMs!.Value).ToList();
                if (latencies.Count > 0) summary.Latency = LatencyStatistics.From(latencies, resamples, StableHash.Seed(seed, arm.Key + "/latency"));
                foreach (string name in outcomes.SelectMany(o => o.Timings.Keys).Distinct(StringComparer.Ordinal).OrderBy(n => n, StringComparer.Ordinal))
                {
                    List<double> values = outcomes.Where(o => o.Passed && o.Timings.ContainsKey(name)).Select(o => o.Timings[name]).ToList();
                    if (values.Count > 0) summary.Timings[name] = LatencyStatistics.From(values, resamples, StableHash.Seed(seed, arm.Key + "/" + name));
                }
                summary.ByType = Groups(outcomes, o => o.Type, resamples, seed, arm.Key + "/type");
                summary.ByCategory = Groups(outcomes, o => o.Category, resamples, seed, arm.Key + "/category");
                report.Arms.Add(summary);
            }
        }

        private static List<GroupSummary> Groups(List<ProbeOutcome> outcomes, Func<ProbeOutcome, string> key, int resamples, int seed, string salt)
        {
            List<GroupSummary> groups = new List<GroupSummary>();
            foreach (IGrouping<string, ProbeOutcome> group in outcomes.GroupBy(key).OrderBy(g => g.Key, StringComparer.Ordinal))
            {
                GroupSummary summary = new GroupSummary();
                summary.Key = group.Key;
                summary.N = group.Count();
                summary.Passed = group.Count(o => o.Passed);
                summary.PassRate = Bootstrap.MeanCi(group.Select(o => o.Score).ToList(), resamples, StableHash.Seed(seed, salt + "/" + group.Key));
                groups.Add(summary);
            }
            return groups;
        }
    }
}
