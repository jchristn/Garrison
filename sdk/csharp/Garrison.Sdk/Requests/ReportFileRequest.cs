namespace Garrison.Sdk.Requests
{
    using System;
    using System.Collections.Generic;
    using Garrison.Sdk.Enums;
    using Garrison.Sdk.Models;

    /// <summary>
    /// A request to file a report as a person or API credential (AA5). Needs Create on Report.
    /// </summary>
    public class ReportFileRequest
    {
        /// <summary>
        /// Agent the report is from, by identifier or name, or null to file in your own name.
        /// </summary>
        public string? Agent { get; set; } = null;

        /// <summary>
        /// App to file within, by identifier or name, or null. A named agent must be a member.
        /// </summary>
        public string? App { get; set; } = null;

        /// <summary>
        /// Audience. Default Manager.
        /// </summary>
        public ReportAudienceEnum? Audience { get; set; } = null;

        /// <summary>
        /// Kind. Default Status.
        /// </summary>
        public ReportKindEnum? Kind { get; set; } = null;

        /// <summary>
        /// Health. Default Unknown.
        /// </summary>
        public ReportHealthEnum? Health { get; set; } = null;

        /// <summary>
        /// Title, 1 to 256 characters.
        /// </summary>
        public string Title { get; set; } = String.Empty;

        /// <summary>
        /// Body text, at most Reports.MaxBodyBytes UTF-8 bytes (default 32768).
        /// </summary>
        public string? Body { get; set; } = null;

        /// <summary>
        /// Start of the period covered (UTC), or null.
        /// </summary>
        public DateTime? PeriodStartUtc { get; set; } = null;

        /// <summary>
        /// End of the period covered (UTC), or null.
        /// </summary>
        public DateTime? PeriodEndUtc { get; set; } = null;

        /// <summary>
        /// Measurements, at most 50.
        /// </summary>
        public List<ReportMetric>? Metrics { get; set; } = null;

        /// <summary>
        /// Problems, at most 50.
        /// </summary>
        public List<ReportIssue>? Issues { get; set; } = null;

        /// <summary>
        /// Decisions, at most 50.
        /// </summary>
        public List<ReportDecision>? Decisions { get; set; } = null;

        /// <summary>
        /// Optional key, at most 256 characters: filing again with it returns the first report.
        /// </summary>
        public string? IdempotencyKey { get; set; } = null;
    }
}
