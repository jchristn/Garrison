namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

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
        /// Conversation identifier filter (the conversation's turns).
        /// </summary>
        public string? ConversationId { get; set; } = null;

        /// <summary>
        /// Pipeline run filter (the stage runs of one pipeline run, P12.9).
        /// </summary>
        public string? PipelineRunId { get; set; } = null;

        /// <summary>
        /// Trigger filter (runs a trigger started, P12.5).
        /// </summary>
        public string? TriggerId { get; set; } = null;

        /// <summary>
        /// Outcome filter.
        /// </summary>
        public RunOutcomeEnum? Outcome { get; set; } = null;

        /// <summary>
        /// Caller principal filter.
        /// </summary>
        public string? CallerId { get; set; } = null;

        /// <summary>
        /// Served model, or null for any. The value "unknown" matches runs that recorded no served model.
        /// </summary>
        public string? ServedModel { get; set; } = null;

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
