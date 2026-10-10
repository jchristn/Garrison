namespace Garrison.Core.Responses
{
    using System;
    using System.Text.Json.Serialization;

    /// <summary>
    /// Metrics for runs created in one time bucket, [StartUtc, StartUtc + bucketSeconds).
    /// </summary>
    public class RunAnalyticsBucket : RunAnalyticsMetrics
    {
        /// <summary>
        /// Bucket start (UTC).
        /// </summary>
        [JsonPropertyOrder(-1)]
        public DateTime StartUtc { get; set; } = DateTime.UtcNow;
    }
}
