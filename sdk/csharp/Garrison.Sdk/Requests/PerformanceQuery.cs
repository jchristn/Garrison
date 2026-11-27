namespace Garrison.Sdk.Requests
{
    using System;

    /// <summary>
    /// Window and scope of an organization performance read (AA11.2). Every member is optional; null members are omitted
    /// and the server applies its defaults.
    /// </summary>
    public class PerformanceQuery
    {
        /// <summary>
        /// Window start (UTC). Null uses the server default of 7 days before ToUtc. The span may be at most 90 days.
        /// </summary>
        public DateTime? FromUtc { get; set; } = null;

        /// <summary>
        /// Window end (UTC). Null uses the server default (now).
        /// </summary>
        public DateTime? ToUtc { get; set; } = null;

        /// <summary>
        /// Restrict the response to this unit's subtree, or null for the whole organization. A unit outside the
        /// organization answers 404.
        /// </summary>
        public string? UnitId { get; set; } = null;
    }
}
