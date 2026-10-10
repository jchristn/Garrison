namespace Garrison.Sdk.Enums
{
    /// <summary>
    /// Bucket interval for run analytics.
    /// </summary>
    public enum AnalyticsIntervalEnum
    {
        /// <summary>
        /// The server chooses a bucket size that fits the range.
        /// </summary>
        Auto,

        /// <summary>
        /// One-minute buckets.
        /// </summary>
        Minute,

        /// <summary>
        /// One-hour buckets.
        /// </summary>
        Hour,

        /// <summary>
        /// One-day buckets.
        /// </summary>
        Day,

        /// <summary>
        /// One-week buckets.
        /// </summary>
        Week
    }
}
