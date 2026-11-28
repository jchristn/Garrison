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
        #region Public-Members

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
        /// Mandate filter (keeper tick runs of a mandate, AA1).
        /// </summary>
        public string? MandateId { get; set; } = null;

        /// <summary>
        /// Eval run filter (the case runs of an eval run, AA9).
        /// </summary>
        public string? EvalRunId { get; set; } = null;

        /// <summary>
        /// Shadow trial filter (the shadow runs of a trial, AA9).
        /// </summary>
        public string? ShadowTrialId { get; set; } = null;

        /// <summary>
        /// Run kind filter, or null for every kind.
        /// </summary>
        public RunKindEnum? Kind { get; set; } = null;

        /// <summary>
        /// Text search, or null for none. A run matches when its agent name or its caller name contains the text,
        /// ignoring case. Leading and trailing white space is trimmed and an empty value means no search.
        /// Default null; at most 200 characters.
        /// </summary>
        /// <exception cref="ArgumentOutOfRangeException">Thrown when the trimmed value is longer than 200 characters.</exception>
        public string? Search
        {
            get
            {
                return _Search;
            }
            set
            {
                string? trimmed = value?.Trim();
                if (String.IsNullOrEmpty(trimmed))
                {
                    _Search = null;
                    return;
                }

                if (trimmed.Length > _SearchMaxLength) throw new ArgumentOutOfRangeException(nameof(Search), "The run search text can be at most " + _SearchMaxLength + " characters.");
                _Search = trimmed;
            }
        }

        /// <summary>
        /// Hop filter, or null for every run. True keeps runs that are part of a request that crossed runs: a run that
        /// sent or received an agent message, started another run or was started by one, or belongs to a fan-out.
        /// False keeps the runs that did none of those.
        /// </summary>
        public bool? HasHops { get; set; } = null;

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

        #endregion

        #region Private-Members

        private string? _Search = null;
        private int _SearchMaxLength = 200;

        #endregion
    }
}
