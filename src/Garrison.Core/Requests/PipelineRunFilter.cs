namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Pipeline run enumeration filter (P12.9). Every route sets TenantId from the request context.
    /// </summary>
    public class PipelineRunFilter
    {
        #region Public-Members

        /// <summary>
        /// Tenant filter.
        /// </summary>
        public string? TenantId { get; set; } = null;

        /// <summary>
        /// Pipeline filter.
        /// </summary>
        public string? PipelineId { get; set; } = null;

        /// <summary>
        /// Status filter.
        /// </summary>
        public PipelineRunStatusEnum? Status { get; set; } = null;

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
        /// Maximum records (the route clamps it to 1 to 1000).
        /// </summary>
        public int MaxResults { get; set; } = 25;

        /// <summary>
        /// Ordering.
        /// </summary>
        public EnumerationOrderEnum Ordering { get; set; } = EnumerationOrderEnum.CreatedDescending;

        #endregion

        #region Constructors-and-Factories

        /// <summary>
        /// Instantiate.
        /// </summary>
        public PipelineRunFilter()
        {
        }

        #endregion
    }
}
