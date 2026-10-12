namespace Garrison.Core.Requests
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Typed approval enumeration filter (P12.3).
    /// </summary>
    public class ApprovalFilter
    {
        /// <summary>
        /// Tenant identifier; null enumerates across tenants (system administrators only).
        /// </summary>
        public string? TenantId { get; set; } = null;

        /// <summary>
        /// Status filter, or null for any.
        /// </summary>
        public ApprovalStatusEnum? Status { get; set; } = null;

        /// <summary>
        /// Run filter, or null for any.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Root run filter (every approval in a delegation tree), or null for any.
        /// </summary>
        public string? RootRunId { get; set; } = null;

        /// <summary>
        /// Agent filter, or null for any.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Deployment filter, or null for any.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Decision source filter, or null for any.
        /// </summary>
        public ApprovalSourceEnum? DecisionSource { get; set; } = null;

        /// <summary>
        /// Requested at or after (UTC).
        /// </summary>
        public DateTime? FromUtc { get; set; } = null;

        /// <summary>
        /// Requested before (UTC).
        /// </summary>
        public DateTime? ToUtc { get; set; } = null;

        /// <summary>
        /// Records to skip.
        /// </summary>
        public int Skip { get; set; } = 0;

        /// <summary>
        /// Page size (1 to 1000).
        /// </summary>
        public int MaxResults { get; set; } = 25;

        /// <summary>
        /// Ordering. Default newest first.
        /// </summary>
        public EnumerationOrderEnum Ordering { get; set; } = EnumerationOrderEnum.CreatedDescending;
    }
}
