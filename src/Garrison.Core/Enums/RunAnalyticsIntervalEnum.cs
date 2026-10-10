namespace Garrison.Core.Enums
{
    /// <summary>
    /// Bucket size requested from the run analytics endpoint.
    /// </summary>
    public enum RunAnalyticsIntervalEnum
    {
        /// <summary>
        /// Pick a bucket size that yields roughly 24 to 96 buckets for the range.
        /// </summary>
        Auto,

        /// <summary>
        /// One minute.
        /// </summary>
        Minute,

        /// <summary>
        /// One hour.
        /// </summary>
        Hour,

        /// <summary>
        /// One day (UTC midnight to midnight).
        /// </summary>
        Day,

        /// <summary>
        /// One week (UTC, Monday to Monday).
        /// </summary>
        Week
    }
}
