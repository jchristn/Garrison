namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Text;
    using System.Text.Json;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Client;
    using Garrison.Benchmark.Metrics;

    /// <summary>
    /// Writes a report as a JSON file for machines and a Markdown file for people, with the same base name
    /// (&lt;yyyyMMdd-HHmmss UTC&gt;-&lt;kind&gt;-&lt;dataset&gt;[-&lt;label&gt;]), UTF-8 without a byte order mark.
    /// The Markdown opens with an incomplete-run banner when needed, then provenance. Stateless and thread-safe.
    /// </summary>
    public static class ReportWriter
    {
        #region Public-Members

        /// <summary>
        /// UTF-8 without a byte order mark.
        /// </summary>
        public static readonly Encoding Utf8NoBom = new UTF8Encoding(false);

        #endregion

        #region Public-Methods

        /// <summary>
        /// Base file name of a report.
        /// </summary>
        /// <param name="report">Report.</param>
        /// <returns>Base name without extension.</returns>
        /// <exception cref="ArgumentNullException">Thrown when report is null.</exception>
        public static string BaseName(BenchmarkReport report)
        {
            if (report == null) throw new ArgumentNullException(nameof(report));
            string name = report.Provenance.StartedUtc.ToString("yyyyMMdd-HHmmss", CultureInfo.InvariantCulture) + "-" + report.Kind + "-" + report.Dataset;
            if (!String.IsNullOrEmpty(report.Label)) name += "-" + report.Label;
            return name;
        }

        /// <summary>
        /// Write both files.
        /// </summary>
        /// <param name="report">Report.</param>
        /// <param name="directory">Directory (created when missing).</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>Path of the JSON file.</returns>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static async Task<string> WriteAsync(BenchmarkReport report, string directory, CancellationToken token)
        {
            if (report == null) throw new ArgumentNullException(nameof(report));
            if (directory == null) throw new ArgumentNullException(nameof(directory));
            Directory.CreateDirectory(directory);
            string basePath = Path.Combine(directory, BaseName(report));
            await File.WriteAllTextAsync(basePath + ".json", JsonSerializer.Serialize(report, JsonDefaults.Indented), Utf8NoBom, token).ConfigureAwait(false);
            await File.WriteAllTextAsync(basePath + ".md", Markdown(report), Utf8NoBom, token).ConfigureAwait(false);
            return basePath + ".json";
        }

        /// <summary>
        /// Read a JSON report.
        /// </summary>
        /// <param name="path">Path.</param>
        /// <returns>Report.</returns>
        /// <exception cref="FileNotFoundException">Thrown when the file does not exist.</exception>
        /// <exception cref="InvalidDataException">Thrown when the file is not a report.</exception>
        public static BenchmarkReport Read(string path)
        {
            if (!File.Exists(path)) throw new FileNotFoundException("Report not found: " + path, path);
            try
            {
                BenchmarkReport? report = JsonSerializer.Deserialize<BenchmarkReport>(File.ReadAllText(path), JsonDefaults.Compact);
                if (report == null || String.IsNullOrEmpty(report.Kind)) throw new InvalidDataException(path + " is not a benchmark report.");
                return report;
            }
            catch (JsonException e)
            {
                throw new InvalidDataException(path + " is not a valid benchmark report: " + e.Message, e);
            }
        }

        /// <summary>
        /// Render the Markdown report.
        /// </summary>
        /// <param name="report">Report.</param>
        /// <returns>Markdown.</returns>
        /// <exception cref="ArgumentNullException">Thrown when report is null.</exception>
        public static string Markdown(BenchmarkReport report)
        {
            if (report == null) throw new ArgumentNullException(nameof(report));
            StringBuilder md = new StringBuilder();
            md.Append("# ").Append(Title(report.Kind)).Append(": ").Append(report.Dataset);
            if (!String.IsNullOrEmpty(report.Label)) md.Append(" (").Append(report.Label).Append(')');
            md.Append("\n\n");
            if (report.Incomplete) md.Append("**Incomplete run: ").Append(report.IncompleteReason ?? "some input failed").Append(". These results are not comparable.**\n\n");

            Provenance(md, report);
            Arms(md, report);
            Ingest(md, report);
            Load(md, report);
            ScaleMarkdown.Append(md, report.Scale);
            Resilience(md, report);
            Stages(md, report.Stages, "Server stage breakdown (whole run)");
            Baselines(md, report);
            Misses(md, report);
            if (report.Notes.Count > 0)
            {
                md.Append("## Notes\n\n");
                foreach (string note in report.Notes) md.Append("- ").Append(note).Append('\n');
                md.Append('\n');
            }
            Options(md, report);
            return md.ToString();
        }

        /// <summary>
        /// Format a number with invariant culture.
        /// </summary>
        /// <param name="value">Value.</param>
        /// <param name="format">Format, for example F1.</param>
        /// <returns>Text.</returns>
        public static string N(double value, string format)
        {
            return value.ToString(format, CultureInfo.InvariantCulture);
        }

        /// <summary>
        /// Escape pipe characters for a Markdown table cell.
        /// </summary>
        /// <param name="text">Text.</param>
        /// <returns>Escaped text.</returns>
        public static string Cell(string? text)
        {
            if (String.IsNullOrEmpty(text)) return String.Empty;
            return text.Replace("|", "\\|", StringComparison.Ordinal).Replace('\n', ' ').Replace('\r', ' ');
        }

        #endregion

        #region Private-Methods

        private static string Title(string kind)
        {
            switch (kind)
            {
                case "e2e": return "End-to-end report";
                case "routing": return "Routing report";
                case "ingest": return "Ingest report";
                case "load": return "Load report";
                case "resilience": return "Resilience report";
                case "scale": return "Scale report";
                default: return kind + " report";
            }
        }

        private static void Provenance(StringBuilder md, BenchmarkReport report)
        {
            ReportProvenance p = report.Provenance;
            md.Append("## Provenance\n\n| Field | Value |\n|---|---|\n");
            Row(md, "Started (UTC)", p.StartedUtc.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture));
            Row(md, "Finished (UTC)", p.FinishedUtc.ToString("yyyy-MM-dd HH:mm:ss", CultureInfo.InvariantCulture));
            Row(md, "System under test", p.SutUrl + (p.SutVersion == null ? String.Empty : " (server " + p.SutVersion + ")"));
            Row(md, "Stack", p.Stack + (String.IsNullOrEmpty(p.StackDetails) ? String.Empty : ": " + p.StackDetails));
            Row(md, "Product commit", p.ProductCommit + (p.ProductDirtyFiles > 0 ? " (" + p.ProductDirtyFiles + " changed or untracked paths)" : String.Empty));
            Row(md, "Harness", "Garrison.Benchmark " + p.HarnessVersion + ", commit " + p.HarnessCommit);
            Row(md, "Machine", p.MachineName + ", " + p.Os + ", " + p.Cpu + ", " + p.Cores + " logical processors");
            Row(md, "Runtime", p.Runtime);
            Row(md, "HTTP client", p.HttpClient);
            Row(md, "Dataset", p.DatasetName + (p.DatasetPath == null ? String.Empty : " (" + p.DatasetPath + ")"));
            Row(md, "Dataset SHA-256", p.DatasetSha256);
            Row(md, "External services", String.Join("; ", p.ExternalServices));
            Row(md, "Shared machine", p.SharedMachine ?? "not recorded (pass --shared-note)");
            Row(md, "Seed", p.Seed.ToString(CultureInfo.InvariantCulture));
            Row(md, "Deterministic", report.Deterministic ? "yes (no wall-clock value is scored)" : "no");
            Row(md, "Command line", "`" + p.CommandLine + "`");
            md.Append('\n');
            if (p.Images.Count > 0)
            {
                md.Append("### Images\n\n| Pod | Container | Image | Image ID |\n|---|---|---|---|\n");
                foreach (ImageDigest image in p.Images) md.Append("| ").Append(Cell(image.Pod)).Append(" | ").Append(Cell(image.Container)).Append(" | ").Append(Cell(image.Image)).Append(" | ").Append(Cell(image.ImageId)).Append(" |\n");
                md.Append('\n');
            }
        }

        private static void Arms(StringBuilder md, BenchmarkReport report)
        {
            if (report.Arms.Count == 0) return;
            md.Append("## Summary\n\n| Arm | Outcomes | Passed | Errors | Pass rate [95% CI] | Latency p50 [95% CI] (ms) | p95 [95% CI] (ms) |\n|---|---|---|---|---|---|---|\n");
            foreach (ArmSummary arm in report.Arms)
            {
                md.Append("| ").Append(arm.Name).Append(" | ").Append(arm.Probes).Append(" | ").Append(arm.Passed).Append(" | ").Append(arm.Errors)
                    .Append(" | ").Append(arm.PassRate == null ? "n/a" : arm.PassRate.Format("F3"))
                    .Append(" | ").Append(arm.Latency?.P50Ci == null ? (arm.Latency == null ? "n/a" : N(arm.Latency.P50, "F1")) : arm.Latency.P50Ci.Format("F1"))
                    .Append(" | ").Append(arm.Latency?.P95Ci == null ? (arm.Latency == null ? "n/a" : N(arm.Latency.P95, "F1")) : arm.Latency.P95Ci.Format("F1"))
                    .Append(" |\n");
            }
            md.Append('\n');
            foreach (ArmSummary arm in report.Arms.Where(a => !String.IsNullOrEmpty(a.Description)))
                md.Append("- **").Append(arm.Name).Append("**: ").Append(arm.Description).Append('\n');
            md.Append('\n');

            foreach (ArmSummary arm in report.Arms.Where(a => a.Timings.Count > 0))
            {
                md.Append("### Timings, ").Append(arm.Name).Append(" (passed outcomes, ms)\n\n");
                Distributions(md, arm.Timings);
            }
            foreach (ArmSummary arm in report.Arms)
            {
                if (arm.ByType.Count > 1)
                {
                    md.Append("### By probe type, ").Append(arm.Name).Append("\n\n");
                    GroupTable(md, arm.ByType, "Type");
                }
                if (arm.ByCategory.Count > 1)
                {
                    md.Append("### By category, ").Append(arm.Name).Append("\n\n");
                    GroupTable(md, arm.ByCategory, "Category");
                }
            }
        }

        private static void Distributions(StringBuilder md, IDictionary<string, LatencyStatistics> timings)
        {
            md.Append("| Measure | n | mean | p50 [95% CI] | p90 | p95 [95% CI] | p99 | max |\n|---|---|---|---|---|---|---|---|\n");
            foreach (KeyValuePair<string, LatencyStatistics> timing in timings)
            {
                LatencyStatistics s = timing.Value;
                md.Append("| ").Append(timing.Key).Append(" | ").Append(s.Count).Append(" | ").Append(N(s.Mean, "F1"))
                    .Append(" | ").Append(s.P50Ci == null ? N(s.P50, "F1") : s.P50Ci.Format("F1"))
                    .Append(" | ").Append(N(s.P90, "F1"))
                    .Append(" | ").Append(s.P95Ci == null ? N(s.P95, "F1") : s.P95Ci.Format("F1"))
                    .Append(" | ").Append(N(s.P99, "F1")).Append(" | ").Append(N(s.Max, "F1")).Append(" |\n");
            }
            md.Append('\n');
        }

        private static void GroupTable(StringBuilder md, List<GroupSummary> groups, string header)
        {
            md.Append("| ").Append(header).Append(" | n | Passed | Pass rate [95% CI] |\n|---|---|---|---|\n");
            foreach (GroupSummary group in groups)
                md.Append("| ").Append(Cell(group.Key)).Append(" | ").Append(group.N).Append(" | ").Append(group.Passed).Append(" | ").Append(group.PassRate == null ? "n/a" : group.PassRate.Format("F3")).Append(" |\n");
            md.Append('\n');
        }

        private static void Ingest(StringBuilder md, BenchmarkReport report)
        {
            IngestSummary? i = report.Ingest;
            if (i == null) return;
            md.Append("## Load path\n\n| Measure | Value |\n|---|---|\n");
            Row(md, "Documents", i.Documents + " in " + i.Applies + " applies of up to " + i.BatchSize);
            Row(md, "Created / updated / unchanged / failed", i.Created + " / " + i.Updated + " / " + i.Unchanged + " / " + i.Failed);
            Row(md, "Apply requests without a result", i.RequestErrors.ToString(CultureInfo.InvariantCulture));
            Row(md, "Documents per second", N(i.DocumentsPerSecond, "F1"));
            if (i.ApplyLatency != null) Row(md, "Apply latency p50 / p95 / max (ms)", N(i.ApplyLatency.P50, "F1") + " / " + N(i.ApplyLatency.P95, "F1") + " / " + N(i.ApplyLatency.Max, "F1"));
            Row(md, "Idempotent re-apply (share Unchanged)", N(i.ReapplyUnchangedRate, "F3"));
            if (i.ReapplyLatency != null) Row(md, "Re-apply latency p50 / p95 (ms)", N(i.ReapplyLatency.P50, "F1") + " / " + N(i.ReapplyLatency.P95, "F1"));
            if (i.DryRunMs > 0) Row(md, "Dry run of the whole corpus (ms)", N(i.DryRunMs, "F1"));
            Row(md, "Reachability (agents readable by name)", i.Reachable + " of " + i.AgentDocuments + " (" + N(i.Reachability, "F3") + ")");
            md.Append('\n');
        }

        private static void Load(StringBuilder md, BenchmarkReport report)
        {
            if (report.LoadLevels.Count == 0) return;
            md.Append("## Load\n\n| Arm | Mode | Workers | Slots | Load | Started | Succeeded | Failed | Throughput (ops/s) [95% CI] | p50 (ms) | p95 [95% CI] (ms) | p99 (ms) | queue p50 (ms) |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n");
            foreach (LoadLevelResult level in report.LoadLevels)
            {
                string load = level.Mode == "open" ? N(level.TargetRate, "0.##") + "/s" : "c" + level.Concurrency.ToString(CultureInfo.InvariantCulture);
                level.Timings.TryGetValue("queueMs", out LatencyStatistics? queue);
                md.Append("| ").Append(level.Arm).Append(" | ").Append(level.Mode).Append(" | ").Append(level.Workers).Append(" | ").Append(level.Slots).Append(" | ").Append(load)
                    .Append(" | ").Append(level.Started).Append(" | ").Append(level.Succeeded).Append(" | ").Append(level.Failed)
                    .Append(" | ").Append(level.ThroughputCi == null ? N(level.Throughput, "F2") : N(level.Throughput, "F2") + " [" + N(level.ThroughputCi.Lower, "F2") + ", " + N(level.ThroughputCi.Upper, "F2") + "]")
                    .Append(" | ").Append(level.Latency == null ? "n/a" : N(level.Latency.P50, "F1"))
                    .Append(" | ").Append(level.Latency == null ? "n/a" : (level.Latency.P95Ci == null ? N(level.Latency.P95, "F1") : level.Latency.P95Ci.Format("F1")))
                    .Append(" | ").Append(level.Latency == null ? "n/a" : N(level.Latency.P99, "F1"))
                    .Append(" | ").Append(queue == null ? "n/a" : N(queue.P50, "F1"))
                    .Append(" |\n");
            }
            md.Append('\n');
            List<LoadLevelResult> failing = report.LoadLevels.Where(l => l.FailuresByKind.Count > 0).ToList();
            if (failing.Count > 0)
            {
                md.Append("### Failures by kind\n\n| Arm | Level | Kind | Count |\n|---|---|---|---|\n");
                foreach (LoadLevelResult level in failing)
                    foreach (KeyValuePair<string, int> kind in level.FailuresByKind)
                        md.Append("| ").Append(level.Arm).Append(" | ").Append(HeadlineMetrics.LevelKey(level)).Append(" | ").Append(Cell(kind.Key)).Append(" | ").Append(kind.Value).Append(" |\n");
                md.Append('\n');
            }
            foreach (LoadLevelResult level in report.LoadLevels.Where(l => l.Timings.Count > 0))
            {
                md.Append("### Timings, ").Append(level.Arm).Append(' ').Append(HeadlineMetrics.LevelKey(level)).Append(" (successful operations, ms)\n\n");
                Distributions(md, level.Timings);
                if (level.Stages.Count > 0) Stages(md, level.Stages.Take(8).ToList(), null);
            }
        }

        private static void Resilience(StringBuilder md, BenchmarkReport report)
        {
            if (report.Scenarios.Count == 0) return;
            md.Append("## Resilience\n\n| Scenario | Result | Runs | Succeeded | Lost | Duplicates | Client errors | Unclean errors | Recovery (s) |\n|---|---|---|---|---|---|---|---|---|\n");
            foreach (ResilienceScenarioResult s in report.Scenarios)
            {
                string result = s.Skipped ? "skipped" : (s.Passed ? "pass" : "FAIL");
                md.Append("| ").Append(s.Name).Append(" | ").Append(result).Append(" | ").Append(s.RunsSubmitted).Append(" | ").Append(s.RunsSucceeded).Append(" | ").Append(s.RunsLost)
                    .Append(" | ").Append(s.DuplicateRuns).Append(" | ").Append(s.ClientErrors.Values.Sum()).Append(" | ").Append(s.UncleanErrors)
                    .Append(" | ").Append(s.RecoverySeconds < 0 ? "n/a" : N(s.RecoverySeconds, "F1")).Append(" |\n");
            }
            md.Append('\n');
            foreach (ResilienceScenarioResult s in report.Scenarios)
            {
                md.Append("### ").Append(s.Name).Append("\n\n").Append(s.Description).Append("\n\n");
                if (s.Skipped)
                {
                    md.Append("Skipped: ").Append(s.SkipReason).Append("\n\n");
                    continue;
                }
                foreach (string criterion in s.Criteria) md.Append("- ").Append(criterion).Append('\n');
                if (s.Outcomes.Count > 0) md.Append("- Outcomes: ").Append(String.Join(", ", s.Outcomes.Select(o => o.Key + " " + o.Value))).Append('\n');
                if (s.ClientErrors.Count > 0) md.Append("- Client errors: ").Append(String.Join(", ", s.ClientErrors.Select(o => o.Key + " " + o.Value))).Append('\n');
                md.Append('\n');
            }
        }

        private static void Stages(StringBuilder md, List<StageDelta> stages, string? title)
        {
            if (stages.Count == 0) return;
            if (title != null) md.Append("## ").Append(title).Append("\n\nFrom /metrics before and after; server-wide, so concurrent traffic and several replicas blur it.\n\n");
            md.Append("| Series | Count | Total | Mean | Unit |\n|---|---|---|---|---|\n");
            foreach (StageDelta stage in stages.Take(15))
                md.Append("| ").Append(Cell(stage.Series)).Append(" | ").Append(N(stage.Count, "F0")).Append(" | ").Append(N(stage.Total, "F1")).Append(" | ").Append(N(stage.Mean, "F2")).Append(" | ").Append(stage.Unit).Append(" |\n");
            md.Append('\n');
        }

        private static void Baselines(StringBuilder md, BenchmarkReport report)
        {
            if (report.Baselines.Count == 0) return;
            md.Append("## Published and prior baselines\n\n| Metric | Source | Baseline | This run | Net | Note |\n|---|---|---|---|---|---|\n");
            foreach (BaselineComparison b in report.Baselines)
            {
                md.Append("| ").Append(Cell(b.Metric)).Append(" | ").Append(Cell(b.Source)).Append(String.IsNullOrEmpty(b.Link) ? String.Empty : " (" + Cell(b.Link) + ")")
                    .Append(" | ").Append(b.Baseline.HasValue ? N(b.Baseline.Value, "0.###") : "none")
                    .Append(" | ").Append(b.Ours.HasValue ? N(b.Ours.Value, "0.###") : "n/a")
                    .Append(" | ").Append(b.Delta.HasValue ? (b.Delta.Value >= 0 ? "+" : String.Empty) + N(b.Delta.Value, "0.###") : "n/a")
                    .Append(" | ").Append(Cell(b.Note)).Append(" |\n");
            }
            md.Append('\n');
        }

        private static void Misses(StringBuilder md, BenchmarkReport report)
        {
            List<ProbeOutcome> misses = report.Outcomes.Where(o => !o.Passed).Take(25).ToList();
            if (misses.Count == 0) return;
            md.Append("## Misses\n\n| Arm | Probe | Repeat | Type | What went wrong | Observed |\n|---|---|---|---|---|---|\n");
            foreach (ProbeOutcome miss in misses)
            {
                md.Append("| ").Append(miss.Arm).Append(" | ").Append(miss.Corpus).Append('/').Append(miss.ProbeId).Append(" | ").Append(miss.Repeat).Append(" | ").Append(Cell(miss.Type))
                    .Append(" | ").Append(Cell(String.Join("; ", miss.Failures))).Append(" | ").Append(Cell(miss.Observed)).Append(" |\n");
            }
            int more = report.Outcomes.Count(o => !o.Passed) - misses.Count;
            if (more > 0) md.Append("\nAnd ").Append(more).Append(" more in the JSON report.\n");
            md.Append('\n');
        }

        private static void Options(StringBuilder md, BenchmarkReport report)
        {
            md.Append("## Options\n\n| Option | Value |\n|---|---|\n");
            foreach (KeyValuePair<string, string> option in report.Options) Row(md, "--" + option.Key, option.Value);
            md.Append('\n');
        }

        private static void Row(StringBuilder md, string name, string? value)
        {
            md.Append("| ").Append(Cell(name)).Append(" | ").Append(Cell(value)).Append(" |\n");
        }

        #endregion
    }
}
