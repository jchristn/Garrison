namespace Garrison.Benchmark.Metrics
{
    using System;
    using System.Collections.Generic;
    using System.Globalization;
    using System.IO;
    using System.Linq;
    using System.Text;

    /// <summary>
    /// Every sample of one or more Prometheus text scrapes (counters, gauges, and histogram series), for summing a
    /// metric across control-plane replicas. Scrapes of several replicas are concatenated, so <see cref="Sum(string)"/>
    /// over the result is the cluster-wide total of a per-replica counter. Unlike <see cref="PrometheusSnapshot"/>,
    /// which keeps only histogram _sum and _count series, this keeps every line. Not thread-safe; build once and read.
    /// </summary>
    public class PrometheusSamples
    {
        #region Public-Members

        /// <summary>
        /// Every sample.
        /// </summary>
        public List<PrometheusSample> Samples { get; } = new List<PrometheusSample>();

        /// <summary>
        /// Number of scrapes that were parsed into this set (replicas that answered).
        /// </summary>
        public int Scrapes { get; set; }

        #endregion

        #region Public-Methods

        /// <summary>
        /// Parse scrapes and concatenate their samples. Null or empty scrapes are skipped and not counted.
        /// </summary>
        /// <param name="texts">Scrape texts.</param>
        /// <returns>Samples.</returns>
        /// <exception cref="ArgumentNullException">Thrown when texts is null.</exception>
        public static PrometheusSamples Parse(IEnumerable<string?> texts)
        {
            if (texts == null) throw new ArgumentNullException(nameof(texts));
            PrometheusSamples samples = new PrometheusSamples();
            foreach (string? text in texts)
            {
                if (String.IsNullOrEmpty(text)) continue;
                samples.Scrapes++;
                using (StringReader reader = new StringReader(text))
                {
                    string? line;
                    while ((line = reader.ReadLine()) != null)
                    {
                        PrometheusSample? sample = ParseLine(line);
                        if (sample != null) samples.Samples.Add(sample);
                    }
                }
            }
            return samples;
        }

        /// <summary>
        /// Parse one sample line; null for comments, blank lines, and lines that do not parse.
        /// </summary>
        /// <param name="line">Line.</param>
        /// <returns>Sample or null.</returns>
        public static PrometheusSample? ParseLine(string? line)
        {
            if (String.IsNullOrEmpty(line) || line[0] == '#') return null;
            PrometheusSample sample = new PrometheusSample();
            int brace = line.IndexOf('{');
            int space = line.IndexOf(' ');
            int valueStart;
            if (brace >= 0 && (space < 0 || brace < space))
            {
                sample.Name = line.Substring(0, brace);
                int end = ParseLabels(line, brace + 1, sample.Labels);
                if (end < 0) return null;
                valueStart = end + 1;
            }
            else
            {
                if (space <= 0) return null;
                sample.Name = line.Substring(0, space);
                valueStart = space;
            }
            string rest = line.Substring(Math.Min(valueStart, line.Length)).Trim();
            int valueEnd = rest.IndexOf(' ');
            string valueText = valueEnd > 0 ? rest.Substring(0, valueEnd) : rest;
            if (valueText == "+Inf") sample.Value = Double.PositiveInfinity;
            else if (valueText == "-Inf") sample.Value = Double.NegativeInfinity;
            else if (!Double.TryParse(valueText, NumberStyles.Float, CultureInfo.InvariantCulture, out double value)) return null;
            else sample.Value = value;
            return sample;
        }

        /// <summary>
        /// Sum of every sample of a series name.
        /// </summary>
        /// <param name="name">Series name as exposed (with its suffix).</param>
        /// <returns>Sum, 0 when absent.</returns>
        public double Sum(string name)
        {
            return Sum(name, null);
        }

        /// <summary>
        /// Sum of the samples of a series name whose labels match a filter.
        /// </summary>
        /// <param name="name">Series name as exposed (with its suffix).</param>
        /// <param name="filter">Filter, or null for every sample.</param>
        /// <returns>Sum, 0 when absent.</returns>
        public double Sum(string name, Func<PrometheusSample, bool>? filter)
        {
            double total = 0;
            foreach (PrometheusSample sample in Samples)
            {
                if (!String.Equals(sample.Name, name, StringComparison.Ordinal)) continue;
                if (filter != null && !filter(sample)) continue;
                if (Double.IsNaN(sample.Value) || Double.IsInfinity(sample.Value)) continue;
                total += sample.Value;
            }
            return total;
        }

        /// <summary>
        /// Sum of the samples of a series name whose label equals a value.
        /// </summary>
        /// <param name="name">Series name as exposed.</param>
        /// <param name="label">Label name.</param>
        /// <param name="value">Label value.</param>
        /// <returns>Sum, 0 when absent.</returns>
        public double Sum(string name, string label, string value)
        {
            return Sum(name, s => String.Equals(s.Label(label), value, StringComparison.Ordinal));
        }

        /// <summary>
        /// Sums of the samples of a series name grouped by one label's value (samples without it group under none).
        /// </summary>
        /// <param name="name">Series name as exposed.</param>
        /// <param name="label">Label to group by.</param>
        /// <param name="filter">Filter, or null.</param>
        /// <returns>Sum by label value.</returns>
        public SortedDictionary<string, double> SumBy(string name, string label, Func<PrometheusSample, bool>? filter)
        {
            SortedDictionary<string, double> sums = new SortedDictionary<string, double>(StringComparer.Ordinal);
            foreach (PrometheusSample sample in Samples)
            {
                if (!String.Equals(sample.Name, name, StringComparison.Ordinal)) continue;
                if (filter != null && !filter(sample)) continue;
                if (Double.IsNaN(sample.Value) || Double.IsInfinity(sample.Value)) continue;
                string key = sample.Label(label) ?? "none";
                sums.TryGetValue(key, out double current);
                sums[key] = current + sample.Value;
            }
            return sums;
        }

        #endregion

        #region Private-Methods

        private static int ParseLabels(string line, int start, Dictionary<string, string> labels)
        {
            int i = start;
            while (i < line.Length)
            {
                while (i < line.Length && (line[i] == ',' || line[i] == ' ')) i++;
                if (i < line.Length && line[i] == '}') return i;
                int equals = line.IndexOf('=', i);
                if (equals < 0 || equals + 1 >= line.Length || line[equals + 1] != '"') return -1;
                string key = line.Substring(i, equals - i).Trim();
                StringBuilder value = new StringBuilder();
                int j = equals + 2;
                bool closed = false;
                while (j < line.Length)
                {
                    char c = line[j];
                    if (c == '\\' && j + 1 < line.Length)
                    {
                        char next = line[j + 1];
                        value.Append(next == 'n' ? '\n' : next);
                        j += 2;
                        continue;
                    }
                    if (c == '"')
                    {
                        closed = true;
                        break;
                    }
                    value.Append(c);
                    j++;
                }
                if (!closed) return -1;
                labels[key] = value.ToString();
                i = j + 1;
            }
            return -1;
        }

        #endregion
    }
}
