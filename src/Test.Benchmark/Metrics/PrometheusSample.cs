namespace Garrison.Benchmark.Metrics
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// One sample line of a Prometheus text scrape: the series name, its labels, and its value.
    /// </summary>
    public class PrometheusSample
    {
        /// <summary>
        /// Series name as exposed, including any _total, _count, _sum, or _bucket suffix.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Labels by name. OpenTelemetry scope labels are kept; filters simply ignore them.
        /// </summary>
        public Dictionary<string, string> Labels { get; set; } = new Dictionary<string, string>(StringComparer.Ordinal);

        /// <summary>
        /// Sample value.
        /// </summary>
        public double Value { get; set; }

        /// <summary>
        /// Value of a label, or null when the sample does not carry it.
        /// </summary>
        /// <param name="name">Label name.</param>
        /// <returns>Value or null.</returns>
        public string? Label(string name)
        {
            if (name == null) return null;
            return Labels.TryGetValue(name, out string? value) ? value : null;
        }
    }
}
