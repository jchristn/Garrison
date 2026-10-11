namespace Garrison.Benchmark.Runners
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Text;
    using System.Threading;
    using System.Threading.Tasks;
    using Garrison.Benchmark.Reporting;

    /// <summary>
    /// The history command: one table per report kind and dataset with every headline metric (overall and per probe
    /// type) for each round, the net change from the first round to the last, the probe counts, and the published or
    /// prior baselines with the net difference against the latest round. Round selectors accept a run label or a UTC
    /// timestamp prefix of the report file name. Saved as &lt;utc&gt;-history.md next to the reports.
    /// </summary>
    public static class HistoryRunner
    {
        /// <summary>
        /// Run the command.
        /// </summary>
        /// <param name="context">Context.</param>
        /// <param name="token">Cancellation token.</param>
        /// <returns>0 on success, 1 when no report matched, 2 on bad usage.</returns>
        /// <exception cref="ArgumentNullException">Thrown when context is null.</exception>
        public static async Task<int> RunAsync(BenchmarkContext context, CancellationToken token)
        {
            if (context == null) throw new ArgumentNullException(nameof(context));
            List<string> rounds = context.Args.GetList("rounds", String.Empty);
            List<string> kinds = context.Args.GetList("kinds", String.Empty);
            string directory = context.ResolvePath(context.Args.GetString("dir", context.ResultsDirectory));
            if (rounds.Count == 0)
            {
                Console.Error.WriteLine("history needs --rounds R0=<label or utc prefix>,R1=<...>.");
                return 2;
            }

            List<KeyValuePair<string, string>> selectors = new List<KeyValuePair<string, string>>();
            foreach (string round in rounds)
            {
                int eq = round.IndexOf('=');
                selectors.Add(eq > 0 ? new KeyValuePair<string, string>(round.Substring(0, eq), round.Substring(eq + 1)) : new KeyValuePair<string, string>(round, round));
            }

            List<ReportFile> reports = new List<ReportFile>();
            foreach (string path in Directory.Exists(directory) ? Directory.GetFiles(directory, "*.json") : new string[0])
            {
                string file = Path.GetFileName(path);
                if (file.Contains("-compare-", StringComparison.Ordinal)) continue;
                try
                {
                    BenchmarkReport report = ReportWriter.Read(path);
                    if (kinds.Count > 0 && !kinds.Contains(report.Kind)) continue;
                    ReportFile entry = new ReportFile();
                    entry.Path = path;
                    entry.File = file;
                    entry.Report = report;
                    reports.Add(entry);
                }
                catch (InvalidDataException)
                {
                }
            }

            PublishedBaselines baselines = BaselineMatcher.Load(Path.Combine(context.Root, "benchmarks", "baselines.json"));
            StringBuilder md = new StringBuilder();
            md.Append("# Benchmark history\n\nRounds: ").Append(String.Join(", ", selectors.Select(s => s.Key + " = " + s.Value))).Append(". Generated ").Append(DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm", CultureInfo.InvariantCulture)).Append(" UTC by `Garrison.Benchmark history`.\n\n");
            int tables = 0;
            foreach (IGrouping<string, ReportFile> group in reports.GroupBy(r => r.Report.Kind + "/" + r.Report.Dataset).OrderBy(g => g.Key, StringComparer.Ordinal))
            {
                List<ReportFile?> columns = new List<ReportFile?>();
                foreach (KeyValuePair<string, string> selector in selectors)
                {
                    ReportFile? match = group
                        .Where(r => r.Report.Label == selector.Value || r.File.StartsWith(selector.Value, StringComparison.Ordinal))
                        .OrderByDescending(r => r.File, StringComparer.Ordinal)
                        .FirstOrDefault();
                    columns.Add(match);
                }
                if (columns.All(c => c == null)) continue;
                tables++;
                List<SortedDictionary<string, double>> metrics = columns.Select(c => c == null ? new SortedDictionary<string, double>() : HeadlineMetrics.From(c.Report)).ToList();
                List<string> keys = metrics.SelectMany(m => m.Keys).Distinct(StringComparer.Ordinal).OrderBy(k => k, StringComparer.Ordinal).ToList();
                ReportFile latest = columns.Last(c => c != null)!;
                Dictionary<string, int> typeCounts = latest.Report.Outcomes.Where(o => o.Arm == "garrison").GroupBy(o => o.Type).ToDictionary(g => g.Key, g => g.Count(), StringComparer.Ordinal);

                md.Append("## ").Append(group.Key).Append("\n\n| Metric | n |");
                foreach (KeyValuePair<string, string> selector in selectors) md.Append(' ').Append(selector.Key).Append(" |");
                md.Append(" Net (first to last) |\n|---|---|");
                foreach (KeyValuePair<string, string> selector in selectors) md.Append("---|");
                md.Append("---|\n");
                foreach (string key in keys)
                {
                    string n = String.Empty;
                    int typeIndex = key.IndexOf(".passRate.type.", StringComparison.Ordinal);
                    if (typeIndex > 0 && typeCounts.TryGetValue(key.Substring(typeIndex + 15), out int count)) n = count < 20 ? count + " (indicative)" : count.ToString(CultureInfo.InvariantCulture);
                    md.Append("| ").Append(key).Append(" | ").Append(n).Append(" |");
                    double? first = null;
                    double? last = null;
                    foreach (SortedDictionary<string, double> round in metrics)
                    {
                        if (round.TryGetValue(key, out double value))
                        {
                            md.Append(' ').Append(ReportWriter.N(value, "0.###")).Append(" |");
                            if (!first.HasValue) first = value;
                            last = value;
                        }
                        else md.Append(" |");
                    }
                    md.Append(' ').Append(first.HasValue && last.HasValue ? (last.Value - first.Value >= 0 ? "+" : String.Empty) + ReportWriter.N(last.Value - first.Value, "0.###") : String.Empty).Append(" |\n");
                }
                md.Append("\nReports: ").Append(String.Join(", ", selectors.Select((s, i) => s.Key + " " + (columns[i] == null ? "(none)" : "`" + columns[i]!.File + "`")))).Append("\n\n");

                BenchmarkReport copy = latest.Report;
                BaselineMatcher.Apply(copy, baselines);
                if (copy.Baselines.Count > 0)
                {
                    md.Append("Baselines against the latest round:\n\n| Metric | Source | Baseline | Latest | Net |\n|---|---|---|---|---|\n");
                    foreach (BaselineComparison b in copy.Baselines)
                        md.Append("| ").Append(b.Metric).Append(" | ").Append(ReportWriter.Cell(b.Source)).Append(" | ").Append(b.Baseline.HasValue ? ReportWriter.N(b.Baseline.Value, "0.###") : "none").Append(" | ").Append(b.Ours.HasValue ? ReportWriter.N(b.Ours.Value, "0.###") : "n/a").Append(" | ").Append(b.Delta.HasValue ? ReportWriter.N(b.Delta.Value, "+0.###;-0.###;0") : "n/a").Append(" |\n");
                    md.Append('\n');
                }
            }
            if (tables == 0)
            {
                Console.Error.WriteLine("No report in " + directory + " matched the rounds " + String.Join(", ", selectors.Select(s => s.Value)) + ".");
                return 1;
            }
            string output = Path.Combine(context.ResultsDirectory, DateTime.UtcNow.ToString("yyyyMMdd-HHmmss", CultureInfo.InvariantCulture) + "-history.md");
            Directory.CreateDirectory(context.ResultsDirectory);
            await File.WriteAllTextAsync(output, md.ToString(), ReportWriter.Utf8NoBom, token).ConfigureAwait(false);
            Console.Out.WriteLine(md.ToString());
            BenchmarkContext.Log("history: " + context.Relative(output));
            return 0;
        }
    }
}
