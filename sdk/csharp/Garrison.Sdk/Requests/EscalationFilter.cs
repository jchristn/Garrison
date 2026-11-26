namespace Garrison.Sdk.Requests
{
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Typed escalation enumeration filter. Null members are not sent. The server lists open escalations first, then the
    /// newest.
    /// </summary>
    public class EscalationFilter
    {
        /// <summary>
        /// Status filter, for example Open for the escalations waiting for an answer.
        /// </summary>
        public EscalationStatusEnum? Status { get; set; } = null;

        /// <summary>
        /// Severity filter.
        /// </summary>
        public EscalationSeverityEnum? Severity { get; set; } = null;

        /// <summary>
        /// Target kind filter.
        /// </summary>
        public EscalationTargetKindEnum? TargetKind { get; set; } = null;

        /// <summary>
        /// Target identifier filter.
        /// </summary>
        public string? TargetId { get; set; } = null;

        /// <summary>
        /// Agent filter (the raising run's agent).
        /// </summary>
        public string? AgentId { get; set; } = null;

        /// <summary>
        /// Keeper mandate filter.
        /// </summary>
        public string? MandateId { get; set; } = null;

        /// <summary>
        /// Raising run filter.
        /// </summary>
        public string? RaisingRunId { get; set; } = null;

        /// <summary>
        /// Text search over the question and context.
        /// </summary>
        public string? Search { get; set; } = null;

        /// <summary>
        /// Records to skip. Default 0.
        /// </summary>
        public int Skip { get; set; } = 0;

        /// <summary>
        /// Page size (1 to 1000). Default 25.
        /// </summary>
        public int MaxResults { get; set; } = 25;
    }
}
