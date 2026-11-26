namespace Garrison.Core.Requests
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Typed escalation enumeration filter (AA2). Open escalations sort first, then newest first.
    /// </summary>
    public class EscalationFilter
    {
        /// <summary>
        /// Tenant identifier. Required.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Status filter, or null for any.
        /// </summary>
        public EscalationStatusEnum? Status { get; set; } = null;

        /// <summary>
        /// Target kind filter, or null for any.
        /// </summary>
        public EscalationTargetKindEnum? TargetKind { get; set; } = null;

        /// <summary>
        /// Target identifier filter, or null for any.
        /// </summary>
        public string? TargetId { get; set; } = null;

        /// <summary>
        /// Severity filter, or null for any.
        /// </summary>
        public EscalationSeverityEnum? Severity { get; set; } = null;

        /// <summary>
        /// Raising agent filter, or null for any.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Mandate filter, or null for any.
        /// </summary>
        public string? MandateId { get; set; } = null;

        /// <summary>
        /// Raising run filter, or null for any.
        /// </summary>
        public string? RaisingRunId { get; set; } = null;

        /// <summary>
        /// Text that must occur in the question, or null.
        /// </summary>
        public string? Search { get; set; } = null;

        /// <summary>
        /// Records to skip. Minimum 0.
        /// </summary>
        public int Skip { get; set; } = 0;

        /// <summary>
        /// Page size, 1 to 1000. Default 25.
        /// </summary>
        public int MaxResults { get; set; } = 25;
    }
}
