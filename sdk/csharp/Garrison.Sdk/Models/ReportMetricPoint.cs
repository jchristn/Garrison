namespace Garrison.Sdk.Models
{
    using System;

    /// <summary>
    /// One point of a report metric series (AA5). Not thread-safe.
    /// </summary>
    public class ReportMetricPoint
    {
        /// <summary>
        /// The report the value comes from.
        /// </summary>
        public string ReportId { get; set; } = String.Empty;

        /// <summary>
        /// Author agent, or null for a person's report.
        /// </summary>
        public string? AuthorAgentId { get; set; } = null;

        /// <summary>
        /// Author agent name when the report was filed.
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
        /// The report's period end when it has one, otherwise when it was filed (UTC).
        /// </summary>
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
    }
}
