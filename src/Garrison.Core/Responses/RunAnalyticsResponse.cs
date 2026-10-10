namespace Garrison.Core.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Time-bucketed run analytics (plan section 10.6).
    /// </summary>
    public class RunAnalyticsResponse
    {
        /// <summary>
        /// Inclusive start of the requested range (UTC).
        /// </summary>
        public DateTime FromUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Exclusive end of the requested range (UTC).
        /// </summary>
        public DateTime ToUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Bucket interval: minute, hour, day, or week; or auto when the automatically chosen size is not exactly one
        /// of those (bucketSeconds is always authoritative).
        /// </summary>
        public string Interval { get; set; } = "hour";

        /// <summary>
        /// Bucket size in seconds.
        /// </summary>
        public long BucketSeconds { get; set; } = 3600;

        /// <summary>
        /// Whether the per-request run cap was reached, in which case only the newest runs were aggregated.
        /// </summary>
        public bool Truncated { get; set; } = false;

        /// <summary>
        /// Metrics over every aggregated run in the range.
        /// </summary>
        public RunAnalyticsMetrics Totals { get; set; } = new RunAnalyticsMetrics();

        /// <summary>
        /// Series: one when not grouped, otherwise one per agent or harness type, ordered by run count descending.
        /// </summary>
        public List<RunAnalyticsSeries> Series { get; set; } = new List<RunAnalyticsSeries>();
    }
}
