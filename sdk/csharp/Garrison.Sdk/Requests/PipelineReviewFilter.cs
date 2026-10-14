namespace Garrison.Sdk.Requests
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Typed pipeline review enumeration filter. Null members are not sent.
    /// </summary>
    public class PipelineReviewFilter
    {
        #region Public-Members

        /// <summary>
        /// Status filter, for example Pending for the reviews waiting for a person.
        /// </summary>
        public PipelineReviewStatusEnum? Status { get; set; } = null;

        /// <summary>
        /// Pipeline run filter.
        /// </summary>
        public string? PipelineRunId { get; set; } = null;

        /// <summary>
        /// Pipeline filter.
        /// </summary>
        public string? PipelineId { get; set; } = null;

        /// <summary>
        /// Stage run filter.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Decision source filter (User, Timeout, Cancelled).
        /// </summary>
        public PipelineReviewSourceEnum? DecisionSource { get; set; } = null;

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

        #endregion
    }
}
