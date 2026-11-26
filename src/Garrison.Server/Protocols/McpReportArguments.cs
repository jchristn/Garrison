namespace Garrison.Server.Protocols
{
    using System;
    using System.Collections.Generic;
    using Garrison.Core.Models;

    /// <summary>Typed arguments of the report tools (AA5.4). Tenant identity comes from the authenticated caller.</summary>
    public class McpReportArguments
    {
        /// <summary>Report identifier (garrison_get_report).</summary>
        public string? ReportId { get; set; } = null;

        /// <summary>Kind: Status, Incident, Decision, Handoff, or Brief (file; list filter).</summary>
        public string? Kind { get; set; } = null;

        /// <summary>Health: Healthy, Degraded, Unhealthy, or Unknown (file; list filter).</summary>
        public string? Health { get; set; } = null;

        /// <summary>Audience: Manager, Chain, or Board (file).</summary>
        public string? Audience { get; set; } = null;

        /// <summary>Title, 1 to 256 characters (file).</summary>
        public string? Title { get; set; } = null;

        /// <summary>Body text (file).</summary>
        public string? Body { get; set; } = null;

        /// <summary>Start of the period covered, UTC (file).</summary>
        public DateTime? PeriodStartUtc { get; set; } = null;

        /// <summary>End of the period covered, UTC (file).</summary>
        public DateTime? PeriodEndUtc { get; set; } = null;

        /// <summary>Measurements (file).</summary>
        public List<ReportMetric>? Metrics { get; set; } = null;

        /// <summary>Problems (file).</summary>
        public List<ReportIssue>? Issues { get; set; } = null;

        /// <summary>Decisions taken (file).</summary>
        public List<ReportDecision>? Decisions { get; set; } = null;

        /// <summary>App identifier or name the report is filed within (file); list filter for people.</summary>
        public string? App { get; set; } = null;

        /// <summary>People only: the agent a report is filed in the name of (file), or the author to list.</summary>
        public string? Agent { get; set; } = null;

        /// <summary>People only: idempotency key for filing.</summary>
        public string? IdempotencyKey { get; set; } = null;

        /// <summary>Runs only: include your own reports when listing. Default true.</summary>
        public bool? IncludeOwn { get; set; } = null;

        /// <summary>Only reports filed at or after this time, UTC (list).</summary>
        public DateTime? Since { get; set; } = null;

        /// <summary>Records to skip (list).</summary>
        public int? Skip { get; set; } = null;

        /// <summary>Page size, 1 to 100, default 25 (list).</summary>
        public int? MaxResults { get; set; } = null;
    }
}
