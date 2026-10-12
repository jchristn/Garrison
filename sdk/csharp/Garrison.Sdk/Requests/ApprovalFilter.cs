namespace Garrison.Sdk.Requests
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Typed permission approval enumeration filter. Null members are not sent.
    /// </summary>
    public class ApprovalFilter
    {
        /// <summary>
        /// Status filter, for example Pending for the approvals waiting for a person.
        /// </summary>
        public ApprovalStatusEnum? Status { get; set; } = null;

        /// <summary>
        /// Run filter.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Root run filter (every approval of a delegation tree).
        /// </summary>
        public string? RootRunId { get; set; } = null;

        /// <summary>
        /// Agent filter.
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Deployment filter.
        /// </summary>
        public string? DeploymentId { get; set; } = null;

        /// <summary>
        /// Decision source filter (Rule, Default, User, Timeout, Cancelled).
        /// </summary>
        public ApprovalSourceEnum? DecisionSource { get; set; } = null;

        /// <summary>
        /// Created at or after (UTC).
        /// </summary>
        public DateTime? FromUtc { get; set; } = null;

        /// <summary>
        /// Created before (UTC).
        /// </summary>
        public DateTime? ToUtc { get; set; } = null;

        /// <summary>
        /// Records to skip. Default 0.
        /// </summary>
        public int Skip { get; set; } = 0;

        /// <summary>
        /// Page size (1 to 1000). Default 25.
        /// </summary>
        public int MaxResults { get; set; } = 25;

        /// <summary>
        /// Ordering. Default CreatedDescending.
        /// </summary>
        public EnumerationOrderEnum Ordering { get; set; } = EnumerationOrderEnum.CreatedDescending;
    }
}
