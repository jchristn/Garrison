namespace Garrison.Core.Requests
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Parameters of a run analytics request (plan section 10.6).
    /// </summary>
    public class RunAnalyticsQuery
    {
        /// <summary>
        /// Tenant identifier. Required.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Inclusive start of the range (UTC), compared against each run's creation time. Null means 24 hours before
        /// ToUtc.
        /// </summary>
        public DateTime? FromUtc { get; set; } = null;

        /// <summary>
        /// Exclusive end of the range (UTC). Null means now.
        /// </summary>
        public DateTime? ToUtc { get; set; } = null;

        /// <summary>
        /// Bucket size. Default Auto.
        /// </summary>
        public RunAnalyticsIntervalEnum Interval { get; set; } = RunAnalyticsIntervalEnum.Auto;

        /// <summary>
        /// Only runs of this agent, or null for all.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Only runs of this harness type, or null for all.
        /// </summary>
        public HarnessTypeEnum? HarnessType { get; set; } = null;

        /// <summary>
        /// Only runs of this deployment, or null for all.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Only runs whose served model equals this value ("unknown" matches runs without one), or null for all.
        /// </summary>
        public string? Model { get; set; } = null;

        /// <summary>
        /// Series grouping. Default None.
        /// </summary>
        public RunAnalyticsGroupByEnum GroupBy { get; set; } = RunAnalyticsGroupByEnum.None;
    }
}
