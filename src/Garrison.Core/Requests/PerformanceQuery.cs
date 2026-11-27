namespace Garrison.Core.Requests
{
    using System;

    /// <summary>
    /// Window and scope of an organization performance rollup (AA11.2). Not thread-safe.
    /// </summary>
    public class PerformanceQuery
    {
        /// <summary>
        /// Inclusive window start (UTC), or null for 7 days before toUtc.
        /// </summary>
        public DateTime? FromUtc { get; set; } = null;

        /// <summary>
        /// Exclusive window end (UTC), or null for now. The window is at most 90 days.
        /// </summary>
        public DateTime? ToUtc { get; set; } = null;

        /// <summary>
        /// Unit (identifier or name) whose subtree to restrict the rollup to, or null for the whole organization.
        /// </summary>
        public string? UnitId { get; set; } = null;
    }
}
