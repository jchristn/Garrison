namespace Garrison.Core.Models
{
    using System;

    /// <summary>
    /// One point of a metric series (AA5): a metric value from one report, with the report's author and time. Not
    /// thread-safe.
    /// </summary>
    public class ReportMetricPoint
    {
        #region Public-Members

        /// <summary>
        /// The report the value comes from.
        /// </summary>
        public string ReportId { get; set; } = String.Empty;

        /// <summary>
        /// The report's author agent, or null for a person's report.
        /// </summary>
        public string? AuthorAgentId { get; set; } = null;

        /// <summary>
        /// The author agent's name when the report was filed.
        /// </summary>
        public string? AuthorAgentName { get; set; } = null;

        /// <summary>
        /// Metric name.
        /// </summary>
        public string Name { get; set; } = String.Empty;

        /// <summary>
        /// Value.
        /// </summary>
        public double Value { get; set; } = 0;

        /// <summary>
        /// Unit, or null.
        /// </summary>
        public string? Unit { get; set; } = null;

        /// <summary>
        /// When the point applies: the report's period end when it has one, otherwise when it was filed (UTC).
        /// </summary>
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;

        #endregion
    }
}
