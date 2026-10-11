namespace Garrison.Benchmark.Reporting
{
    using System;
    using System.Collections.Generic;
    using System.IO;
    using System.Linq;
    using System.Text.Json;
    using Garrison.Benchmark.Client;

    /// <summary>
    /// Adds the applicable entries of benchmarks/baselines.json to a report, each with the net difference from this
    /// run's value of the same headline metric. Stateless and thread-safe.
    /// </summary>
    public static class BaselineMatcher
    {
        /// <summary>
        /// Read baselines.json; an absent file gives an empty set.
        /// </summary>
        /// <param name="path">Path.</param>
        /// <returns>Baselines.</returns>
        /// <exception cref="InvalidDataException">Thrown when the file is not valid.</exception>
        public static PublishedBaselines Load(string path)
        {
            if (!File.Exists(path)) return new PublishedBaselines();
            try
            {
                return JsonSerializer.Deserialize<PublishedBaselines>(File.ReadAllText(path), JsonDefaults.Compact) ?? new PublishedBaselines();
            }
            catch (JsonException e)
            {
                throw new InvalidDataException(path + " is not a valid baselines file: " + e.Message, e);
            }
        }

        /// <summary>
        /// Entries that apply to a dataset and report kind.
        /// </summary>
        /// <param name="baselines">Baselines.</param>
        /// <param name="dataset">Dataset.</param>
        /// <param name="kind">Report kind.</param>
        /// <returns>Entries.</returns>
        /// <exception cref="ArgumentNullException">Thrown when baselines is null.</exception>
        public static List<PublishedDatasetBaselines> Applicable(PublishedBaselines baselines, string dataset, string kind)
        {
            if (baselines == null) throw new ArgumentNullException(nameof(baselines));
            return baselines.Datasets.Where(d => (d.Dataset == "*" || d.Dataset == dataset) && (d.Kinds.Count == 0 || d.Kinds.Contains(kind))).ToList();
        }

        /// <summary>
        /// Fill report.Baselines.
        /// </summary>
        /// <param name="report">Report.</param>
        /// <param name="baselines">Baselines.</param>
        /// <exception cref="ArgumentNullException">Thrown when an argument is null.</exception>
        public static void Apply(BenchmarkReport report, PublishedBaselines baselines)
        {
            if (report == null) throw new ArgumentNullException(nameof(report));
            if (baselines == null) throw new ArgumentNullException(nameof(baselines));
            SortedDictionary<string, double> metrics = HeadlineMetrics.From(report);
            report.Baselines.Clear();
            List<PublishedDatasetBaselines> entries = Applicable(baselines, report.Dataset, report.Kind);
            foreach (PublishedDatasetBaselines entry in entries)
            {
                if (entry.Results.Count == 0)
                {
                    BaselineComparison none = new BaselineComparison();
                    none.Metric = "(all)";
                    none.Source = "no comparable published result";
                    none.Note = entry.Note;
                    report.Baselines.Add(none);
                    continue;
                }
                foreach (PublishedResult result in entry.Results)
                {
                    BaselineComparison row = new BaselineComparison();
                    row.Metric = result.Metric;
                    row.Source = result.Source;
                    row.Link = result.Link;
                    row.Baseline = result.Value;
                    row.Note = result.Note ?? entry.Note;
                    if (metrics.TryGetValue(result.Metric, out double ours))
                    {
                        row.Ours = ours;
                        if (result.Value.HasValue) row.Delta = ours - result.Value.Value;
                    }
                    report.Baselines.Add(row);
                }
            }
        }
    }
}
