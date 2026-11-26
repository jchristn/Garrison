namespace Garrison.Core.Requests
{
    using System;

    /// <summary>
    /// Filter for a report metric series (AA5). Points are returned oldest first.
    /// </summary>
    public class ReportMetricFilter
    {
        /// <summary>
        /// Tenant identifier. Required.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Only metrics reported by this author agent, or null for every author.
        /// </summary>
        public string? AuthorAgentId { get; set; } = null;

        /// <summary>
        /// Only metrics with this exact name, or null for every name.
        /// </summary>
        public string? Name { get; set; } = null;

        /// <summary>
        /// Only reports filed at or after this time (UTC), or null.
        /// </summary>
        public DateTime? FromUtc { get; set; } = null;

        /// <summary>
        /// Only reports filed before this time (UTC), or null.
        /// </summary>
        public DateTime? ToUtc { get; set; } = null;

        /// <summary>
        /// Most points to return, the newest ones. Default 500, range 1 to 5000.
        /// </summary>
        public int MaxPoints
        {
            get
            {
                return _MaxPoints;
            }
            set
            {
                _MaxPoints = Math.Clamp(value, 1, 5000);
            }
        }

        private int _MaxPoints = 500;
    }
}
