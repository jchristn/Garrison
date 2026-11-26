namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// One measurement in a report (AA5). The same name from the same author over time forms a series. Not thread-safe.
    /// </summary>
    public class ReportMetric
    {
        /// <summary>
        /// Metric name, 1 to 64 characters.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Value; a finite number.
        /// </summary>
        public double Value { get; set; } = 0;

        /// <summary>
        /// Optional unit, at most 32 characters.
        /// </summary>
        public string? Unit { get; set; } = null;
    }
}
