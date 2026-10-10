namespace Garrison.Sdk.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Typed run enumeration filter.
    /// </summary>
    public class RunFilter
    {
        /// <summary>
        /// Tenant identifier; null enumerates across tenants (system administrators only).
        /// </summary>
        public string? TenantId { get; set; } = null;

        /// <summary>
        /// Status filter.
        /// </summary>
        public RunStatusEnum? Status { get; set; } = null;

        /// <summary>
        /// Agent filter.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Deployment filter.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Harness type filter.
        /// </summary>
        public HarnessTypeEnum? HarnessType { get; set; } = null;

        /// <summary>
        /// Lease node filter.
        /// </summary>
        public string? NodeId { get; set; } = null;

        /// <summary>
        /// Parent run filter.
        /// </summary>
        public string? ParentRunId { get; set; } = null;

        /// <summary>
        /// Root run filter.
        /// </summary>
        public string? RootRunId { get; set; } = null;

        /// <summary>
        /// Outcome filter.
        /// </summary>
        public RunOutcomeEnum? Outcome { get; set; } = null;

        /// <summary>
        /// Caller principal filter.
        /// </summary>
        public string? CallerId { get; set; } = null;

        /// <summary>
        /// Created at or after (UTC).
        /// </summary>
        public DateTime? FromUtc { get; set; } = null;

        /// <summary>
        /// Created before (UTC).
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
        /// Ordering.
        /// </summary>
        public EnumerationOrderEnum Ordering { get; set; } = EnumerationOrderEnum.CreatedDescending;
    }
}
