namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.Linq;
    using System.Text;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// The regression gate. Pairs two reports probe by probe (arm, corpus, probe, repeat) and flags a regression only
    /// when a drop is both larger than the tolerance and statistically distinguishable from noise (paired bootstrap:
    /// interval entirely below zero or p below alpha). Deterministic reports, whose scores carry no noise, additionally
    /// treat any probe that flips from pass to fail as a regression. Latency and throughput compare p95 and
    /// throughput with relative tolerances and require the 95% intervals not to overlap. Mismatched probe sets fail
    /// unless partial comparison is allowed. Every report kind is covered. Stateless and thread-safe.
    /// </summary>
    public static class ReportComparer
    {
        #region Public-Methods

        /// <summary>
        /// Compare two reports.
        /// </summary>
        /// <param name="baseline">Baseline report.</param>
        /// <param name="candidate">Candidate report.</param>
        /// <param name="options">Options.</param>
        /// <returns>Result.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static CompareResult Compare(BenchmarkReport baseline, BenchmarkReport candidate, ComparisonOptions options)
        {
            if (baseline == null) throw new ArgumentNullException(nameof(baseline));
            if (candidate == null) throw new ArgumentNullException(nameof(candidate));
            if (options == null) throw new ArgumentNullException(nameof(options));

            CompareResult result = new CompareResult();
            result.Kind = candidate.Kind;
            result.Options = options;
            if (baseline.Kind != candidate.Kind)
            {
                result.Messages.Add("The reports are of different kinds (" + baseline.Kind + " and " + candidate.Kind + ") and cannot be compared.");
                result.Regression = true;
                return result;
            }
            if (baseline.Dataset != candidate.Dataset) result.Messages.Add("Different datasets: " + baseline.Dataset + " and " + candidate.Dataset + ".");
            if (baseline.Provenance.DatasetSha256 != candidate.Provenance.DatasetSha256) result.Messages.Add("The dataset files differ (SHA-256 " + Short(baseline.Provenance.DatasetSha256) + " and " + Short(candidate.Provenance.DatasetSha256) + "); probe pairing still applies.");
            if (baseline.Provenance.MachineName != candidate.Provenance.MachineName && options.CompareLatency) result.Messages.Add("The reports come from different machines (" + baseline.Provenance.MachineName + ", " + candidate.Provenance.MachineName + "); latency and throughput comparisons are not meaningful across machines. Pass --no-latency.");
            if (baseline.Incomplete || candidate.Incomplete)
            {
                result.Messages.Add("A report is incomplete (" + (candidate.Incomplete ? "candidate: " + candidate.IncompleteReason : "baseline: " + baseline.IncompleteReason) + "); incomplete runs are not comparable.");
                result.Regression = true;
            }

            ComparePairs(baseline, candidate, options, result);
            bool deterministic = baseline.Deterministic && candidate.Deterministic;
            if (options.CompareLatency && !deterministic)
            {
                CompareLatency(baseline, candidate, options, result);
            }
            CompareLoad(baseline, candidate, options, result);
            CompareIngest(baseline, candidate, options, result);
            CompareResilience(baseline, candidate, result);

            if (result.Rows.Any(r => r.Verdict == "regression")) result.Regression = true;
            if ((result.MissingInCandidate > 0 || result.MissingInBaseline > 0) && !options.AllowPartial)
            {
                result.Messages.Add("The probe sets differ: " + result.MissingInCandidate + " baseline probes are missing from the candidate and " + result.MissingInBaseline + " candidate probes are missing from the baseline. Pass --allow-partial to compare the common probes anyway.");
                result.Regression = true;
            }
            return result;
        }

        /// <summary>
        /// Render a comparison as Markdown.
        /// </summary>
        /// <param name="result">Result.</param>
        /// <returns>Markdown.</returns>
        /// <exception cref="ArgumentNullException">Thrown when result is null.</exception>
        public static string Markdown(CompareResult result)
        {
            if (result == null) throw new ArgumentNullException(nameof(result));
            StringBuilder md = new StringBuilder();
            md.Append("# Comparison: ").Append(result.Kind).Append("\n\n");
            md.Append("| | |\n|---|---|\n");
            md.Append("| Baseline | ").Append(ReportWriter.Cell(result.Baseline)).Append(" |\n");
            md.Append("| Candidate | ").Append(ReportWriter.Cell(result.Candidate)).Append(" |\n");
            md.Append("| Compared (UTC) | ").Append(result.ComparedUtc.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture)).Append(" |\n");
            md.Append("| Tolerance / alpha | ").Append(ReportWriter.N(result.Options.Tolerance, "0.###")).Append(" / ").Append(ReportWriter.N(result.Options.Alpha, "0.###")).Append(" |\n");
            md.Append("| Latency / throughput tolerance | ").Append(ReportWriter.N(result.Options.LatencyTolerance, "0.###")).Append(" / ").Append(ReportWriter.N(result.Options.ThroughputTolerance, "0.###")).Append(result.Options.CompareLatency ? String.Empty : " (latency not compared)").Append(" |\n");
            md.Append("| Missing in candidate / baseline | ").Append(result.MissingInCandidate).Append(" / ").Append(result.MissingInBaseline).Append(result.Options.AllowPartial ? " (partial allowed)" : String.Empty).Append(" |\n\n");
            if (result.Messages.Count > 0)
            {
                foreach (string message in result.Messages) md.Append("- ").Append(message).Append('\n');
                md.Append('\n');
            }
            md.Append("| Section | Measure | Baseline | Candidate | Delta | Evidence | Verdict |\n|---|---|---|---|---|---|---|\n");
            foreach (CompareRow row in result.Rows)
            {
                md.Append("| ").Append(row.Section).Append(" | ").Append(ReportWriter.Cell(row.Name))
                    .Append(" | ").Append(Value(row.Baseline)).Append(" | ").Append(Value(row.Candidate))
                    .Append(" | ").Append(row.Delta.HasValue ? (row.Delta.Value >= 0 ? "+" : String.Empty) + ReportWriter.N(row.Delta.Value, "0.####") : String.Empty)
                    .Append(" | ").Append(ReportWriter.Cell(row.Evidence)).Append(" | ").Append(row.Verdict == "regression" ? "**regression**" : row.Verdict).Append(" |\n");
            }
            md.Append("\nRESULT: ").Append(result.Regression ? "regression" : "no regression").Append('\n');
            return md.ToString();
        }

        #endregion

        #region Private-Methods

        private static string Key(ProbeOutcome outcome)
        {
            return outcome.Arm + "|" + outcome.Corpus + "/" + outcome.ProbeId + "#" + outcome.Repeat.ToString(CultureInfo.InvariantCulture);
        }

        private static void ComparePairs(BenchmarkReport baseline, BenchmarkReport candidate, ComparisonOptions options, CompareResult result)
        {
            Dictionary<string, ProbeOutcome> before = new Dictionary<string, ProbeOutcome>(StringComparer.Ordinal);
            foreach (ProbeOutcome outcome in baseline.Outcomes) before[Key(outcome)] = outcome;
            Dictionary<string, ProbeOutcome> after = new Dictionary<string, ProbeOutcome>(StringComparer.Ordinal);
            foreach (ProbeOutcome outcome in candidate.Outcomes) after[Key(outcome)] = outcome;
            result.MissingInCandidate += before.Keys.Count(k => !after.ContainsKey(k));
            result.MissingInBaseline += after.Keys.Count(k => !before.ContainsKey(k));
            foreach (string missing in before.Keys.Where(k => !after.ContainsKey(k)).Take(10)) result.Messages.Add("Missing in candidate: " + missing);
            foreach (string missing in after.Keys.Where(k => !before.ContainsKey(k)).Take(10)) result.Messages.Add("Missing in baseline: " + missing);

            List<string> common = before.Keys.Where(after.ContainsKey).OrderBy(k => k, StringComparer.Ordinal).ToList();
            if (common.Count == 0) return;
            bool deterministic = baseline.Deterministic && candidate.Deterministic;

            foreach (IGrouping<string, string> arm in common.GroupBy(k => before[k].Arm))
            {
                List<string> keys = arm.ToList();
                QualityRow(result, "quality", arm.Key + " pass rate", keys.Select(k => before[k].Score).ToList(), keys.Select(k => after[k].Score).ToList(), options, StableHash.Seed(options.Seed, arm.Key));
                foreach (IGrouping<string, string> type in keys.GroupBy(k => before[k].Type).OrderBy(g => g.Key, StringComparer.Ordinal))
                {
                    List<string> typeKeys = type.ToList();
                    QualityRow(result, "quality", arm.Key + " pass rate, type " + type.Key + (typeKeys.Count < Bootstrap.IndicativeBelow ? " (indicative, n " + typeKeys.Count + ")" : String.Empty), typeKeys.Select(k => before[k].Score).ToList(), typeKeys.Select(k => after[k].Score).ToList(), options, StableHash.Seed(options.Seed, arm.Key + "/" + type.Key));
                }
            }

            foreach (string key in common)
            {
                ProbeOutcome a = before[key];
                ProbeOutcome b = after[key];
                if (a.Passed == b.Passed) continue;
                CompareRow row = new CompareRow();
                row.Section = "probe";
                row.Name = key;
                row.Baseline = a.Score;
                row.Candidate = b.Score;
                row.Delta = b.Score - a.Score;
                if (a.Passed && !b.Passed)
                {
                    row.Evidence = deterministic ? "deterministic probe flipped from pass to fail: " + String.Join("; ", b.Failures) : String.Join("; ", b.Failures);
                    row.Verdict = deterministic ? "regression" : "info";
                }
                else
                {
                    row.Evidence = "now passes";
                    row.Verdict = "improvement";
                }
                result.Rows.Add(row);
            }
        }

        private static void QualityRow(CompareResult result, string section, string name, List<double> before, List<double> after, ComparisonOptions options, int seed)
        {
            PairedDifference diff = Bootstrap.PairedDiff(before, after, options.Resamples, seed);
            CompareRow row = new CompareRow();
            row.Section = section;
            row.Name = name;
            row.Baseline = before.Count == 0 ? 0 : before.Average();
            row.Candidate = after.Count == 0 ? 0 : after.Average();
            row.Delta = row.Candidate - row.Baseline;
            row.Evidence = "paired diff 95% CI [" + ReportWriter.N(diff.Interval.Lower, "0.####") + ", " + ReportWriter.N(diff.Interval.Upper, "0.####") + "], p " + ReportWriter.N(diff.PValue, "0.####");
            bool significant = diff.Interval.Upper < 0 || diff.PValue < options.Alpha;
            if (row.Delta.Value < -options.Tolerance && significant) row.Verdict = "regression";
            else if (row.Delta.Value > options.Tolerance && (diff.Interval.Lower > 0 || diff.PValue < options.Alpha)) row.Verdict = "improvement";
            else row.Verdict = "ok";
            result.Rows.Add(row);
        }

        private static void CompareLatency(BenchmarkReport baseline, BenchmarkReport candidate, ComparisonOptions options, CompareResult result)
        {
            foreach (ArmSummary b in baseline.Arms)
            {
                ArmSummary? c = candidate.Arms.FirstOrDefault(a => a.Name == b.Name);
                if (c == null) continue;
                if (b.Latency != null && c.Latency != null) LatencyRow(result, b.Name + " latency p95 (ms)", b.Latency, c.Latency, options);
                foreach (string timing in new string[] { "overheadMs", "serverOverheadMs", "queueMs", "eventPersistMs", "streamMs" })
                {
                    if (b.Timings.TryGetValue(timing, out LatencyStatistics? bt) && c.Timings.TryGetValue(timing, out LatencyStatistics? ct)) LatencyRow(result, b.Name + " " + timing + " p95", bt, ct, options);
                }
            }
        }

        private static void LatencyRow(CompareResult result, string name, LatencyStatistics before, LatencyStatistics after, ComparisonOptions options)
        {
            CompareRow row = new CompareRow();
            row.Section = "latency";
            row.Name = name;
            row.Baseline = before.P95;
            row.Candidate = after.P95;
            row.Delta = after.P95 - before.P95;
            bool separated = before.P95Ci != null && after.P95Ci != null && after.P95Ci.Lower > before.P95Ci.Upper;
            bool improved = before.P95Ci != null && after.P95Ci != null && after.P95Ci.Upper < before.P95Ci.Lower;
            row.Evidence = "p95 CI " + (before.P95Ci == null ? "n/a" : "[" + ReportWriter.N(before.P95Ci.Lower, "F1") + ", " + ReportWriter.N(before.P95Ci.Upper, "F1") + "]")
                + " to " + (after.P95Ci == null ? "n/a" : "[" + ReportWriter.N(after.P95Ci.Lower, "F1") + ", " + ReportWriter.N(after.P95Ci.Upper, "F1") + "]");
            if (after.P95 > before.P95 * (1 + options.LatencyTolerance) && separated) row.Verdict = "regression";
            else if (after.P95 < before.P95 * (1 - options.LatencyTolerance) && improved) row.Verdict = "improvement";
            else row.Verdict = "ok";
            result.Rows.Add(row);
        }

        private static void CompareLoad(BenchmarkReport baseline, BenchmarkReport candidate, ComparisonOptions options, CompareResult result)
        {
            if (baseline.LoadLevels.Count == 0 && candidate.LoadLevels.Count == 0) return;
            Dictionary<string, LoadLevelResult> before = baseline.LoadLevels.ToDictionary(l => l.Arm + "." + l.Mode + "." + HeadlineMetrics.LevelKey(l), StringComparer.Ordinal);
            Dictionary<string, LoadLevelResult> after = candidate.LoadLevels.ToDictionary(l => l.Arm + "." + l.Mode + "." + HeadlineMetrics.LevelKey(l), StringComparer.Ordinal);
            result.MissingInCandidate += before.Keys.Count(k => !after.ContainsKey(k));
            result.MissingInBaseline += after.Keys.Count(k => !before.ContainsKey(k));
            foreach (string key in before.Keys.Where(after.ContainsKey).OrderBy(k => k, StringComparer.Ordinal))
            {
                LoadLevelResult b = before[key];
                LoadLevelResult c = after[key];
                CompareRow errors = new CompareRow();
                errors.Section = "load";
                errors.Name = key + " failed operations";
                errors.Baseline = b.Failed;
                errors.Candidate = c.Failed;
                errors.Delta = c.Failed - b.Failed;
                errors.Evidence = "any new failure in a level that had none";
                errors.Verdict = b.Failed == 0 && c.Failed > 0 ? "regression" : "ok";
                result.Rows.Add(errors);
                if (!options.CompareLatency) continue;

                CompareRow row = new CompareRow();
                row.Section = "load";
                row.Name = key + " throughput (ops/s)";
                row.Baseline = b.Throughput;
                row.Candidate = c.Throughput;
                row.Delta = c.Throughput - b.Throughput;
                bool separated = b.ThroughputCi != null && c.ThroughputCi != null && c.ThroughputCi.Upper < b.ThroughputCi.Lower;
                row.Evidence = "per-second CI " + (b.ThroughputCi == null ? "n/a" : "[" + ReportWriter.N(b.ThroughputCi.Lower, "F2") + ", " + ReportWriter.N(b.ThroughputCi.Upper, "F2") + "]")
                    + " to " + (c.ThroughputCi == null ? "n/a" : "[" + ReportWriter.N(c.ThroughputCi.Lower, "F2") + ", " + ReportWriter.N(c.ThroughputCi.Upper, "F2") + "]");
                row.Verdict = c.Throughput < b.Throughput * (1 - options.ThroughputTolerance) && separated ? "regression" : "ok";
                result.Rows.Add(row);
                if (b.Latency != null && c.Latency != null) LatencyRow(result, key + " latency p95 (ms)", b.Latency, c.Latency, options);
            }
        }

        private static void CompareIngest(BenchmarkReport baseline, BenchmarkReport candidate, ComparisonOptions options, CompareResult result)
        {
            if (baseline.Ingest == null || candidate.Ingest == null) return;
            IngestSummary b = baseline.Ingest;
            IngestSummary c = candidate.Ingest;
            Exact(result, "ingest", "failed documents", b.Failed, c.Failed, c.Failed > b.Failed);
            Exact(result, "ingest", "apply requests without a result", b.RequestErrors, c.RequestErrors, c.RequestErrors > b.RequestErrors);
            Exact(result, "ingest", "reachability", b.Reachability, c.Reachability, c.Reachability < b.Reachability);
            Exact(result, "ingest", "idempotent re-apply share", b.ReapplyUnchangedRate, c.ReapplyUnchangedRate, c.ReapplyUnchangedRate < b.ReapplyUnchangedRate);
            if (!options.CompareLatency || baseline.Deterministic && candidate.Deterministic) return;
            CompareRow rate = new CompareRow();
            rate.Section = "ingest";
            rate.Name = "documents per second";
            rate.Baseline = b.DocumentsPerSecond;
            rate.Candidate = c.DocumentsPerSecond;
            rate.Delta = c.DocumentsPerSecond - b.DocumentsPerSecond;
            rate.Evidence = "tolerance only (one rate per run, no interval)";
            rate.Verdict = c.DocumentsPerSecond < b.DocumentsPerSecond * (1 - options.ThroughputTolerance) ? "regression" : "ok";
            result.Rows.Add(rate);
            if (b.ApplyLatency != null && c.ApplyLatency != null) LatencyRow(result, "apply latency p95 (ms)", b.ApplyLatency, c.ApplyLatency, options);
        }

        private static void CompareResilience(BenchmarkReport baseline, BenchmarkReport candidate, CompareResult result)
        {
            foreach (ResilienceScenarioResult b in baseline.Scenarios.Where(s => !s.Skipped))
            {
                ResilienceScenarioResult? c = candidate.Scenarios.FirstOrDefault(s => s.Name == b.Name);
                if (c == null || c.Skipped)
                {
                    result.MissingInCandidate++;
                    continue;
                }
                Exact(result, "resilience", b.Name + " passed", b.Passed ? 1 : 0, c.Passed ? 1 : 0, b.Passed && !c.Passed);
                Exact(result, "resilience", b.Name + " lost runs", b.RunsLost, c.RunsLost, c.RunsLost > b.RunsLost);
            }
        }

        private static void Exact(CompareResult result, string section, string name, double before, double after, bool regressed)
        {
            CompareRow row = new CompareRow();
            row.Section = section;
            row.Name = name;
            row.Baseline = before;
            row.Candidate = after;
            row.Delta = after - before;
            row.Evidence = "exact (correctness)";
            row.Verdict = regressed ? "regression" : "ok";
            result.Rows.Add(row);
        }

        private static string Value(double? value)
        {
            return value.HasValue ? ReportWriter.N(value.Value, "0.####") : String.Empty;
        }

        private static string Short(string text)
        {
            return text.Length > 12 ? text.Substring(0, 12) : text;
        }

        #endregion
    }
}
