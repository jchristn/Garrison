namespace Garrison.Core.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Enums;

    /// <summary>
    /// Filter for listing reports (AA5). Results are newest first.
    /// </summary>
    public class ReportFilter
    {
        /// <summary>
        /// Tenant identifier. Required.
        /// </summary>
        public string TenantId { get; set; } = String.Empty;

        /// <summary>
        /// Only reports from this author agent, or null.
        /// </summary>
        public string? AuthorAgentId { get; set; } = null;

        /// <summary>
        /// Only reports from these author agents, or null for any. An empty list matches nothing.
        /// </summary>
        public List<string>? AuthorAgentIds { get; set; } = null;

        /// <summary>
        /// Only reports of this organization unit, or null.
        /// </summary>
        public string? OrgUnitId { get; set; } = null;

        /// <summary>
        /// Only reports filed within this app, or null.
        /// </summary>
        public string? AppId { get; set; } = null;

        /// <summary>
        /// Only reports a run's agent may see: its own and its subordinates' (AA5.3), or null for no such limit.
        /// </summary>
        public ReportVisibilityScope? Visibility { get; set; } = null;

        /// <summary>
        /// Only reports of this kind, or null.
        /// </summary>
        public ReportKindEnum? Kind { get; set; } = null;

        /// <summary>
        /// Only reports with this health, or null.
        /// </summary>
        public ReportHealthEnum? Health { get; set; } = null;

        /// <summary>
        /// Only reports filed by this run, or null.
        /// </summary>
        public string? RunId { get; set; } = null;

        /// <summary>
        /// Only reports filed at or after this time (UTC), or null.
        /// </summary>
        public DateTime? FromUtc { get; set; } = null;

        /// <summary>
        /// Only reports filed before this time (UTC), or null.
        /// </summary>
        public DateTime? ToUtc { get; set; } = null;

        /// <summary>
        /// Case-insensitive text matched against the title, or null.
        /// </summary>
        public string? Search { get; set; } = null;

        /// <summary>
        /// Records to skip. Minimum 0.
        /// </summary>
        public int Skip { get; set; } = 0;

        /// <summary>
        /// Most records to return. Default 25; the enumeration bounds apply.
        /// </summary>
        public int MaxResults { get; set; } = 25;
    }
}
