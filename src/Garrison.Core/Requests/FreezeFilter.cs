namespace Garrison.Core.Requests
{
    using System;
    using Garrison.Core.Enums;

    /// <summary>
    /// Typed freeze enumeration filter (AA3). Active freezes sort first, then newest first.
    /// </summary>
    public class FreezeFilter
    {
        /// <summary>
        /// Tenant identifier. Required.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Target kind filter, or null for any.
        /// </summary>
        public FreezeTargetKindEnum? TargetKind { get; set; } = null;

        /// <summary>
        /// Target identifier filter, or null for any.
        /// </summary>
        public string? TargetId { get; set; } = null;

        /// <summary>
        /// True for active freezes only, false for lifted ones only, null for both.
        /// </summary>
        public bool? Active { get; set; } = null;

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
