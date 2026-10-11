namespace Garrison.Benchmark.Metrics
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Linq;

    /// <summary>
    /// The _sum and _count series of every histogram and summary in one Prometheus text scrape. Diffing two snapshots
    /// attributes server time to stages (BENCHMARKING.md, "Attribute time to stages"). The counters are server-wide and,
    /// behind a Service, come from whichever replica answered, so concurrent traffic or several replicas blur the
    /// breakdown. Not thread-safe; build once and read.
    /// </summary>
    public class PrometheusSnapshot
    {
        #region Public-Members

        /// <summary>
        /// Series value by series key (metric name with labels, without the _sum or _count suffix) and suffix.
        /// </summary>
        public Dictionary<string, double> Sums { get; } = new Dictionary<string, double>(StringComparer.Ordinal);

        /// <summary>
        /// Count series by series key.
        /// </summary>
        public Dictionary<string, double> Counts { get; } = new Dictionary<string, double>(StringComparer.Ordinal);

        /// <summary>
        /// When the scrape was taken (UTC).
        /// </summary>
        public DateTime TakenUtc { get; set; } = DateTime.UtcNow;

        #endregion

        #region Public-Methods

        /// <summary>
        /// Parse a text exposition.
        /// </summary>
        /// <param name="text">Scrape text; null or empty gives an empty snapshot.</param>
        /// <returns>Snapshot.</returns>
        public static PrometheusSnapshot Parse(string? text)
        {
            PrometheusSnapshot snapshot = new PrometheusSnapshot();
            if (String.IsNullOrEmpty(text)) return snapshot;
            using (StringReader reader = new StringReader(text))
            {
                string? line;
                while ((line = reader.ReadLine()) != null)
                {
                    if (line.Length == 0 || line[0] == '#') continue;
                    int brace = line.IndexOf('{');
                    int space = brace >= 0 ? line.IndexOf(' ', line.IndexOf('}', brace) + 1) : line.IndexOf(' ');
                    if (space <= 0) continue;
                    string series = line.Substring(0, space);
                    string rest = line.Substring(space + 1).Trim();
                    int valueEnd = rest.IndexOf(' ');
                    string valueText = valueEnd > 0 ? rest.Substring(0, valueEnd) : rest;
                    if (!Double.TryParse(valueText, NumberStyles.Float, CultureInfo.InvariantCulture, out double value)) continue;
                    string name = brace >= 0 ? series.Substring(0, brace) : series;
                    string labels = brace >= 0 ? StripScopeLabels(series.Substring(brace)) : String.Empty;
                    if (name.EndsWith("_sum", StringComparison.Ordinal)) snapshot.Sums[name.Substring(0, name.Length - 4) + labels] = value;
                    else if (name.EndsWith("_count", StringComparison.Ordinal)) snapshot.Counts[name.Substring(0, name.Length - 6) + labels] = value;
                }
            }
            return snapshot;
        }

        /// <summary>
        /// Difference from an earlier snapshot to this one, for series whose count grew, largest total time first.
        /// </summary>
        /// <param name="before">Earlier snapshot.</param>
        /// <param name="max">Most rows to return, 1 to 1000.</param>
        /// <returns>Stage rows.</returns>
        /// <exception cref="ArgumentNullException">Thrown when before is null.</exception>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when max is out of range.</exception>
        public List<StageDelta> Since(PrometheusSnapshot before, int max)
        {
            if (before == null) throw new ArgumentNullException(nameof(before));
            if (max < 1 || max > 1000) throw new ArgumentOutOfRangeException(nameof(max));
            List<StageDelta> rows = new List<StageDelta>();
            foreach (KeyValuePair<string, double> count in Counts)
            {
                before.Counts.TryGetValue(count.Key, out double countBefore);
                double deltaCount = count.Value - countBefore;
                if (deltaCount <= 0) continue;
                Sums.TryGetValue(count.Key, out double sumAfter);
                before.Sums.TryGetValue(count.Key, out double sumBefore);
                double deltaSum = sumAfter - sumBefore;
                StageDelta row = new StageDelta();
                row.Series = count.Key;
                row.Count = deltaCount;
                bool seconds = count.Key.Contains("_seconds", StringComparison.Ordinal);
                row.Unit = seconds ? "ms" : "units";
                row.Total = seconds ? deltaSum * 1000.0 : deltaSum;
                row.Mean = row.Total / deltaCount;
                rows.Add(row);
            }
            return rows.OrderBy(r => r.Unit == "ms" ? 0 : 1).ThenByDescending(r => r.Total).Take(max).ToList();
        }

        #endregion

        #region Private-Methods

        private static string StripScopeLabels(string labels)
        {
            // OpenTelemetry adds otel_scope_name and otel_scope_version to every series; they only add noise here.
            string inner = labels.Trim('{', '}');
            List<string> kept = new List<string>();
            foreach (string pair in inner.Split(',', StringSplitOptions.RemoveEmptyEntries))
            {
                if (pair.StartsWith("otel_scope_", StringComparison.Ordinal)) continue;
                kept.Add(pair);
            }
            return kept.Count == 0 ? String.Empty : "{" + String.Join(",", kept) + "}";
        }

        #endregion
    }
}
