namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Report metric series filter (AA5). Points are oldest first.
    /// </summary>
    public class ReportMetricFilter
    {
        /// <summary>
        /// Author agent identifier or name, or null for every author.
        /// </summary>
        public string? Author { get; set; } = null;

        /// <summary>
        /// Exact metric name, or null for every name.
        /// </summary>
        public string? Name { get; set; } = null;

        /// <summary>
        /// Reports filed at or after this time (UTC), or null.
        /// </summary>
        public DateTime? FromUtc { get; set; } = null;

        /// <summary>
        /// Reports filed before this time (UTC), or null.
        /// </summary>
        public DateTime? ToUtc { get; set; } = null;

        /// <summary>
        /// Most points, the newest ones, 1 to 5000. Default 500.
        /// </summary>
        public int? MaxPoints { get; set; } = null;
    }
}
