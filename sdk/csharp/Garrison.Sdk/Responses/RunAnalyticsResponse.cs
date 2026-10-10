namespace Garrison.Sdk.Responses
{
    using System;
    using System.Collections.Generic;

    /// <summary>
    /// Run analytics for a time range.
    /// </summary>
    public class RunAnalyticsResponse
    {
        /// <summary>
        /// Range start (UTC).
        /// </summary>
        public DateTime FromUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Range end (UTC).
        /// </summary>
        public DateTime ToUtc { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Interval name: minute, hour, day, week, or auto when the chosen bucket size is not one of those.
        /// </summary>
        public string Interval
        {
            get
            {
                return _Interval;
            }
            set
            {
                _Interval = value ?? String.Empty;
            }
        }

        /// <summary>
        /// Bucket size in seconds. Authoritative over Interval.
        /// </summary>
        public long BucketSeconds { get; set; } = 0;

        /// <summary>
        /// True when the server hit its 100,000-run cap and the figures are partial.
        /// </summary>
        public bool Truncated { get; set; } = false;

        /// <summary>
        /// Totals across the whole range. Never null.
        /// </summary>
        public RunAnalyticsMetrics Totals
        {
            get
            {
                return _Totals;
            }
            set
            {
                _Totals = value ?? new RunAnalyticsMetrics();
            }
        }

        /// <summary>
        /// Series. Never null.
        /// </summary>
        public List<RunAnalyticsSeries> Series
        {
            get
            {
                return _Series;
            }
            set
            {
                _Series = value ?? new List<RunAnalyticsSeries>();
            }
        }

        private string _Interval = String.Empty;
        private RunAnalyticsMetrics _Totals = new RunAnalyticsMetrics();
        private List<RunAnalyticsSeries> _Series = new List<RunAnalyticsSeries>();
    }
}
