namespace Garrison.Sdk.Requests
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Typed query for run analytics. Every member is optional; null members are omitted and the server applies its defaults.
    /// </summary>
    public class RunAnalyticsQuery
    {
        /// <summary>
        /// Range start (UTC, inclusive). Null uses the server default. Must be earlier than To.
        /// </summary>
        public DateTime? From { get; set; } = null;

        /// <summary>
        /// Range end (UTC, exclusive). Null uses the server default (now).
        /// </summary>
        public DateTime? To { get; set; } = null;

        /// <summary>
        /// Bucket interval. Null uses the server default. The range may not require more than 400 buckets.
        /// </summary>
        public AnalyticsIntervalEnum? Interval { get; set; } = null;

        /// <summary>
        /// Agent filter.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Harness type filter.
        /// </summary>
        public HarnessTypeEnum? HarnessType { get; set; } = null;

        /// <summary>
        /// Deployment filter.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Served model filter: only runs whose served model equals this value. The value "unknown" matches runs without a recorded model.
        /// </summary>
        public string? Model { get; set; } = null;

        /// <summary>
        /// Series grouping. Null uses the server default (none).
        /// </summary>
        public AnalyticsGroupByEnum? GroupBy { get; set; } = null;
    }
}
