namespace Garrison.Sdk.Requests
{
    using System;
    using Garrison.Sdk.Enums;

    /// <summary>
    /// Typed pipeline run enumeration filter. Null members are not sent.
    /// </summary>
    public class PipelineRunFilter
    {
        #region Public-Members

        /// <summary>
        /// Pipeline filter.
        /// </summary>
        public string? PipelineId { get; set; } = null;

        /// <summary>
        /// Status filter.
        /// </summary>
        public PipelineRunStatusEnum? Status { get; set; } = null;

        /// <summary>
        /// Caller filter.
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
