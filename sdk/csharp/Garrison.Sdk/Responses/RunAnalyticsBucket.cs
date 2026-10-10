namespace Garrison.Sdk.Responses
{
    using System;

    /// <summary>
    /// Metrics for one time bucket.
    /// </summary>
    public class RunAnalyticsBucket : RunAnalyticsMetrics
    {
        /// <summary>
        /// Bucket start (UTC). The bucket spans BucketSeconds from the enclosing response.
        /// </summary>
        public DateTime StartUtc { get; set; } = DateTime.UtcNow;
    }
}
