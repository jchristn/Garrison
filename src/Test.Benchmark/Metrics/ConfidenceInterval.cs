namespace Garrison.Benchmark.Metrics
{
    using System;

    /// <summary>
    /// A point estimate with a percentile bootstrap confidence interval.
    /// </summary>
    public class ConfidenceInterval
    {
        /// <summary>
        /// Point estimate on the full sample.
        /// </summary>
        public double Estimate { get; set; }

        /// <summary>
        /// Lower bound.
        /// </summary>
        public double Lower { get; set; }

        /// <summary>
        /// Upper bound.
        /// </summary>
        public double Upper { get; set; }

        /// <summary>
        /// Confidence level, for example 0.95.
        /// </summary>
        public double Level { get; set; } = 0.95;

        /// <summary>
        /// Sample size.
        /// </summary>
        public int N { get; set; }

        /// <summary>
        /// True when the sample is smaller than 20, so the interval is indicative only.
        /// </summary>
        public bool Indicative { get; set; }

        /// <summary>
        /// Text such as "0.950 [0.900, 1.000]".
        /// </summary>
        /// <param name="format">Numeric format, for example F3 or F1.</param>
        /// <returns>Text.</returns>
        public string Format(string format)
        {
            string text = Estimate.ToString(format, System.Globalization.CultureInfo.InvariantCulture)
                + " [" + Lower.ToString(format, System.Globalization.CultureInfo.InvariantCulture)
                + ", " + Upper.ToString(format, System.Globalization.CultureInfo.InvariantCulture) + "]";
            return Indicative ? text + " (indicative)" : text;
        }
    }
}
